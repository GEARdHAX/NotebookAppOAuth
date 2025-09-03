import {
    ApiResponse,
    ApiCallOptions,
    HttpMethod,
    UserRegisterRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    OTPVerificationRequest,
    ResendOTPRequest,
    NoteCreateRequest,
    NoteUpdateRequest,
    AuthResponse,
    NotesResponse,
    SearchNotesResponse,
    NoteStats,
    User,
    Note,
    UserStats
} from '../types';

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API Client Class
class ApiClient {
    private baseURL: string;
    private defaultHeaders: Record<string, string>;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    private getAuthHeaders(): Record<string, string> {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    private async makeRequest<T>(
        endpoint: string,
        options: ApiCallOptions = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        const config: RequestInit = {
            method: options.method || 'GET',
            headers: {
                ...this.defaultHeaders,
                ...this.getAuthHeaders(),
                ...options.headers,
            },
        };

        if (options.body && ['POST', 'PUT', 'PATCH'].includes(config.method || 'GET')) {
            config.body = typeof options.body === 'string'
                ? options.body
                : JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw {
                    success: false,
                    error: data.error || 'API request failed',
                    code: data.code,
                    status: response.status,
                };
            }

            return data;
        } catch (error: any) {
            if (error.success === false) {
                throw error;
            }

            console.error('API request error:', error);
            throw {
                success: false,
                error: error.message || 'Network error',
                code: 'NETWORK_ERROR',
                status: 0,
            };
        }
    }

    // Auth API Methods
    async register(userData: UserRegisterRequest): Promise<ApiResponse<{ userId: string; email: string; message: string }>> {
        return this.makeRequest('/auth/register', {
            method: 'POST',
            body: userData,
        });
    }

    async login(credentials: UserLoginRequest): Promise<ApiResponse<AuthResponse>> {
        return this.makeRequest('/auth/login', {
            method: 'POST',
            body: credentials,
        });
    }

    async googleAuth(googleData: GoogleAuthRequest): Promise<ApiResponse<AuthResponse>> {
        return this.makeRequest('/auth/google', {
            method: 'POST',
            body: googleData,
        });
    }

    async verifyOTP(otpData: OTPVerificationRequest): Promise<ApiResponse<AuthResponse>> {
        return this.makeRequest('/auth/verify-otp', {
            method: 'POST',
            body: otpData,
        });
    }

    async resendOTP(emailData: ResendOTPRequest): Promise<ApiResponse<{ message: string }>> {
        return this.makeRequest('/auth/resend-otp', {
            method: 'POST',
            body: emailData,
        });
    }

    // Notes API Methods
    async getNotes(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<ApiResponse<NotesResponse>> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/notes?${queryString}` : '/notes';

        return this.makeRequest(endpoint);
    }

    async getNoteById(id: string): Promise<ApiResponse<{ note: Note }>> {
        return this.makeRequest(`/notes/${id}`);
    }

    async createNote(noteData: NoteCreateRequest): Promise<ApiResponse<{ note: Note }>> {
        return this.makeRequest('/notes', {
            method: 'POST',
            body: noteData,
        });
    }

    async updateNote(id: string, noteData: NoteUpdateRequest): Promise<ApiResponse<{ note: Note }>> {
        return this.makeRequest(`/notes/${id}`, {
            method: 'PUT',
            body: noteData,
        });
    }

    async deleteNote(id: string): Promise<ApiResponse<{ deletedNote: { id: string; title: string; deletedAt: string } }>> {
        return this.makeRequest(`/notes/${id}`, {
            method: 'DELETE',
        });
    }

    async searchNotes(query: string, params?: {
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<SearchNotesResponse>> {
        const queryParams = new URLSearchParams({ q: query });
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });
        }

        return this.makeRequest(`/notes/search?${queryParams.toString()}`);
    }

    async getNotesStats(): Promise<ApiResponse<{ stats: NoteStats }>> {
        return this.makeRequest('/notes/stats');
    }

    async deleteAllNotes(): Promise<ApiResponse<{ deletedCount: number; deletedAt: string }>> {
        return this.makeRequest('/notes', {
            method: 'DELETE',
        });
    }

    // User API Methods
    async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
        return this.makeRequest('/user/profile');
    }

    async updateUserProfile(userData: {
        name?: string;
        email?: string;
    }): Promise<ApiResponse<{ user: User; emailChanged: boolean }>> {
        return this.makeRequest('/user/profile', {
            method: 'PUT',
            body: userData,
        });
    }

    async changePassword(passwordData: {
        currentPassword: string;
        newPassword: string;
    }): Promise<ApiResponse<{ message: string; changedAt: string }>> {
        return this.makeRequest('/user/password', {
            method: 'PUT',
            body: passwordData,
        });
    }

    async deleteAccount(password?: string): Promise<ApiResponse<{ message: string; deletedAt: string; notesDeleted: number }>> {
        return this.makeRequest('/user/account', {
            method: 'DELETE',
            body: password ? { password } : {},
        });
    }

    async getUserStats(): Promise<ApiResponse<{ stats: UserStats }>> {
        return this.makeRequest('/user/stats');
    }

    // Health Check
    async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; uptime: number }>> {
        return this.makeRequest('/health');
    }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE);

// Export individual API methods for easier importing
export const authAPI = {
    register: (userData: UserRegisterRequest) => apiClient.register(userData),
    login: (credentials: UserLoginRequest) => apiClient.login(credentials),
    googleAuth: (googleData: GoogleAuthRequest) => apiClient.googleAuth(googleData),
    verifyOTP: (otpData: OTPVerificationRequest) => apiClient.verifyOTP(otpData),
    resendOTP: (emailData: ResendOTPRequest) => apiClient.resendOTP(emailData),
};

export const notesAPI = {
    getNotes: (params?: Parameters<typeof apiClient.getNotes>[0]) => apiClient.getNotes(params),
    getNoteById: (id: string) => apiClient.getNoteById(id),
    createNote: (noteData: NoteCreateRequest) => apiClient.createNote(noteData),
    updateNote: (id: string, noteData: NoteUpdateRequest) => apiClient.updateNote(id, noteData),
    deleteNote: (id: string) => apiClient.deleteNote(id),
    searchNotes: (query: string, params?: Parameters<typeof apiClient.searchNotes>[1]) =>
        apiClient.searchNotes(query, params),
    getStats: () => apiClient.getNotesStats(),
    deleteAll: () => apiClient.deleteAllNotes(),
};

export const userAPI = {
    getProfile: () => apiClient.getUserProfile(),
    updateProfile: (userData: Parameters<typeof apiClient.updateUserProfile>[0]) =>
        apiClient.updateUserProfile(userData),
    changePassword: (passwordData: Parameters<typeof apiClient.changePassword>[0]) =>
        apiClient.changePassword(passwordData),
    deleteAccount: (password?: string) => apiClient.deleteAccount(password),
    getStats: () => apiClient.getUserStats(),
};

export default apiClient;
