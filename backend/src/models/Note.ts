import mongoose, { Schema, Model } from 'mongoose';
import { INote } from '../types/index';

const noteSchema = new Schema<INote>(
    {
        title: {
            type: String,
            required: [true, 'Note title is required'],
            trim: true,
            minlength: [1, 'Title cannot be empty'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        content: {
            type: String,
            required: [true, 'Note content is required'],
            trim: true,
            minlength: [1, 'Content cannot be empty'],
            maxlength: [10000, 'Content cannot exceed 10,000 characters'],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true, // Index for faster queries
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete (ret as any)._id;
                delete (ret as any).__v;
                delete (ret as any).userId; // Don't expose userId in API responses
                return ret;
            },
        },
    }
);

// Compound index for user-specific queries
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, updatedAt: -1 });

// Static methods
noteSchema.statics.findByUserId = function (userId: string) {
    return this.find({ userId }).sort({ updatedAt: -1 });
};

noteSchema.statics.findByUserIdAndNoteId = function (userId: string, noteId: string) {
    return this.findOne({ _id: noteId, userId });
};

noteSchema.statics.deleteByUserIdAndNoteId = function (userId: string, noteId: string) {
    return this.findOneAndDelete({ _id: noteId, userId });
};

// Instance methods
noteSchema.methods.toNoteResponse = function () {
    return {
        id: this._id.toString(),
        title: this.title,
        content: this.content,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

// Interface for static methods
interface INoteModel extends Model<INote> {
    findByUserId(userId: string): Promise<INote[]>;
    findByUserIdAndNoteId(userId: string, noteId: string): Promise<INote | null>;
    deleteByUserIdAndNoteId(userId: string, noteId: string): Promise<INote | null>;
}

export const Note: INoteModel = mongoose.model<INote, INoteModel>('Note', noteSchema);
