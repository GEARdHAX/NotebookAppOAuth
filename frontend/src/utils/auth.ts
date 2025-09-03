import { User } from '../types';

// Auth utility functions
export class AuthUtils {
    private static readonly TOKEN_KEY = 'token';
    private static readonly USER_KEY = 'user';

    // Token management
    static getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static removeToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    // User data management
    static getUser(): User | null {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.removeUser();
            return null;
        }
    }

    static setUser(user: User): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    static removeUser(): void {
        localStorage.removeItem(this.USER_KEY);
    }

    // Authentication state
    static isAuthenticated(): boolean {
        const token = this.getToken();
        const user = this.getUser();
        return Boolean(token && user);
    }

    // Login
    static login(token: string, user: User): void {
        console.log('🔐 AuthUtils.login called with token:', token ? 'Present' : 'Missing', 'user:', user);
        this.setToken(token);
        this.setUser(user);

        // Verify storage
        const storedToken = this.getToken();
        const storedUser = this.getUser();
        console.log('🔐 After storage - Token stored:', storedToken ? 'Yes' : 'No', 'User stored:', storedUser ? 'Yes' : 'No');
    }

    // Logout
    static logout(): void {
        this.removeToken();
        this.removeUser();
    }

    // Auto-login check
    static getStoredAuth(): { user: User; token: string } | null {
        const token = this.getToken();
        const user = this.getUser();

        if (token && user) {
            return { token, user };
        }

        return null;
    }

    // Token validation (basic client-side check)
    static isTokenValid(token?: string): boolean {
        const tokenToCheck = token || this.getToken();

        if (!tokenToCheck) {
            return false;
        }

        try {
            // Basic JWT structure check
            const parts = tokenToCheck.split('.');
            if (parts.length !== 3) {
                return false;
            }

            // Decode payload (without verification - this is just for expiry check)
            const payload = JSON.parse(atob(parts[1]));
            const now = Date.now() / 1000;

            // Check if token is expired
            if (payload.exp && payload.exp < now) {
                console.log('Token is expired');
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating token:', error);
            this.logout();
            return false;
        }
    }

    // Get auth headers for API requests
    static getAuthHeaders(): Record<string, string> {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Handle authentication errors
    static handleAuthError(): void {
        this.logout();
        // You could also trigger a redirect or show a notification here
        window.location.reload();
    }

    // Check if user is verified
    static isUserVerified(): boolean {
        const user = this.getUser();
        return user ? user.isVerified !== false : false;
    }

    // Get user role or permissions (for future use)
    static getUserRole(): string {
        const user = this.getUser();
        return user ? 'user' : 'guest'; // Basic implementation
    }
}

export default AuthUtils;
