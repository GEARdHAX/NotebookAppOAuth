import React, { useState } from 'react';
import { RegisterFormProps, RegisterFormData } from '../types';
import { authAPI } from '../services/api';
import { ValidationUtils } from '../utils/validation';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onRegistrationSuccess }) => {
    const [formData, setFormData] = useState<RegisterFormData>({
        email: '',
        password: '',
        name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

    const handleInputChange = (field: keyof RegisterFormData, value: string) => {
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
        setSuccess('');
        setValidationErrors({});

        // Client-side validation
        const validation = ValidationUtils.validateRegistrationForm(formData);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.register(formData);
            if (response.success) {
                setSuccess(response.message || 'Registration successful! Please verify your email.');
                onRegistrationSuccess(formData.email);
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.error || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Account</h2>
                <p>Sign up to start taking notes</p>

                {error && <ErrorMessage message={error} onClose={() => setError('')} />}
                {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                            placeholder="Enter your full name"
                            className={validationErrors.name ? 'error' : ''}
                        />
                        {validationErrors.name && (
                            <span className="field-error">{validationErrors.name[0]}</span>
                        )}
                    </div>

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
                                placeholder="Create a password (min 6 characters)"
                                minLength={6}
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
                        {loading ? <LoadingSpinner /> : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="link-btn">
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
