// NOVA - Jobs Module
// Handles job search, live job fetching, and external platform integration:
//   - Live job fetching via PuterService (placeholder for Adzuna/other APIs)
//   - External platform search (LinkedIn, Indeed, Glassdoor)
//   - Job matching logic and rendering
//
// Depends on: PuterService, Visuals, Helpers, Analysis (for rendering)
// Exposes: window.Jobs

var Jobs = {

    // ---- INITIALISATION ----
    init: function () {
        // Jobs specific initialization
        console.log('[NOVA] Jobs module initialized');
    },

    // ---- LIVE JOBS ----

    // Fetches live jobs based on the user's profile and region
    loadLiveJobs: async function () {
        var region = document.getElementById('job-region') ? document.getElementById('job-region').value : 'Abu Dhabi, UAE';
        var query = Upload.resumeText ? 'Relevant to my resume' : 'Software Engineer';
        
        Visuals.toast('Fetching live jobs in ' + region + '...', 'info');
        
        try {
            // In a real app, this would call an API like Adzuna or LinkedIn.
            // For now, we use AI to simulate a live search based on the resume.
            var prompt = Prompts.jobMatch(Upload.resumeText, 'Jobs in ' + region);
            var result = await PuterService.aiChat(prompt);
            var data = Helpers.parseJSON(result);

            if (data && data.jobs) {
                Analysis.renderJobMatches(data.jobs);
                Visuals.toast('Found ' + data.jobs.length + ' new matches!', 'success');
            } else {
                Visuals.toast('No live jobs found for this region', 'warning');
            }
        } catch (error) {
            console.error('Failed to load live jobs:', error);
            Visuals.toast('Failed to fetch live jobs', 'error');
        }
    },

    // Scans for more jobs (simulated deep scan)
    findMoreJobs: async function () {
        Visuals.toast('Scanning deeper for more matches...', 'info');
        await this.loadLiveJobs();
    },

    // ---- EXTERNAL SEARCH ----

    // Opens a new tab with a pre-filled search query on external platforms
    searchExternal: function (platform) {
        var query = '';
        var resumeData = Upload.analysisResult;
        
        if (resumeData && resumeData.suggestedTitle) {
            query = resumeData.suggestedTitle;
        } else if (Upload.resumeText) {
            // Try to extract a title from the first line of resume
            query = Upload.resumeText.split('\n')[0].substring(0, 50);
        } else {
            query = 'Software Engineer';
        }

        var region = document.getElementById('job-region') ? document.getElementById('job-region').value : '';
        var fullQuery = encodeURIComponent(query + ' ' + region);
        
        var url = '';
        switch (platform) {
            case 'linkedin':
                url = 'https://www.linkedin.com/jobs/search/?keywords=' + fullQuery;
                break;
            case 'indeed':
                url = 'https://www.indeed.com/jobs?q=' + fullQuery;
                break;
            case 'glassdoor':
                url = 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword=' + fullQuery;
                break;
            default:
                url = 'https://www.google.com/search?q=' + fullQuery + '+jobs';
        }

        window.open(url, '_blank');
        Visuals.toast('Opening ' + Helpers.capitalize(platform) + '...', 'info');
    }
};

window.Jobs = Jobs;
