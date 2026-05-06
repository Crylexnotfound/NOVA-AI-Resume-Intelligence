/**
 * NOVA - Interview Prep Module
 * Handles mock interview generation, question rendering, 
 * voice integration, and evaluation feedback.
 * 
 * Depends on: PuterService, Visuals, Helpers, Prompts, VoiceMonitor
 */

var Interview = {
    // ---- STATE ----
    _currentQuestions: [],
    _voiceData: {}, // Stores {pacing, energy} per question index

    // ---- INITIALISATION ----
    init: function () {
        console.log('[NOVA] Interview module initialized');
    },

    // ---- QUESTIONS GENERATION ----

    // Triggers full AI generation of 8 interview questions based on resume and target JD.
    generateQuestions: async function () {
        if (!Upload.resumeText) {
            Visuals.toast('Please upload a resume first', 'error');
            return;
        }

        var container = document.getElementById('interview-root');
        if (!container) return;

        // Get JD from interview panel, fallback to main JD from dashboard
        var jd = document.getElementById('int-job-description') ? document.getElementById('int-job-description').value : '';
        if (!jd) {
            var dashJd = document.getElementById('job-description');
            if (dashJd) jd = dashJd.value || '';
        }

        container.innerHTML =
            '<div class="text-center" style="padding:60px;">' +
            '  <i class="fas fa-atom fa-spin" style="font-size:32px; color:var(--accent-cyan); margin-bottom:16px;"></i>' +
            '  <p style="color:var(--text-secondary); font-weight:500;">NOVA is studying the role and your experience...</p>' +
            '</div>';

        Visuals.toast('Generating interview questions...', 'info');

        try {
            var prompt = Prompts.interview(Upload.resumeText, jd);
            var result = await PuterService.aiChat(prompt);
            var data = Helpers.parseJSON(result);

            if (data && data.questions) {
                this.renderQuestions(data);
                Visuals.toast('Mock interview ready!', 'success');
            } else {
                container.innerHTML = '<p class="error" style="text-align:center; padding:40px;">Failed to generate questions. Please try again.</p>';
            }
        } catch (error) {
            console.error('Interview generation failed:', error);
            container.innerHTML = '<p class="error" style="text-align:center; padding:40px;">Error generating questions: ' + error.message + '</p>';
        }
    },

    // Renders a list of interview questions into the interview panel
    renderQuestions: function (data) {
        var container = document.getElementById('interview-root');
        if (!container) return;

        // Store questions for later reference when submitting
        this._currentQuestions = data.questions;

        var html = '';
        if (data.questions && data.questions.length) {
            data.questions.forEach(function (q, idx) {
                var difficultyIcon = q.difficulty === 'Hard' ? 'fa-fire' : (q.difficulty === 'Medium' ? 'fa-bolt' : 'fa-leaf');
                var difficultyColor = q.difficulty === 'Hard' ? '#EF4444' : (q.difficulty === 'Medium' ? '#F59E0B' : '#10B981');

                html +=
                    '<div class="feedback-card interview-q-card" id="q-card-' + idx + '" style="animation-delay: ' + (idx * 0.1) + 's; margin-bottom:24px;">' +
                    '  <div class="feedback-card-header" style="margin-bottom:20px;">' +
                    '    <div class="feedback-card-icon" style="background:' + difficultyColor + '15; color:' + difficultyColor + '">' +
                    '      <i class="fas ' + difficultyIcon + '"></i>' +
                    '    </div>' +
                    '    <div style="display:flex; flex-direction:column">' +
                    '      <span class="feedback-card-title">' + (q.type || 'Question') + '</span>' +
                    '      <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase; letter-spacing:1px">' + (q.difficulty || 'Medium') + ' Difficulty</span>' +
                    '    </div>' +
                    '  </div>' +
                    '  <p class="feedback-item" style="color:var(--text-primary); font-size:17px; margin-bottom:24px; font-weight:600; line-height:1.4">' + q.question + '</p>' +
                    '  <div class="int-input-wrap">' +
                    '    <textarea id="answer-' + idx + '" class="input-dark" placeholder="Type your answer here... Be detailed." rows="4" style="margin-bottom:16px; min-height:120px;"></textarea>' +
                    '    <div class="int-actions" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">' +
                    '      <div style="display:flex; align-items:center; gap:12px; flex:1;">' +
                    '        <button class="mic-btn" onclick="app.toggleInterviewMic(' + idx + ')" id="mic-btn-' + idx + '" title="Speak your answer">' +
                    '          <i class="fas fa-microphone"></i>' +
                    '        </button>' +
                    '        <div class="waveform-container" id="waveform-container-' + idx + '">' +
                    '          <canvas id="waveform-' + idx + '" class="waveform-canvas"></canvas>' +
                    '        </div>' +
                    '        <div id="voice-meta-' + idx + '" class="voice-meta-tags"></div>' +
                    '      </div>' +
                    '      <button class="btn-glow" onclick="app.submitInterviewAnswer(' + idx + ')" id="submit-btn-' + idx + '" style="padding:10px 24px; border-radius:12px;">' +
                    '        <span class="btn-glow-text"><i class="fas fa-paper-plane"></i> Submit Answer</span>' +
                    '      </button>' +
                    '    </div>' +
                    '    <div class="q-tip-box" style="font-size:12px; color:var(--accent-cyan); background:rgba(6,182,212,0.05); padding:8px 14px; border-radius:10px; border:1px solid rgba(6,182,212,0.1); margin-top:16px;"><i class="fas fa-lightbulb"></i> <span style="font-weight:600">Tip:</span> ' + (q.tip || "Focus on STAR method.") + '</div>' +
                    '  </div>' +
                    '  <div id="feedback-root-' + idx + '" class="feedback-results-root"></div>' +
                    '</div>';
            });
        } else {
            html = '<div class="no-data-state" style="text-align:center; padding:40px; color:var(--text-dim)"><p>No questions generated yet. Click "Start AI Interview Prep" to begin.</p></div>';
        }

        container.innerHTML = html;
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // ---- VOICE INTEGRATION ----

    toggleMic: async function (idx) {
        var btn = document.getElementById('mic-btn-' + idx);
        var waveformCont = document.getElementById('waveform-container-' + idx);
        var textarea = document.getElementById('answer-' + idx);
        var metaRoot = document.getElementById('voice-meta-' + idx);

        if (VoiceMonitor.isRecording) {
            // STOP
            var result = VoiceMonitor.stop();
            btn.classList.remove('active');
            waveformCont.classList.remove('active');

            if (result) {
                this._voiceData[idx] = { pacing: result.pacing, energy: result.energy };
                metaRoot.innerHTML =
                    '<div class="voice-meta-tag"><i class="fas fa-gauge-high"></i> ' + result.pacing + ' WPM</div>' +
                    '<div class="voice-meta-tag"><i class="fas fa-bolt"></i> ' + result.energy + '% Energy</div>';
                Visuals.toast('Voice analysis complete', 'success');
            }
        } else {
            // START
            try {
                btn.classList.add('active');
                waveformCont.classList.add('active');
                metaRoot.innerHTML = '';

                var canvas = document.getElementById('waveform-' + idx);
                var ctx = canvas.getContext('2d');

                await VoiceMonitor.start(
                    idx,
                    (transcript) => {
                        if (textarea) textarea.value = transcript;
                    },
                    (dataArray) => {
                        // Drawing logic for waveform
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = '#8B5CF6';
                        ctx.beginPath();
                        var sliceWidth = canvas.width * 1.0 / dataArray.length;
                        var x = 0;
                        for (var i = 0; i < dataArray.length; i++) {
                            var v = dataArray[i] / 128.0;
                            var y = v * canvas.height / 2;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                            x += sliceWidth;
                        }
                        ctx.lineTo(canvas.width, canvas.height / 2);
                        ctx.stroke();
                    }
                );
            } catch (err) {
                btn.classList.remove('active');
                waveformCont.classList.remove('active');
                Visuals.toast('Mic access denied or not supported', 'error');
            }
        }
    },

    // ---- EVALUATION ----

    submitAnswer: async function (idx) {
        var answerEl = document.getElementById('answer-' + idx);
        var answer = answerEl ? answerEl.value : '';

        if (!answer || answer.trim().length < 5) {
            Visuals.toast('Please provide a more substantial answer', 'warning');
            return;
        }

        var btn = document.getElementById('submit-btn-' + idx);
        var feedbackRoot = document.getElementById('feedback-root-' + idx);
        var question = this._currentQuestions[idx].question;

        if (btn) btn.disabled = true;
        if (btn) btn.innerHTML = '<span class="btn-glow-text"><i class="fas fa-spinner fa-spin"></i> Analyzing...</span>';
        feedbackRoot.innerHTML =
            '<div class="text-center" style="padding:30px;">' +
            '  <i class="fas fa-circle-notch fa-spin" style="margin-bottom:10px; color:var(--accent-violet)"></i>' +
            '  <p style="font-size:13px; color:var(--text-dim)">Evaluating and generating model answer...</p>' +
            '</div>';

        try {
            var jd = document.getElementById('int-job-description') ? document.getElementById('int-job-description').value : '';
            var voiceMeta = this._voiceData[idx] || null;
            var prompt = Prompts.interviewFeedback(question, answer, Upload.resumeText, jd, voiceMeta);
            var result = await PuterService.aiChat(prompt);
            var data = Helpers.parseJSON(result);

            if (data && data.score !== undefined) {
                this.renderDetailedFeedback(idx, data);
                if (btn) btn.innerHTML = '<span class="btn-glow-text"><i class="fas fa-check"></i> Analysis Complete</span>';
                Visuals.toast('Detailed feedback generated!', 'success');
            } else {
                feedbackRoot.innerHTML = '<p class="error">Failed to parse analysis. Please try again.</p>';
                if (btn) btn.disabled = false;
                if (btn) btn.innerHTML = '<span class="btn-glow-text">Retry Submission</span>';
            }
        } catch (error) {
            console.error('Feedback failed:', error);
            feedbackRoot.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            if (btn) btn.disabled = false;
            if (btn) btn.innerHTML = '<span class="btn-glow-text">Retry Submission</span>';
        }
    },

    // Renders the detailed analytical feedback for a mock answer
    renderDetailedFeedback: function (idx, data) {
        var root = document.getElementById('feedback-root-' + idx);
        var scoreColor = Helpers.getScoreColor(data.score);

        var html =
            '<div class="detailed-feedback-result" style="animation: fadeUp 0.5s ease forwards; margin-top:24px; padding-top:24px; border-top:1px solid var(--border-subtle)">' +
            '  <div class="feedback-score-bar" style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">' +
            '    <div class="score-pill" style="background:' + scoreColor + '15; color:' + scoreColor + '; padding:6px 14px; border-radius:99px; font-weight:700; border:1px solid ' + scoreColor + '30">' +
            '      <strong>' + data.score + '/100</strong> Performance Score' +
            '    </div>' +
            '    <span class="verdict-text" style="font-size:14px; font-weight:600; color:var(--text-primary)">' + data.verdict + '</span>' +
            '  </div>' +
            '  <div class="pillars-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:24px;">';

        // Render Pillars
        if (data.pillars) {
            Object.keys(data.pillars).forEach(function (key) {
                var p = data.pillars[key];
                var pColor = Helpers.getScoreColor(p.score);
                html +=
                    '<div class="pillar-item" style="background:rgba(255,255,255,0.02); padding:14px; border-radius:12px; border:1px solid var(--border-subtle)">' +
                    '  <div class="pillar-info" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">' +
                    '    <span class="pillar-name" style="font-weight:600; color:var(--text-secondary)">' + Helpers.capitalize(key) + '</span>' +
                    '    <span class="pillar-val" style="color:' + pColor + '; font-weight:700">' + p.score + '%</span>' +
                    '  </div>' +
                    '  <div class="pillar-bar" style="height:4px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden; margin-bottom:8px;">' +
                    '    <div class="pillar-fill" style="width:' + p.score + '%; height:100%; background:' + pColor + '; border-radius:4px; transition:width 1s ease"></div>' +
                    '  </div>' +
                    '  <p class="pillar-desc" style="font-size:11px; color:var(--text-dim); line-height:1.4">' + p.feedback + '</p>' +
                    '</div>';
            });
        }

        html += '</div>'; // End pillars grid

        // Strengths & Improvements
        html += '<div class="int-feedback-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">';

        if (data.strengths && data.strengths.length) {
            html += '<div class="int-fb-col"><span style="font-size:12px; font-weight:700; color:var(--accent-green); text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:12px;"><i class="fas fa-check-circle"></i> Key Strengths</span><ul class="feedback-list" style="margin-top:0">';
            data.strengths.forEach(function (s) { html += '<li class="feedback-item" style="font-size:13px; color:var(--text-secondary); margin-bottom:6px;"><i class="fas fa-check" style="color:var(--accent-green); font-size:10px;"></i> ' + s + '</li>'; });
            html += '</ul></div>';
        }

        if (data.improvements && data.improvements.length) {
            html += '<div class="int-fb-col"><span style="font-size:12px; font-weight:700; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:12px;"><i class="fas fa-arrow-alt-circle-up"></i> Critical Improvements</span><ul class="feedback-list" style="margin-top:0">';
            data.improvements.forEach(function (i) { html += '<li class="feedback-item" style="font-size:13px; color:var(--text-secondary); margin-bottom:6px;"><i class="fas fa-arrow-right" style="color:var(--accent-cyan); font-size:10px;"></i> ' + i + '</li>'; });
            html += '</ul></div>';
        }

        html += '</div>';

        // Model Answer
        if (data.modelAnswer) {
            html +=
                '<div class="model-answer-section" style="background:linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1)); border:1px solid rgba(139,92,246,0.2); padding:20px; border-radius:16px;">' +
                '  <span style="font-size:12px; font-weight:700; color:var(--accent-violet); text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:10px;"><i class="fas fa-certificate"></i> Recommended Model Answer</span>' +
                '  <div class="model-answer-content" style="font-size:14px; color:var(--text-primary); line-height:1.6; font-style:italic">"' + data.modelAnswer + '"</div>' +
                '</div>';
        }

        html += '</div>';
        root.innerHTML = html;
        root.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

window.Interview = Interview;
