// NOVA - PDF Parser Module
// Depends on: pdfjsLib (loaded from CDN in <head>)
// Provides: PDF text extraction, file validation, file size formatting

// NOVA - PDF Parser Module

const Parser = {
    async parsePDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const strings = content.items.map(item => item.str);
                        fullText += strings.join(' ') + '\n';
                    }

                    const cleaned = fullText.trim();
                    if (!cleaned || cleaned.length < 30) {
                        reject(new Error('Could not extract readable text from this PDF. Make sure it contains actual text and not just images.'));
                        return;
                    }

                    resolve(cleaned);
                } catch (error) {
                    reject(new Error('PDF parsing failed: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read the file'));
            reader.readAsArrayBuffer(file);
        });
    },

    validateFile(file) {
        if (!file) return { valid: false, error: 'No file provided' };

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return { valid: false, error: 'Only PDF files are supported' };
        }

        if (file.size > 10 * 1024 * 1024) {
            return { valid: false, error: 'File too large. Maximum size is 10MB.' };
        }

        if (file.size < 100) {
            return { valid: false, error: 'File appears to be empty.' };
        }

        return { valid: true };
    },

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};
