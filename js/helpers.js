// NOVA - Helpers Module
// Pure utility functions with no external dependencies.
// Used by app.js, visuals.js, interview-app.js, and other modules.

var Helpers = {

    // Safely escapes HTML special characters to prevent XSS
    // Used whenever user-provided or AI-generated text is inserted into innerHTML
    escapeHtml: function (str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str; // Browser handles escaping
        return div.innerHTML;
    },

    // Splits a block of text into individual sentences
    // Used for processing AI responses
    splitSentences: function (text) {
        if (!text) return [];
        return text.replace(/\s+/g, ' ').trim()
            .split(/(?<=[\.!\?])\s+/) // Split after sentence-ending punctuation
            .filter(Boolean);
    },

    // Renders AI response text as HTML
    // Uses the Marked library if available, falls back to basic bold formatting
    formatAiResponse: function (text) {
        if (!text) return '';
        if (typeof marked !== 'undefined') {
            try {
                return marked.parse(text); // Full markdown → HTML conversion
            } catch (e) {
                console.error('Marked parse error', e);
            }
        }
        // Fallback: escape HTML then convert **bold** to <strong>
        return Helpers.escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    },

    capitalize: function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Returns a color hex string based on ATS score (0-100)
    // Green ≥80, Yellow ≥60, Red <60
    getScoreColor: function (score) {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    },

    // Returns a CSS gradient string based on ATS score
    getScoreGradient: function (score) {
        if (score >= 80) return 'linear-gradient(135deg, #10B981, #06B6D4)';
        if (score >= 60) return 'linear-gradient(135deg, #F59E0B, #EC4899)';
        return 'linear-gradient(135deg, #EF4444, #F59E0B)';
    },

    // Returns a human-readable verdict string for an ATS score
    getVerdict: function (score) {
        if (score >= 90) return 'Exceptional Resume';
        if (score >= 80) return 'Strong Resume';
        if (score >= 70) return 'Good, Needs Polish';
        if (score >= 60) return 'Needs Improvement';
        if (score >= 50) return 'Significant Improvements Needed';
        return 'Major Revisions Recommended';
    },

    // Robustly parses JSON from AI responses
    // AI often wraps JSON in markdown code blocks or adds extra text
    // Tries 3 strategies in order:
    //   1. Direct JSON.parse
    //   2. Extract first {...} block from text
    //   3. Strip markdown code fences then extract {...} block
    parseJSON: function (text) {
        if (!text) return null;
        // Strategy 1: Direct parse (works if AI returned clean JSON)
        try { return JSON.parse(text); } catch (e) { }
        // Strategy 2: Extract JSON object from surrounding text
        try {
            var match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch (e) { }
        // Strategy 3: Remove ```json ... ``` fences then extract
        try {
            var cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
            var match2 = cleaned.match(/\{[\s\S]*\}/);
            if (match2) return JSON.parse(match2[0]);
        } catch (e) { }
        return null; // All strategies failed
    },

    // Extracts contact info and name from raw resume text using regex
    // Returns an object with: email, phone, linkedin, name
    // These are "immutable" fields that should not be changed by AI resume generation
    extractImmutableData: function (text) {
        var data = {};
        if (!text) return data;
        var emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        var phoneMatch = text.match(/(\+?\d[\d\s\-()]{8,}\d)/);
        var linkedinMatch = text.match(/(https?:\/\/(www\.)?linkedin\.com\/[^\s]+)/i);
        data.email = emailMatch ? emailMatch[0] : undefined;
        data.phone = phoneMatch ? phoneMatch[0] : undefined;
        data.linkedin = linkedinMatch ? linkedinMatch[0] : undefined;
        // Naive name guess: first non-empty line under 60 chars without '@' or 'http'
        var firstLine = (text.split(/\n/).find(function (l) {
            return l && l.trim().length > 0 && !/@|http/i.test(l);
        }) || '').trim();
        if (firstLine && firstLine.length <= 60) data.name = firstLine;
        return data;
    },

    // Infers the industry from resume text using keyword matching
    // Returns one of: 'finance', 'design', 'technology', 'healthcare', 'marketing', 'general'
    inferIndustry: function (text) {
        var t = (text || '').toLowerCase();
        if (/financ|bank|account|audit/.test(t)) return 'finance';
        if (/design|ux|ui|illustrat|creative/.test(t)) return 'design';
        if (/engineer|developer|software|it|tech|data|machine learning|ai/.test(t)) return 'technology';
        if (/health|clinic|hospital|nurs|medic/.test(t)) return 'healthcare';
        if (/marketing|brand|seo|content/.test(t)) return 'marketing';
        return 'general';
    },

    // Infers seniority level from resume text
    // Returns one of: 'executive', 'lead', 'senior', 'junior', 'mid'
    inferSeniority: function (text) {
        var t = (text || '').toLowerCase();
        if (/director|vp|chief|head/.test(t)) return 'executive';
        if (/lead|manager/.test(t)) return 'lead';
        if (/senior|sr\./.test(t)) return 'senior';
        if (/junior|jr\./.test(t)) return 'junior';
        return 'mid';
    }
};