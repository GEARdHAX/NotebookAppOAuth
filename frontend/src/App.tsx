import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ViewType, User, AuthResponse } from './types';
import { AuthUtils } from './utils/auth';
import {
    LoginForm,
    RegisterForm,
    OTPVerification,
    Dashboard,
    ErrorMessage,
} from './components';
import './App.css';

// Debug log for environment variables
console.log('Environment check:', {
    API_URL: import.meta.env.VITE_API_URL,
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
});

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('login');
    const [user, setUser] = useState<User | null>(null);
    const [otpEmail, setOtpEmail] = useState('');
    const [initializing, setInitializing] = useState(true);

    // Auto-login if user already in localStorage
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedAuth = AuthUtils.getStoredAuth();

                if (storedAuth && AuthUtils.isTokenValid(storedAuth.token)) {
                    setUser(storedAuth.user);
                    setCurrentView('dashboard');
                } else {
                    // Clear invalid/expired auth data
                    AuthUtils.logout();
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                AuthUtils.logout();
            } finally {
                setInitializing(false);
            }
        };

        initializeAuth();
    }, []);

    const handleLogin = (authData: AuthResponse) => {
        console.log('🔐 App.handleLogin called with:', authData);

        try {
            // Store authentication data in localStorage
            console.log('🔐 Storing auth data using AuthUtils.login');
            AuthUtils.login(authData.token, authData.user);

            console.log('🔐 Setting user state and switching to dashboard');
            setUser(authData.user);
            setCurrentView('dashboard');

            console.log('🔐 Login flow completed successfully');
        } catch (error) {
            console.error('🔐 Error during login handling:', error);
        }
    };

    const handleRegistrationSuccess = (email: string) => {
        setOtpEmail(email);
        setCurrentView('otp');
    };

    const handleVerificationSuccess = (authData: AuthResponse) => {
        // Store authentication data in localStorage
        AuthUtils.login(authData.token, authData.user);
        setUser(authData.user);
        setCurrentView('dashboard');
    };

    const handleLogout = () => {
        AuthUtils.logout();
        setUser(null);
        setCurrentView('login');
    };

    const handleViewSwitch = (view: ViewType) => {
        setCurrentView(view);
    };

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Show loading spinner while initializing
    if (initializing) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Loading...</h2>
                    <p>Initializing application...</p>
                </div>
            </div>
        );
    }

    // Show error if Google Client ID is missing
    if (!googleClientId) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Configuration Error</h2>
                    <p>Google Client ID is missing. Please check your .env file.</p>
                    <p>Add <code>VITE_GOOGLE_CLIENT_ID</code> to your <code>frontend/.env</code> file</p>
                    <div style={{ marginTop: '20px' }}>
                        <button onClick={handleLogout} className="btn-secondary">
                            Continue without Google Auth
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <GoogleOAuthProvider clientId={googleClientId}>
                {currentView === 'login' && (
                    <LoginForm
                        onLogin={handleLogin}
                        onSwitchToRegister={() => handleViewSwitch('register')}
                    />
                )}

                {currentView === 'register' && (
                    <RegisterForm
                        onSwitchToLogin={() => handleViewSwitch('login')}
                        onRegistrationSuccess={handleRegistrationSuccess}
                    />
                )}

                {currentView === 'otp' && (
                    <OTPVerification
                        email={otpEmail}
                        onVerificationSuccess={handleVerificationSuccess}
                        onBackToLogin={() => handleViewSwitch('login')}
                    />
                )}

                {currentView === 'dashboard' && user && (
                    <Dashboard
                        user={user}
                        onLogout={handleLogout}
                    />
                )}

                {/* Fallback for invalid states */}
                {currentView === 'dashboard' && !user && (
                    <div className="auth-container">
                        <div className="auth-card">
                            <ErrorMessage
                                message="Session expired. Please log in again."
                                onClose={() => handleViewSwitch('login')}
                            />
                        </div>
                    </div>
                )}
            </GoogleOAuthProvider>
        </div>
    );
};

export default App;
