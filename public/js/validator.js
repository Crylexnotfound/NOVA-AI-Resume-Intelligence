// Validation module
class Validator {
    constructor() {
        this.rules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\d{3}[-.]?\d{3}[-.]?\d{4}$/,
            name: /^[a-zA-Z\s]{2,50}$/,
            file: {
                pdf: /^application\/pdf$/,
                doc: /^application\/msword$/,
                docx: /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,
                txt: /^text\/plain$/
            }
        };
    }

    validateEmail(email) {
        return this.rules.email.test(email);
    }

    validatePhone(phone) {
        return this.rules.phone.test(phone.replace(/\s/g, ''));
    }

    validateName(name) {
        return this.rules.name.test(name);
    }

    validateFile(file, allowedTypes = ['pdf', 'doc', 'docx', 'txt']) {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return { valid: false, error: 'File size exceeds 10MB limit' };
        }

        const fileType = file.type;
        const isValidType = allowedTypes.some(type => this.rules.file[type]?.test(fileType));

        if (!isValidType) {
            return { valid: false, error: 'Invalid file type. Allowed types: PDF, DOC, DOCX, TXT' };
        }

        return { valid: true };
    }

    validateResumeData(data) {
        const errors = [];

        if (!data.personalInfo) {
            errors.push('Personal information is required');
        } else {
            if (!data.personalInfo.name || !this.validateName(data.personalInfo.name)) {
                errors.push('Valid name is required');
            }
            if (data.personalInfo.email && !this.validateEmail(data.personalInfo.email)) {
                errors.push('Valid email is required');
            }
            if (data.personalInfo.phone && !this.validatePhone(data.personalInfo.phone)) {
                errors.push('Valid phone number is required');
            }
        }

        if (!data.experience || data.experience.trim().length < 50) {
            errors.push('Experience section should be at least 50 characters');
        }

        if (!data.education || data.education.trim().length < 20) {
            errors.push('Education section should be at least 20 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    sanitizeInput(input) {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    validateLinkedIn(url) {
        if (!url) return true; // Optional field
        return this.validateURL(url) && url.includes('linkedin.com');
    }

    validateSkills(skills) {
        if (!skills || typeof skills !== 'string') {
            return { valid: false, error: 'Skills must be provided as text' };
        }

        const skillArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        if (skillArray.length === 0) {
            return { valid: false, error: 'At least one skill must be provided' };
        }

        if (skillArray.length > 20) {
            return { valid: false, error: 'Too many skills (maximum 20)' };
        }

        const invalidSkills = skillArray.filter(skill => skill.length < 2 || skill.length > 30);
        if (invalidSkills.length > 0) {
            return { valid: false, error: 'Each skill must be between 2 and 30 characters' };
        }

        return { valid: true, skills: skillArray };
    }

    validateExperience(experience) {
        if (!experience || typeof experience !== 'string') {
            return { valid: false, error: 'Experience must be provided as text' };
        }

        if (experience.trim().length < 50) {
            return { valid: false, error: 'Experience section is too short (minimum 50 characters)' };
        }

        if (experience.trim().length > 2000) {
            return { valid: false, error: 'Experience section is too long (maximum 2000 characters)' };
        }

        return { valid: true };
    }

    validateEducation(education) {
        if (!education || typeof education !== 'string') {
            return { valid: false, error: 'Education must be provided as text' };
        }

        if (education.trim().length < 20) {
            return { valid: false, error: 'Education section is too short (minimum 20 characters)' };
        }

        if (education.trim().length > 1000) {
            return { valid: false, error: 'Education section is too long (maximum 1000 characters)' };
        }

        return { valid: true };
    }

    showError(field, message) {
        const fieldElement = document.getElementById(field);
        if (!fieldElement) return;

        // Remove existing error
        this.removeError(field);

        // Add error styling
        fieldElement.classList.add('border-red-500', 'focus:border-red-500');

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.id = `${field}-error`;
        errorDiv.className = 'text-red-500 text-sm mt-1';
        errorDiv.textContent = message;

        // Insert error message after field
        fieldElement.parentNode.insertBefore(errorDiv, fieldElement.nextSibling);
    }

    removeError(field) {
        const fieldElement = document.getElementById(field);
        if (!fieldElement) return;

        // Remove error styling
        fieldElement.classList.remove('border-red-500', 'focus:border-red-500');

        // Remove error message
        const errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
            errorElement.remove();
        }
    }

    clearAllErrors() {
        document.querySelectorAll('[id$="-error"]').forEach(error => {
            error.remove();
        });

        document.querySelectorAll('.border-red-500').forEach(field => {
            field.classList.remove('border-red-500', 'focus:border-red-500');
        });
    }

    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return { valid: false, errors: ['Form not found'] };

        this.clearAllErrors();
        const errors = [];

        // Validate all required fields
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                errors.push(`${field.name || field.id} is required`);
                this.showError(field.id || field.name, 'This field is required');
            }
        });

        // Validate specific field types
        form.querySelectorAll('input[type="email"]').forEach(field => {
            if (field.value && !this.validateEmail(field.value)) {
                errors.push('Invalid email format');
                this.showError(field.id, 'Please enter a valid email address');
            }
        });

        form.querySelectorAll('input[type="tel"]').forEach(field => {
            if (field.value && !this.validatePhone(field.value)) {
                errors.push('Invalid phone format');
                this.showError(field.id, 'Please enter a valid phone number');
            }
        });

        form.querySelectorAll('input[type="file"]').forEach(field => {
            if (field.files[0]) {
                const validation = this.validateFile(field.files[0]);
                if (!validation.valid) {
                    errors.push(validation.error);
                    this.showError(field.id, validation.error);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export for use in other modules
window.validator = new Validator();
