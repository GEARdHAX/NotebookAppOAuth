import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { emailService } from '../utils/email';
import { validateRequest, registerSchema, loginSchema, googleAuthSchema, otpVerificationSchema, resendOTPSchema } from '../utils/validation';
import { generateAccessToken } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import {
    IUserRegisterRequest,
    IUserLoginRequest,
    IGoogleAuthRequest,
    IOTPVerificationRequest,
    IResendOTPRequest,
    IAuthResponse,
} from '../types/index';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const { email, password, name } = validateRequest(registerSchema, req.body) as IUserRegisterRequest;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        throw new AppError('User already exists with this email', 400, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        isVerified: false,
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    try {
        await emailService.sendOTPEmail(email, otp);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for OTP verification.',
            data: {
                userId: user._id,
                email: user.email,
                message: 'OTP sent to email',
            },
        });
    } catch (emailError) {
        console.error('Email sending failed during registration:', emailError);

        res.status(201).json({
            success: true,
            message: 'User registered but email could not be sent. Please try to resend OTP.',
            data: {
                userId: user._id,
                email: user.email,
                message: 'Email service temporarily unavailable',
            },
        });
    }
});

export const verifyOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const { email, otp } = validateRequest(otpVerificationSchema, req.body) as IOTPVerificationRequest;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if already verified
    if (user.isVerified) {
        throw new AppError('User is already verified', 400, 'ALREADY_VERIFIED');
    }

    // Validate OTP
    if (!user.isOTPValid(otp)) {
        throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    // Verify user and clear OTP
    user.isVerified = true;
    user.clearOTP();
    await user.save();

    // Send welcome email
    try {
        await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
        console.error('Welcome email sending failed:', emailError);
        // Don't fail the verification if welcome email fails
    }

    // Generate JWT
    const token = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
    });

    const response: IAuthResponse = {
        message: 'Email verified successfully',
        token,
        user: user.toUserResponse(),
    };

    res.json({
        success: true,
        ...response,
    });
});

export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const { email, password } = validateRequest(loginSchema, req.body) as IUserLoginRequest;

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user signed up with Google
    if (user.googleId && !user.password) {
        throw new AppError('Please login with Google', 400, 'GOOGLE_LOGIN_REQUIRED');
    }

    // Check password
    if (!user.password) {
        throw new AppError('Please login with Google', 400, 'GOOGLE_LOGIN_REQUIRED');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if email is verified
    if (!user.isVerified) {
        throw new AppError('Please verify your email first', 400, 'EMAIL_NOT_VERIFIED');
    }

    // Generate JWT
    const token = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
    });

    const response: IAuthResponse = {
        message: 'Login successful',
        token,
        user: user.toUserResponse(),
    };

    res.json({
        success: true,
        ...response,
    });
});

export const googleAuth = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const { tokenId } = validateRequest(googleAuthSchema, req.body) as IGoogleAuthRequest;

    try {
        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: tokenId,
            audience: env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new AppError('Invalid Google token', 400, 'INVALID_GOOGLE_TOKEN');
        }

        const { sub: googleId, email, name } = payload;

        if (!email || !name || !googleId) {
            throw new AppError('Incomplete Google profile', 400, 'INCOMPLETE_GOOGLE_PROFILE');
        }

        // Check if user exists
        let user = await User.findByEmail(email);

        if (user) {
            // User exists, update Google ID if not set
            if (!user.googleId) {
                user.googleId = googleId;
                user.isVerified = true; // Google users are automatically verified
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                email: email.toLowerCase(),
                name,
                googleId,
                isVerified: true,
            });
            await user.save();

            // Send welcome email
            try {
                await emailService.sendWelcomeEmail(email, name);
            } catch (emailError) {
                console.error('Welcome email sending failed:', emailError);
                // Don't fail the registration if welcome email fails
            }
        }

        // Generate JWT
        const token = generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
        });

        const response: IAuthResponse = {
            message: 'Google login successful',
            token,
            user: user.toUserResponse(),
        };

        res.json({
            success: true,
            ...response,
        });
    } catch (error: any) {
        if (error.name === 'AppError') {
            throw error;
        }
        console.error('Google authentication error:', error);
        throw new AppError('Google authentication failed', 500, 'GOOGLE_AUTH_FAILED');
    }
});

export const resendOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const { email } = validateRequest(resendOTPSchema, req.body) as IResendOTPRequest;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if already verified
    if (user.isVerified) {
        throw new AppError('User is already verified', 400, 'ALREADY_VERIFIED');
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    try {
        await emailService.sendOTPEmail(email, otp);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                message: 'New OTP sent to your email',
            },
        });
    } catch (emailError) {
        console.error('Email sending failed during OTP resend:', emailError);
        throw new AppError('Failed to send OTP email', 500, 'EMAIL_SEND_FAILED');
    }
});

// Health check for auth service
export const healthCheck = catchAsync(async (req: Request, res: Response): Promise<void> => {
    res.json({
        success: true,
        message: 'Auth service is healthy',
        data: {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});
