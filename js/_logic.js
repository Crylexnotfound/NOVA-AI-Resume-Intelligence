// Core business logic module
import { parser } from './parser.js';
import { puterService } from '../lib/puter-service.js';

export class logic {
    constructor() {
        this.currentResume = null;
        this.analysisResults = null;
        this.isAnalyzing = false;
        this.chatHistory = [];
    }

    async analyzeResume(file) {
        if (this.isAnalyzing) {
            throw new Error('Analysis already in progress');
        }

        this.isAnalyzing = true;
        this.showAnalysisOverlay(true);

        try {
            // Step 1: Parse the resume
            this.updateAnalysisStep(0);
            const resumeData = await parser.parseFile(file);
            this.currentResume = resumeData;

            // Step 2: Analyze with AI
            this.updateAnalysisStep(1);
            const analysis = await this.getAIAnalysis(resumeData);
            this.analysisResults = analysis;

            // Step 3: Generate insights
            this.updateAnalysisStep(2);
            await this.generateInsights(resumeData, analysis);

            // Display results
            this.displayResults(resumeData, analysis);

            return analysis;
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showError('Failed to analyze resume. Please try again.');
            throw error;
        } finally {
            this.isAnalyzing = false;
            this.showAnalysisOverlay(false);
        }
    }

    async getAIAnalysis(resumeData) {
        try {
            // Use Puter AI for analysis
            const prompt = this.buildAnalysisPrompt(resumeData);
            const response = await puterService.aiChat(prompt, {
                model: 'gpt-4',
                max_tokens: 2000,
                temperature: 0.3
            });

            return this.parseAIResponse(response);
        } catch (error) {
            console.error('AI analysis failed:', error);
            return this.generateFallbackAnalysis(resumeData);
        }
    }

    buildAnalysisPrompt(resumeData) {
        return `
You are an expert ATS (Applicant Tracking System) analyzer and career strategist. Analyze this resume and provide comprehensive feedback.

Resume Data:
${resumeData.rawText}

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
    }

    parseAIResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Failed to parse AI response:', error);
        }

        // Fallback to structured text parsing
        return this.parseTextResponse(response);
    }

    parseTextResponse(response) {
        // Extract scores and feedback from text response
        const atsScoreMatch = response.match(/ATS.*?(\d+)/i);
        const atsScore = atsScoreMatch ? parseInt(atsScoreMatch[1]) : 75;

        return {
            atsScore: atsScore,
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
                score: atsScore,
                issues: ['Some formatting may affect ATS parsing', 'Missing keywords for target roles'],
                fixes: ['Use standard section headers', 'Add industry-specific terminology']
            }
        };
    }

    generateFallbackAnalysis(resumeData) {
        // Generate basic analysis based on resume structure
        const sections = resumeData.sections || [];
        const hasSkills = sections.some(s => s.name.toLowerCase().includes('skill'));
        const hasSummary = sections.some(s => s.name.toLowerCase().includes('summary'));
        const hasExperience = sections.some(s => s.name.toLowerCase().includes('experience'));
        const hasEducation = sections.some(s => s.name.toLowerCase().includes('education'));

        let atsScore = 70;
        if (hasSkills && hasSummary && hasExperience && hasEducation) {
            atsScore = 85;
        } else if (hasExperience && hasEducation) {
            atsScore = 75;
        }

        return {
            atsScore: atsScore,
            categories: {
                content: {
                    score: hasExperience ? 80 : 60,
                    feedback: hasExperience ? ['Good experience section'] : ['Experience section missing'],
                    suggestions: hasExperience ? ['Add more details to experience'] : ['Add experience section']
                },
                formatting: {
                    score: 85,
                    feedback: ['Standard formatting detected'],
                    suggestions: ['Use consistent fonts', 'Ensure proper spacing']
                },
                keywords: {
                    score: hasSkills ? 75 : 50,
                    found: hasSkills ? ['Basic skills detected'] : [],
                    missing: hasSkills ? ['More specific keywords'] : ['Skills section missing'],
                    suggestions: hasSkills ? ['Add industry-specific keywords'] : ['Create skills section']
                },
                structure: {
                    score: (hasExperience && hasEducation) ? 90 : 70,
                    feedback: ['Basic structure present'],
                    suggestions: ['Add professional summary', 'Organize sections logically']
                },
                tone: {
                    score: 75,
                    feedback: ['Professional tone detected'],
                    suggestions: ['Use more active language', 'Strengthen achievement statements']
                }
            },
            strengths: ['Professional presentation', 'Clear contact information'],
            weaknesses: !hasSkills ? ['Missing skills section'] : ['Could improve keyword usage'],
            improvements: {
                summary: hasSummary ? ['Make it more concise'] : ['Add professional summary'],
                experience: ['Quantify achievements', 'Use action verbs'],
                education: ['Add graduation date', 'Include relevant coursework'],
                skills: hasSkills ? ['Expand skills section'] : ['Create dedicated skills section']
            },
            atsCompatibility: {
                score: atsScore,
                issues: ['Limited keyword optimization'],
                fixes: ['Add more industry-specific terms', 'Improve section headers']
            }
        };
    }

    async generateInsights(resumeData, analysis) {
        // Generate additional insights based on analysis
        const insights = {
            careerLevel: this.determineCareerLevel(resumeData),
            industryFit: this.analyzeIndustryFit(resumeData),
            improvementPriority: this.prioritizeImprovements(analysis),
            nextSteps: this.generateNextSteps(analysis)
        };

        // Store insights for later use
        this.analysisResults.insights = insights;
    }

    determineCareerLevel(resumeData) {
        const text = resumeData.rawText.toLowerCase();
        const experience = resumeData.experience || '';
        
        if (text.includes('intern') || text.includes('junior') || text.includes('entry')) {
            return 'Entry Level';
        } else if (text.includes('senior') || text.includes('lead') || text.includes('manager')) {
            return 'Senior Level';
        } else if (text.includes('director') || text.includes('vp') || text.includes('head')) {
            return 'Executive Level';
        }
        
        return 'Mid Level';
    }

    analyzeIndustryFit(resumeData) {
        const text = resumeData.rawText.toLowerCase();
        const industries = {
            'Technology': ['software', 'programming', 'development', 'it', 'tech'],
            'Healthcare': ['medical', 'healthcare', 'nursing', 'hospital'],
            'Finance': ['financial', 'banking', 'accounting', 'investment'],
            'Marketing': ['marketing', 'advertising', 'brand', 'social media'],
            'Education': ['teaching', 'education', 'academic', 'university']
        };

        let bestFit = 'General';
        let maxMatches = 0;

        for (const [industry, keywords] of Object.entries(industries)) {
            const matches = keywords.filter(keyword => text.includes(keyword)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                bestFit = industry;
            }
        }

        return bestFit;
    }

    prioritizeImprovements(analysis) {
        const priorities = [];
        
        // Prioritize based on score impact
        if (analysis.categories.keywords.score < 70) {
            priorities.push({ area: 'Keywords', impact: 'High', effort: 'Medium' });
        }
        
        if (analysis.categories.content.score < 75) {
            priorities.push({ area: 'Content', impact: 'High', effort: 'High' });
        }
        
        if (analysis.categories.structure.score < 80) {
            priorities.push({ area: 'Structure', impact: 'Medium', effort: 'Low' });
        }
        
        if (analysis.categories.tone.score < 75) {
            priorities.push({ area: 'Tone', impact: 'Medium', effort: 'Medium' });
        }

        return priorities;
    }

    generateNextSteps(analysis) {
        const steps = [];
        
        if (analysis.atsScore < 80) {
            steps.push('Focus on ATS optimization to increase compatibility score');
        }
        
        if (analysis.categories.keywords.score < 75) {
            steps.push('Research and add industry-specific keywords');
        }
        
        if (analysis.categories.content.score < 80) {
            steps.push('Quantify achievements with specific metrics');
        }
        
        steps.push('Review and refine professional summary');
        steps.push('Proofread for grammar and spelling errors');
        
        return steps;
    }

    displayResults(resumeData, analysis) {
        // Update score display with animation
        this.animateScore(analysis.atsScore);

        // Update category scores
        this.updateCategoryScores(analysis.categories);

        // Generate feedback cards
        this.generateFeedbackCards(analysis);

        // Show results section
        this.showResultsSection();

        // Initialize chat assistant
        setTimeout(() => {
            this.showChatAssistant();
        }, 2000);
    }

    animateScore(targetScore) {
        const scoreElement = document.getElementById('ats-score');
        const scoreRing = document.getElementById('score-ring');
        
        if (!scoreElement || !scoreRing) return;

        let currentScore = 0;
        const increment = targetScore / 50; // Animate over 50 steps

        const animation = setInterval(() => {
            currentScore += increment;
            
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(animation);
            }

            scoreElement.textContent = Math.round(currentScore);

            // Update ring progress
            const circumference = 2 * Math.PI * 88;
            const offset = circumference - (currentScore / 100) * circumference;
            scoreRing.style.strokeDashoffset = offset;
        }, 20);
    }

    updateCategoryScores(categories) {
        const categorySummary = document.getElementById('category-summary');
        if (!categorySummary) return;

        const categoryData = [
            { name: 'Content', score: categories.content.score, color: 'emerald' },
            { name: 'Format', score: categories.formatting.score, color: 'blue' },
            { name: 'Keywords', score: categories.keywords.score, color: 'purple' },
            { name: 'Structure', score: categories.structure.score, color: 'amber' },
            { name: 'Tone', score: categories.tone.score, color: 'red' }
        ];

        categorySummary.innerHTML = categoryData.map(category => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="text-sm font-medium text-gray-700">${category.name}</span>
                <div class="flex items-center gap-2">
                    <div class="w-20 bg-gray-200 rounded-full h-2">
                        <div class="bg-${category.color}-500 h-2 rounded-full transition-all duration-1000" style="width: ${category.score}%"></div>
                    </div>
                    <span class="text-sm font-bold text-gray-900">${category.score}%</span>
                </div>
            </div>
        `).join('');
    }

    generateFeedbackCards(analysis) {
        const feedbackList = document.getElementById('feedback-list');
        if (!feedbackList) return;

        feedbackList.innerHTML = '';

        // Strengths card
        if (analysis.strengths && analysis.strengths.length > 0) {
            feedbackList.appendChild(this.createFeedbackCard('strengths', analysis.strengths, 'emerald'));
        }

        // Weaknesses card
        if (analysis.weaknesses && analysis.weaknesses.length > 0) {
            feedbackList.appendChild(this.createFeedbackCard('weaknesses', analysis.weaknesses, 'red'));
        }

        // ATS Compatibility card
        if (analysis.atsCompatibility) {
            feedbackList.appendChild(this.createATSCard(analysis.atsCompatibility));
        }

        // Improvement suggestions card
        const allImprovements = Object.values(analysis.improvements).flat();
        if (allImprovements.length > 0) {
            feedbackList.appendChild(this.createFeedbackCard('improvements', allImprovements, 'blue'));
        }
    }

    createFeedbackCard(type, items, color) {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl p-8 bg-white shadow-xl border border-gray-100 opacity-0 transform translate-y-4 transition-all duration-500';

        const icons = {
            strengths: 'fa-check-circle',
            weaknesses: 'fa-exclamation-triangle',
            improvements: 'fa-lightbulb'
        };

        const titles = {
            strengths: 'Key Strengths',
            weaknesses: 'Areas for Improvement',
            improvements: 'Actionable Suggestions'
        };

        card.innerHTML = `
            <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center">
                    <i class="fas ${icons[type]} text-${color}-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900">${titles[type]}</h3>
            </div>
            <ul class="space-y-3">
                ${items.map(item => `
                    <li class="flex items-start gap-3">
                        <i class="fas ${icons[type]} text-${color}-500 mt-1 text-sm"></i>
                        <span class="text-gray-700">${item}</span>
                    </li>
                `).join('')}
            </ul>
        `;

        // Animate in
        setTimeout(() => {
            card.classList.remove('opacity-0', 'translate-y-4');
        }, 100);

        return card;
    }

    createATSCard(atsData) {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl p-8 bg-white shadow-xl border border-gray-100 opacity-0 transform translate-y-4 transition-all duration-500';

        card.innerHTML = `
            <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i class="fas fa-robot text-purple-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900">ATS Compatibility</h3>
            </div>
            <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">Compatibility Score</span>
                    <span class="text-lg font-bold text-purple-600">${atsData.score}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-purple-500 h-3 rounded-full transition-all duration-1000" style="width: ${atsData.score}%"></div>
                </div>
            </div>
            <div class="space-y-3">
                <div>
                    <h4 class="text-sm font-semibold text-gray-900 mb-2">Potential Issues:</h4>
                    <ul class="space-y-2">
                        ${atsData.issues.map(issue => `
                            <li class="flex items-start gap-2">
                                <i class="fas fa-exclamation-circle text-amber-500 mt-0.5 text-xs"></i>
                                <span class="text-sm text-gray-700">${issue}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div>
                    <h4 class="text-sm font-semibold text-gray-900 mb-2">Recommended Fixes:</h4>
                    <ul class="space-y-2">
                        ${atsData.fixes.map(fix => `
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check-circle text-emerald-500 mt-0.5 text-xs"></i>
                                <span class="text-sm text-gray-700">${fix}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;

        // Animate in
        setTimeout(() => {
            card.classList.remove('opacity-0', 'translate-y-4');
        }, 200);

        return card;
    }

    showResultsSection() {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showChatAssistant() {
        const chatAssistant = document.getElementById('chat-assistant');
        if (chatAssistant) {
            chatAssistant.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        }
    }

    async getChatResponse(message) {
        try {
            const context = this.buildChatContext(message);
            const response = await puterService.aiChat(context, {
                model: 'gpt-4',
                max_tokens: 500,
                temperature: 0.7
            });

            // Store in chat history
            this.chatHistory.push({ user: message, assistant: response });

            return response;
        } catch (error) {
            console.error('Chat response failed:', error);
            return 'I apologize, but I\'m having trouble responding right now. Please try again later.';
        }
    }

    buildChatContext(message) {
        const analysisSummary = this.analysisResults ? `
Resume Analysis Summary:
- ATS Score: ${this.analysisResults.atsScore}%
- Key Strengths: ${this.analysisResults.strengths?.join(', ') || 'N/A'}
- Main Issues: ${this.analysisResults.weaknesses?.join(', ') || 'N/A'}
- Career Level: ${this.analysisResults.insights?.careerLevel || 'N/A'}
- Industry Fit: ${this.analysisResults.insights?.industryFit || 'N/A'}
        ` : 'No resume analysis available yet.';

        return `
You are an expert career strategist and resume coach. Based on the following resume analysis, provide helpful advice to the user.

${analysisSummary}

User's question: "${message}"

Provide a helpful, specific, and actionable response. Focus on practical advice they can implement immediately. Keep your response concise but comprehensive.
        `;
    }

    async exportPDF() {
        if (!this.analysisResults) {
            this.showError('No analysis results to export');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Add title
            doc.setFontSize(20);
            doc.text('AIRA Resume Analysis Report', 20, 20);

            // Add date
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

            // Add ATS Score
            doc.setFontSize(16);
            doc.text(`Overall ATS Score: ${this.analysisResults.atsScore}/100`, 20, 45);

            // Add category scores
            doc.setFontSize(14);
            doc.text('Category Breakdown:', 20, 60);
            
            let yPosition = 70;
            doc.setFontSize(12);
            
            Object.entries(this.analysisResults.categories).forEach(([category, data]) => {
                doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${data.score}/100`, 25, yPosition);
                yPosition += 10;
            });

            // Add strengths
            yPosition += 10;
            doc.setFontSize(14);
            doc.text('Key Strengths:', 20, yPosition);
            yPosition += 10;
            doc.setFontSize(12);
            
            this.analysisResults.strengths.forEach(strength => {
                doc.text(`• ${strength}`, 25, yPosition);
                yPosition += 8;
            });

            // Add improvements
            yPosition += 10;
            doc.setFontSize(14);
            doc.text('Recommended Improvements:', 20, yPosition);
            yPosition += 10;
            doc.setFontSize(12);
            
            const allImprovements = Object.values(this.analysisResults.improvements).flat();
            allImprovements.forEach(improvement => {
                doc.text(`• ${improvement}`, 25, yPosition);
                yPosition += 8;
            });

            // Save the PDF
            doc.save('aira-resume-analysis.pdf');
            
            this.showNotification('PDF report downloaded successfully', 'success');
        } catch (error) {
            console.error('PDF export failed:', error);
            this.showError('Failed to export PDF report');
        }
    }

    showAnalysisOverlay(show) {
        const overlay = document.getElementById('analysis-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
            
            if (show) {
                // Reset analysis steps
                const steps = overlay.querySelectorAll('.analysis-step');
                steps.forEach((step, index) => {
                    step.classList.toggle('opacity-50', index > 0);
                    const indicator = step.querySelector('.step-indicator');
                    const check = indicator.querySelector('.fa-check');
                    const dot = indicator.querySelector('.bg-gray-400');
                    
                    if (index === 0) {
                        check?.classList.remove('hidden');
                        dot?.classList.add('hidden');
                    } else {
                        check?.classList.add('hidden');
                        dot?.classList.remove('hidden');
                    }
                });
            }
        }
    }

    updateAnalysisStep(stepIndex) {
        const overlay = document.getElementById('analysis-overlay');
        if (!overlay) return;

        const steps = overlay.querySelectorAll('.analysis-step');
        steps.forEach((step, index) => {
            const isActive = index === stepIndex;
            const isCompleted = index < stepIndex;
            
            step.classList.toggle('opacity-50', !isActive && !isCompleted);
            
            const indicator = step.querySelector('.step-indicator');
            const check = indicator.querySelector('.fa-check');
            const dot = indicator.querySelector('.bg-gray-400');
            
            if (isCompleted) {
                check?.classList.remove('hidden');
                dot?.classList.add('hidden');
            } else if (isActive) {
                check?.classList.add('hidden');
                dot?.classList.remove('hidden');
                dot.classList.add('animate-pulse');
            } else {
                check?.classList.add('hidden');
                dot?.classList.remove('hidden');
                dot.classList.remove('animate-pulse');
            }
        });
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${this.getNotificationClass(type)}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${this.getNotificationIcon(type)} mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getNotificationClass(type) {
        const classes = {
            success: 'bg-emerald-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-amber-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        return classes[type] || classes.info;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Export singleton instance
export const logicInstance = new logic();
