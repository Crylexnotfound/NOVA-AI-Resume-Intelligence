// Resume parsing module
class Parser {
    constructor() {
        this.supportedFormats = ['pdf', 'doc', 'docx', 'txt'];
    }

    async parseFile(file) {
        const format = this.getFileFormat(file);
        
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`Unsupported file format: ${format}`);
        }

        switch (format) {
            case 'pdf':
                return await this.parsePDF(file);
            case 'doc':
            case 'docx':
                return await this.parseDoc(file);
            case 'txt':
                return await this.parseText(file);
            default:
                throw new Error('Unsupported format');
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
                        
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            fullText += pageText + '\n';
                        }
                        
                        resolve(this.extractResumeData(fullText));
                    } else {
                        reject(new Error('PDF.js not loaded'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    async parseDoc(file) {
        // For demo purposes, return mock data
        // In production, you'd use a library like mammoth.js for .docx
        return this.extractResumeData("Mock resume content from document file");
    }

    async parseText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    resolve(this.extractResumeData(text));
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    extractResumeData(text) {
        // Extract basic information from resume text
        const lines = text.split('\n').filter(line => line.trim());
        
        const data = {
            rawText: text,
            personalInfo: this.extractPersonalInfo(text),
            experience: this.extractExperience(text),
            education: this.extractEducation(text),
            skills: this.extractSkills(text),
            sections: this.identifySections(text)
        };

        return data;
    }

    extractPersonalInfo(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
        
        const emails = text.match(emailRegex) || [];
        const phones = text.match(phoneRegex) || [];
        
        // Extract name (first line that looks like a name)
        const lines = text.split('\n').filter(line => line.trim());
        const name = lines[0] || 'Unknown';
        
        return {
            name: name.replace(/\d/g, '').trim(), // Remove digits
            email: emails[0] || '',
            phone: phones[0] || '',
            location: this.extractLocation(text)
        };
    }

    extractLocation(text) {
        const locationKeywords = ['Street', 'Avenue', 'Road', 'Drive', 'Lane', 'Boulevard', 'Way'];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (locationKeywords.some(keyword => line.includes(keyword))) {
                return line.trim();
            }
        }
        
        return '';
    }

    extractExperience(text) {
        const experienceSection = this.extractSection(text, ['experience', 'work', 'employment', 'career']);
        return experienceSection || '';
    }

    extractEducation(text) {
        const educationSection = this.extractSection(text, ['education', 'academic', 'university', 'college', 'school']);
        return educationSection || '';
    }

    extractSkills(text) {
        const skillsSection = this.extractSection(text, ['skills', 'technical', 'competencies', 'abilities']);
        return skillsSection || '';
    }

    extractSection(text, keywords) {
        const lines = text.split('\n');
        let sectionStart = -1;
        let sectionEnd = -1;
        
        // Find section start
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (keywords.some(keyword => line.includes(keyword))) {
                sectionStart = i;
                break;
            }
        }
        
        if (sectionStart === -1) return '';
        
        // Find section end (next major section)
        const majorSections = ['experience', 'education', 'skills', 'summary', 'objective', 'projects', 'certifications'];
        for (let i = sectionStart + 1; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (majorSections.some(section => line.includes(section) && !keywords.includes(section))) {
                sectionEnd = i;
                break;
            }
        }
        
        const sectionLines = lines.slice(sectionStart, sectionEnd === -1 ? lines.length : sectionEnd);
        return sectionLines.join('\n').trim();
    }

    identifySections(text) {
        const sections = [];
        const sectionKeywords = [
            'summary', 'objective', 'experience', 'work', 'employment',
            'education', 'academic', 'skills', 'technical', 'projects',
            'certifications', 'awards', 'interests', 'references'
        ];
        
        const lines = text.split('\n');
        
        for (const keyword of sectionKeywords) {
            const found = lines.some(line => line.toLowerCase().includes(keyword));
            if (found) {
                sections.push({
                    name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                    present: true
                });
            }
        }
        
        return sections;
    }
}

// Export for use in other modules
window.parser = new Parser();
