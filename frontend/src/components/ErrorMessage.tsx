import React from 'react';
import { ErrorMessageProps } from '../types';

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => (
    <div className="error-message">
        <span>{message}</span>
        <button onClick={onClose} aria-label="Close error message">
            &times;
        </button>
    </div>
);

export default ErrorMessage;
