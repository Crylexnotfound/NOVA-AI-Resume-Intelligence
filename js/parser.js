// NOVA - PDF Parser Module
// Depends on: pdfjsLib (loaded from CDN in <head>)
// Provides: PDF text extraction, file validation, file size formatting

const Parser = {

    // Extracts all text from a PDF file using PDF.js
    // Returns a Promise that resolves with the full text string
    // Rejects with a descriptive error if parsing fails or text is too short
    async parsePDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    // Convert the file to a Uint8Array — required by PDF.js
                    const typedArray = new Uint8Array(e.target.result);

                    // Load the PDF document — returns a PDFDocumentProxy
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;

                    let fullText = '';

                    // Iterate through every page and extract text items
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        // Each item has a .str property with the text fragment
                        const strings = content.items.map(item => item.str);
                        fullText += strings.join(' ') + '\n'; // Join fragments with spaces
                    }

                    const cleaned = fullText.trim();

                    // Reject if the extracted text is too short — likely a scanned/image PDF
                    if (!cleaned || cleaned.length < 30) {
                        reject(new Error(
                            'Could not extract readable text from this PDF. ' +
                            'Make sure it contains actual text and not just images.'
                        ));
                        return;
                    }

                    resolve(cleaned);
                } catch (error) {
                    reject(new Error('PDF parsing failed: ' + error.message));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read the file'));

            // Read the file as an ArrayBuffer — required for Uint8Array conversion
            reader.readAsArrayBuffer(file);
        });
    },

    // Validates a file before attempting to parse it
    // Returns { valid: true } or { valid: false, error: 'message' }
    validateFile(file) {
        if (!file) return { valid: false, error: 'No file provided' };

        // Only PDF files are supported (PDF.js limitation)
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return { valid: false, error: 'Only PDF files are supported' };
        }

        // 10MB maximum — larger files may time out or exceed memory limits
        if (file.size > 10 * 1024 * 1024) {
            return { valid: false, error: 'File too large. Maximum size is 10MB.' };
        }

        // Reject suspiciously small files — likely empty or corrupt
        if (file.size < 100) {
            return { valid: false, error: 'File appears to be empty.' };
        }

        return { valid: true };
    },

    // Formats a byte count into a human-readable string
    // e.g. 2457600 → "2.3 MB"
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};