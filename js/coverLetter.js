// NOVA - Cover Letter Module
// Handles cover letter generation functionality:
//   - Tailored cover letter generation based on resume and job description
//   - Clipboard copy functionality
//
// Depends on: PuterService, Prompts, Visuals, Upload (for resumeText)
// Exposes: window.CoverLetter

var CoverLetter = {

    // ---- INITIALISATION ----
    init: function () {
        // Cover letter specific initialization if needed
    },

    // ---- COVER LETTER GENERATION ----

    // Generates a tailored cover letter using the resume text and target position
    generateCoverLetter: async function () {
        var comp = document.getElementById('cl-company');
        var pos = document.getElementById('cl-position');
        var output = document.getElementById('cl-output');

        if (!comp || !pos || !output) {
            console.error('Cover letter elements not found');
            return;
        }

        var company = comp.value.trim();
        var position = pos.value.trim();
        var resumeText = Upload.resumeText;

        if (!company || !position) {
            Visuals.toast('Please enter company and position', 'error');
            return;
        }

        if (!resumeText) {
            Visuals.toast('Please upload a resume first', 'error');
            return;
        }

        output.innerHTML = '<div class="loading-dots">Generating...</div>';
        Visuals.toast('Generating cover letter...', 'info');

        try {
            var prompt = Prompts.coverLetter(resumeText, position, company);
            var result = await PuterService.aiChat(prompt);

            // Parse markdown to HTML
            if (typeof marked !== 'undefined') {
                result = marked.parse(result);
            }

            output.innerHTML = result;
            Visuals.toast('Cover letter generated!', 'success');

        } catch (error) {
            console.error('Cover letter generation failed:', error);
            output.innerHTML = '<p class="error">Failed to generate cover letter. Please try again.</p>';
            Visuals.toast('Cover letter generation failed', 'error');
        }
    },

    // Copies the generated cover letter text to the clipboard
    copyCoverLetter: function () {
        var output = document.getElementById('cl-output');
        if (!output) return;

        // Get text content (strip HTML tags if present)
        var text = output.textContent || output.innerText;

        if (!text || text.trim() === '' || text.includes('Generating')) {
            Visuals.toast('No cover letter to copy', 'warning');
            return;
        }

        navigator.clipboard.writeText(text).then(function () {
            Visuals.toast('Cover letter copied to clipboard!', 'success');
        }).catch(function (err) {
            console.error('Failed to copy:', err);
            Visuals.toast('Failed to copy to clipboard', 'error');
        });
    }
};

window.CoverLetter = CoverLetter;
