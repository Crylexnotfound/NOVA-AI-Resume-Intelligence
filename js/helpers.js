// NOVA - Helpers Module

var Helpers = {
    escapeHtml: function (str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    splitSentences: function (text) {
        if (!text) return [];
        return text.replace(/\s+/g, ' ').trim().split(/(?<=[\.!\?])\s+/).filter(Boolean);
    },

    formatAiResponse: function (text) {
        if (!text) return '';
        if (typeof marked !== 'undefined') {
            try {
                return marked.parse(text);
            } catch (e) {
                console.error('Marked parse error', e);
            }
        }
        // Fallback if marked not loaded
        return Helpers.escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    },

    capitalize: function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    getScoreColor: function (score) {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    },

    getScoreGradient: function (score) {
        if (score >= 80) return 'linear-gradient(135deg, #10B981, #06B6D4)';
        if (score >= 60) return 'linear-gradient(135deg, #F59E0B, #EC4899)';
        return 'linear-gradient(135deg, #EF4444, #F59E0B)';
    },

    getVerdict: function (score) {
        if (score >= 90) return 'Exceptional Resume';
        if (score >= 80) return 'Strong Resume';
        if (score >= 70) return 'Good, Needs Polish';
        if (score >= 60) return 'Needs Improvement';
        if (score >= 50) return 'Significant Improvements Needed';
        return 'Major Revisions Recommended';
    },

    parseJSON: function (text) {
        if (!text) return null;
        // Direct parse
        try { return JSON.parse(text); } catch (e) { }
        // Extract JSON object from text
        try {
            var match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch (e) { }
        // Remove markdown code blocks then try
        try {
            var cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
            var match2 = cleaned.match(/\{[\s\S]*\}/);
            if (match2) return JSON.parse(match2[0]);
        } catch (e) { }
        return null;
    },

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
        var firstLine = (text.split(/\n/).find(function (l) { return l && l.trim().length > 0 && !/@|http/i.test(l); }) || '').trim();
        if (firstLine && firstLine.length <= 60) data.name = firstLine;
        return data;
    },

    inferIndustry: function (text) {
        var t = (text || '').toLowerCase();
        if (/financ|bank|account|audit/.test(t)) return 'finance';
        if (/design|ux|ui|illustrat|creative/.test(t)) return 'design';
        if (/engineer|developer|software|it|tech|data|machine learning|ai/.test(t)) return 'technology';
        if (/health|clinic|hospital|nurs|medic/.test(t)) return 'healthcare';
        if (/marketing|brand|seo|content/.test(t)) return 'marketing';
        return 'general';
    },

    inferSeniority: function (text) {
        var t = (text || '').toLowerCase();
        if (/director|vp|chief|head/.test(t)) return 'executive';
        if (/lead|manager/.test(t)) return 'lead';
        if (/senior|sr\./.test(t)) return 'senior';
        if (/junior|jr\./.test(t)) return 'junior';
        return 'mid';
    }
};
