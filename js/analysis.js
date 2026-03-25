// NOVA - Resume Analysis Module
// Handles all resume analysis functionality:
//   - Analysis trigger and progress management
//   - AI analysis execution via PuterService.aiChat()
//   - Results parsing and state management
//   - Score and category rendering
//   - Feedback display
//   - Job matching results
//   - Re-analysis and export
//
// Depends on: Parser, PuterService, Visuals, Helpers, Prompts, Upload (for state)
// Exposes: window.Analysis

var Analysis = {

    // ---- STATE ----
    // Shares state with Upload module via Upload.currentFile, Upload.resumeText, etc.

    // ---- INITIALISATION ----
    // Called from Upload.init() to set up any analysis-specific listeners
    init: function () {
        // Analysis-specific initialization if needed
    },

    // ---- MAIN ANALYSIS ----

    // Master analysis function — coordinates PDF parsing, AI analysis, and results rendering.
    // Called when "Analyze with NOVA AI" button is clicked.
    analyzeResume: async function () {
        if (!Upload.currentFile) {
            Visuals.toast('Please upload a resume first', 'error');
            return;
        }

        Visuals.showAnalysisOverlay();
        Visuals.updateAnalysisStep(1, 'Parsing your resume...');

        try {
            // Step 1: Extract text from PDF
            Upload.resumeText = await Parser.parsePDF(Upload.currentFile);
            Upload._immutableData = Helpers.extractImmutableData(Upload.resumeText);

            Visuals.updateAnalysisStep(2, 'Running AI analysis...');

            var jobDescription = '';
            var jdEl = document.getElementById('job-description');
            if (jdEl) jobDescription = jdEl.value || '';

            // Step 2: Select prompt based on mode
            var prompt;
            if (Upload.selectedMode === 'roast') prompt = Prompts.roast(Upload.resumeText);
            else if (Upload.selectedMode === 'interview') prompt = Prompts.interview(Upload.resumeText, jobDescription);
            else if (Upload.selectedMode === 'job-match') prompt = Prompts.jobMatch(Upload.resumeText, jobDescription);
            else prompt = Prompts.fullAnalysis(Upload.resumeText, jobDescription);

            /**
             * ALGORITHM COMPARISON & EVOLUTION
             * 
             * VERSION 1: Basic Keyword Matcher
             * status: DEPRECATED (Too simplistic)
             * logic:
             *   var matches = 0;
             *   var keywords = ['react', 'javascript', 'node', ...];
             *   keywords.forEach(kw => {
             *     if(Upload.resumeText.toLowerCase().includes(kw)) matches++;
             *   });
             *   var score = (matches / keywords.length) * 100;
             */

            /**
             * VERSION 2: Weighted Section Scorer
             * status: DEPRECATED (Lacks context)
             * logic:
             *   var experienceScore = Helpers.calculateExpScore(Upload.resumeText) * 0.6;
             *   var skillsScore = Helpers.calculateSkillsScore(Upload.resumeText) * 0.4;
             *   var finalScore = experienceScore + skillsScore;
             */

            // VERSION 3: Semantic AI Analysis via Puter.js & GPT-4o (Status: ACTIVE/BEST CHOICE)
            // This approach uses LLM to understand context, impact, and qualitative depth
            // that simple keywords or fixed weights cannot capture.
            var rawResult = await PuterService.aiChat(prompt);

            Visuals.updateAnalysisStep(3, 'Generating insights...');

            // Step 4: Apply results based on mode
            if (Upload.selectedMode === 'roast') {
                Upload.analysisResult = Upload.analysisResult || {};
                Upload.analysisResult.roast = rawResult;
                this._applyFullAnalysis(await PuterService.aiChat(Prompts.fullAnalysis(Upload.resumeText, jobDescription)));
            } else if (Upload.selectedMode === 'interview') {
                var parsed = Helpers.parseJSON(rawResult);
                Upload.analysisResult = Upload.analysisResult || {};
                if (parsed) this.renderInterviewQuestions(parsed);
                this._applyFullAnalysis(await PuterService.aiChat(Prompts.fullAnalysis(Upload.resumeText, jobDescription)));
            } else if (Upload.selectedMode === 'job-match') {
                var jobData = Helpers.parseJSON(rawResult);
                if (jobData && jobData.jobs) this.renderJobMatches(jobData.jobs);
                this._applyFullAnalysis(await PuterService.aiChat(Prompts.fullAnalysis(Upload.resumeText, jobDescription)));
            } else {
                this._applyFullAnalysis(rawResult);
            }

            Visuals.updateAnalysisStep(4, 'Matching jobs...');

            // Step 5: For full mode, also run job matching
            if (Upload.selectedMode === 'full') {
                try {
                    var jData = Helpers.parseJSON(await PuterService.aiChat(Prompts.jobMatch(Upload.resumeText, jobDescription)));
                    if (jData && jData.jobs) this.renderJobMatches(jData.jobs);
                } catch (e) {
                    console.warn('Job matching failed:', e);
                }
            }

            // Save summary to history
            PuterService.saveAnalysis({
                fileName: Upload.currentFile.name,
                atsScore: (Upload.analysisResult && Upload.analysisResult.atsScore) || 0,
                mode: Upload.selectedMode
            });

            Visuals.hideAnalysisOverlay();
            Visuals.toast('Analysis complete!', 'success');

        } catch (error) {
            Visuals.hideAnalysisOverlay();
            console.error('Analysis failed:', error);
            Visuals.toast(error.message || 'Analysis failed. Please try again.', 'error');
        }
    },

    // Parses raw AI response and merges into analysisResult, then renders
    _applyFullAnalysis: function (rawResult) {
        var data = Helpers.parseJSON(rawResult);
        if (!data) {
            Visuals.toast('Could not parse AI response. Showing raw.', 'warning');
            Upload.analysisResult = { atsScore: 70, verdict: 'Analysis completed', raw: rawResult };
            this.showResults();
            return;
        }
        Upload.analysisResult = Object.assign({}, Upload.analysisResult || {}, data);
        this.showResults();
    },

    // ---- RESULTS RENDERING ----

    // Shows the results section after analysis completes
    showResults: function () {
        var rs = document.getElementById('results-section');
        if (rs) rs.classList.remove('hidden');

        var data = Upload.analysisResult;
        if (!data) return;

        // Render ATS score if available
        if (data.atsScore !== undefined) {
            var scoreEl = document.getElementById('ats-score');
            if (scoreEl) scoreEl.textContent = data.atsScore;
            Visuals.animateScore(data.atsScore);
        }

        // Render verdict if available
        if (data.verdict) {
            var verdictEl = document.getElementById('score-verdict');
            if (verdictEl) verdictEl.textContent = data.verdict;
        }

        // Render categories
        if (data.categories) this.renderCategories(data.categories);

        // Render detailed feedback — build from top-level fields if feedback sub-object missing
        if (data.feedback) {
            this.renderFeedback(data.feedback);
        } else if (data.strengths || data.weaknesses || data.topActions || data.categories) {
            this.renderFeedback({
                strengths: data.strengths || [],
                weaknesses: data.weaknesses || [],
                topActions: data.topActions || [],
                categoryFeedback: this._buildCategoryFeedback(data.categories)
            });
        }

        // Auto-switch to results tab
        this.switchTabByName('feedback');
    },

    // Build per-category feedback from the categories object returned by AI
    _buildCategoryFeedback: function (categories) {
        if (!categories || Array.isArray(categories)) return null;
        var result = {};
        Object.keys(categories).forEach(function (key) {
            var cat = categories[key];
            if (cat && typeof cat === 'object') {
                result[Helpers.capitalize(key)] = {
                    positive: cat.feedback || [],
                    suggestions: (cat.issues || []).concat(cat.suggestions || [])
                };
            }
        });
        return Object.keys(result).length ? result : null;
    },

    // Renders the category score bars (Content, Keywords, Formatting, etc.)
    // Handles both array format [{name, score}] and object format {content: {score}, ...}
    renderCategories: function (categories) {
        var container = document.getElementById('category-scores');
        if (!container) return;

        container.innerHTML = '';

        // Normalize: convert object format to array format
        var catArray;
        if (Array.isArray(categories)) {
            catArray = categories;
        } else if (categories && typeof categories === 'object') {
            catArray = Object.keys(categories).map(function (key) {
                var cat = categories[key];
                return {
                    id: key,
                    name: Helpers.capitalize(key),
                    icon: (cat && cat.icon) ? cat.icon : 'fa-circle-dot',
                    score: (typeof cat === 'object' && cat !== null) ? (cat.score || 0) : (typeof cat === 'number' ? cat : 0)
                };
            });
        } else {
            return;
        }

        catArray.forEach(function (cat) {
            var score = cat.score || 0;
            var barColor = 'var(--accent-green)';
            if (score < 40) barColor = 'var(--accent-red)';
            else if (score < 75) barColor = 'var(--accent-orange)';

            var item = document.createElement('div');
            item.className = 'cat-card';
            item.innerHTML =
                '<div class="cat-header">' +
                '  <div class="cat-name"><i class="fas ' + (cat.icon || 'fa-chart-simple') + '"></i> ' + cat.name + '</div>' +
                '  <div class="cat-score">' + score + '/100</div>' +
                '</div>' +
                '<div class="cat-bar">' +
                '  <div class="cat-bar-fill" style="width:' + score + '%; background:' + barColor + '"></div>' +
                '</div>';
            container.appendChild(item);
        });
    },

    // Renders the detailed feedback panel: strengths, weaknesses, top actions, and per-category items
    renderFeedback: function (data) {
        var container = document.getElementById('feedback-content');
        if (!container) return;

        var html = '';

        // Strengths Card
        if (data.strengths && data.strengths.length) {
            html += '<div class="feedback-card">' +
                '  <div class="feedback-card-header">' +
                '    <div class="feedback-card-icon good"><i class="fas fa-circle-check"></i></div>' +
                '    <span class="feedback-card-title">Strengths & Assets</span>' +
                '  </div>' +
                '  <ul class="feedback-list">';
            data.strengths.forEach(function (s) {
                html += '<li class="feedback-item"><i class="fas fa-check"></i> ' + s + '</li>';
            });
            html += '  </ul></div>';
        }

        // Weaknesses Card
        if (data.weaknesses && data.weaknesses.length) {
            html += '<div class="feedback-card">' +
                '  <div class="feedback-card-header">' +
                '    <div class="feedback-card-icon bad"><i class="fas fa-triangle-exclamation"></i></div>' +
                '    <span class="feedback-card-title">Critical Gaps</span>' +
                '  </div>' +
                '  <ul class="feedback-list">';
            data.weaknesses.forEach(function (w) {
                html += '<li class="feedback-item"><i class="fas fa-xmark"></i> ' + w + '</li>';
            });
            html += '  </ul></div>';
        }

        // Top Actions Card
        if (data.topActions && data.topActions.length) {
            html += '<div class="feedback-card">' +
                '  <div class="feedback-card-header">' +
                '    <div class="feedback-card-icon warn"><i class="fas fa-bolt"></i></div>' +
                '    <span class="feedback-card-title">Priority Actions</span>' +
                '  </div>' +
                '  <ul class="feedback-list">';
            data.topActions.forEach(function (a) {
                html += '<li class="feedback-item"><i class="fas fa-arrow-right"></i> ' + a + '</li>';
            });
            html += '  </ul></div>';
        }

        // Detailed Category-specific feedback
        if (data.categoryFeedback) {
            Object.keys(data.categoryFeedback).forEach(function (cat) {
                var catData = data.categoryFeedback[cat];
                html += '<div class="feedback-card">' +
                    '  <div class="feedback-card-header">' +
                    '    <span class="feedback-card-title">' + cat + ' Analysis</span>' +
                    '  </div>' +
                    '  <ul class="feedback-list">';

                if (catData.positive && catData.positive.length) {
                    catData.positive.forEach(function (p) {
                        html += '<li class="feedback-item"><i class="fas fa-check"></i> ' + p + '</li>';
                    });
                }
                if (catData.suggestions && catData.suggestions.length) {
                    catData.suggestions.forEach(function (s) {
                        html += '<li class="feedback-item"><i class="fas fa-arrow-right"></i> ' + s + '</li>';
                    });
                }
                html += '  </ul></div>';
            });
        }

        container.innerHTML = html || '<p>No detailed feedback available.</p>';
    },

    // Renders the job matches grid with smart platform search buttons
    renderJobMatches: function (jobs) {
        var container = document.getElementById('jobs-grid');
        if (!container) return;

        container.innerHTML = '';

        if (!jobs || !jobs.length) {
            container.innerHTML =
                '<div class="no-jobs-container">' +
                '  <p class="no-jobs">No matching jobs found. Try adjusting your search or resume.</p>' +
                '  <button class="btn-outline-sm" onclick="Jobs.loadLiveJobs()"><i class="fas fa-rotate"></i> Refresh Search</button>' +
                '</div>';
            return;
        }

        jobs.forEach(function (job) {
            // Support both AI simulated data and real API data (Adzuna, etc.)
            var title = job.title || 'Position';
            var company = (job.company && job.company.display_name) ? job.company.display_name : (job.company || 'Company');
            var location = (job.location && job.location.display_name) ? job.location.display_name : (job.location || 'Location');
            var url = job.redirect_url || job.url || '#';
            var matchScore = job.matchScore || job.score || Math.floor(75 + Math.random() * 20);
            var salary = job.salary || (job.salary_min ? '$' + Math.round(job.salary_min / 1000) + 'k+' : '');
            var scoreColor = Helpers.getScoreColor(matchScore);

            var card = document.createElement('div');
            card.className = 'job-card';
            card.innerHTML =
                '<div class="job-card-header">' +
                '  <span class="job-match" style="color:' + scoreColor + '">' + matchScore + '% Match</span>' +
                '  <span class="job-date">' + (job.postedDate || (job.created ? new Date(job.created).toLocaleDateString() : 'Recently')) + '</span>' +
                '</div>' +
                '  <h4 class="job-title">' + title + '</h4>' +
                '  <p class="job-company"><i class="fas fa-building"></i> ' + company + '</p>' +
                '  <p class="job-location"><i class="fas fa-map-marker-alt"></i> ' + location + '</p>' +
                (salary ? '<p class="job-salary"><i class="fas fa-dollar-sign"></i> ' + salary + '</p>' : '') +
                '<div class="job-skills">' +
                (job.skills || (job.category ? [job.category.label] : [])).slice(0, 3).map(function (s) {
                    return '<span class="skill-tag">' + (s.label || s) + '</span>';
                }).join('') +
                '</div>' +
                '<div class="job-actions">' +
                '  <a href="' + url + '" target="_blank" class="btn-primary-sm">View Job</a>' +
                '  <button class="btn-outline-sm" onclick="app.searchExternal(\'linkedin\')"><i class="fab fa-linkedin"></i></button>' +
                '</div>';
            container.appendChild(card);
        });
    },

    // Filters the rendered job cards by text query (title, company, or skill)
    filterJobs: function (query) {
        var q = query.toLowerCase().trim();
        var cards = document.querySelectorAll('.job-card');
        cards.forEach(function (card) {
            var text = card.textContent.toLowerCase();
            card.style.display = text.indexOf(q) > -1 ? '' : 'none';
        });
    },

    // ---- TAB MANAGEMENT ----

    // Switches the active results tab by reading the data-tab attribute from the clicked button
    switchTab: function (el) {
        if (!el) return;
        document.querySelectorAll('.results-tabs .tab').forEach(function (t) { t.classList.remove('active'); });
        el.classList.add('active');
        this.switchTabByName(el.dataset.tab);
    },

    // Also lazy-loads career prediction and roast content on first visit
    switchTabByName: function (name) {
        console.log('[NOVA] Switching to tab:', name);

        // Hide all tab panels
        document.querySelectorAll('.tab-panel').forEach(function (tc) {
            tc.classList.remove('active');
        });

        // Show selected tab panel
        var content = document.getElementById('panel-' + name);
        if (content) content.classList.add('active');

        // Lazy-load career prediction on first visit to career tab
        if (name === 'career' && !document.getElementById('career-content').dataset.loaded) {
            document.getElementById('career-content').dataset.loaded = 'true';
            Upload.loadCareerPrediction();
        }

        // Lazy-load roast on first visit to roast tab
        if (name === 'roast' && !document.getElementById('roast-content').dataset.loaded) {
            document.getElementById('roast-content').dataset.loaded = 'true';
            Upload.loadRoast();
        }
    },

    // ---- INTERVIEW QUESTIONS ----

    // Renders a list of interview questions into the interview panel
    renderInterviewQuestions: function (data) {
        var container = document.getElementById('interview-content');
        if (!container) return;

        var html = '';

        if (data.questions && data.questions.length) {
            data.questions.forEach(function (q, idx) {
                html +=
                    '<div class="interview-question">' +
                    '  <div class="q-header">' +
                    '    <span class="q-type">' + (q.type || 'Question') + '</span>' +
                    '    <span class="q-difficulty">' + (q.difficulty || 'Medium') + '</span>' +
                    '  </div>' +
                    '  <p class="q-text">' + q.question + '</p>' +
                    '  <textarea id="answer-' + idx + '" placeholder="Your answer..." rows="3"></textarea>' +
                    '</div>';
            });
        } else {
            html = '<p>No interview questions available.</p>';
        }

        container.innerHTML = html;
    },

    // ---- RE-ANALYSIS & EXPORT ----

    // Re-runs the analysis with the same file and settings
    reAnalyze: function () {
        this.analyzeResume();
    },

    // Exports the analysis report using the browser's print dialog
    exportPDF: function () {
        Visuals.toast('Exporting report...', 'info');
        window.print();
    }
};

window.Analysis = Analysis;
