import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password?: string;
    name: string;
    isVerified: boolean;
    googleId?: string;
    otp?: string;
    otpExpiry?: Date;
    createdAt: Date;
    // Instance methods
    generateOTP(): string;
    isOTPValid(otp: string): boolean;
    clearOTP(): void;
    toUserResponse(): IUserResponse;
}

export interface IUserResponse {
    id: string;
    email: string;
    name: string;
    isVerified?: boolean;
    createdAt?: Date;
}

export interface IUserRegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface IUserLoginRequest {
    email: string;
    password: string;
}

export interface IGoogleAuthRequest {
    tokenId: string;
}

export interface IOTPVerificationRequest {
    email: string;
    otp: string;
}

export interface IResendOTPRequest {
    email: string;
}

// Note Types
export interface INote extends Document {
    _id: Types.ObjectId;
    title: string;
    content: string;
    userId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    // Instance methods
    toNoteResponse(): INoteResponse;
}

export interface INoteResponse {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INoteCreateRequest {
    title: string;
    content: string;
}

// Auth Types
export interface IJWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

export interface IAuthResponse {
    message: string;
    token: string;
    user: IUserResponse;
}

// API Response Types
export interface IApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface IApiError {
    message: string;
    status: number;
    code?: string;
}

// Environment Variables
export interface IEnvironmentVariables {
    PORT: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    EMAIL_USER: string;
    EMAIL_PASS: string;
    GOOGLE_CLIENT_ID: string;
    NODE_ENV: string;
}

// Email Types
export interface IEmailOptions {
    to: string;
    subject: string;
    html: string;
}

// Validation Types
export interface IValidationError {
    field: string;
    message: string;
    value?: any;
}
