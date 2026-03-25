// NOVA - Career Module
// Handles career prediction and resume review functionality:
//   - Career path prediction based on resume
//   - Resume review (candid feedback)
//   - Lazy-loaded content for performance
//
// Depends on: PuterService, Prompts, Visuals, Upload (for resumeText)
// Exposes: window.Career

var Career = {

    // ---- INITIALISATION ----
    init: function () {
        // Career specific initialization if needed
    },

    // ---- CAREER PREDICTION ----

    // Called lazily on first visit to the career tab
    loadCareerPrediction: async function () {
        if (!Upload.resumeText) {
            var container = document.getElementById('career-content');
            if (container) container.innerHTML = '<p class="no-data">Please upload and analyze a resume first to see your career trajectory.</p>';
            return;
        }

        var container = document.getElementById('career-content');
        if (!container) return;

        // Visual loading state
        container.innerHTML =
            '<div class="loading-wrap">' +
            '  <div class="loading-dots">Analyzing career paths...</div>' +
            '  <p class="loading-sub">NOVA is projecting your professional trajectory based on your unique experience.</p>' +
            '</div>';

        try {
            var prompt = Prompts.careerPrediction(Upload.resumeText);
            var result = await PuterService.aiChat(prompt);
            var data = Helpers.parseJSON(result);

            if (data && (data.careerPaths || data.salaryProjections)) {
                var html = '<div class="career-prediction">';

                if (data.currentLevel) {
                    html += '<div class="career-level-pill">Current Level: <span>' + data.currentLevel + '</span></div>';
                }

                // Career paths
                if (data.careerPaths && data.careerPaths.length) {
                    html += '<div class="prediction-section"><h4><i class="fas fa-map-signs"></i> Recommended Career Paths</h4><ul class="career-list">';
                    data.careerPaths.forEach(function (path) {
                        html += '<li class="career-item"><strong>' + path.title + '</strong><p>' + path.description + '</p></li>';
                    });
                    html += '</ul></div>';
                }

                // Salary projections
                if (data.salaryProjections) {
                    html += '<div class="prediction-section"><h4><i class="fas fa-coins"></i> Market Value & Salary Projection</h4>';
                    if (data.salaryProjections.range) {
                        html += '<div class="salary-range-highlight">' + data.salaryProjections.range + '</div>';
                    }
                    html += '<p>' + (data.salaryProjections.summary || '') + '</p>';
                    html += '</div>';
                }

                // Growth opportunities
                if (data.growthOpportunities && data.growthOpportunities.length) {
                    html += '<div class="prediction-section"><h4><i class="fas fa-arrow-up-right-dots"></i> Growth Opportunities</h4><ul class="growth-list">';
                    data.growthOpportunities.forEach(function (opp) {
                        html += '<li>' + opp + '</li>';
                    });
                    html += '</ul></div>';
                }

                // Strategy/Advice
                if (data.strategy || data.advice) {
                    html += '<div class="prediction-section career-strategy"><h4><i class="fas fa-lightbulb"></i> Strategic Career Advice</h4>';
                    html += '<p>' + (data.strategy || data.advice) + '</p>';
                    html += '</div>';
                }

                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML =
                    '<div class="error-fallback">' +
                    '  <p><i class="fas fa-triangle-exclamation"></i> We couldn\'t generate a detailed career path right now.</p>' +
                    '  <button class="btn-outline-sm" onclick="Career.loadCareerPrediction()">Try Again</button>' +
                    '</div>';
            }

        } catch (error) {
            console.error('Career prediction failed:', error);
            container.innerHTML = '<p class="error-message">Failed to load career prediction. Please ensure you are connected and try again.</p>';
        }
    },

    // ---- RESUME REVIEW ----

    // Called lazily on first visit to the review tab
    loadReview: async function () {
        if (!Upload.resumeText) return;

        var container = document.getElementById('review-content');
        if (!container) return;

        // Visual loading state
        container.innerHTML = '<div class="loading-dots">Reviewing your resume...</div>';

        try {
            var prompt = Prompts.review(Upload.resumeText);
            var result = await PuterService.aiChat(prompt);

            // Parse markdown if available
            if (typeof marked !== 'undefined') {
                result = marked.parse(result);
            }

            container.innerHTML = '<div class="review-content">' + result + '</div>';

        } catch (error) {
            console.error('Review failed:', error);
            container.innerHTML = '<p>Failed to review resume. Please try again.</p>';
        }
    }
};

window.Career = Career;
