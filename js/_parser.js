// Resume parsing & text extraction module
export class parser {
    constructor() {
        this.supportedFormats = ['pdf', 'doc', 'docx', 'txt'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    async parseFile(file) {
        // Validate file
        this.validateFile(file);
        
        const format = this.getFileFormat(file);
        
        switch (format) {
            case 'pdf':
                return await this.parsePDF(file);
            case 'doc':
            case 'docx':
                return await this.parseWord(file);
            case 'txt':
                return await this.parseText(file);
            default:
                throw new Error(`Unsupported file format: ${format}`);
        }
    }

    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
        }

        const format = this.getFileFormat(file);
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`Unsupported file format: ${format}. Supported formats: ${this.supportedFormats.join(', ')}`);
        }
    }

    getFileFormat(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return extension;
    }

    async parsePDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    
                    if (window.pdfjsLib) {
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        let fullText = '';
                        let pageCount = 0;
                        
                        // Extract text from all pages
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items
                                .map(item => item.str)
                                .join(' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            
                            fullText += pageText + '\n';
                            pageCount++;
                        }
                        
                        const resumeData = this.extractResumeData(fullText);
                        resumeData.metadata = {
                            format: 'pdf',
                            pageCount: pageCount,
                            fileSize: file.size
                        };
                        
                        resolve(resumeData);
                    } else {
                        reject(new Error('PDF.js library not loaded'));
                    }
                } catch (error) {
                    reject(new Error(`PDF parsing failed: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            reader.readAsArrayBuffer(file);
        });
    }

    async parseWord(file) {
        // For Word documents, we'll use a simplified approach
        // In a production environment, you'd use libraries like mammoth.js for .docx files
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    // Since we can't parse Word files directly in the browser without additional libraries,
                    // we'll extract basic text and provide a structured response
                    const arrayBuffer = e.target.result;
                    const text = this.extractTextFromWordBuffer(arrayBuffer);
                    
                    const resumeData = this.extractResumeData(text);
                    resumeData.metadata = {
                        format: this.getFileFormat(file),
                        fileSize: file.size
                    };
                    
                    resolve(resumeData);
                } catch (error) {
                    reject(new Error(`Word document parsing failed: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read Word document'));
            reader.readAsArrayBuffer(file);
        });
    }

    extractTextFromWordBuffer(buffer) {
        // This is a simplified text extraction for Word documents
        // In production, use proper libraries like mammoth.js
        const decoder = new TextDecoder('utf-8');
        let text = decoder.decode(buffer);
        
        // Remove Word-specific formatting and binary data
        text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        text = text.replace(/\s+/g, ' ');
        text = text.trim();
        
        // If no meaningful text extracted, provide a placeholder
        if (text.length < 50) {
            text = 'Resume content - Word document parsing requires additional libraries for full text extraction. Please upload a PDF or TXT file for best results.';
        }
        
        return text;
    }

    async parseText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const resumeData = this.extractResumeData(text);
                    resumeData.metadata = {
                        format: 'txt',
                        fileSize: file.size
                    };
                    
                    resolve(resumeData);
                } catch (error) {
                    reject(new Error(`Text parsing failed: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read text file'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    extractResumeData(text) {
        // Clean and normalize text
        const cleanText = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        // Extract structured information
        const resumeData = {
            rawText: cleanText,
            personalInfo: this.extractPersonalInfo(cleanText),
            experience: this.extractExperience(cleanText),
            education: this.extractEducation(cleanText),
            skills: this.extractSkills(cleanText),
            sections: this.identifySections(cleanText),
            summary: this.extractSummary(cleanText),
            metadata: {}
        };

        return resumeData;
    }

    extractPersonalInfo(text) {
        const lines = text.split('\n').filter(line => line.trim());
        
        // Extract name (usually first line)
        let name = '';
        if (lines.length > 0) {
            name = lines[0].trim();
            // Remove common non-name elements
            name = name.replace(/\d+/g, ''); // Remove numbers
            name = name.replace(/[^\w\s\-']/g, ' '); // Keep only letters, spaces, hyphens, apostrophes
            name = name.replace(/\s+/g, ' ').trim();
            
            // If name looks like an email or phone, skip
            if (name.includes('@') || /^\d[\d\-\s]*\d$/.test(name)) {
                name = '';
            }
        }

        // Extract email
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailRegex) || [];
        const email = emails[0] || '';

        // Extract phone numbers
        const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
        const phones = text.match(phoneRegex) || [];
        const phone = phones[0] || '';

        // Extract location (state, city, or country)
        const location = this.extractLocation(text);

        // Extract LinkedIn
        const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/)([a-zA-Z0-9\-]+)/gi;
        const linkedinMatches = text.match(linkedinRegex) || [];
        const linkedin = linkedinMatches[0] || '';

        return {
            name: name,
            email: email,
            phone: phone,
            location: location,
            linkedin: linkedin
        };
    }

    extractLocation(text) {
        const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
        const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
        
        const lines = text.split('\n');
        
        for (const line of lines) {
            const cleanLine = line.trim();
            
            // Check for state abbreviations
            for (const state of states) {
                if (cleanLine.includes(state)) {
                    return cleanLine;
                }
            }
            
            // Check for major cities
            for (const city of cities) {
                if (cleanLine.includes(city)) {
                    return cleanLine;
                }
            }
        }
        
        return '';
    }

    extractExperience(text) {
        const experienceSection = this.extractSection(text, [
            'experience', 'work', 'employment', 'career', 'professional experience',
            'work experience', 'work history', 'professional background'
        ]);
        
        return experienceSection || '';
    }

    extractEducation(text) {
        const educationSection = this.extractSection(text, [
            'education', 'academic', 'university', 'college', 'school',
            'academic background', 'educational background', 'qualifications'
        ]);
        
        return educationSection || '';
    }

    extractSkills(text) {
        const skillsSection = this.extractSection(text, [
            'skills', 'technical', 'competencies', 'abilities', 'expertise',
            'technical skills', 'core competencies', 'key skills', 'skill set'
        ]);
        
        return skillsSection || '';
    }

    extractSummary(text) {
        const summarySection = this.extractSection(text, [
            'summary', 'objective', 'profile', 'overview',
            'professional summary', 'career summary', 'executive summary',
            'career objective', 'professional profile'
        ]);
        
        return summarySection || '';
    }

    extractSection(text, keywords) {
        const lines = text.split('\n');
        let sectionStart = -1;
        let sectionEnd = -1;
        
        // Find section start
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase().trim();
            
            // Check if any keyword matches
            const keywordMatch = keywords.some(keyword => {
                // Exact match
                if (line === keyword) return true;
                // Contains keyword
                if (line.includes(keyword)) return true;
                // Word boundary match
                const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                return regex.test(line);
            });
            
            if (keywordMatch) {
                sectionStart = i;
                break;
            }
        }
        
        if (sectionStart === -1) return '';
        
        // Find section end (next major section)
        const majorSections = [
            'experience', 'work', 'employment', 'education', 'academic',
            'skills', 'technical', 'competencies', 'summary', 'objective',
            'profile', 'projects', 'certifications', 'awards', 'interests',
            'references', 'activities', 'leadership', 'volunteer'
        ];
        
        for (let i = sectionStart + 1; i < lines.length; i++) {
            const line = lines[i].toLowerCase().trim();
            
            const isNextSection = majorSections.some(section => {
                // Don't match the current section keywords
                if (keywords.some(k => line.includes(k))) return false;
                
                // Check for other section headers
                return line === section || line.includes(section);
            });
            
            if (isNextSection) {
                sectionEnd = i;
                break;
            }
        }
        
        // Extract section lines
        const sectionLines = lines.slice(
            sectionStart, 
            sectionEnd === -1 ? lines.length : sectionEnd
        );
        
        // Clean up the section text
        let sectionText = sectionLines.join('\n').trim();
        
        // Remove the section header
        const headerLine = sectionLines[0].trim();
        if (keywords.some(k => headerLine.toLowerCase().includes(k))) {
            sectionText = sectionLines.slice(1).join('\n').trim();
        }
        
        return sectionText;
    }

    identifySections(text) {
        const sections = [];
        const sectionKeywords = [
            { name: 'Summary', keywords: ['summary', 'objective', 'profile', 'overview'] },
            { name: 'Experience', keywords: ['experience', 'work', 'employment', 'career'] },
            { name: 'Education', keywords: ['education', 'academic', 'university', 'college'] },
            { name: 'Skills', keywords: ['skills', 'technical', 'competencies', 'abilities'] },
            { name: 'Projects', keywords: ['projects', 'portfolio', 'work samples'] },
            { name: 'Certifications', keywords: ['certifications', 'certificates', 'licenses'] },
            { name: 'Awards', keywords: ['awards', 'honors', 'recognition'] },
            { name: 'Leadership', keywords: ['leadership', 'activities', 'volunteer'] },
            { name: 'References', keywords: ['references', 'referees'] }
        ];
        
        const lines = text.split('\n');
        
        sectionKeywords.forEach(section => {
            const found = lines.some(line => {
                const cleanLine = line.toLowerCase().trim();
                return section.keywords.some(keyword => {
                    return cleanLine === keyword || cleanLine.includes(keyword);
                });
            });
            
            if (found) {
                sections.push({
                    name: section.name,
                    present: true,
                    keywords: section.keywords
                });
            }
        });
        
        return sections;
    }

    // Utility method to extract keywords from text
    extractKeywords(text) {
        // Common resume keywords and skills
        const commonKeywords = [
            'leadership', 'management', 'communication', 'teamwork', 'problem solving',
            'project management', 'data analysis', 'customer service', 'sales',
            'marketing', 'development', 'programming', 'design', 'research',
            'analytical', 'strategic', 'planning', 'coordination', 'training',
            'mentoring', 'budgeting', 'forecasting', 'reporting', 'presentation'
        ];
        
        const foundKeywords = [];
        const lowerText = text.toLowerCase();
        
        commonKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                foundKeywords.push(keyword);
            }
        });
        
        return foundKeywords;
    }

    // Utility method to extract years of experience
    extractYearsOfExperience(text) {
        const yearRegex = /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi;
        const matches = text.match(yearRegex);
        
        if (matches && matches.length > 0) {
            const years = parseInt(matches[0].match(/\d+/)[0]);
            return years;
        }
        
        // Try to calculate from dates
        const dateRegex = /(\d{4})\s*[-–—]\s*(\d{4}|present|current)/gi;
        const dateMatches = text.match(dateRegex);
        
        if (dateMatches && dateMatches.length > 0) {
            let totalYears = 0;
            dateMatches.forEach(match => {
                const years = match.match(/(\d{4})/g);
                if (years && years.length >= 2) {
                    const startYear = parseInt(years[0]);
                    const endYear = years[1].toLowerCase().includes('present') ? 
                        new Date().getFullYear() : parseInt(years[1]);
                    totalYears += Math.max(0, endYear - startYear);
                }
            });
            return Math.min(totalYears, 50); // Cap at 50 years
        }
        
        return 0;
    }

    // Utility method to validate extracted data
    validateExtractedData(resumeData) {
        const validation = {
            isValid: true,
            warnings: [],
            errors: []
        };
        
        // Check for essential information
        if (!resumeData.personalInfo.name) {
            validation.warnings.push('Name not detected');
        }
        
        if (!resumeData.personalInfo.email) {
            validation.warnings.push('Email not detected');
        }
        
        if (!resumeData.experience || resumeData.experience.length < 50) {
            validation.warnings.push('Experience section appears to be missing or very short');
        }
        
        if (!resumeData.education || resumeData.education.length < 20) {
            validation.warnings.push('Education section appears to be missing or very short');
        }
        
        // Check for suspicious content
        if (resumeData.rawText.length < 100) {
            validation.errors.push('Resume text appears to be too short');
            validation.isValid = false;
        }
        
        if (resumeData.rawText.length > 10000) {
            validation.warnings.push('Resume is quite long - consider condensing to 1-2 pages');
        }
        
        return validation;
    }
}

// Export singleton instance
export const parserInstance = new parser();
