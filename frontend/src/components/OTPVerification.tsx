import React, { useState } from 'react';
import { OTPVerificationProps } from '../types';
import { authAPI } from '../services/api';
import { ValidationUtils } from '../utils/validation';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const OTPVerification: React.FC<OTPVerificationProps> = ({
    email,
    onVerificationSuccess,
    onBackToLogin
}) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const handleOtpChange = (value: string) => {
        // Only allow digits and limit to 6 characters
        const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
        setOtp(sanitizedValue);

        // Clear validation errors when user types
        if (validationErrors.length > 0) {
            setValidationErrors([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setValidationErrors([]);

        // Client-side validation
        const validation = ValidationUtils.isValidOTP(otp);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.verifyOTP({ email, otp });
            if (response.success) {
                // The response contains token and user directly, not wrapped in data
                const authData = {
                    message: response.message || 'Email verified successfully',
                    token: response.token,
                    user: response.user
                };
                onVerificationSuccess(authData);
            }
        } catch (err: any) {
            console.error('OTP verification error:', err);
            setError(err.error || err.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        setError('');

        try {
            const response = await authAPI.resendOTP({ email });
            if (response.success) {
                // Show success feedback (you could use a toast notification here)
                alert('OTP sent successfully!');
            }
        } catch (err: any) {
            console.error('Resend OTP error:', err);
            setError(err.error || err.message || 'Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Verify Your Email</h2>
                <p>We've sent a 6-digit code to <strong>{email}</strong></p>

                {error && <ErrorMessage message={error} onClose={() => setError('')} />}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="otp">Enter OTP</label>
                        <input
                            id="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => handleOtpChange(e.target.value)}
                            required
                            placeholder="000000"
                            maxLength={6}
                            className={`otp-input ${validationErrors.length > 0 ? 'error' : ''}`}
                            autoComplete="one-time-code"
                        />
                        {validationErrors.length > 0 && (
                            <span className="field-error">{validationErrors[0]}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? <LoadingSpinner /> : 'Verify'}
                    </button>
                </form>

                <div className="otp-actions">
                    <button
                        onClick={handleResendOTP}
                        disabled={resendLoading}
                        className="link-btn"
                    >
                        {resendLoading ? 'Sending...' : 'Resend OTP'}
                    </button>
                    <button onClick={onBackToLogin} className="link-btn">
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
