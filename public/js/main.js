/**
 * Bluetech Client Website - Main Interactive Scripts
 * Handles WhatsApp communications, Gemini AI Assistant, backend contact submissions, and UI interactions.
 */

// Configuration - easily adjust phone number and email
const BLUETECH_CONFIG = {
  // WhatsApp number in international format without '+' or special characters
  whatsAppNumber: '923001234567',
  supportEmail: 'hello@bluetech.com',
  companyName: 'Bluetech'
};

// Global chat history for Gemini context
let aiChatHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  initWhatsAppTriggers();
  initContactForm();
  initEnhancedWidget();
  initMobileNavigation();
  initSmoothScroll();
});

/**
 * Build WhatsApp URL with encoded message
 */
function getWhatsAppUrl(customMessage) {
  const defaultText = `Hello ${BLUETECH_CONFIG.companyName} Team, I would like to inquire about your digital services.`;
  const message = encodeURIComponent(customMessage || defaultText);
  return `https://wa.me/${BLUETECH_CONFIG.whatsAppNumber}?text=${message}`;
}

/**
 * Initialize all WhatsApp buttons and links throughout the site
 */
function initWhatsAppTriggers() {
  const waButtons = document.querySelectorAll('[data-wa-action="chat"]');
  waButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceType = btn.getAttribute('data-wa-service');
      let text = `Hello ${BLUETECH_CONFIG.companyName}! I would like to inquire about your services.`;

      if (serviceType === 'mern') {
        text = `Hello ${BLUETECH_CONFIG.companyName} team! I am interested in building a web application using the MERN Stack (React, Node.js, Express, MongoDB). Let's discuss!`;
      } else if (serviceType === 'web-design') {
        text = `Hello ${BLUETECH_CONFIG.companyName} team! I am looking for modern Web Designing & UI/UX services for my business.`;
      } else if (serviceType === 'quickbooks') {
        text = `Hello ${BLUETECH_CONFIG.companyName} team! I would like to consult with you regarding QuickBooks setup, bookkeeping workflows, and API integration.`;
      } else if (serviceType === 'custom-web') {
        text = `Hello ${BLUETECH_CONFIG.companyName} team! I would like to consult with you regarding a custom business website.`;
      } else if (serviceType === 'general') {
        text = `Hello ${BLUETECH_CONFIG.companyName} team! I'm reaching out from your website to discuss digital solutions for my business.`;
      }

      window.open(getWhatsAppUrl(text), '_blank');
    });
  });
}

/**
 * Handle Contact & Inquiry Form submission to Express Backend
 */
function initContactForm() {
  const form = document.getElementById('inquiryForm');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const service = document.getElementById('service').value;
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      showStatus('Please fill in your name, email, and project message.', 'error');
      return;
    }

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting Inquiry...';
    hideStatus();

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          service,
          message
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showStatus('Thank you! Your inquiry has been politely received. Our team will review your requirements and respond promptly.', 'success');
        form.reset();
      } else {
        showStatus(data.message || 'There was an issue processing your request. Please try contacting us directly via WhatsApp.', 'error');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      showStatus('Notice: Server is offline or unreachable. Please click below to send us your message directly via WhatsApp or Email.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = `form-status ${type}`;
    statusEl.style.display = 'block';
  }

  function hideStatus() {
    statusEl.style.display = 'none';
  }
}

/**
 * Enhanced Widget with Gemini AI Assistant and WhatsApp Tabs
 */
function initEnhancedWidget() {
  const triggerBtn = document.getElementById('waTriggerBtn');
  const chatPopup = document.getElementById('waChatPopup');
  const closeBtn = document.getElementById('waCloseBtn');
  const tabAiBtn = document.getElementById('tabAiBtn');
  const tabWaBtn = document.getElementById('tabWaBtn');
  const panelAi = document.getElementById('panelAi');
  const panelWa = document.getElementById('panelWa');

  // AI Elements
  const aiChatBody = document.getElementById('aiChatBody');
  const aiChatInput = document.getElementById('aiChatInput');
  const aiSendBtn = document.getElementById('aiSendBtn');
  const aiTyping = document.getElementById('aiTyping');
  const aiChips = document.querySelectorAll('.ai-chip');

  // WhatsApp Elements
  const waOptionButtons = document.querySelectorAll('.wa-option-btn');
  const waChatInput = document.getElementById('waChatInput');
  const waSendBtn = document.getElementById('waSendBtn');

  // Global trigger buttons (like "Ask AI" in nav)
  const openAiButtons = document.querySelectorAll('[data-action="open-ai"]');
  openAiButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openWidget('ai');
    });
  });

  if (!triggerBtn || !chatPopup) return;

  function openWidget(tab = 'ai') {
    chatPopup.classList.add('active');
    switchTab(tab);
    if (tab === 'ai') {
      aiChatInput.focus();
    } else {
      waChatInput.focus();
    }
  }

  function closeWidget() {
    chatPopup.classList.remove('active');
  }

  triggerBtn.addEventListener('click', () => {
    if (chatPopup.classList.contains('active')) {
      closeWidget();
    } else {
      openWidget('ai');
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeWidget);
  }

  // Tab switching
  function switchTab(tab) {
    if (tab === 'ai') {
      tabAiBtn.classList.add('active');
      tabWaBtn.classList.remove('active');
      panelAi.classList.add('active');
      panelWa.classList.remove('active');
      aiChatInput.focus();
    } else {
      tabWaBtn.classList.add('active');
      tabAiBtn.classList.remove('active');
      panelWa.classList.add('active');
      panelAi.classList.remove('active');
      waChatInput.focus();
    }
  }

  if (tabAiBtn && tabWaBtn) {
    tabAiBtn.addEventListener('click', () => switchTab('ai'));
    tabWaBtn.addEventListener('click', () => switchTab('wa'));
  }

  // --- AI Chat Logic ---
  async function sendAiMessage(messageText) {
    const text = (messageText || aiChatInput.value).trim();
    if (!text) return;

    // Append user message bubble
    appendBubble(text, 'user');
    aiChatInput.value = '';

    // Scroll to bottom
    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    // Show typing indicator
    aiTyping.classList.add('active');
    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: aiChatHistory
        })
      });

      const data = await response.json();
      aiTyping.classList.remove('active');

      if (data && data.reply) {
        appendBubble(data.reply, 'bot', true);
        aiChatHistory.push({ role: 'user', text: text });
        aiChatHistory.push({ role: 'model', text: data.reply });
      } else {
        appendBubble("Thank you for your message! Our team is available on WhatsApp (+92 300 1234567) to assist you right away.", 'bot', true);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      aiTyping.classList.remove('active');
      appendBubble("I apologize for the inconvenience. Our AI service is currently reconnecting. You can connect with our developers directly on WhatsApp at +92 300 1234567.", 'bot', true);
    }

    aiChatBody.scrollTop = aiChatBody.scrollHeight;
  }

  function appendBubble(content, sender, showActions = false) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    if (sender === 'bot') {
      const formatted = content
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      let actionsHtml = '';
      if (showActions) {
        actionsHtml = `
          <div class="chat-bubble-action">
            <a href="#contact" class="btn-inline-wa" data-wa-action="chat" data-wa-service="general">
              <i class="fab fa-whatsapp"></i> Chat on WhatsApp
            </a>
          </div>
        `;
      }

      bubble.innerHTML = `
        <div class="chat-bubble-sender"><i class="fas fa-robot"></i> Bluetech AI</div>
        <div>${formatted}</div>
        ${actionsHtml}
      `;

      // Bind newly created whatsapp trigger
      const inlineWa = bubble.querySelector('[data-wa-action="chat"]');
      if (inlineWa) {
        inlineWa.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(getWhatsAppUrl("Hello Bluetech team, I was consulting with your AI Assistant and would like to continue our conversation with your team!"), '_blank');
        });
      }
    } else {
      bubble.textContent = content;
    }

    // Insert before typing indicator
    aiChatBody.insertBefore(bubble, aiTyping);
  }

  if (aiSendBtn) {
    aiSendBtn.addEventListener('click', () => sendAiMessage());
  }

  if (aiChatInput) {
    aiChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendAiMessage();
      }
    });
  }

  // Suggestion chips
  aiChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt') || chip.textContent.trim();
      sendAiMessage(prompt);
    });
  });

  // --- WhatsApp Panel Logic ---
  waOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-msg');
      window.open(getWhatsAppUrl(text), '_blank');
      closeWidget();
    });
  });

  function sendCustomWhatsApp() {
    const text = waChatInput.value.trim();
    if (text) {
      window.open(getWhatsAppUrl(text), '_blank');
      waChatInput.value = '';
      closeWidget();
    }
  }

  if (waSendBtn) {
    waSendBtn.addEventListener('click', sendCustomWhatsApp);
  }

  if (waChatInput) {
    waChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendCustomWhatsApp();
      }
    });
  }
}

/**
 * Mobile Navigation Toggle
 */
function initMobileNavigation() {
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');

  if (!mobileToggle || !navLinks) return;

  mobileToggle.addEventListener('click', () => {
    const isExpanded = navLinks.classList.toggle('active-mobile');
    mobileToggle.innerHTML = isExpanded 
      ? '<i class="fas fa-times"></i>' 
      : '<i class="fas fa-bars"></i>';
  });

  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active-mobile');
      mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });
}

/**
 * Smooth scrolling and active navigation link highlight
 */
function initSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}
