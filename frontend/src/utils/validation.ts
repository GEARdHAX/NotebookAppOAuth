// Client-side validation utilities
export class ValidationUtils {
    // Email validation
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    // Password validation
    static isValidPassword(password: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!password) {
            errors.push('Password is required');
            return { valid: false, errors };
        }

        if (password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        if (password.length > 128) {
            errors.push('Password cannot exceed 128 characters');
        }

        // Optional: Add more password strength checks
        if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
            // This is optional - you can uncomment if you want stronger passwords
            // errors.push('Password should contain both uppercase and lowercase letters');
        }

        return { valid: errors.length === 0, errors };
    }

    // Name validation
    static isValidName(name: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmedName = name.trim();

        if (!trimmedName) {
            errors.push('Name is required');
            return { valid: false, errors };
        }

        if (trimmedName.length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (trimmedName.length > 50) {
            errors.push('Name cannot exceed 50 characters');
        }

        // Check for valid characters (letters, spaces, hyphens, apostrophes)
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!nameRegex.test(trimmedName)) {
            errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
        }

        return { valid: errors.length === 0, errors };
    }

    // OTP validation
    static isValidOTP(otp: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmedOTP = otp.trim();

        if (!trimmedOTP) {
            errors.push('OTP is required');
            return { valid: false, errors };
        }

        if (trimmedOTP.length !== 6) {
            errors.push('OTP must be exactly 6 digits');
        }

        if (!/^\d{6}$/.test(trimmedOTP)) {
            errors.push('OTP must contain only numbers');
        }

        return { valid: errors.length === 0, errors };
    }

    // Note title validation
    static isValidNoteTitle(title: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            errors.push('Title is required');
            return { valid: false, errors };
        }

        if (trimmedTitle.length > 200) {
            errors.push('Title cannot exceed 200 characters');
        }

        return { valid: errors.length === 0, errors };
    }

    // Note content validation
    static isValidNoteContent(content: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const trimmedContent = content.trim();

        if (!trimmedContent) {
            errors.push('Content is required');
            return { valid: false, errors };
        }

        if (trimmedContent.length > 10000) {
            errors.push('Content cannot exceed 10,000 characters');
        }

        return { valid: errors.length === 0, errors };
    }

    // Generic form validation
    static validateForm(
        data: Record<string, any>,
        validators: Record<string, (value: any) => { valid: boolean; errors: string[] }>
    ): { valid: boolean; errors: Record<string, string[]> } {
        const allErrors: Record<string, string[]> = {};
        let isValid = true;

        Object.entries(validators).forEach(([field, validator]) => {
            const result = validator(data[field]);
            if (!result.valid) {
                allErrors[field] = result.errors;
                isValid = false;
            }
        });

        return { valid: isValid, errors: allErrors };
    }

    // Registration form validation
    static validateRegistrationForm(data: {
        email: string;
        password: string;
        name: string;
    }): { valid: boolean; errors: Record<string, string[]> } {
        return this.validateForm(data, {
            email: (email) => ({
                valid: this.isValidEmail(email),
                errors: this.isValidEmail(email) ? [] : ['Please enter a valid email address']
            }),
            password: this.isValidPassword,
            name: this.isValidName,
        });
    }

    // Login form validation
    static validateLoginForm(data: {
        email: string;
        password: string;
    }): { valid: boolean; errors: Record<string, string[]> } {
        return this.validateForm(data, {
            email: (email) => ({
                valid: this.isValidEmail(email),
                errors: this.isValidEmail(email) ? [] : ['Please enter a valid email address']
            }),
            password: (password) => ({
                valid: Boolean(password),
                errors: password ? [] : ['Password is required']
            }),
        });
    }

    // Note form validation
    static validateNoteForm(data: {
        title: string;
        content: string;
    }): { valid: boolean; errors: Record<string, string[]> } {
        return this.validateForm(data, {
            title: this.isValidNoteTitle,
            content: this.isValidNoteContent,
        });
    }

    // Sanitize HTML content (basic)
    static sanitizeHtml(html: string): string {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    // Format validation errors for display
    static formatErrors(errors: Record<string, string[]>): string {
        return Object.entries(errors)
            .map(([field, fieldErrors]) =>
                `${field.charAt(0).toUpperCase() + field.slice(1)}: ${fieldErrors.join(', ')}`
            )
            .join('\n');
    }

    // Get first error message
    static getFirstError(errors: Record<string, string[]>): string {
        const firstField = Object.keys(errors)[0];
        return firstField ? errors[firstField][0] : '';
    }
}

export default ValidationUtils;
