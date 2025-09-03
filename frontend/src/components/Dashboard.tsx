import React, { useState, useEffect } from 'react';
import { DashboardProps, Note, NoteCreateRequest } from '../types';
import { notesAPI } from '../services/api';
import { ValidationUtils } from '../utils/validation';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newNote, setNewNote] = useState<NoteCreateRequest>({ title: '', content: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await notesAPI.getNotes();
            if (response.success && response.data) {
                setNotes(response.data.notes || []);
            }
        } catch (err: any) {
            console.error('Fetch notes error:', err);
            setError(err.error || err.message || 'Failed to fetch notes');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof NoteCreateRequest, value: string) => {
        setNewNote(prev => ({ ...prev, [field]: value }));

        // Clear validation error for this field when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});

        // Client-side validation
        const validation = ValidationUtils.validateNoteForm(newNote);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }

        setCreateLoading(true);

        try {
            const response = await notesAPI.createNote(newNote);
            if (response.success && response.data) {
                setNotes(prevNotes => [response.data.note, ...prevNotes]);
                setNewNote({ title: '', content: '' });
                setShowCreateModal(false);
            }
        } catch (err: any) {
            console.error('Create note error:', err);
            setError(err.error || err.message || 'Failed to create note');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;

        try {
            await notesAPI.deleteNote(noteId);
            setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
        } catch (err: any) {
            console.error('Delete note error:', err);
            setError(err.error || err.message || 'Failed to delete note');
        }
    };

    const handleLogout = () => {
        onLogout();
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setNewNote({ title: '', content: '' });
        setValidationErrors({});
        setError('');
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <LoadingSpinner />
                <p>Loading your notes...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>My Notes</h1>
                        <p>Welcome back, {user.name || user.email}!</p>
                    </div>
                    <div className="header-right">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                            aria-label="Create new note"
                        >
                            + New Note
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn-secondary"
                            aria-label="Logout"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Error Message */}
            {error && (
                <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
                    <ErrorMessage message={error} onClose={() => setError('')} />
                </div>
            )}

            {/* Main Content */}
            <main className="dashboard-main">
                {notes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>No notes yet</h3>
                        <p>Create your first note to get started!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                        >
                            Create Note
                        </button>
                    </div>
                ) : (
                    <div className="notes-grid">
                        {notes.map((note) => (
                            <div key={note.id} className="note-card">
                                <div className="note-header">
                                    <h3>{note.title}</h3>
                                    <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="delete-btn"
                                        title="Delete note"
                                        aria-label={`Delete note: ${note.title}`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <div className="note-content">
                                    <p>{note.content}</p>
                                </div>
                                <div className="note-footer">
                                    <small>
                                        {new Date(note.createdAt || note.updatedAt || Date.now()).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Note Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create New Note</h3>
                            <button
                                onClick={closeModal}
                                className="close-btn"
                                aria-label="Close modal"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateNote}>
                            <div className="form-group">
                                <label htmlFor="note-title">Title</label>
                                <input
                                    id="note-title"
                                    type="text"
                                    value={newNote.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    required
                                    placeholder="Enter note title"
                                    className={validationErrors.title ? 'error' : ''}
                                />
                                {validationErrors.title && (
                                    <span className="field-error">{validationErrors.title[0]}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="note-content">Content</label>
                                <textarea
                                    id="note-content"
                                    value={newNote.content}
                                    onChange={(e) => handleInputChange('content', e.target.value)}
                                    required
                                    placeholder="Write your note here..."
                                    rows={6}
                                    className={validationErrors.content ? 'error' : ''}
                                />
                                {validationErrors.content && (
                                    <span className="field-error">{validationErrors.content[0]}</span>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={createLoading}
                                >
                                    {createLoading ? <LoadingSpinner /> : 'Create Note'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
