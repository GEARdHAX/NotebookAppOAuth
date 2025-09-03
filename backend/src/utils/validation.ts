import Joi from 'joi';
import {
    IUserRegisterRequest,
    IUserLoginRequest,
    IGoogleAuthRequest,
    IOTPVerificationRequest,
    IResendOTPRequest,
    INoteCreateRequest,
} from '../types/index';

// User validation schemas
export const registerSchema = Joi.object<IUserRegisterRequest>({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .min(6)
        .max(128)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password cannot exceed 128 characters',
            'any.required': 'Password is required',
        }),
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'any.required': 'Name is required',
        }),
});

export const loginSchema = Joi.object<IUserLoginRequest>({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required',
        }),
});

export const googleAuthSchema = Joi.object<IGoogleAuthRequest>({
    tokenId: Joi.string()
        .required()
        .messages({
            'any.required': 'Google token is required',
        }),
});

export const otpVerificationSchema = Joi.object<IOTPVerificationRequest>({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    otp: Joi.string()
        .length(6)
        .pattern(/^\d+$/)
        .required()
        .messages({
            'string.length': 'OTP must be exactly 6 digits',
            'string.pattern.base': 'OTP must contain only numbers',
            'any.required': 'OTP is required',
        }),
});

export const resendOTPSchema = Joi.object<IResendOTPRequest>({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
});

// Note validation schemas
export const createNoteSchema = Joi.object<INoteCreateRequest>({
    title: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.min': 'Title cannot be empty',
            'string.max': 'Title cannot exceed 200 characters',
            'any.required': 'Title is required',
        }),
    content: Joi.string()
        .trim()
        .min(1)
        .max(10000)
        .required()
        .messages({
            'string.min': 'Content cannot be empty',
            'string.max': 'Content cannot exceed 10,000 characters',
            'any.required': 'Content is required',
        }),
});

export const updateNoteSchema = Joi.object<Partial<INoteCreateRequest>>({
    title: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .optional()
        .messages({
            'string.min': 'Title cannot be empty',
            'string.max': 'Title cannot exceed 200 characters',
        }),
    content: Joi.string()
        .trim()
        .min(1)
        .max(10000)
        .optional()
        .messages({
            'string.min': 'Content cannot be empty',
            'string.max': 'Content cannot exceed 10,000 characters',
        }),
}).min(1).messages({
    'object.min': 'At least one field (title or content) must be provided',
});

// MongoDB ObjectId validation
export const mongoIdSchema = Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
        'string.pattern.base': 'Invalid ID format',
        'any.required': 'ID is required',
    });

// Validation helper functions
export const validateRequest = <T>(schema: Joi.Schema, data: any): T => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const validationErrors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
        }));

        throw {
            status: 400,
            message: 'Validation failed',
            errors: validationErrors,
        };
    }

    return value;
};

// Validate single value (for ObjectId and other simple validations)
export const validateSingle = <T>(schema: Joi.Schema, value: any): T => {
    const { error, value: validatedValue } = schema.validate(value);

    if (error) {
        throw {
            status: 400,
            message: error.message,
            errors: [{
                field: 'value',
                message: error.message,
                value,
            }],
        };
    }

    return validatedValue;
};

// Client-side validation utilities (can be used in frontend too)
export class ValidationUtils {
    // Email validation
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    // Password validation
    static isValidPassword(password: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!password) {
            errors.push('Password is required');
            return { valid: false, errors };
        }

        if (password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        if (password.length > 128) {
            errors.push('Password cannot exceed 128 characters');
        }

        return { valid: errors.length === 0, errors };
    }

    // Name validation
    static isValidName(name: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmedName = name.trim();

        if (!trimmedName) {
            errors.push('Name is required');
            return { valid: false, errors };
        }

        if (trimmedName.length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (trimmedName.length > 50) {
            errors.push('Name cannot exceed 50 characters');
        }

        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!nameRegex.test(trimmedName)) {
            errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
        }

        return { valid: errors.length === 0, errors };
    }

    // OTP validation
    static isValidOTP(otp: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmedOTP = otp.trim();

        if (!trimmedOTP) {
            errors.push('OTP is required');
            return { valid: false, errors };
        }

        if (trimmedOTP.length !== 6) {
            errors.push('OTP must be exactly 6 digits');
        }

        if (!/^\d{6}$/.test(trimmedOTP)) {
            errors.push('OTP must contain only numbers');
        }

        return { valid: errors.length === 0, errors };
    }

    // Note title validation
    static isValidNoteTitle(title: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            errors.push('Title is required');
            return { valid: false, errors };
        }

        if (trimmedTitle.length > 200) {
            errors.push('Title cannot exceed 200 characters');
        }

        return { valid: errors.length === 0, errors };
    }

    // Note content validation
    static isValidNoteContent(content: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmedContent = content.trim();

        if (!trimmedContent) {
            errors.push('Content is required');
            return { valid: false, errors };
        }

        if (trimmedContent.length > 10000) {
            errors.push('Content cannot exceed 10,000 characters');
        }

        return { valid: errors.length === 0, errors };
    }
}

// Rate limiting validation (for future implementation)
export const rateLimitConfig = {
    register: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    login: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 attempts per 15 minutes
    otpVerification: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    resendOTP: { windowMs: 15 * 60 * 1000, max: 3 }, // 3 attempts per 15 minutes
    createNote: { windowMs: 15 * 60 * 1000, max: 50 }, // 50 notes per 15 minutes
};