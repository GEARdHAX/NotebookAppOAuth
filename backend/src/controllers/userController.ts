import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Note } from '../models/Note';
import { validateRequest } from '../utils/validation';
import { catchAsync, AppError } from '../middleware/errorHandler';
import Joi from 'joi';

// Validation schemas specific to user operations
const updateProfileSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .optional()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 50 characters',
        }),
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .optional()
        .messages({
            'string.email': 'Please provide a valid email address',
        }),
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Current password is required',
        }),
    newPassword: Joi.string()
        .min(6)
        .max(128)
        .required()
        .messages({
            'string.min': 'New password must be at least 6 characters long',
            'string.max': 'New password cannot exceed 128 characters',
            'any.required': 'New password is required',
        }),
});

export const getProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Find user and exclude sensitive fields
    const user = await User.findById(req.user.userId).select('-password -otp -otpExpiry');
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get user statistics
    const [totalNotes, notesThisMonth] = await Promise.all([
        Note.countDocuments({ userId: user._id }),
        Note.countDocuments({
            userId: user._id,
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        }),
    ]);

    res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
            user: {
                ...user.toUserResponse(),
                stats: {
                    totalNotes,
                    notesThisMonth,
                    memberSince: user.createdAt,
                },
            },
        },
    });
});

export const updateProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Validate request body
    const updateData = validateRequest<{ name?: string; email?: string }>(updateProfileSchema, req.body);

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
        throw new AppError('No fields to update', 400, 'NO_FIELDS_TO_UPDATE');
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser) {
            throw new AppError('Email is already in use', 400, 'EMAIL_ALREADY_EXISTS');
        }
        user.email = updateData.email.toLowerCase();
        // If email is changed, mark as unverified (for security)
        user.isVerified = false;
    }

    // Update name if provided
    if (updateData.name) {
        user.name = updateData.name.trim();
    }

    await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: user.toUserResponse(),
            emailChanged: updateData.email ? true : false,
        },
    });
});

export const changePassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Validate request body
    const { currentPassword, newPassword } = validateRequest<{ currentPassword: string; newPassword: string }>(changePasswordSchema, req.body);

    // Find user with password field
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user has a password (not Google-only user)
    if (!user.password) {
        throw new AppError('Cannot change password for Google-authenticated account', 400, 'GOOGLE_ACCOUNT_NO_PASSWORD');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
        throw new AppError('New password must be different from current password', 400, 'SAME_PASSWORD');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    await user.save();

    res.json({
        success: true,
        message: 'Password changed successfully',
        data: {
            message: 'Your password has been updated',
            changedAt: new Date().toISOString(),
        },
    });
});

export const deleteAccount = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    const { password } = req.body;

    // Find user with password field
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // If user has a password, verify it
    if (user.password && password) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Invalid password', 400, 'INVALID_PASSWORD');
        }
    } else if (user.password && !password) {
        throw new AppError('Password is required to delete account', 400, 'PASSWORD_REQUIRED');
    }

    // Delete all user's notes first
    const notesDeletionResult = await Note.deleteMany({ userId: user._id });

    // Delete user account
    await User.findByIdAndDelete(user._id);

    res.json({
        success: true,
        message: 'Account deleted successfully',
        data: {
            message: 'Your account and all associated data have been permanently deleted',
            deletedAt: new Date().toISOString(),
            notesDeleted: notesDeletionResult.deletedCount,
        },
    });
});

export const getUserStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Calculate various statistics
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
        totalNotes,
        notesToday,
        notesThisWeek,
        notesThisMonth,
        notesThisYear,
        accountAge,
    ] = await Promise.all([
        Note.countDocuments({ userId: user._id }),
        Note.countDocuments({ userId: user._id, createdAt: { $gte: startOfToday } }),
        Note.countDocuments({ userId: user._id, createdAt: { $gte: startOfWeek } }),
        Note.countDocuments({ userId: user._id, createdAt: { $gte: startOfMonth } }),
        Note.countDocuments({ userId: user._id, createdAt: { $gte: startOfYear } }),
        Promise.resolve(Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))),
    ]);

    res.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
            stats: {
                totalNotes,
                notesToday,
                notesThisWeek,
                notesThisMonth,
                notesThisYear,
                accountAge: {
                    days: accountAge,
                    years: Math.floor(accountAge / 365),
                    months: Math.floor(accountAge / 30),
                },
                averageNotesPerDay: totalNotes > 0 && accountAge > 0 ? (totalNotes / accountAge).toFixed(2) : 0,
                memberSince: user.createdAt,
                lastActiveAt: new Date().toISOString(), // Current request time as last active
            },
        },
    });
});
