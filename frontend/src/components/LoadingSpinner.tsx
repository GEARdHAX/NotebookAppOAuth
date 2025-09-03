import React from 'react';
import { LoadingSpinnerProps } from '../types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = () => (
    <div className="loading-spinner">
        <div className="spinner"></div>
    </div>
);

export default LoadingSpinner;
