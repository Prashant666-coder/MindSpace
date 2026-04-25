/**
 * MindSpace 3D – AI Wellness Chatbot
 * Provides supportive mental health suggestions and responses.
 * Uses keyword matching and sentiment analysis for relevant advice.
 */

(function () {
  'use strict';

  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  const chatMicBtn = document.getElementById('chat-mic-btn');
  const voiceToggle = document.getElementById('chat-voice-toggle');
  let isVoiceEnabled = localStorage.getItem('mindspace_chat_voice') !== 'false';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  let isListening = false;

  if (recognition) {
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    console.log('🎙️ Speech Recognition initialized');

    recognition.onstart = () => {
      console.log('🎙️ Listening...');
    };

    recognition.onresult = (event) => {
      console.log('🎙️ Result received:', event.results);
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) {
        console.log('🎙️ Transcript:', transcript);
        chatInput.value = transcript;
        sendMessage();
      }
    };

    recognition.onend = () => {
      console.log('🎙️ Listening stopped');
      isListening = false;
      if (chatMicBtn) chatMicBtn.classList.remove('active');
    };

    recognition.onerror = (event) => {
      console.error('🎙️ Speech Recognition Error:', event.error);
      isListening = false;
      if (chatMicBtn) chatMicBtn.classList.remove('active');

      // Provide user feedback
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please enable it in browser settings.');
      }
    };
  } else if (chatMicBtn) {
    chatMicBtn.disabled = true;
    chatMicBtn.title = 'Voice input not supported in this browser';
  }

  // ─── Backend API client ────────────────────────────────
  async function fetchReply(message) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!res.ok) {
        throw new Error('Unable to reach chat service');
      }

      const data = await res.json();
      return data.reply || 'Thank you for sharing. Tell me more about how you are feeling.';
    } catch (err) {
      console.error('Chat API error:', err.message);
      return 'I am here to listen. Tell me what is on your mind and I will suggest a calm next step.';
    }
  }

  // ─── Add Message to Chat ───────────────────────────────
  function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;

    const avatarContent = isUser ? 'You' : `<img src="logo.jpeg" alt="MS" class="logo-emoji-img">`;
    const avatarClass = isUser ? 'chat-avatar' : 'chat-avatar bot-img';

    // Convert markdown-like formatting to HTML
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    msgDiv.innerHTML = `
      <span class="${avatarClass}">${avatarContent}</span>
      <div class="chat-bubble"><p>${formattedText}</p></div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    const sanitized = text.replace(/\*\*(.*?)\*\*/g, '$1');
    const utterance = new SpeechSynthesisUtterance(sanitized);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function addTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'chat-message bot typing';
    typing.innerHTML = `
      <span class="chat-avatar bot-img"><img src="logo.jpeg" alt="MS" class="logo-emoji-img"></span>
      <div class="chat-bubble typing-bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
        <p class="typing-label">AI is typing...</p>
      </div>
    `;
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typing;
  }

  function startListening() {
    if (!recognition || isListening) return;
    isListening = true;
    chatMicBtn.classList.add('active');
    try {
      recognition.start();
    } catch (err) {
      console.error('🎙️ Error starting recognition:', err);
      isListening = false;
      chatMicBtn.classList.remove('active');
    }
  }

  function stopListening() {
    if (!recognition || !isListening) return;
    recognition.stop();
  }

  // ─── Send Message Handler ──────────────────────────────
  async function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    // Add user message
    addMessage(msg, true);
    chatInput.value = '';
    chatSendBtn.disabled = true;

    const typing = addTypingIndicator();
    const response = await fetchReply(msg);
    typing.remove();

    addMessage(response, false);
    if (isVoiceEnabled) speakText(response);
    chatSendBtn.disabled = false;
  }

  // Voice Toggle Handler
  function updateVoiceUI() {
    if (!voiceToggle) return;
    const span = voiceToggle.querySelector('span');
    const icon = voiceToggle.querySelector('i');
    
    if (isVoiceEnabled) {
      voiceToggle.classList.remove('muted');
      span.textContent = 'Voice Enabled';
      icon.setAttribute('data-lucide', 'volume-2');
    } else {
      voiceToggle.classList.add('muted');
      span.textContent = 'Voice Muted';
      icon.setAttribute('data-lucide', 'volume-x');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  if (voiceToggle) {
    voiceToggle.addEventListener('click', () => {
      isVoiceEnabled = !isVoiceEnabled;
      localStorage.setItem('mindspace_chat_voice', isVoiceEnabled);
      updateVoiceUI();
      if (!isVoiceEnabled) window.speechSynthesis.cancel();
    });
    updateVoiceUI();
  }

  // Event listeners
  chatSendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  if (chatMicBtn && recognition) {
    chatMicBtn.addEventListener('click', () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    });
  }

  // Suggestion chips
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.dataset.msg;
      sendMessage();
    });
  });

  console.log('🤖 AI Chatbot initialized');
})();
