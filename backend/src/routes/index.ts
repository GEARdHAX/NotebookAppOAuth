import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import noteRoutes from './noteRoutes';
import userRoutes from './userRoutes';

const router = Router();

// API version prefix
const API_VERSION = 'v1';

// Mount routes
router.use(`/api/${API_VERSION}/auth`, authRoutes);
router.use(`/api/${API_VERSION}/notes`, noteRoutes);
router.use(`/api/${API_VERSION}/user`, userRoutes);

// Backward compatibility - mount routes without version prefix (matching original API)
router.use('/api/auth', authRoutes);
router.use('/api/notes', noteRoutes);
router.use('/api/user', userRoutes);

// API root endpoint
router.get('/api', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Note App API',
        version: API_VERSION,
        endpoints: {
            auth: `/api/${API_VERSION}/auth`,
            notes: `/api/${API_VERSION}/notes`,
            user: `/api/${API_VERSION}/user`,
        },
        documentation: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                googleAuth: 'POST /api/auth/google',
                verifyOTP: 'POST /api/auth/verify-otp',
                resendOTP: 'POST /api/auth/resend-otp',
            },
            notes: {
                list: 'GET /api/notes',
                search: 'GET /api/notes/search?q=query',
                stats: 'GET /api/notes/stats',
                getById: 'GET /api/notes/:id',
                create: 'POST /api/notes',
                update: 'PUT/PATCH /api/notes/:id',
                delete: 'DELETE /api/notes/:id',
                deleteAll: 'DELETE /api/notes',
            },
            user: {
                profile: 'GET /api/user/profile',
                stats: 'GET /api/user/stats',
                updateProfile: 'PUT/PATCH /api/user/profile',
                changePassword: 'PUT /api/user/password',
                deleteAccount: 'DELETE /api/user/account',
            },
        },
        status: 'active',
        timestamp: new Date().toISOString(),
    });
});

// Health check endpoint
router.get('/api/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        status: 'OK',
        message: 'Note App API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
    });
});

export default router;
