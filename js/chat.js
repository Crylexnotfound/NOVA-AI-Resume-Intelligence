// NOVA - AI Chat Module
// Handles the AI coach chat interface:
//   - Chat message sending and state management
//   - AI response generation via PuterService
//   - Chat history rendering
//
// Depends on: PuterService, Prompts, Visuals, Upload (for state)
// Exposes: window.Chat

var Chat = {

    // ---- INITIALISATION ----
    init: function () {
        // Chat specific initialization
        console.log('[NOVA] Chat module initialized');
    },

    // ---- CHAT ACTIONS ----

    // Sends the user message to the AI and renders the response
    sendChat: async function () {
        var input = document.getElementById('chat-input');
        var messages = document.getElementById('chat-messages');
        
        if (!input || !messages) return;
        
        var text = input.value.trim();
        if (!text) return;

        // Render user message
        this.addMessage(text, 'user');
        input.value = '';
        input.disabled = true;

        // Auto-scroll to bottom
        this.scrollToBottom();

        // Render loading state for AI response
        var loadingMsg = this.addMessage('Thinking...', 'ai', true);

        try {
            // Include resume and analysis context in the prompt
            var resumeText = Upload.resumeText || '';
            var analysisContext = Upload.analysisResult || {};
            
            var prompt = Prompts.chatResponse(text, resumeText, analysisContext);
            var response = await PuterService.aiChat(prompt);

            // Replace loading message with real response
            this.removeMessage(loadingMsg);
            this.addMessage(response, 'ai');
            
            this.scrollToBottom();
        } catch (error) {
            console.error('Chat failed:', error);
            this.removeMessage(loadingMsg);
            this.addMessage('I apologize, but I encountered an error. Please try again.', 'ai');
            Visuals.toast('Chat error: ' + error.message, 'error');
        } finally {
            input.disabled = false;
            input.focus();
        }
    },

    // ---- UTILITIES ----

    // Adds a message bubble to the chat container
    addMessage: function (text, sender, isLoading) {
        var container = document.getElementById('chat-messages');
        if (!container) return null;

        var msg = document.createElement('div');
        msg.className = 'chat-msg ' + sender;
        if (isLoading) msg.classList.add('loading');
        
        // Support simple markdown-like breaks
        var formatted = text.replace(/\n/g, '<br>');
        
        msg.innerHTML = '<div class="msg-bubble">' + formatted + '</div>';
        container.appendChild(msg);
        return msg;
    },

    // Removes a specific message element (used for loading states)
    removeMessage: function (el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    },

    // Scrolls the chat container to the bottom
    scrollToBottom: function () {
        var container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
};

window.Chat = Chat;
