//Resume analysis module. 
// Handles all resume analysis functionality including AI execution, results parsing, score rendering, feedback display, and job matching.

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
    init: function () { /* ... */ },

    // ---- MAIN ANALYSIS ----
    analyzeResume: async function () { /* ... */ },
    _applyFullAnalysis: function (rawResult) { /* ... */ },

    // ---- RESULTS RENDERING ----
    showResults: function () { /* ... */ },
    renderCategories: function (categories) { /* ... */ },
    renderFeedback: function (data) { /* ... */ },
    renderJobMatches: function (jobs) { /* ... */ },
    filterJobs: function (query) { /* ... */ },

    // ---- TAB MANAGEMENT ----
    switchTab: function (el) { /* ... */ },
    switchTabByName: function (name) { /* ... */ },

    // ---- INTERVIEW QUESTIONS ----
    renderInterviewQuestions: function (data) { /* ... */ },

    // ---- RE-ANALYSIS & EXPORT ----
    reAnalyze: function () { /* ... */ },
    exportPDF: function () { /* ... */ }
};

window.Analysis = Analysis;


// NOVA - Resume Upload & Analysis Module
// Handles: file input, drag-and-drop, file validation, PDF parsing,
//          AI analysis trigger, results rendering, tabs, cover letter,
//          career prediction, AI chat, live jobs, resume generator.
//
// Depends on: Parser, PuterService, Visuals, Helpers, Prompts
// Exposes: window.Upload

var Upload = {

    // ---- STATE ----
    currentFile: null,          // The currently selected File object (null if none)
    resumeText: '',             // Extracted plain text from the uploaded PDF
    analysisResult: null,       // Parsed AI analysis result object
    selectedMode: 'full',       // Active analysis mode: 'full' | 'roast' | 'job-match' | 'interview'
    selectedTemplate: 'professional',
    selectedPalette: 'blue',
    _generatedResumeData: null,
    _immutableData: null,       // Contact info extracted before AI processing

    // ---- INITIALISATION ----
    // Called once from app.init() — restores preferences and wires up listeners
    init: function () {
        try {
            var savedT = localStorage.getItem('nova.template');
            var savedP = localStorage.getItem('nova.palette');
            if (savedT) this.selectedTemplate = savedT;
            if (savedP) this.selectedPalette = savedP;
        } catch (e) { }

        this.initFileUpload();
        this.initChatInput();
        this.initJobSearch();
    },

    // ---- FILE UPLOAD LISTENERS ----
    // Supports: click anywhere in the zone, drag-and-drop, Browse button
    initFileUpload: function () {
        var self = this;
        var dropArea = document.getElementById('upload-drop-area');
        var fileInput = document.getElementById('file-input');
        if (!dropArea || !fileInput) return;

        dropArea.addEventListener('click', function (e) {
            if (e.target.tagName !== 'BUTTON') fileInput.click();
        });

        dropArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            dropArea.classList.add('drag-over');
        });

        dropArea.addEventListener('dragleave', function () {
            dropArea.classList.remove('drag-over');
        });

        dropArea.addEventListener('drop', function (e) {
            e.preventDefault();
            dropArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length) self.handleFile(e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', function (e) {
            if (e.target.files.length) self.handleFile(e.target.files[0]);
        });
    },

    // ---- FILE HANDLING ----

    // Validates and accepts a file — shows error toast on failure
    handleFile: function (file) {
        if (!file) return;
        var validation = Parser.validateFile(file);
        if (!validation.valid) { Visuals.toast(validation.error, 'error'); return; }

        this.currentFile = file;
        var uz = document.getElementById('upload-zone');
        var fp = document.getElementById('file-preview');
        if (uz) uz.classList.add('hidden');
        if (fp) fp.classList.remove('hidden');
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-size').textContent = Parser.formatFileSize(file.size);
        Visuals.toast('Uploaded: ' + file.name, 'success');
    },

    // Resets upload state — clears file, hides preview, shows upload zone
    removeFile: function () {
        this.currentFile = null;
        this.resumeText = '';
        var fi = document.getElementById('file-input');
        if (fi) fi.value = '';
        var uz = document.getElementById('upload-zone');
        var fp = document.getElementById('file-preview');
        var rs = document.getElementById('results-section');
        if (uz) uz.classList.remove('hidden');
        if (fp) fp.classList.add('hidden');
        if (rs) rs.classList.add('hidden');
    },

    // Updates the selected analysis mode
    selectMode: function (el) {
        document.querySelectorAll('.mode-card').forEach(function (c) { c.classList.remove('active'); });
        el.classList.add('active');
        this.selectedMode = el.dataset.mode;
    },

    // ---- ANALYSIS TRIGGER ----
    // Called when "Analyze with NOVA AI" is clicked.
    // Parses the PDF, selects the AI prompt, sends to GPT-4o, applies results.
    analyzeResume: async function () {
        if (!this.currentFile) { Visuals.toast('Please upload a resume first', 'error'); return; }

        Visuals.showAnalysisOverlay();
        Visuals.updateAnalysisStep(1, 'Parsing your resume...');

        try {
            // Step 1: Extract text from PDF
            this.resumeText = await Parser.parsePDF(this.currentFile);
            this._immutableData = Helpers.extractImmutableData(this.resumeText);

            Visuals.updateAnalysisStep(2, 'Running AI analysis...');

            var jobDescription = '';
            var jdEl = document.getElementById('job-description');
            if (jdEl) jobDescription = jdEl.value || '';

            // Step 2: Select prompt based on mode
            var prompt;
            if (this.selectedMode === 'roast') prompt = Prompts.roast(this.resumeText);
            else if (this.selectedMode === 'interview') prompt = Prompts.interview(this.resumeText, jobDescription);
            else if (this.selectedMode === 'job-match') prompt = Prompts.jobMatch(this.resumeText, jobDescription);
            else prompt = Prompts.fullAnalysis(this.resumeText, jobDescription);

            // Step 3: Send to GPT-4o
            var rawResult = await PuterService.aiChat(prompt);

            Visuals.updateAnalysisStep(3, 'Generating insights...');

            // Step 4: Apply results
            if (this.selectedMode === 'roast') {
                this.analysisResult = this.analysisResult || {};
                this.analysisResult.roast = rawResult;
                this._applyFullAnalysis(await PuterService.aiChat(Prompts.fullAnalysis(this.resumeText, jobDescription)));
            } else if (this.selectedMode === 'interview') {
                var parsed = Helpers.parseJSON(rawResult);
                this.analysisResult = this.analysisResult || {};
                if (parsed) this.renderInterviewQuestions(parsed);
                this._applyFullAnalysis(await PuterService.aiChat(Prompts.fullAnalysis(this.resumeText, jobDescription)));
            } else if (this.selectedMode === 'job-match') {
                var jobData = Helpers.parseJSON(rawResult);
                if (jobData && jobData.jobs) this.renderJobMatches(jobData.jobs);
                this._applyFullAnalysis(await PuterService.aiChat(Prompts.fullAnalysis(this.resumeText, jobDescription)));
            } else {
                this._applyFullAnalysis(rawResult);
            }

            Visuals.updateAnalysisStep(4, 'Matching jobs...');

            // Step 5: For full mode, also run job matching
            if (this.selectedMode === 'full') {
                try {
                    var jData = Helpers.parseJSON(await PuterService.aiChat(Prompts.jobMatch(this.resumeText, jobDescription)));
                    if (jData && jData.jobs) this.renderJobMatches(jData.jobs);
                } catch (e) { console.warn('Job matching failed:', e); }
            }

            // Save summary to history
            PuterService.saveAnalysis({
                fileName: this.currentFile.name,
                atsScore: (this.analysisResult && this.analysisResult.atsScore) || 0,
                mode: this.selectedMode
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
            this.analysisResult = { atsScore: 70, verdict: 'Analysis completed', raw: rawResult };
            this.showResults();
            return;
        }
        this.analysisResult = Object.assign({}, this.analysisResult || {}, data);
        this.showResults();
    }

    // ... (renderCategories, renderFeedback, renderJobMatches, switchTabByName,
    //      generateCoverLetter, loadCareerPrediction, loadRoast, sendChat,
    //      loadLiveJobs, selectTemplate, generateNewResume, downloadResumePDF
    //      — all follow the same pattern; see js/upload.js for full implementation)
};

window.Upload = Upload;