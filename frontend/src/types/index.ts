// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    code?: string;
}

// User Types
export interface User {
    id: string;
    email: string;
    name: string;
    isVerified?: boolean;
    createdAt?: string;
}

export interface UserRegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface UserLoginRequest {
    email: string;
    password: string;
}

export interface GoogleAuthRequest {
    tokenId: string;
}

export interface OTPVerificationRequest {
    email: string;
    otp: string;
}

export interface ResendOTPRequest {
    email: string;
}

// Note Types
export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    relevanceScore?: number; // For search results
}

export interface NoteCreateRequest {
    title: string;
    content: string;
}

export interface NoteUpdateRequest {
    title?: string;
    content?: string;
}

// Auth Response Types
export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

// API Error Types
export interface ApiError {
    success: false;
    error: string;
    code?: string;
    errors?: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

// Component Props Types
export interface LoadingSpinnerProps { }

export interface ErrorMessageProps {
    message: string;
    onClose: () => void;
}

export interface SuccessMessageProps {
    message: string;
    onClose: () => void;
}

export interface LoginFormProps {
    onLogin: (authData: AuthResponse) => void;
    onSwitchToRegister: () => void;
}

export interface RegisterFormProps {
    onSwitchToLogin: () => void;
    onRegistrationSuccess: (email: string) => void;
}

export interface OTPVerificationProps {
    email: string;
    onVerificationSuccess: (authData: AuthResponse) => void;
    onBackToLogin: () => void;
}

export interface DashboardProps {
    user: User;
    onLogout: () => void;
}

// Form State Types
export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    email: string;
    password: string;
    name: string;
}

// App State Types
export type ViewType = 'login' | 'register' | 'otp' | 'dashboard';

// API Configuration
export interface ApiConfig {
    baseURL: string;
    timeout: number;
    headers: Record<string, string>;
}

// Pagination Types
export interface Pagination {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// Notes API Response Types
export interface NotesResponse {
    notes: Note[];
    pagination: Pagination;
    search?: string | null;
    sortBy: string;
    sortOrder: string;
}

export interface SearchNotesResponse {
    query: string;
    notes: Note[];
    pagination: Pagination;
}

// Statistics Types
export interface NoteStats {
    totalNotes: number;
    notesToday: number;
    notesThisWeek: number;
    notesThisMonth: number;
    oldestNote?: {
        id: string;
        title: string;
        createdAt: string;
    } | null;
    newestNote?: {
        id: string;
        title: string;
        createdAt: string;
    } | null;
    averageContentLength: number;
}

export interface UserStats {
    totalNotes: number;
    notesToday: number;
    notesThisWeek: number;
    notesThisMonth: number;
    notesThisYear: number;
    accountAge: {
        days: number;
        years: number;
        months: number;
    };
    averageNotesPerDay: string | number;
    memberSince: string;
    lastActiveAt: string;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Call Options
export interface ApiCallOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}
