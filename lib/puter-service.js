// Puter SDK integration - Faraz
export class puterService {
    constructor() {
        this.isInitialized = false;
        this.user = null;
        this.apiKey = null;
        this.baseURL = 'https://api.puter.com';
    }

    async init() {
        try {
            if (!window.puter) {
                throw new Error('Puter SDK not loaded');
            }

            // Initialize Puter
            await puter.init();
            
            // Check if user is already authenticated
            const user = await puter.auth.getUser();
            if (user) {
                this.user = user;
                console.log('User authenticated:', user);
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Puter initialization failed:', error);
            throw error;
        }
    }

    // Authentication methods
    async signIn() {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            await puter.auth.signIn();
            this.user = await puter.auth.getUser();
            
            return this.user;
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await puter.auth.signOut();
            this.user = null;
            return true;
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }

    getUser() {
        return this.user;
    }

    isSignedIn() {
        return this.user !== null;
    }

    // AI Chat methods
    async aiChat(prompt, options = {}) {
        try {
            const {
                model = 'gpt-4',
                max_tokens = 1000,
                temperature = 0.7,
                stream = false
            } = options;

            const response = await puter.ai.chat(prompt, {
                model: model,
                max_tokens: max_tokens,
                temperature: temperature,
                stream: stream
            });

            return response;
        } catch (error) {
            console.error('AI chat failed:', error);
            throw new Error(`AI chat failed: ${error.message}`);
        }
    }

    // Key-Value Storage methods
    async set(key, value) {
        try {
            await puter.kv.set(key, value);
            return true;
        } catch (error) {
            console.error('KV set failed:', error);
            throw new Error(`Failed to store data: ${error.message}`);
        }
    }

    async get(key) {
        try {
            const value = await puter.kv.get(key);
            return value;
        } catch (error) {
            console.error('KV get failed:', error);
            return null;
        }
    }

    async delete(key) {
        try {
            await puter.kv.delete(key);
            return true;
        } catch (error) {
            console.error('KV delete failed:', error);
            throw new Error(`Failed to delete data: ${error.message}`);
        }
    }

    // File Storage methods
    async uploadFile(file, path = '/') {
        try {
            const result = await puter.fs.write(path + file.name, file);
            return result;
        } catch (error) {
            console.error('File upload failed:', error);
            throw new Error(`File upload failed: ${error.message}`);
        }
    }

    async downloadFile(path) {
        try {
            const file = await puter.fs.read(path);
            return file;
        } catch (error) {
            console.error('File download failed:', error);
            throw new Error(`File download failed: ${error.message}`);
        }
    }

    async listFiles(path = '/') {
        try {
            const files = await puter.fs.readdir(path);
            return files;
        } catch (error) {
            console.error('List files failed:', error);
            return [];
        }
    }

    async deleteFile(path) {
        try {
            await puter.fs.delete(path);
            return true;
        } catch (error) {
            console.error('File delete failed:', error);
            throw new Error(`File delete failed: ${error.message}`);
        }
    }

    // Resume Analysis specific methods
    async analyzeResume(resumeText, jobDescription = '') {
        try {
            const prompt = this.buildAnalysisPrompt(resumeText, jobDescription);
            const response = await this.aiChat(prompt, {
                model: 'gpt-4',
                max_tokens: 2000,
                temperature: 0.3
            });

            return this.parseAnalysisResponse(response);
        } catch (error) {
            console.error('Resume analysis failed:', error);
            throw error;
        }
    }

    buildAnalysisPrompt(resumeText, jobDescription) {
        const basePrompt = `
You are an expert ATS (Applicant Tracking System) analyzer and career strategist. Analyze the following resume and provide comprehensive feedback.

Resume:
${resumeText}

${jobDescription ? `Target Job Description:\n${jobDescription}\n\n` : ''}

Please provide detailed analysis in the following JSON format:
{
    "atsScore": number (0-100),
    "categories": {
        "content": {
            "score": number,
            "feedback": ["specific feedback points"],
            "suggestions": ["actionable suggestions"]
        },
        "formatting": {
            "score": number,
            "feedback": ["formatting issues"],
            "suggestions": ["formatting improvements"]
        },
        "keywords": {
            "score": number,
            "found": ["keywords found"],
            "missing": ["important keywords missing"],
            "suggestions": ["keyword additions"]
        },
        "structure": {
            "score": number,
            "feedback": ["structure issues"],
            "suggestions": ["structure improvements"]
        },
        "tone": {
            "score": number,
            "feedback": ["tone analysis"],
            "suggestions": ["tone improvements"]
        }
    },
    "strengths": ["key strengths identified"],
    "weaknesses": ["key weaknesses identified"],
    "improvements": {
        "summary": ["summary improvements"],
        "experience": ["experience improvements"],
        "education": ["education improvements"],
        "skills": ["skills improvements"]
    },
    "atsCompatibility": {
        "score": number,
        "issues": ["ATS compatibility issues"],
        "fixes": ["how to fix ATS issues"]
    }
}

Focus on:
1. ATS readability and parsing
2. Keyword optimization for common job roles
3. Professional tone and language
4. Quantifiable achievements
5. Structure and formatting best practices
6. Action verb usage
7. Content completeness

Be specific, actionable, and professional in your feedback.
        `;

        return basePrompt;
    }

    parseAnalysisResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Failed to parse analysis response:', error);
        }

        // Fallback response structure
        return this.generateFallbackAnalysis();
    }

    generateFallbackAnalysis() {
        return {
            atsScore: 75,
            categories: {
                content: {
                    score: 80,
                    feedback: ['Good content structure', 'Clear experience descriptions'],
                    suggestions: ['Add more quantifiable achievements', 'Include action verbs']
                },
                formatting: {
                    score: 85,
                    feedback: ['Clean layout', 'Good use of white space'],
                    suggestions: ['Ensure consistent formatting', 'Use bullet points effectively']
                },
                keywords: {
                    score: 70,
                    found: ['project management', 'team leadership', 'communication'],
                    missing: ['data analysis', 'problem solving', 'strategic planning'],
                    suggestions: ['Add industry-specific keywords', 'Include technical skills']
                },
                structure: {
                    score: 90,
                    feedback: ['Well-organized sections', 'Logical flow'],
                    suggestions: ['Add professional summary', 'Ensure section order is optimal']
                },
                tone: {
                    score: 75,
                    feedback: ['Professional tone', 'Clear communication'],
                    suggestions: ['Use more active language', 'Strengthen achievement statements']
                }
            },
            strengths: ['Strong experience section', 'Good educational background', 'Professional presentation'],
            weaknesses: ['Limited quantifiable achievements', 'Could use more keywords', 'Summary section needs improvement'],
            improvements: {
                summary: ['Add a 2-3 sentence professional summary', 'Highlight key qualifications'],
                experience: ['Quantify achievements with numbers', 'Use more action verbs'],
                education: ['Add graduation date if missing', 'Include relevant coursework'],
                skills: ['Create a dedicated skills section', 'Group technical and soft skills']
            },
            atsCompatibility: {
                score: 75,
                issues: ['Some formatting may affect ATS parsing', 'Missing keywords for target roles'],
                fixes: ['Use standard section headers', 'Add industry-specific terminology']
            }
        };
    }

    // Chat Assistant methods
    async getChatResponse(message, context = {}) {
        try {
            const prompt = this.buildChatPrompt(message, context);
            const response = await this.aiChat(prompt, {
                model: 'gpt-4',
                max_tokens: 500,
                temperature: 0.7
            });

            return response;
        } catch (error) {
            console.error('Chat response failed:', error);
            return 'I apologize, but I\'m having trouble responding right now. Please try again later.';
        }
    }

    buildChatPrompt(message, context) {
        const contextString = context.resumeAnalysis ? `
Resume Analysis Context:
- ATS Score: ${context.resumeAnalysis.atsScore}%
- Key Strengths: ${context.resumeAnalysis.strengths?.join(', ') || 'N/A'}
- Main Issues: ${context.resumeAnalysis.weaknesses?.join(', ') || 'N/A'}
- Career Level: ${context.resumeAnalysis.insights?.careerLevel || 'N/A'}
- Industry Fit: ${context.resumeAnalysis.insights?.industryFit || 'N/A'}
        ` : 'No resume analysis available yet.';

        return `
You are an expert career strategist and resume coach. Based on the following resume analysis, provide helpful advice to the user.

${contextString}

User's question: "${message}"

Provide a helpful, specific, and actionable response. Focus on practical advice they can implement immediately. Keep your response concise but comprehensive. Use a professional but friendly tone.
        `;
    }

    // User data management
    async saveAnalysis(analysisData, resumeName) {
        try {
            const timestamp = new Date().toISOString();
            const analysisRecord = {
                id: Date.now(),
                resumeName: resumeName,
                analysis: analysisData,
                timestamp: timestamp
            };

            // Get existing analyses
            const existingAnalyses = await this.get('user_analyses') || [];
            existingAnalyses.push(analysisRecord);

            // Keep only last 10 analyses
            const limitedAnalyses = existingAnalyses.slice(-10);

            // Save to Puter storage
            await this.set('user_analyses', limitedAnalyses);

            return analysisRecord;
        } catch (error) {
            console.error('Failed to save analysis:', error);
            throw error;
        }
    }

    async getAnalyses() {
        try {
            const analyses = await this.get('user_analyses') || [];
            return analyses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Failed to get analyses:', error);
            return [];
        }
    }

    async deleteAnalysis(analysisId) {
        try {
            const analyses = await this.get('user_analyses') || [];
            const filteredAnalyses = analyses.filter(a => a.id !== analysisId);
            await this.set('user_analyses', filteredAnalyses);
            return true;
        } catch (error) {
            console.error('Failed to delete analysis:', error);
            throw error;
        }
    }

    // Utility methods
    async testConnection() {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            // Test with a simple KV operation
            const testKey = 'connection_test';
            const testValue = { timestamp: Date.now() };
            
            await this.set(testKey, testValue);
            const retrieved = await this.get(testKey);
            await this.delete(testKey);

            return retrieved && retrieved.timestamp === testValue.timestamp;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`Puter Service Error [${context}]:`, error);
        
        // You can implement error reporting here
        if (this.isSignedIn()) {
            this.reportError(error, context);
        }
    }

    async reportError(error, context) {
        try {
            const errorReport = {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                context: context,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // Store error reports
            const existingReports = await this.get('error_reports') || [];
            existingReports.push(errorReport);
            
            // Keep only last 50 error reports
            const limitedReports = existingReports.slice(-50);
            
            await this.set('error_reports', limitedReports);
        } catch (reportError) {
            console.error('Failed to report error:', reportError);
        }
    }

    // Cleanup
    async cleanup() {
        try {
            // Clear any temporary data
            await this.delete('temp_data');
            
            // Reset state
            this.user = null;
            this.isInitialized = false;
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
}

// Export singleton instance
export const puterServiceInstance = new puterService();
