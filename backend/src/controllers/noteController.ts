import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Note } from '../models/Note';
import { validateRequest, validateSingle, createNoteSchema, updateNoteSchema, mongoIdSchema } from '../utils/validation';
import { catchAsync, AppError } from '../middleware/errorHandler';
import { INoteCreateRequest } from '../types/index';

export const getNotes = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Get query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'updatedAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Build query
    const query: any = { userId: req.user.userId };

    // Add search functionality
    if (search && search.trim()) {
        query.$or = [
            { title: { $regex: search.trim(), $options: 'i' } },
            { content: { $regex: search.trim(), $options: 'i' } },
        ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [notes, totalCount] = await Promise.all([
        Note.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Note.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
        success: true,
        message: 'Notes retrieved successfully',
        data: {
            notes: notes.map(note => ({
                id: note._id.toString(),
                title: note.title,
                content: note.content,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            })),
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage,
                hasPrevPage,
            },
            search: search || null,
            sortBy,
            sortOrder,
        },
    });
});

export const getNoteById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Validate note ID
    const noteId = validateSingle<string>(mongoIdSchema, req.params.id);

    // Find note by ID and user ID
    const note = await Note.findByUserIdAndNoteId(req.user.userId, noteId);
    if (!note) {
        throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }

    res.json({
        success: true,
        message: 'Note retrieved successfully',
        data: {
            note: note.toNoteResponse(),
        },
    });
});

export const createNote = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Validate request body
    const { title, content } = validateRequest(createNoteSchema, req.body) as INoteCreateRequest;

    // Create note
    const note = new Note({
        title: title.trim(),
        content: content.trim(),
        userId: new mongoose.Types.ObjectId(req.user.userId),
    });

    await note.save();

    res.status(201).json({
        success: true,
        message: 'Note created successfully',
        data: {
            note: note.toNoteResponse(),
        },
    });
});

export const updateNote = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Validate note ID
    const noteId = validateSingle<string>(mongoIdSchema, req.params.id);

    // Validate request body
    const updateData = validateRequest<Partial<INoteCreateRequest>>(updateNoteSchema, req.body);

    // Find and update note
    const note = await Note.findByUserIdAndNoteId(req.user.userId, noteId);
    if (!note) {
        throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }

    // Update fields
    if (updateData.title !== undefined) {
        note.title = updateData.title.trim();
    }
    if (updateData.content !== undefined) {
        note.content = updateData.content.trim();
    }

    // Update the updatedAt field manually since we're not using findOneAndUpdate
    note.updatedAt = new Date();
    await note.save();

    res.json({
        success: true,
        message: 'Note updated successfully',
        data: {
            note: note.toNoteResponse(),
        },
    });
});

export const deleteNote = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Validate note ID
    const noteId = validateSingle<string>(mongoIdSchema, req.params.id);

    // Find and delete note
    const deletedNote = await Note.deleteByUserIdAndNoteId(req.user.userId, noteId);
    if (!deletedNote) {
        throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }

    res.json({
        success: true,
        message: 'Note deleted successfully',
        data: {
            deletedNote: {
                id: deletedNote._id.toString(),
                title: deletedNote.title,
                deletedAt: new Date().toISOString(),
            },
        },
    });
});

export const deleteAllNotes = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    // Delete all notes for the user
    const result = await Note.deleteMany({ userId: req.user.userId });

    res.json({
        success: true,
        message: `${result.deletedCount} notes deleted successfully`,
        data: {
            deletedCount: result.deletedCount,
            deletedAt: new Date().toISOString(),
        },
    });
});

export const searchNotes = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    const searchQuery = req.query.q as string;
    if (!searchQuery || searchQuery.trim().length === 0) {
        throw new AppError('Search query is required', 400, 'SEARCH_QUERY_REQUIRED');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Create search query with full-text search
    const searchRegex = new RegExp(searchQuery.trim(), 'i');
    const query = {
        userId: req.user.userId,
        $or: [
            { title: searchRegex },
            { content: searchRegex },
        ],
    };

    // Execute search with pagination
    const [notes, totalCount] = await Promise.all([
        Note.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Note.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
        success: true,
        message: 'Search completed successfully',
        data: {
            query: searchQuery,
            notes: notes.map(note => ({
                id: note._id.toString(),
                title: note.title,
                content: note.content,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                // Add relevance score (basic implementation)
                relevanceScore: (
                    (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) +
                    (note.content.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0)
                ),
            })),
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        },
    });
});

export const getNotesStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
    }

    const userId = req.user.userId;

    // Get various statistics
    const [
        totalNotes,
        notesToday,
        notesThisWeek,
        notesThisMonth,
        oldestNote,
        newestNote,
        avgContentLength,
    ] = await Promise.all([
        // Total notes count
        Note.countDocuments({ userId }),

        // Notes created today
        Note.countDocuments({
            userId,
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        }),

        // Notes created this week
        Note.countDocuments({
            userId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),

        // Notes created this month
        Note.countDocuments({
            userId,
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        }),

        // Oldest note
        Note.findOne({ userId }).sort({ createdAt: 1 }).lean(),

        // Newest note
        Note.findOne({ userId }).sort({ createdAt: -1 }).lean(),

        // Average content length
        Note.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, avgLength: { $avg: { $strLenCP: '$content' } } } },
        ]),
    ]);

    res.json({
        success: true,
        message: 'Notes statistics retrieved successfully',
        data: {
            stats: {
                totalNotes,
                notesToday,
                notesThisWeek,
                notesThisMonth,
                oldestNote: oldestNote ? {
                    id: oldestNote._id.toString(),
                    title: oldestNote.title,
                    createdAt: oldestNote.createdAt,
                } : null,
                newestNote: newestNote ? {
                    id: newestNote._id.toString(),
                    title: newestNote.title,
                    createdAt: newestNote.createdAt,
                } : null,
                averageContentLength: Math.round(avgContentLength[0]?.avgLength || 0),
            },
        },
    });
});
