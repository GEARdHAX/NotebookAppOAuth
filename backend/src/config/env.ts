import dotenv from 'dotenv';
import { IEnvironmentVariables } from '../types/index';

dotenv.config();

export const env: IEnvironmentVariables = {
    PORT: process.env.PORT || '3001',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/noteapp',
    JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    NODE_ENV: process.env.NODE_ENV || 'development',
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS', 'GOOGLE_CLIENT_ID'];

export const validateEnvironment = (): void => {
    const missing = requiredEnvVars.filter(
        (envVar) => !process.env[envVar] || process.env[envVar] === ''
    );

    if (missing.length > 0 && env.NODE_ENV === 'production') {
        console.error('Missing required environment variables:', missing);
        process.exit(1);
    }

    if (missing.length > 0) {
        console.warn('Warning: Missing environment variables:', missing);
    }
};
