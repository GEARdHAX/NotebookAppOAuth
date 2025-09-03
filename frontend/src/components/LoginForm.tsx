import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { LoginFormProps, LoginFormData } from '../types';
import { authAPI } from '../services/api';
import { ValidationUtils } from '../utils/validation';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister }) => {
    const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

    const handleInputChange = (field: keyof LoginFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear validation error for this field when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});

        // Client-side validation
        const validation = ValidationUtils.validateLoginForm(formData);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.login(formData);
            if (response.success) {
                // The response contains token and user directly, not wrapped in data
                const authData = {
                    message: response.message || 'Login successful',
                    token: response.token,
                    user: response.user
                };
                onLogin(authData);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.error || err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setError('Google authentication failed - no credential received');
            return;
        }

        try {
            setLoading(true);
            setError('');

            console.log('🔐 Starting Google OAuth login...');
            const response = await authAPI.googleAuth({
                tokenId: credentialResponse.credential
            });

            console.log('🔐 Google OAuth API response:', response);

            if (response.success) {
                // The response contains token and user directly, not wrapped in data
                const authData = {
                    message: response.message || 'Google login successful',
                    token: response.token,
                    user: response.user
                };
                console.log('🔐 Calling onLogin with:', authData);
                onLogin(authData);
            } else {
                console.error('🔐 OAuth response missing success:', response);
                setError('Google login failed - invalid response');
            }
        } catch (err: any) {
            console.error('🔐 Google login error:', err);
            setError(err.error || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLoginError = () => {
        setError('Google login failed');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Welcome Back</h2>
                <p>Sign in to your account</p>

                {error && <ErrorMessage message={error} onClose={() => setError('')} />}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                            placeholder="Enter your email"
                            className={validationErrors.email ? 'error' : ''}
                        />
                        {validationErrors.email && (
                            <span className="field-error">{validationErrors.email[0]}</span>
                        )}
                    </div>

                    <div className="form-group password-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                required
                                placeholder="Enter your password"
                                className={validationErrors.password ? 'error' : ''}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                        {validationErrors.password && (
                            <span className="field-error">{validationErrors.password[0]}</span>
                        )}
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <LoadingSpinner /> : 'Sign In'}
                    </button>
                </form>

                <div className="divider">
                    <span>or</span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={handleGoogleLoginError}
                        theme="outline"
                        size="large"
                        width="100%"
                    />
                </div>

                <p className="auth-switch">
                    Don't have an account?{' '}
                    <button onClick={onSwitchToRegister} className="link-btn">
                        Sign Up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
