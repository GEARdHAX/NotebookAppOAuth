import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { IApiError, IValidationError } from '../types/index';
import { env } from '../config/env';

// Custom error class
export class AppError extends Error {
    public statusCode: number;
    public code?: string;
    public errors?: IValidationError[];

    constructor(message: string, statusCode: number, code?: string, errors?: IValidationError[]) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.errors = errors;
        this.name = 'AppError';

        Error.captureStackTrace(this, this.constructor);
    }
}

// Handle different types of errors
const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err: any): AppError => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err: mongoose.Error.ValidationError): AppError => {
    const errors: IValidationError[] = Object.values(err.errors).map((error: any) => ({
        field: error.path,
        message: error.message,
        value: error.value,
    }));

    const message = 'Invalid input data';
    return new AppError(message, 400, 'VALIDATION_ERROR', errors);
};

const handleJWTError = (): AppError => {
    return new AppError('Invalid token. Please log in again.', 401, 'INVALID_JWT');
};

const handleJWTExpiredError = (): AppError => {
    return new AppError('Your token has expired. Please log in again.', 401, 'JWT_EXPIRED');
};

// Send error response in development
const sendErrorDev = (err: AppError, res: Response): void => {
    res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        errors: err.errors,
        stack: err.stack,
        details: {
            name: err.name,
            statusCode: err.statusCode,
        },
    });
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response): void => {
    // Operational, trusted error: send message to client
    if (err.statusCode < 500) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            code: err.code,
            errors: err.errors,
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥:', err);

        res.status(500).json({
            success: false,
            error: 'Something went wrong on the server',
            code: 'INTERNAL_SERVER_ERROR',
        });
    }
};

// Global error handling middleware
export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    // Log error details
    console.error(`Error ${error.statusCode}: ${error.message}`);
    if (env.NODE_ENV === 'development') {
        console.error('Stack:', error.stack);
    }

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Handle Joi validation errors
    if (err.status === 400 && err.errors) {
        error = new AppError(err.message, 400, 'VALIDATION_ERROR', err.errors);
    }

    // Send error response
    if (env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }
};

// Catch async errors
export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Handle unhandled routes
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = new AppError(
        `Route ${req.originalUrl} not found on this server`,
        404,
        'ROUTE_NOT_FOUND'
    );
    next(error);
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('User-Agent');
    const ip = req.ip || req.connection.remoteAddress;

    console.log(`${timestamp} - ${method} ${url} - ${ip} - ${userAgent}`);
    next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
};
