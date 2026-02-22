// Main application logic
class Logic {
    constructor() {
        this.currentResume = null;
        this.analysisResults = null;
        this.isAnalyzing = false;
    }

    async analyzeResume(file) {
        if (this.isAnalyzing) {
            throw new Error('Analysis already in progress');
        }

        this.isAnalyzing = true;
        this.showLoadingOverlay(true);

        try {
            // Parse the resume
            const resumeData = await window.parser.parseFile(file);
            this.currentResume = resumeData;

            // Get AI analysis from Puter
            const analysis = await this.getAIAnalysis(resumeData);
            this.analysisResults = analysis;

            // Display results
            this.displayResults(resumeData, analysis);

            return analysis;
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showError('Failed to analyze resume. Please try again.');
            throw error;
        } finally {
            this.isAnalyzing = false;
            this.showLoadingOverlay(false);
        }
    }

    async getAIAnalysis(resumeData) {
        try {
            if (!window.puter) {
                // Fallback to mock analysis
                return this.generateMockAnalysis(resumeData);
            }

            // Use Puter AI for analysis
            const prompt = this.buildAnalysisPrompt(resumeData);
            const response = await puter.ai.chat(prompt, {
                model: 'gpt-4',
                max_tokens: 2000
            });

            return this.parseAIResponse(response);
        } catch (error) {
            console.error('AI analysis failed:', error);
            return this.generateMockAnalysis(resumeData);
        }
    }

    buildAnalysisPrompt(resumeData) {
        return `
Analyze this resume and provide detailed feedback:

Resume Data:
${resumeData.rawText}

Please provide:
1. Overall ATS compatibility score (0-100)
2. Key strengths and weaknesses
3. Missing sections that should be added
4. Skills that should be highlighted
5. Formatting recommendations
6. Content improvements
7. Specific suggestions for each section

Format your response as JSON with this structure:
{
    "atsScore": number,
    "strengths": ["string"],
    "weaknesses": ["string"],
    "missingSections": ["string"],
    "recommendedSkills": ["string"],
    "formattingTips": ["string"],
    "contentImprovements": ["string"],
    "sectionSuggestions": {
        "summary": ["suggestion1", "suggestion2"],
        "experience": ["suggestion1", "suggestion2"],
        "education": ["suggestion1", "suggestion2"],
        "skills": ["suggestion1", "suggestion2"]
    }
}
        `;
    }

    parseAIResponse(response) {
        try {
            // Try to parse as JSON
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
        return {
            atsScore: 75,
            strengths: ['Good structure', 'Relevant experience'],
            weaknesses: ['Missing skills section', 'Poor formatting'],
            missingSections: ['Skills summary', 'Professional summary'],
            recommendedSkills: ['Leadership', 'Communication'],
            formattingTips: ['Use consistent fonts', 'Add bullet points'],
            contentImprovements: ['Quantify achievements', 'Add metrics'],
            sectionSuggestions: {
                summary: ['Add a professional summary'],
                experience: ['Quantify your achievements'],
                education: ['Add graduation date'],
                skills: ['Create a dedicated skills section']
            }
        };
    }

    generateMockAnalysis(resumeData) {
        const sections = resumeData.sections || [];
        const hasSkills = sections.some(s => s.name.toLowerCase().includes('skill'));
        const hasSummary = sections.some(s => s.name.toLowerCase().includes('summary'));

        return {
            atsScore: hasSkills && hasSummary ? 85 : 65,
            strengths: [
                'Clear contact information',
                'Relevant experience section',
                'Education details included'
            ],
            weaknesses: [
                !hasSkills ? 'Missing skills section' : null,
                !hasSummary ? 'No professional summary' : null,
                'Limited quantifiable achievements'
            ].filter(Boolean),
            missingSections: [
                !hasSkills ? 'Skills section' : null,
                !hasSummary ? 'Professional summary' : null
            ].filter(Boolean),
            recommendedSkills: ['Communication', 'Leadership', 'Problem-solving'],
            formattingTips: [
                'Use consistent formatting',
                'Add bullet points for readability',
                'Ensure proper spacing'
            ],
            contentImprovements: [
                'Add metrics to achievements',
                'Include action verbs',
                'Tailor to job descriptions'
            ],
            sectionSuggestions: {
                summary: hasSummary ? ['Make it more concise'] : ['Add a 2-3 sentence professional summary'],
                experience: ['Quantify achievements with numbers', 'Use action verbs'],
                education: ['Add graduation date if missing', 'Include relevant coursework'],
                skills: hasSkills ? ['Group technical and soft skills'] : ['Create a dedicated skills section']
            }
        };
    }

    displayResults(resumeData, analysis) {
        // Update score display
        this.updateScore(analysis.atsScore);

        // Update feedback list
        this.updateFeedbackList(analysis);

        // Update category summary
        this.updateCategorySummary(analysis);

        // Show dashboard
        this.showDashboard();

        // Initialize chat assistant
        this.initializeChat(analysis);
    }

    updateScore(score) {
        const scoreElement = document.getElementById('ats-score');
        const scoreRing = document.getElementById('score-ring');
        
        if (scoreElement) {
            scoreElement.textContent = score;
        }

        if (scoreRing) {
            const circumference = 2 * Math.PI * 120;
            const offset = circumference - (score / 100) * circumference;
            scoreRing.style.strokeDashoffset = offset;
        }
    }

    updateFeedbackList(analysis) {
        const feedbackList = document.getElementById('feedback-list');
        if (!feedbackList) return;

        feedbackList.innerHTML = '';

        // Add strengths
        if (analysis.strengths && analysis.strengths.length > 0) {
            const strengthCard = this.createFeedbackCard('strengths', analysis.strengths);
            feedbackList.appendChild(strengthCard);
        }

        // Add weaknesses
        if (analysis.weaknesses && analysis.weaknesses.length > 0) {
            const weaknessCard = this.createFeedbackCard('weaknesses', analysis.weaknesses);
            feedbackList.appendChild(weaknessCard);
        }

        // Add content improvements
        if (analysis.contentImprovements && analysis.contentImprovements.length > 0) {
            const improvementCard = this.createFeedbackCard('improvements', analysis.contentImprovements);
            feedbackList.appendChild(improvementCard);
        }
    }

    createFeedbackCard(type, items) {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl p-8 bg-white shadow-xl border border-gray-100';

        const icons = {
            strengths: 'fa-check-circle',
            weaknesses: 'fa-exclamation-triangle',
            improvements: 'fa-lightbulb'
        };

        const colors = {
            strengths: 'text-emerald-600',
            weaknesses: 'text-amber-600',
            improvements: 'text-blue-600'
        };

        const titles = {
            strengths: 'Strengths',
            weaknesses: 'Areas for Improvement',
            improvements: 'Content Improvements'
        };

        card.innerHTML = `
            <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <i class="fas ${icons[type]} ${colors[type]} text-xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900">${titles[type]}</h3>
            </div>
            <ul class="space-y-3">
                ${items.map(item => `
                    <li class="flex items-start gap-3">
                        <i class="fas ${icons[type]} ${colors[type]} mt-1 text-sm"></i>
                        <span class="text-gray-700">${item}</span>
                    </li>
                `).join('')}
            </ul>
        `;

        return card;
    }

    updateCategorySummary(analysis) {
        const categorySummary = document.getElementById('category-summary');
        if (!categorySummary) return;

        const categories = [
            { name: 'Content', score: analysis.atsScore },
            { name: 'Format', score: 85 },
            { name: 'Keywords', score: 75 },
            { name: 'Structure', score: 90 }
        ];

        categorySummary.innerHTML = categories.map(category => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="text-sm font-medium text-gray-700">${category.name}</span>
                <div class="flex items-center gap-2">
                    <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div class="bg-emerald-500 h-2 rounded-full" style="width: ${category.score}%"></div>
                    </div>
                    <span class="text-sm font-bold text-gray-900">${category.score}%</span>
                </div>
            </div>
        `).join('');
    }

    showDashboard() {
        const landingView = document.getElementById('landing-view');
        const dashboardView = document.getElementById('dashboard-view');

        if (landingView) landingView.classList.add('hidden');
        if (dashboardView) dashboardView.classList.remove('hidden');
    }

    showLoadingOverlay(show) {
        const overlay = document.getElementById('analysis-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }

    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    initializeChat(analysis) {
        const chatAssistant = document.getElementById('chat-assistant');
        if (chatAssistant) {
            // Show chat assistant after a delay
            setTimeout(() => {
                chatAssistant.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
            }, 2000);
        }
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
            doc.text('Resume Analysis Report', 20, 20);

            // Add ATS score
            doc.setFontSize(16);
            doc.text(`ATS Score: ${this.analysisResults.atsScore}/100`, 20, 40);

            // Add strengths
            doc.setFontSize(14);
            doc.text('Strengths:', 20, 60);
            doc.setFontSize(12);
            let yPosition = 70;
            this.analysisResults.strengths.forEach(strength => {
                doc.text(`• ${strength}`, 25, yPosition);
                yPosition += 10;
            });

            // Add weaknesses
            doc.setFontSize(14);
            doc.text('Areas for Improvement:', 20, yPosition + 10);
            doc.setFontSize(12);
            yPosition += 20;
            this.analysisResults.weaknesses.forEach(weakness => {
                doc.text(`• ${weakness}`, 25, yPosition);
                yPosition += 10;
            });

            // Save the PDF
            doc.save('resume-analysis.pdf');
        } catch (error) {
            console.error('PDF export failed:', error);
            this.showError('Failed to export PDF');
        }
    }
}

// Export for use in other modules
window.logic = new Logic();
