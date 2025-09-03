import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getUserStats,
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// User routes
router.get('/profile', getProfile);
router.get('/stats', getUserStats);
router.put('/profile', updateProfile);
router.patch('/profile', updateProfile); // Allow both PUT and PATCH
router.put('/password', changePassword);
router.delete('/account', deleteAccount);

export default router;
