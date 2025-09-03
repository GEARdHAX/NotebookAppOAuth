import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IJWTPayload, IApiError } from '../types/index';

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            const error: IApiError = {
                message: 'Access token required',
                status: 401,
                code: 'MISSING_TOKEN',
            };
            res.status(401).json({
                success: false,
                error: error.message,
                code: error.code,
            });
            return;
        }

        jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
            if (err) {
                let errorMessage = 'Invalid or expired token';
                let errorCode = 'INVALID_TOKEN';

                if (err.name === 'TokenExpiredError') {
                    errorMessage = 'Token has expired';
                    errorCode = 'TOKEN_EXPIRED';
                } else if (err.name === 'JsonWebTokenError') {
                    errorMessage = 'Invalid token format';
                    errorCode = 'MALFORMED_TOKEN';
                }

                const error: IApiError = {
                    message: errorMessage,
                    status: 403,
                    code: errorCode,
                };

                res.status(403).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }

            // Type assertion since we know the structure of our JWT payload
            req.user = decoded as IJWTPayload;
            next();
        });
    } catch (error) {
        const apiError: IApiError = {
            message: 'Authentication failed',
            status: 500,
            code: 'AUTH_ERROR',
        };

        res.status(500).json({
            success: false,
            error: apiError.message,
            code: apiError.code,
        });
    }
};

export const generateAccessToken = (payload: Omit<IJWTPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: '7d', // 7 days
        issuer: 'noteapp-backend',
        audience: 'noteapp-frontend',
    });
};

export const verifyToken = (token: string): Promise<IJWTPayload> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded as IJWTPayload);
            }
        });
    });
};

// Optional middleware for refreshing tokens (for future implementation)
export const refreshTokenMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            next();
            return;
        }

        jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
            if (!err && decoded) {
                const payload = decoded as IJWTPayload;
                const now = Math.floor(Date.now() / 1000);

                // If token expires in less than 1 day, include a new token in response
                if (payload.exp && payload.exp - now < 24 * 60 * 60) {
                    const newToken = generateAccessToken({
                        userId: payload.userId,
                        email: payload.email,
                    });

                    res.setHeader('X-New-Token', newToken);
                }
            }
            next();
        });
    } catch (error) {
        next();
    }
};
