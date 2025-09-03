import React from 'react';
import { SuccessMessageProps } from '../types';

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onClose }) => (
    <div className="success-message">
        <span>{message}</span>
        <button onClick={onClose} aria-label="Close success message">
            &times;
        </button>
    </div>
);

export default SuccessMessage;
