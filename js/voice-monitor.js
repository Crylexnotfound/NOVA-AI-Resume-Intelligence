/**
 * NOVA - Voice Tone & Flow Monitor
 * Handles Web Audio API (AudioContext, AnalyserNode) and Speech Recognition.
 * Measures Pacing (WPM) and Energy Variance (Enthusiasm).
 */

var VoiceMonitor = {
    audioContext: null,
    analyser: null,
    dataArray: null,
    source: null,
    stream: null,
    recognition: null,
    isRecording: false,
    
    // Tracking Data
    startTime: 0,
    rmsLevels: [],
    transcript: '',
    
    /**
     * Start recording audio and speech recognition
     * @param {number} idx - Index of the interview question
     * @param {Function} onTranscript - Callback for real-time transcript updates
     * @param {Function} onDraw - Callback for drawing the visualizer
     */
    start: async function(idx, onTranscript, onDraw) {
        if (this.isRecording) return;
        
        try {
            // 1. Initialize Audio Context for Energy Measurement
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.source.connect(this.analyser);
            
            var bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            // 2. Initialize Speech Recognition
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error("Speech Recognition not supported in this browser.");
            }
            
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.transcript = '';
            this.rmsLevels = [];
            this.startTime = Date.now();
            this.isRecording = true;
            
            this.recognition.onresult = (event) => {
                var currentTranscript = '';
                for (var i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                this.transcript = currentTranscript;
                if (onTranscript) onTranscript(this.transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                this.stop();
            };
            
            this.recognition.start();
            
            // 3. Start Visualizer and RMS Tracking
            this._animate(onDraw);
            
            console.log("[NOVA] Voice Monitor started");
        } catch (err) {
            console.error("[NOVA] Failed to start Voice Monitor:", err);
            throw err;
        }
    },
    
    /**
     * Stop recording and return metadata
     */
    stop: function() {
        if (!this.isRecording) return null;
        
        this.isRecording = false;
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            // We keep the context but stop the source
            if (this.source) this.source.disconnect();
        }
        
        var durationMinutes = (Date.now() - this.startTime) / 60000;
        var words = this.transcript.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        var wpm = Math.round(words / Math.max(0.1, durationMinutes));
        var energyVariance = this._calculateVariance(this.rmsLevels);
        
        console.log("[NOVA] Voice Monitor stopped. WPM:", wpm, "Energy Var:", energyVariance);
        
        return {
            pacing: wpm,
            energy: energyVariance,
            transcript: this.transcript
        };
    },
    
    /**
     * Internal animation loop for visualizer and energy tracking
     */
    _animate: function(onDraw) {
        if (!this.isRecording) return;
        
        this.analyser.getByteTimeDomainData(this.dataArray);
        
        // Calculate RMS (Energy)
        var sum = 0;
        for (var i = 0; i < this.dataArray.length; i++) {
            var val = (this.dataArray[i] - 128) / 128;
            sum += val * val;
        }
        var rms = Math.sqrt(sum / this.dataArray.length);
        this.rmsLevels.push(rms);
        
        if (onDraw) onDraw(this.dataArray);
        
        requestAnimationFrame(() => this._animate(onDraw));
    },
    
    /**
     * Calculate variance of an array of numbers
     */
    _calculateVariance: function(arr) {
        if (arr.length === 0) return 0;
        var mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        var squareDiffs = arr.map(value => Math.pow(value - mean, 2));
        var variance = squareDiffs.reduce((a, b) => a + b, 0) / arr.length;
        // Scale variance for better visibility in prompt (0-100 range roughly)
        return Math.min(100, Math.round(variance * 5000));
    }
};

window.VoiceMonitor = VoiceMonitor;
