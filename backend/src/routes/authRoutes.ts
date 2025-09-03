import { Router } from 'express';
import {
    register,
    verifyOTP,
    login,
    googleAuth,
    resendOTP,
    healthCheck,
} from '../controllers/authController';

const router = Router();

// Auth routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/resend-otp', resendOTP);

// Health check
router.get('/health', healthCheck);

export default router;
