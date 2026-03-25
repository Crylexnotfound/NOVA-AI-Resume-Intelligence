// NOVA - Resume Generation Module
// Handles AI resume rebuilding and PDF export:
//   - AI resume content generation based on resume and job description
//   - Template and color palette selection
//   - HTML to PDF export via html2pdf.js
//
// Depends on: PuterService, Prompts, Visuals, Upload (for state), html2pdf (external)
// Exposes: window.ResumeGen

var ResumeGen = {

    // ---- INITIALISATION ----
    init: function () {
        // ResumeGen specific initialization
        console.log('[NOVA] ResumeGen module initialized');
    },

    // ---- TEMPLATE & PALETTE SELECTION ----

    // Selects a resume template (Professional, Modern, Minimal, Creative)
    selectTemplate: function (el) {
        if (!el) return;
        document.querySelectorAll('.template-card').forEach(function (c) { c.classList.remove('active'); });
        el.classList.add('active');
        Upload.selectedTemplate = el.dataset.template || 'professional';
        
        // Save to local storage for persistence
        try { localStorage.setItem('nova.template', Upload.selectedTemplate); } catch (e) {}
    },

    // Selects a color palette (Blue, Teal, Grey, Sunset)
    selectPalette: function (el) {
        if (!el) return;
        document.querySelectorAll('.palette-card').forEach(function (c) { c.classList.remove('active'); });
        el.classList.add('active');
        Upload.selectedPalette = el.dataset.palette || 'blue';
        
        // Save to local storage for persistence
        try { localStorage.setItem('nova.palette', Upload.selectedPalette); } catch (e) {}
    },

    // ---- RESUME GENERATION ----

    // Generates an improved, ATS-optimized resume using AI
    generateNewResume: async function () {
        if (!Upload.resumeText) {
            Visuals.toast('Please upload a resume first', 'error');
            return;
        }

        var output = document.getElementById('generated-resume-output');
        if (!output) return;

        var jd = document.getElementById('rg-job-description') ? document.getElementById('rg-job-description').value : '';
        
        output.innerHTML = '<div class="loading-dots">Building your new resume...</div>';
        Visuals.toast('Generating optimized resume...', 'info');

        try {
            var prompt = Prompts.generateResume(Upload.resumeText, Upload.analysisResult, Upload.selectedTemplate, jd);
            var result = await PuterService.aiChat(prompt);
            var data = Helpers.parseJSON(result);

            if (data && data.name) {
                Upload._generatedResumeData = data;
                this.renderResume(data);
                
                // Show download button
                var dlBtn = document.getElementById('download-resume-btn');
                if (dlBtn) dlBtn.style.display = 'block';
                
                Visuals.toast('Resume generated successfully!', 'success');
            } else {
                output.innerHTML = '<p class="error">Failed to generate resume. Please try again.</p>';
                Visuals.toast('Failed to generate resume', 'error');
            }
        } catch (error) {
            console.error('Resume generation failed:', error);
            output.innerHTML = '<p class="error">Failed to generate resume. Error: ' + error.message + '</p>';
            Visuals.toast('Resume generation failed', 'error');
        }
    },

    // Renders the AI-generated resume data into the preview container
    renderResume: function (data) {
        var output = document.getElementById('generated-resume-output');
        if (!output) return;

        var palette = Upload.selectedPalette || 'blue';
        var accentColor = '#8B5CF6';
        if (palette === 'teal') accentColor = '#06B6D4';
        else if (palette === 'grey') accentColor = '#64748B';
        else if (palette === 'sunset') accentColor = '#F97316';

        var html = '<div class="resume-preview-doc ' + (Upload.selectedTemplate || 'professional') + '" id="resume-to-pdf">';
        
        // Header
        html += '<div class="res-header" style="border-bottom: 2px solid ' + accentColor + '">';
        html += '  <h1 style="color:' + accentColor + '">' + (data.name || 'Your Name') + '</h1>';
        html += '  <p class="res-subtitle">' + (data.title || '') + '</p>';
        html += '  <div class="res-contact">';
        if (data.email) html += '<span><i class="fas fa-envelope"></i> ' + data.email + '</span>';
        if (data.phone) html += '<span><i class="fas fa-phone"></i> ' + data.phone + '</span>';
        if (data.location) html += '<span><i class="fas fa-map-marker-alt"></i> ' + data.location + '</span>';
        if (data.linkedin) html += '<span><i class="fab fa-linkedin"></i> ' + data.linkedin + '</span>';
        html += '  </div>';
        html += '</div>';

        // Summary
        if (data.summary) {
            html += '<div class="res-section"><h3>Professional Summary</h3><p>' + data.summary + '</p></div>';
        }

        // Experience
        if (data.experience && data.experience.length) {
            html += '<div class="res-section"><h3>Professional Experience</h3>';
            data.experience.forEach(function (exp) {
                html += '<div class="res-item">';
                html += '  <div class="res-item-header"><strong>' + exp.title + '</strong><span>' + (exp.duration || '') + '</span></div>';
                html += '  <div class="res-company">' + exp.company + '</div>';
                if (exp.bullets && exp.bullets.length) {
                    html += '  <ul>';
                    exp.bullets.forEach(function (b) { html += '<li>' + b + '</li>'; });
                    html += '  </ul>';
                }
                html += '</div>';
            });
            html += '</div>';
        }

        // Education
        if (data.education && data.education.length) {
            html += '<div class="res-section"><h3>Education</h3>';
            data.education.forEach(function (edu) {
                html += '<div class="res-item">';
                html += '  <div class="res-item-header"><strong>' + edu.degree + '</strong><span>' + (edu.year || '') + '</span></div>';
                html += '  <div class="res-company">' + edu.school + '</div>';
                if (edu.details) html += '  <p>' + edu.details + '</p>';
                html += '</div>';
            });
            html += '</div>';
        }

        // Skills
        if (data.skills && data.skills.length) {
            html += '<div class="res-section"><h3>Skills</h3>';
            html += '<div class="res-skills-grid">';
            data.skills.forEach(function (s) { html += '<span class="res-skill-tag">' + s + '</span>'; });
            html += '</div></div>';
        }

        // Certifications
        if (data.certifications && data.certifications.length) {
            html += '<div class="res-section"><h3>Certifications</h3><ul>';
            data.certifications.forEach(function (c) { html += '<li>' + c + '</li>'; });
            html += '</ul></div>';
        }

        html += '</div>';
        output.innerHTML = html;
    },

    // ---- PDF EXPORT ----

    // Exports the generated resume to a PDF file using html2pdf.js
    downloadResumePDF: function () {
        var element = document.getElementById('resume-to-pdf');
        if (!element) {
            Visuals.toast('No resume to download', 'warning');
            return;
        }

        var opt = {
            margin: 0.5,
            filename: (Upload._generatedResumeData ? Upload._generatedResumeData.name.replace(/ /g, '_') : 'NOVA') + '_Resume.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        Visuals.toast('Preparing your PDF...', 'info');
        
        // Use html2pdf if available
        if (typeof html2pdf !== 'undefined') {
            html2pdf().from(element).set(opt).save().then(function () {
                Visuals.toast('Resume downloaded!', 'success');
            }).catch(function (err) {
                console.error('PDF generation failed:', err);
                Visuals.toast('Failed to generate PDF', 'error');
            });
        } else {
            // Fallback: print the page (not ideal, but works as last resort)
            window.print();
        }
    }
};

window.ResumeGen = ResumeGen;
