// Input validation & error handling module
export class validator {
    constructor() {
        this.rules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\d{3}[-.]?\d{3}[-.]?\d{4}$/,
            name: /^[a-zA-Z\s\-'\.]{2,50}$/,
            url: /^https?:\/\/.+/,
            linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/,
            file: {
                pdf: /^application\/pdf$/,
                doc: /^application\/msword$/,
                docx: /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,
                txt: /^text\/plain$/
            }
        };
        
        this.errors = [];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    // Validate email address
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Email is required' };
        }

        if (!this.rules.email.test(email)) {
            return { valid: false, error: 'Please enter a valid email address' };
        }

        if (email.length > 254) {
            return { valid: false, error: 'Email address is too long' };
        }

        return { valid: true };
    }

    // Validate phone number
    validatePhone(phone) {
        if (!phone) return { valid: true }; // Phone is optional

        if (typeof phone !== 'string') {
            return { valid: false, error: 'Phone number must be a string' };
        }

        const cleanPhone = phone.replace(/\s/g, '');
        
        if (!this.rules.phone.test(cleanPhone)) {
            return { valid: false, error: 'Please enter a valid phone number (e.g., 555-123-4567)' };
        }

        return { valid: true };
    }

    // Validate name
    validateName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Name is required' };
        }

        const cleanName = name.trim();
        
        if (cleanName.length < 2) {
            return { valid: false, error: 'Name must be at least 2 characters long' };
        }

        if (cleanName.length > 50) {
            return { valid: false, error: 'Name must be less than 50 characters' };
        }

        if (!this.rules.name.test(cleanName)) {
            return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
        }

        return { valid: true };
    }

    // Validate URL
    validateURL(url) {
        if (!url) return { valid: true }; // URL is optional

        if (typeof url !== 'string') {
            return { valid: false, error: 'URL must be a string' };
        }

        if (!this.rules.url.test(url)) {
            return { valid: false, error: 'Please enter a valid URL (e.g., https://example.com)' };
        }

        return { valid: true };
    }

    // Validate LinkedIn URL
    validateLinkedIn(url) {
        if (!url) return { valid: true }; // LinkedIn is optional

        const urlValidation = this.validateURL(url);
        if (!urlValidation.valid) {
            return urlValidation;
        }

        if (!this.rules.linkedin.test(url)) {
            return { valid: false, error: 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)' };
        }

        return { valid: true };
    }

    // Validate file upload
    validateFile(file, allowedTypes = ['pdf', 'doc', 'docx', 'txt']) {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            return { 
                valid: false, 
                error: `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit` 
            };
        }

        // Check file type
        const fileType = file.type;
        const isValidType = allowedTypes.some(type => {
            const rule = this.rules.file[type];
            return rule && rule.test(fileType);
        });

        if (!isValidType) {
            return { 
                valid: false, 
                error: `Invalid file type. Allowed types: ${allowedTypes.join(', ').toUpperCase()}` 
            };
        }

        // Check file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(extension)) {
            return { 
                valid: false, 
                error: `Invalid file extension. Allowed extensions: ${allowedTypes.join(', ').toUpperCase()}` 
            };
        }

        return { valid: true };
    }

    // Validate resume data structure
    validateResumeData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            errors.push('Resume data must be an object');
            return { valid: false, errors };
        }

        // Validate required fields
        if (!data.rawText || typeof data.rawText !== 'string') {
            errors.push('Resume text is required');
        } else if (data.rawText.length < 50) {
            errors.push('Resume text is too short (minimum 50 characters)');
        } else if (data.rawText.length > 50000) {
            errors.push('Resume text is too long (maximum 50,000 characters)');
        }

        // Validate personal info
        if (data.personalInfo) {
            const personalValidation = this.validatePersonalInfo(data.personalInfo);
            if (!personalValidation.valid) {
                errors.push(...personalValidation.errors);
            }
        }

        // Validate sections
        if (data.sections && Array.isArray(data.sections)) {
            if (data.sections.length === 0) {
                errors.push('Resume must have at least one section');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Validate personal information
    validatePersonalInfo(personalInfo) {
        const errors = [];

        if (!personalInfo || typeof personalInfo !== 'object') {
            errors.push('Personal information must be an object');
            return { valid: false, errors };
        }

        // Validate name
        if (personalInfo.name) {
            const nameValidation = this.validateName(personalInfo.name);
            if (!nameValidation.valid) {
                errors.push(`Name: ${nameValidation.error}`);
            }
        }

        // Validate email
        if (personalInfo.email) {
            const emailValidation = this.validateEmail(personalInfo.email);
            if (!emailValidation.valid) {
                errors.push(`Email: ${emailValidation.error}`);
            }
        }

        // Validate phone
        if (personalInfo.phone) {
            const phoneValidation = this.validatePhone(personalInfo.phone);
            if (!phoneValidation.valid) {
                errors.push(`Phone: ${phoneValidation.error}`);
            }
        }

        // Validate LinkedIn
        if (personalInfo.linkedin) {
            const linkedinValidation = this.validateLinkedIn(personalInfo.linkedin);
            if (!linkedinValidation.valid) {
                errors.push(`LinkedIn: ${linkedinValidation.error}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Validate skills
    validateSkills(skills) {
        if (!skills) return { valid: true }; // Skills are optional

        if (typeof skills !== 'string') {
            return { valid: false, error: 'Skills must be provided as text' };
        }

        const skillArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        if (skillArray.length === 0) {
            return { valid: false, error: 'At least one skill must be provided' };
        }

        if (skillArray.length > 50) {
            return { valid: false, error: 'Too many skills (maximum 50)' };
        }

        const invalidSkills = skillArray.filter(skill => 
            skill.length < 2 || skill.length > 50
        );

        if (invalidSkills.length > 0) {
            return { valid: false, error: 'Each skill must be between 2 and 50 characters' };
        }

        return { valid: true, skills: skillArray };
    }

    // Validate experience
    validateExperience(experience) {
        if (!experience) return { valid: true }; // Experience is optional

        if (typeof experience !== 'string') {
            return { valid: false, error: 'Experience must be provided as text' };
        }

        const cleanExperience = experience.trim();

        if (cleanExperience.length < 20) {
            return { valid: false, error: 'Experience section is too short (minimum 20 characters)' };
        }

        if (cleanExperience.length > 10000) {
            return { valid: false, error: 'Experience section is too long (maximum 10,000 characters)' };
        }

        return { valid: true };
    }

    // Validate education
    validateEducation(education) {
        if (!education) return { valid: true }; // Education is optional

        if (typeof education !== 'string') {
            return { valid: false, error: 'Education must be provided as text' };
        }

        const cleanEducation = education.trim();

        if (cleanEducation.length < 10) {
            return { valid: false, error: 'Education section is too short (minimum 10 characters)' };
        }

        if (cleanEducation.length > 5000) {
            return { valid: false, error: 'Education section is too long (maximum 5,000 characters)' };
        }

        return { valid: true };
    }

    // Validate form
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) {
            return { valid: false, errors: ['Form not found'] };
        }

        this.clearAllErrors();
        const errors = [];

        // Validate all required fields
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            const value = field.value.trim();
            
            if (!value) {
                const fieldName = field.name || field.id || 'Field';
                errors.push(`${fieldName} is required`);
                this.showFieldError(field, 'This field is required');
            } else {
                this.clearFieldError(field);
            }
        });

        // Validate specific field types
        form.querySelectorAll('input[type="email"]').forEach(field => {
            if (field.value) {
                const validation = this.validateEmail(field.value);
                if (!validation.valid) {
                    errors.push(`Email: ${validation.error}`);
                    this.showFieldError(field, validation.error);
                } else {
                    this.clearFieldError(field);
                }
            }
        });

        form.querySelectorAll('input[type="tel"]').forEach(field => {
            if (field.value) {
                const validation = this.validatePhone(field.value);
                if (!validation.valid) {
                    errors.push(`Phone: ${validation.error}`);
                    this.showFieldError(field, validation.error);
                } else {
                    this.clearFieldError(field);
                }
            }
        });

        form.querySelectorAll('input[type="url"]').forEach(field => {
            if (field.value) {
                const validation = this.validateURL(field.value);
                if (!validation.valid) {
                    errors.push(`URL: ${validation.error}`);
                    this.showFieldError(field, validation.error);
                } else {
                    this.clearFieldError(field);
                }
            }
        });

        form.querySelectorAll('input[type="file"]').forEach(field => {
            if (field.files[0]) {
                const validation = this.validateFile(field.files[0]);
                if (!validation.valid) {
                    errors.push(`File: ${validation.error}`);
                    this.showFieldError(field, validation.error);
                } else {
                    this.clearFieldError(field);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Show field error
    showFieldError(field, message) {
        this.clearFieldError(field); // Clear existing error
        
        field.classList.add('border-red-500', 'focus:border-red-500');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1 field-error';
        errorDiv.textContent = message;
        
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    // Clear field error
    clearFieldError(field) {
        field.classList.remove('border-red-500', 'focus:border-red-500');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Clear all form errors
    clearAllErrors() {
        document.querySelectorAll('.field-error').forEach(error => {
            error.remove();
        });

        document.querySelectorAll('.border-red-500').forEach(field => {
            field.classList.remove('border-red-500', 'focus:border-red-500');
        });
    }

    // Sanitize input
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    // Validate password strength
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Password is required' };
        }

        if (password.length < 8) {
            return { valid: false, error: 'Password must be at least 8 characters long' };
        }

        if (password.length > 128) {
            return { valid: false, error: 'Password must be less than 128 characters' };
        }

        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const strength = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

        if (strength < 3) {
            return { 
                valid: false, 
                error: 'Password must contain at least 3 of: lowercase letters, uppercase letters, numbers, special characters' 
            };
        }

        return { valid: true, strength };
    }

    // Validate job description
    validateJobDescription(description) {
        if (!description || typeof description !== 'string') {
            return { valid: false, error: 'Job description is required' };
        }

        const cleanDescription = description.trim();

        if (cleanDescription.length < 50) {
            return { valid: false, error: 'Job description is too short (minimum 50 characters)' };
        }

        if (cleanDescription.length > 5000) {
            return { valid: false, error: 'Job description is too long (maximum 5,000 characters)' };
        }

        return { valid: true };
    }

    // Get all validation errors
    getErrors() {
        return [...this.errors];
    }

    // Clear all errors
    clearErrors() {
        this.errors = [];
    }

    // Add custom error
    addError(error) {
        this.errors.push(error);
    }

    // Check if there are any errors
    hasErrors() {
        return this.errors.length > 0;
    }
}

// Export singleton instance
export const validatorInstance = new validator();
