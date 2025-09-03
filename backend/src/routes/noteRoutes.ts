import { Router } from 'express';
import {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    deleteAllNotes,
    searchNotes,
    getNotesStats,
} from '../controllers/noteController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Note routes
router.get('/', getNotes);
router.get('/search', searchNotes);
router.get('/stats', getNotesStats);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.patch('/:id', updateNote); // Allow both PUT and PATCH for updates
router.delete('/:id', deleteNote);
router.delete('/', deleteAllNotes); // Delete all notes (be careful with this)

export default router;
