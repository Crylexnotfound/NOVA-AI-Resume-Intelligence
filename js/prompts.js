// NOVA - AI Prompts Module
// All prompt builders for the different AI features
/**
 * ALGORITHM SELECTION: SEMANTIC AI (VERSION 3)
 * 
 * We have selected the Semantic AI approach (using PuterService.aiChat and GPT-4o) 
 * as our primary engine because it provides deep contextual understanding that 
 * traditional algorithms lack:
 * 
 * - Over Keyword Matchers: Understands synonyms, intent, and soft skills without exact string matches.
 * - Over Weighted Scorers: Dynamically evaluates the impact of achievements rather than 
 *   using rigid, static percentage weights for different resume sections.
 */

const Prompts = {

    fullAnalysis(resumeText, jobDescription) {
        var jdPart = '';
        if (jobDescription) {
            jdPart = '\nTarget Job Description:\n' + jobDescription + '\n';
        }

        return 'You are an expert ATS analyzer, career strategist, and hiring consultant. Provide a comprehensive analysis.\n\n' +
            'Resume:\n' + resumeText + '\n' + jdPart + '\n' +
            'Respond ONLY with valid JSON (no markdown, no code blocks, no extra text). The JSON must follow this exact structure:\n' +
            '{\n' +
            '    "atsScore": <number 0-100>,\n' +
            '    "verdict": "<one line verdict>",\n' +
            '    "suggestedTitle": "<relevant job title>",\n' +
            '    "location": "<user location or Remote>",\n' +
            '    "categories": {\n' +
            '        "content": { "score": <0-100>, "icon": "fa-file-lines", "feedback": ["<positive>"], "issues": ["<issue>"], "suggestions": ["<suggestion>"] },\n' +
            '        "keywords": { "score": <0-100>, "icon": "fa-key", "found": ["<kw>"], "missing": ["<kw>"], "suggestions": ["<suggestion>"] },\n' +
            '        "formatting": { "score": <0-100>, "icon": "fa-palette", "feedback": ["<positive>"], "issues": ["<issue>"], "suggestions": ["<suggestion>"] },\n' +
            '        "experience": { "score": <0-100>, "icon": "fa-briefcase", "feedback": ["<positive>"], "issues": ["<issue>"], "suggestions": ["<suggestion>"] },\n' +
            '        "impact": { "score": <0-100>, "icon": "fa-chart-line", "feedback": ["<positive>"], "issues": ["<issue>"], "suggestions": ["<suggestion>"] }\n' +
            '    },\n' +
            '    "strengths": ["<strength1>", "<strength2>", "<strength3>"],\n' +
            '    "weaknesses": ["<weakness1>", "<weakness2>"],\n' +
            '    "topActions": ["<action1>", "<action2>", "<action3>"]\n' +
            '}';
    },

    review(resumeText) {
        return 'You are a supportive resume reviewer. Provide a candid, constructive review that highlights strengths and suggests clear improvements in an encouraging tone.\n\n' +
            'Resume:\n' + resumeText + '\n\n' +
            'Guidelines:\n' +
            '- Be professional, specific, and growth‑oriented\n' +
            '- Replace harsh language with neutral, actionable phrasing\n' +
            '- Call out clichés and vague statements and suggest stronger alternatives\n' +
            '- End with exactly 3 prioritized, specific improvement actions\n' +
            '- Write in a concise, friendly style\n' +
            '- No JSON, just plain text';
    },

    jobMatch(resumeText, jobDescription) {
        var jdPart = '';
        if (jobDescription) {
            jdPart = '\nThe user is interested in this type of role:\n' + jobDescription + '\n';
        }

        return 'You are a job matching AI. Based on this resume, suggest the best job matches.\n\n' +
            'Resume:\n' + resumeText + '\n' + jdPart + '\n' +
            'Respond ONLY with valid JSON (no markdown, no code blocks, no extra text):\n' +
            '{\n' +
            '    "jobs": [\n' +
            '        {\n' +
            '            "title": "<job title>",\n' +
            '            "company": "<type of company>",\n' +
            '            "matchScore": <number 60-98>,\n' +
            '            "matchReason": "<why good match>",\n' +
            '            "missingSkills": ["<skill1>"],\n' +
            '            "tags": ["<tag1>", "<tag2>"],\n' +
            '            "salaryRange": "<e.g. $80K-$120K>"\n' +
            '        }\n' +
            '    ],\n' +
            '    "profileSummary": "<one line summary>"\n' +
            '}\n' +
            'Generate exactly 5 realistic, well-matched job suggestions.';
    },

    interview(resumeText, jobDescription) {
        var jdPart = 'General specialized roles';
        if (jobDescription) {
            jdPart = 'Target Job Description:\n' + jobDescription;
        }

        return 'You are a Senior Technical Recruiter and Career Coach. Generate a list of HIGHLY TARGETED interview questions.\n\n' +
            'Candidate Resume:\n' + resumeText + '\n\n' +
            jdPart + '\n\n' +
            'INSTRUCTIONS:\n' +
            '- Blend the candidate\'s actual experience with the requirements of the job description.\n' +
            '- Prioritize keywords from the job description to test alignment.\n' +
            '- If no job description is provided, analyze the resume for likely target roles and generate questions for those.\n' +
            '- Questions must be specific, not generic. Use "Based on your experience with X, how would you handle Y in this role?".\n' +
            '- Respond ONLY with valid JSON (no markdown, no code blocks, no extra text).\n\n' +
            'REQUIRED JSON STRUCTURE:\n' +
            '{\n' +
            '    "questions": [\n' +
            '        {\n' +
            '            "question": "<specific interview question>",\n' +
            '            "type": "<Behavioral|Technical|Situational|Culture Fit>",\n' +
            '            "difficulty": "<Easy|Medium|Hard>",\n' +
            '            "tip": "<coaching tip on what the interviewer is looking for>"\n' +
            '        }\n' +
            '    ]\n' +
            '}\n' +
            'Generate exactly 8 questions - a mix of types and difficulties.';
    },

    careerPrediction(resumeText) {
        return 'You are a career futurist. Analyze this resume and predict the career trajectory.\n\n' +
            'Resume:\n' + resumeText + '\n\n' +
            'Respond ONLY with valid JSON (no markdown, no code blocks, no extra text):\n' +
            '{\n' +
            '    "currentLevel": "<e.g. Junior, Mid, Senior, Lead>",\n' +
            '    "careerPaths": [\n' +
            '        { "title": "<role>", "description": "<brief description including timeline, salary range, and required skills>" }\n' +
            '    ],\n' +
            '    "salaryProjections": {\n' +
            '        "summary": "<overall salary outlook>",\n' +
            '        "range": "<e.g. $80k - $120k>"\n' +
            '    },\n' +
            '    "growthOpportunities": ["<opportunity1>", "<opportunity2>"],\n' +
            '    "strategy": "<strategic career advice>"\n' +
            '}';
    },

    coverLetter(resumeText, targetPosition) {
        return 'Write a compelling professional cover letter based on this resume for the position: "' + targetPosition + '".\n\n' +
            'Resume:\n' + resumeText + '\n\n' +
            'Write a cover letter that:\n' +
            '- Is professional yet shows personality\n' +
            '- Highlights relevant experience\n' +
            '- Shows enthusiasm for the role\n' +
            '- Is concise (under 350 words)\n' +
            '- Uses active voice\n' +
            '- Has a compelling opening and strong closing\n\n' +
            'Write ONLY the cover letter text. No JSON, no markdown.';
    },

    chatResponse(message, resumeText, analysisContext) {
        var contextPart = 'No resume uploaded yet.';
        if (resumeText) {
            contextPart = 'Resume (truncated):\n' + resumeText.substring(0, 2000);
        }
        var scorePart = '';
        if (analysisContext && analysisContext.atsScore) {
            scorePart = '\nAnalysis: ATS Score ' + analysisContext.atsScore + '/100';
        }

        return 'You are NOVA AI Coach - an expert career strategist and resume specialist. Be direct, actionable, and specific.\n\n' +
            contextPart + scorePart + '\n\n' +
            'User: ' + message + '\n\n' +
            'Give specific, actionable advice. Be concise but thorough.';
    },

    interviewFeedback(question, answer, resumeText, jobDescription) {
        var context = '';
        if (resumeText) context += 'Candidate Resume Context:\n' + resumeText + '\n\n';
        if (jobDescription) context += 'Target Job Description:\n' + jobDescription + '\n\n';

        return 'You are an expert Interview Coach and Technical Recruiter. Provide HIGHLY DETAILED, analytical feedback on the candidate\'s answer.\n\n' +
            context +
            'Question: ' + question + '\n' +
            'Candidate\'s Answer: ' + answer + '\n\n' +
            'INSTRUCTIONS:\n' +
            '- Be brutally honest but constructive.\n' +
            '- Evaluate based on three pillars: Technical Accuracy, Communication Clarity, and Structure (e.g. STAR method).\n' +
            '- Provide a model answer that would score a 100/100.\n' +
            '- Respond ONLY with valid JSON (no markdown, no code blocks, no extra text).\n\n' +
            'REQUIRED JSON STRUCTURE:\n' +
            '{\n' +
            '    "score": <number 0-100>,\n' +
            '    "verdict": "<one line summary>",\n' +
            '    "pillars": {\n' +
            '        "content": { "score": <0-100>, "feedback": "<what was good/bad about accuracy>" },\n' +
            '        "communication": { "score": <0-100>, "feedback": "<what was good/bad about clarity/filler words>" },\n' +
            '        "structure": { "score": <0-100>, "feedback": "<what was good/bad about logic/STAR method>" }\n' +
            '    },\n' +
            '    "strengths": ["<strength1>", "<strength2>"],\n' +
            '    "improvements": ["<improvement1>", "<improvement2>"],\n' +
            '    "modelAnswer": "<the ideal response to this question>"\n' +
            '}';
    },

    generateResume(resumeText, analysisData, templateStyle, jobDescription) {
        var analysisInfo = '';
        if (analysisData) {
            analysisInfo = '\n\nPrevious analysis found these issues:\n';
            if (analysisData.weaknesses) {
                analysisInfo += '- Weaknesses: ' + analysisData.weaknesses.join(', ') + '\n';
            }
            if (analysisData.topActions) {
                analysisInfo += '- Top actions: ' + analysisData.topActions.join(', ') + '\n';
            }
        }

        var jdPart = '';
        if (jobDescription) {
            jdPart = '\nTarget Job Description:\n' + jobDescription + '\n';
        }

        return 'You are a professional resume writer. Based on the original resume below, create an IMPROVED, ATS-optimized version aligned to the target job while keeping immutable facts unchanged.\n\n' +
            'Original Resume:\n' + resumeText + '\n' + analysisInfo + '\n\n' +
            jdPart +
            'Template style: ' + (templateStyle || 'Professional Clean') + '\n\n' +
            'Instructions:\n' +
            '- Keep immutable facts unchanged: name, contact info, education titles and institutions, certifications, and employment dates\n' +
            '- Rephrase other content (summary, skills, bullets) to align with the target job and ATS keywords\n' +
            '- Add strong action verbs and quantifiable achievements\n' +
            '- Optimize for ATS systems with clear sectioning and concise bullets\n' +
            '- Use the chosen template style\n' +
            '- Structure: Contact Info, Professional Summary, Experience, Education, Skills, Certifications\n\n' +
            'Respond ONLY with valid JSON (no markdown, no code blocks, no extra text):\n' +
            '{\n' +
            '    "name": "<full name>",\n' +
            '    "title": "<professional title>",\n' +
            '    "email": "<email>",\n' +
            '    "phone": "<phone>",\n' +
            '    "location": "<city, state>",\n' +
            '    "linkedin": "<linkedin if found>",\n' +
            '    "summary": "<2-3 sentence professional summary>",\n' +
            '    "experience": [\n' +
            '        {\n' +
            '            "title": "<job title>",\n' +
            '            "company": "<company>",\n' +
            '            "duration": "<date range>",\n' +
            '            "bullets": ["<achievement with numbers>", "<achievement>"]\n' +
            '        }\n' +
            '    ],\n' +
            '    "education": [\n' +
            '        {\n' +
            '            "degree": "<degree>",\n' +
            '            "school": "<school>",\n' +
            '            "year": "<year>",\n' +
            '            "details": "<honors, GPA, etc if applicable>"\n' +
            '        }\n' +
            '    ],\n' +
            '    "skills": ["<skill1>", "<skill2>", "<skill3>"],\n' +
            '    "certifications": ["<cert if any>"]\n' +
            '}';
    }
};
