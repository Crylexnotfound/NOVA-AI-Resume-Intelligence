// NOVA - Upload Module (Guard)
// The full Upload implementation lives in analysis.js.
// This file ensures stub methods exist if the main implementation
// does not define them (prevents "not a function" errors).

(function () {
    // If Upload was already defined by analysis.js, just patch in any missing stubs
    if (window.Upload) {
        if (!window.Upload.initChatInput) {
            window.Upload.initChatInput = function () {
                var input = document.getElementById('chat-input');
                if (input) {
                    input.addEventListener('keypress', function (e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            Upload.sendChat();
                        }
                    });
                }
            };
        }
        if (!window.Upload.initJobSearch) {
            window.Upload.initJobSearch = function () {
                var searchInput = document.getElementById('job-search-input');
                if (searchInput) {
                    searchInput.addEventListener('input', function (e) {
                        Upload.filterJobs(e.target.value);
                    });
                }
            };
        }
        if (!window.Upload.showHistory) {
            window.Upload.showHistory = function () {
                Visuals.toast('History feature coming soon', 'info');
            };
        }
        return;
    }

    // Fallback: define a minimal Upload if analysis.js didn't load
    window.Upload = {
        currentFile: null,
        resumeText: '',
        analysisResult: null,
        selectedMode: 'full',
        selectedTemplate: 'professional',
        selectedPalette: 'blue',
        _generatedResumeData: null,
        _immutableData: null,

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

        initChatInput: function () {
            var input = document.getElementById('chat-input');
            if (input) {
                input.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        Upload.sendChat();
                    }
                });
            }
        },

        initJobSearch: function () {
            var searchInput = document.getElementById('job-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', function (e) {
                    Upload.filterJobs(e.target.value);
                });
            }
        },

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

        selectMode: function (el) {
            document.querySelectorAll('.mode-card').forEach(function (c) { c.classList.remove('active'); });
            el.classList.add('active');
            this.selectedMode = el.dataset.mode;
        },

        sendChat: function () { },
        filterJobs: function () { },
        showHistory: function () { Visuals.toast('History feature coming soon', 'info'); }
    };
})();