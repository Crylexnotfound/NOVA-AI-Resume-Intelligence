// NOVA - Resume Upload Module
// Handles resume file upload and state management:
//   - File input handling (click, drag-and-drop, file picker)
//   - File validation via Parser.validateFile()
//   - Analysis mode selection
//   - State management for currentFile, resumeText, analysisResult
//   - Delegates to Analysis, CoverLetter, Jobs, ResumeGen, Chat, Career modules
//
// Depends on: Parser, Visuals
// Exposes: window.Upload

var Upload = {

    // ---- STATE ----
    currentFile: null,          // The currently selected File object (null if none)
    resumeText: '',             // Extracted plain text from the uploaded PDF
    analysisResult: null,       // Parsed AI analysis result object
    selectedMode: 'full',       // Active analysis mode: 'full' | 'review' | 'job-match' | 'interview'
    selectedTemplate: 'professional',
    selectedPalette: 'blue',
    _generatedResumeData: null, // Parsed data from the last resume generation call
    _immutableData: null,       // Contact info extracted before AI processing

    // ---- INITIALISATION ----
    // Called once from app.init() after PuterService is ready.
    // Restores saved preferences and wires up all upload-related event listeners.
    init: function () {
        // Restore template and palette preferences from localStorage
        try {
            var savedT = localStorage.getItem('nova.template');
            var savedP = localStorage.getItem('nova.palette');
            if (savedT) this.selectedTemplate = savedT;
            if (savedP) this.selectedPalette = savedP;
        } catch (e) { }

        this.initFileUpload();   // Drag-and-drop + file input listeners
        this.initChatInput();    // Enter key handler for the AI chat input
        this.initJobSearch();    // Live filter for the jobs grid
    },

    // ---- FILE UPLOAD LISTENERS ----

    // Supports: click anywhere in the zone, drag-and-drop, and the Browse button.
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

    // ---- CHAT INPUT ----

    // Allows the user to submit a chat message by pressing Enter.
    initChatInput: function () {
        var self = this;
        var input = document.getElementById('chat-input');
        if (!input) return;

        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                Chat.sendChat();
            }
        });
    },

    // ---- JOB SEARCH ----

    // Filters the rendered job cards in real time as the user types.
    initJobSearch: function () {
        var self = this;
        var input = document.getElementById('job-search-input');
        if (!input) return;

        input.addEventListener('input', function (e) {
            Analysis.filterJobs(e.target.value);
        });
    },

    // ---- FILE HANDLING ----

    // Validates and accepts a file — shows error toast on failure
    handleFile: function (file) {
        if (!file) return;

        var validation = Parser.validateFile(file);
        if (!validation.valid) {
            Visuals.toast(validation.error, 'error');
            return;
        }

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

    // ---- CAREER PREDICTION LAZY LOAD ----

    loadCareerPrediction: function () {
        Career.loadCareerPrediction();
    },

    // ---- RESUME REVIEW LAZY LOAD ----

    loadReview: function () {
        Career.loadReview();
    },

    // ---- HISTORY PLACEHOLDER ----

    showHistory: function () {
        Visuals.toast('History feature coming soon', 'info');
    }
};

window.Upload = Upload;
