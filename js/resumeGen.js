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
        
        output.innerHTML = 
            '<div class="text-center" style="padding:80px;">' +
            '  <i class="fas fa-wand-magic-sparkles fa-spin" style="font-size:32px; color:var(--accent-violet); margin-bottom:16px;"></i>' +
            '  <p style="color:var(--text-secondary); font-weight:600;">NOVA is rebuilding your resume...</p>' +
            '  <p style="font-size:12px; color:var(--text-dim); margin-top:8px;">Optimizing for ATS keywords and impact-driven bullets</p>' +
            '</div>';

        Visuals.toast('Generating optimized resume...', 'info');

        var retryCount = 0;
        var maxRetries = 1;
        var success = false;

        while (!success && retryCount <= maxRetries) {
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
                    success = true;
                } else {
                    throw new Error("Invalid structure");
                }
            } catch (error) {
                console.error('Resume generation attempt ' + (retryCount + 1) + ' failed:', error);
                retryCount++;
                if (retryCount > maxRetries) {
                    output.innerHTML = 
                        '<div class="error-state" style="text-align:center; padding:60px; background:rgba(239,68,68,0.05); border-radius:20px; border:1px dashed var(--accent-red)">' +
                        '  <i class="fas fa-circle-exclamation" style="font-size:24px; color:var(--accent-red); margin-bottom:12px;"></i>' +
                        '  <p style="font-weight:600">Generation Sync Failed</p>' +
                        '  <p style="font-size:13px; color:var(--text-dim); margin:8px 0 20px;">The AI model returned an inconsistent response. Please try one more time.</p>' +
                        '  <button class="btn-glow" onclick="ResumeGen.generateNewResume()"><span class="btn-glow-text">Retry Generation</span></button>' +
                        '</div>';
                    Visuals.toast('Failed to generate resume after retries', 'error');
                } else {
                    Visuals.toast('Retrying with stricter constraints...', 'info');
                }
            }
        }
    },

    // Renders the AI-generated resume data into the preview container
    renderResume: function (data) {
        var output = document.getElementById('generated-resume-output');
        if (!output) return;

        var palette = Upload.selectedPalette || 'blue';
        var template = Upload.selectedTemplate || 'professional';
        
        var accentColor = '#8B5CF6';
        if (palette === 'teal') accentColor = '#06B6D4';
        else if (palette === 'grey') accentColor = '#64748B';
        else if (palette === 'sunset') accentColor = '#F97316';

        var html = '<div class="resume-preview-doc ' + template + '" id="resume-to-pdf">';

        if (template === 'modern') {
            // --- MODERN TEMPLATE (SIDEBAR LAYOUT) ---
            html += '<div class="res-sidebar">';
            
            // Sidebar: Contact
            html += '<div class="res-side-section">';
            html += '  <h4 style="color:' + accentColor + '">Contact</h4>';
            if (data.email) html += '<p><i class="fas fa-envelope"></i> ' + data.email + '</p>';
            if (data.phone) html += '<p><i class="fas fa-phone"></i> ' + data.phone + '</p>';
            if (data.location) html += '<p><i class="fas fa-map-marker-alt"></i> ' + data.location + '</p>';
            if (data.linkedin) html += '<p><i class="fab fa-linkedin"></i> ' + data.linkedin + '</p>';
            html += '</div>';

            // Sidebar: Skills
            if (data.skills && data.skills.length) {
                html += '<div class="res-side-section">';
                html += '  <h4 style="color:' + accentColor + '">Expertise</h4>';
                html += '  <div class="res-skills-list">';
                data.skills.forEach(function (s) { html += '<span>' + s + '</span>'; });
                html += '  </div>';
                html += '</div>';
            }

            // Sidebar: Certifications
            if (data.certifications && data.certifications.length) {
                html += '<div class="res-side-section">';
                html += '  <h4 style="color:' + accentColor + '">Certifications</h4>';
                html += '  <ul>';
                data.certifications.forEach(function (c) { html += '<li>' + c + '</li>'; });
                html += '  </ul>';
                html += '</div>';
            }
            html += '</div>'; // End Sidebar

            html += '<div class="res-main">';
            // Main Header
            html += '<div class="res-header">';
            html += '  <h1 style="color:' + accentColor + '">' + (data.name || 'Your Name') + '</h1>';
            html += '  <p class="res-subtitle">' + (data.title || '') + '</p>';
            html += '</div>';

            // Summary
            if (data.summary) {
                html += '<div class="res-section"><h3>Profile Summary</h3><p>' + data.summary + '</p></div>';
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
                    html += '</div>';
                });
                html += '</div>';
            }
            html += '</div>'; // End Main
        } else {
            // --- FLAT LAYOUTS (Professional, Minimal, Creative) ---
            var isMinimal = template === 'minimal';
            var headerStyle = isMinimal ? 'border-bottom:none; text-align:center;' : 'border-bottom: 2px solid ' + accentColor + ';';
            
            html += '<div class="res-header" style="' + headerStyle + '">';
            html += '  <h1 style="color:' + accentColor + '">' + (data.name || 'Your Name') + '</h1>';
            html += '  <p class="res-subtitle">' + (data.title || '') + '</p>';
            html += '  <div class="res-contact" style="' + (isMinimal ? 'justify-content:center;' : '') + '">';
            if (data.email) html += '<span><i class="fas fa-envelope"></i> ' + data.email + '</span>';
            if (data.phone) html += '<span><i class="fas fa-phone"></i> ' + data.phone + '</span>';
            if (data.location) html += '<span><i class="fas fa-map-marker-alt"></i> ' + data.location + '</span>';
            if (data.linkedin) html += '<span><i class="fab fa-linkedin"></i> ' + data.linkedin + '</span>';
            html += '  </div>';
            html += '</div>';

            if (data.summary) {
                html += '<div class="res-section"><h3>Professional Summary</h3><p>' + data.summary + '</p></div>';
            }

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

            if (data.skills && data.skills.length) {
                html += '<div class="res-section"><h3>Skills & Expertise</h3>';
                html += '<div class="res-skills-grid">';
                data.skills.forEach(function (s) { html += '<span class="res-skill-tag">' + s + '</span>'; });
                html += '</div></div>';
            }

            if (data.education && data.education.length) {
                html += '<div class="res-section"><h3>Education</h3>';
                data.education.forEach(function (edu) {
                    html += '<div class="res-item">';
                    html += '  <div class="res-item-header"><strong>' + edu.degree + '</strong><span>' + (edu.year || '') + '</span></div>';
                    html += '  <div class="res-company">' + edu.school + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (data.certifications && data.certifications.length) {
                html += '<div class="res-section"><h3>Certifications</h3><ul>';
                data.certifications.forEach(function (c) { html += '<li>' + c + '</li>'; });
                html += '</ul></div>';
            }
        }

        html += '</div>';
        output.innerHTML = html;

        // Show download button
        var dlBtn = document.getElementById('download-resume-btn');
        if (dlBtn) dlBtn.style.display = 'block';
    },

    // ---- PDF EXPORT ----

    // Exports the generated resume to a PDF file using html2pdf.js
    downloadResumePDF: function () {
        var element = document.getElementById('resume-to-pdf');
        if (!element) {
            Visuals.toast('No resume to download. Generate one first.', 'warning');
            return;
        }

        var btn = document.getElementById('download-resume-btn');
        var originalHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Capturing...';
        }

        var opt = {
            margin: [0, 0, 0, 0], 
            filename: (Upload._generatedResumeData ? Upload._generatedResumeData.name.replace(/ /g, '_') : 'NOVA') + '_Resume.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 800 // Ensure layout doesn't collapse
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
        };

        Visuals.toast('Preparing high-fidelity export...', 'info');
        
        if (typeof html2pdf !== 'undefined') {
            html2pdf().from(element).set(opt).save().then(function () {
                Visuals.toast('Resume exported successfully!', 'success');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            }).catch(function (err) {
                console.error('PDF generation failed:', err);
                Visuals.toast('Export failed. Try again.', 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            });
        } else {
            Visuals.toast('PDF library missing. Using browser print.', 'warning');
            window.print();
        }
    }
};

window.ResumeGen = ResumeGen;
