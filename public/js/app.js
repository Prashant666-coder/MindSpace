/**
 * MindSpace 3D – Main Application Logic
 * Handles authentication, navigation, mood tracking, journal,
 * dashboard analytics, shop, and activities.
 */

(function () {
  'use strict';

  // ═══════════ STATE MANAGEMENT ═══════════
  const state = {
    token: localStorage.getItem('mindspace_token') || null,
    user: JSON.parse(localStorage.getItem('mindspace_user') || 'null'),
    currentSection: 'dashboard',
    selectedMood: null,
    selectedJournalMood: '',
    moodHistory: JSON.parse(localStorage.getItem('mindspace_moods') || '[]'),
    journalEntries: JSON.parse(localStorage.getItem('mindspace_journals') || '[]'),
    products: [],
    sessions: parseInt(localStorage.getItem('mindspace_sessions') || '0'),
    streak: parseInt(localStorage.getItem('mindspace_streak') || '0'),
    theme: localStorage.getItem('mindspace_theme') || 'light',
    map: null
  };

  // ═══════════ API HELPERS ═══════════
  const API_BASE = '/api';

  async function apiRequest(endpoint, options = {}) {
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options
    };

    if (state.token) {
      config.headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // ═══════════ TOAST NOTIFICATIONS ═══════════
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => toast.remove(), 3000);
  }

  // ═══════════ AUTHENTICATION ═══════════
  const authOverlay = document.getElementById('auth-overlay');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authError = document.getElementById('auth-error');
  const appEl = document.getElementById('app');

  // Toggle between login and register forms
  document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    authError.textContent = '';
  });

  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    authError.textContent = '';
  });

  // ─── Theme Management ───
  function initTheme() {
    if (state.theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      state.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      localStorage.setItem('mindspace_theme', state.theme);
      showToast(`${state.theme.charAt(0).toUpperCase() + state.theme.slice(1)} mode activated`, 'info');
      
      // Update map theme if it exists
      if (state.map) {
        updateMapTheme();
      }
    });
  }

  // Initialize theme on load
  initTheme();

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      handleAuthSuccess(data);
    } catch (err) {
      authError.textContent = err.message;
    }
  });

  // Register handler
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      handleAuthSuccess(data);
    } catch (err) {
      authError.textContent = err.message;
    }
  });

  // Guest mode
  document.getElementById('guest-btn').addEventListener('click', () => {
    state.user = { name: 'Guest', email: 'guest@mindspace.app' };
    state.token = null;
    localStorage.setItem('mindspace_user', JSON.stringify(state.user));
    enterApp();
  });

  function handleAuthSuccess(data) {
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('mindspace_token', data.token);
    localStorage.setItem('mindspace_user', JSON.stringify(data.user));
    showToast(data.message, 'success');
    enterApp();
  }

  function enterApp() {
    authOverlay.classList.remove('active');
    appEl.classList.remove('hidden');
    document.getElementById('user-name').textContent = state.user.name;
    updateGreeting();
    loadDashboardData();
    loadProducts();
  }

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    state.token = null;
    state.user = null;
    localStorage.removeItem('mindspace_token');
    localStorage.removeItem('mindspace_user');
    authOverlay.classList.add('active');
    appEl.classList.add('hidden');
    showToast('Logged out successfully', 'info');
  });

  // ═══════════ NAVIGATION ═══════════
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      switchSection(section);
      
      // Auto-close sidebar on mobile after navigation
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
      }
    });
  });

  function switchSection(sectionName) {
    // Update nav
    navItems.forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

    // Update sections
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionName}`)?.classList.add('active');

    state.currentSection = sectionName;

    // Initialize map when activities section is opened
    if (sectionName === 'activities' && !state.map) {
      initMap();
    }
  }

  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !mobileMenuToggle.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });

  // ═══════════ GREETING ═══════════
  function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    const name = state.user?.name || 'friend';
    document.getElementById('greeting-text').textContent =
      `${greeting}, ${name}! How are you feeling today?`;
  }

  // ═══════════ DAILY WELLNESS TIPS ═══════════
  const wellnessTips = [
    'Take 5 minutes to practice deep breathing. It can reduce cortisol levels by up to 50% and immediately calm your nervous system.',
    'Try the 5-4-3-2-1 grounding technique: Notice 5 things you see, 4 you touch, 3 you hear, 2 you smell, and 1 you taste.',
    'A 10-minute walk in nature can boost your mood for up to 7 hours. Try stepping outside today!',
    'Write down 3 things you\'re grateful for. Gratitude journaling rewires your brain for positivity.',
    'Drink a glass of water right now. Dehydration can increase anxiety and lower concentration.',
    'Try progressive muscle relaxation: tense each muscle group for 5 seconds, then release. Start from your toes.',
    'Limit screen time 1 hour before bed. Blue light disrupts melatonin production and sleep quality.',
    'Call or message someone you care about. Social connection is one of the strongest predictors of wellbeing.',
    'Try the "two-minute rule": If something takes less than 2 minutes, do it now. It reduces mental clutter.',
    'Spend 5 minutes in silence. Your brain needs quiet moments to process emotions and recharge.',
    'Stretch for 5 minutes. Physical tension often mirrors mental tension.',
    'Practice self-compassion: Treat yourself with the same kindness you\'d offer a friend.',
    'Listen to calming music for 15 minutes. It can lower blood pressure and reduce stress hormones.',
    'Try a digital detox: No social media for the next hour. Notice how you feel.'
  ];

  function showDailyTip() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const tipIndex = dayOfYear % wellnessTips.length;
    document.getElementById('daily-tip-text').textContent = wellnessTips[tipIndex];

    // Wellness quotes
    const quotes = [
      '"The greatest weapon against stress is our ability to choose one thought over another." — William James',
      '"Almost everything will work again if you unplug it for a few minutes, including you." — Anne Lamott',
      '"You don\'t have to control your thoughts. You just have to stop letting them control you." — Dan Millman',
      '"Self-care is not self-indulgence, it is self-preservation." — Audre Lorde',
      '"Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor." — Thich Nhat Hanh',
      '"The only way out is through." — Robert Frost',
      '"Happiness can be found even in the darkest of times, if one only remembers to turn on the light." — Albus Dumbledore',
      '"Be gentle with yourself. You\'re doing the best you can." — Unknown',
      '"Mental health is not a destination, but a process." — Noam Shpancer',
      '"You are allowed to be both a masterpiece and a work in progress simultaneously." — Sophia Bush'
    ];
    const quoteEl = document.getElementById('wellness-quote');
    if (quoteEl) {
      quoteEl.textContent = quotes[dayOfYear % quotes.length];
    }
  }
  showDailyTip();

  // ═══════════ MOOD TRACKER ═══════════
  const moodOptions = document.querySelectorAll('.mood-option');
  const moodIntensity = document.getElementById('mood-intensity');
  const intensityValue = document.getElementById('intensity-value');
  const logMoodBtn = document.getElementById('log-mood-btn');

  // Mood emoji map
  const moodEmojis = {
    happy: '😊', calm: '😌', anxious: '😰',
    sad: '😢', stressed: '😫', angry: '😡'
  };

  // Select mood
  moodOptions.forEach(option => {
    option.addEventListener('click', () => {
      moodOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      state.selectedMood = option.dataset.mood;
      logMoodBtn.disabled = false;
    });
  });

  // Intensity slider
  moodIntensity.addEventListener('input', () => {
    intensityValue.textContent = moodIntensity.value;
  });

  // Log mood
  logMoodBtn.addEventListener('click', async () => {
    if (!state.selectedMood) return;

    const moodData = {
      emotion: state.selectedMood,
      intensity: parseInt(moodIntensity.value),
      note: document.getElementById('mood-note').value.trim(),
      date: new Date().toISOString()
    };

    // Try to save to server
    if (state.token) {
      try {
        await apiRequest('/mood', {
          method: 'POST',
          body: JSON.stringify(moodData)
        });
      } catch (err) {
        console.log('Saving mood locally');
      }
    }

    // Save locally too
    state.moodHistory.unshift(moodData);
    localStorage.setItem('mindspace_moods', JSON.stringify(state.moodHistory));

    // Reset form
    moodOptions.forEach(o => o.classList.remove('selected'));
    state.selectedMood = null;
    document.getElementById('mood-note').value = '';
    moodIntensity.value = 5;
    intensityValue.textContent = '5';
    logMoodBtn.disabled = true;

    showToast('Mood logged successfully! 📊', 'success');
    renderMoodHistory();
    updateDashboardStats();
    updateCharts();
  });

  // ─── AI Mood Detection ───
  const detectMoodAiBtn = document.getElementById('detect-mood-ai-btn');
  const aiMoodInput = document.getElementById('ai-mood-input');
  const aiDetectLoader = document.getElementById('ai-detect-loader');
  const aiDetectResult = document.getElementById('ai-detect-result');
  const detectedEmotionEl = document.getElementById('detected-emotion');
  const detectedIntensityEl = document.getElementById('detected-intensity');

  detectMoodAiBtn.addEventListener('click', async () => {
    // Collect answers from questionnaire
    const q1 = document.getElementById('ai-q-day').value.trim();
    const q2 = document.getElementById('ai-q-event').value.trim();
    const q3 = document.getElementById('ai-q-energy').value.trim();
    const q4 = document.getElementById('ai-q-mind').value.trim();

    // Combine into a single text block
    const text = `
      Day overall: ${q1}
      Significant event: ${q2}
      Energy level: ${q3}
      Additional thoughts: ${q4}
    `.trim();

    if (text.length < 20) {
      showToast('Please provide more details in the questions.', 'info');
      return;
    }

    try {
      // Show loader, disable button
      detectMoodAiBtn.disabled = true;
      aiDetectLoader.style.display = 'flex';
      aiDetectResult.style.display = 'none';

      const data = await apiRequest('/mood/detect', {
        method: 'POST',
        body: JSON.stringify({ text })
      });

      // Update UI with result
      detectedEmotionEl.textContent = data.emotion;
      detectedIntensityEl.textContent = data.intensity;
      aiDetectResult.style.display = 'block';

      // Auto-select the mood in the manual selector
      const moodOption = document.querySelector(`.mood-option[data-mood="${data.emotion}"]`);
      if (moodOption) {
        moodOptions.forEach(o => o.classList.remove('selected'));
        moodOption.classList.add('selected');
        state.selectedMood = data.emotion;
        logMoodBtn.disabled = false;
      }

      // Update intensity slider
      moodIntensity.value = data.intensity;
      intensityValue.textContent = data.intensity;

      // Add the text as a note automatically
      document.getElementById('mood-note').value = text;

      showToast('Mood detected! ✨', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to detect mood.', 'error');
    } finally {
      detectMoodAiBtn.disabled = false;
      aiDetectLoader.style.display = 'none';
    }
  });

  // Render mood history
  function renderMoodHistory() {
    const list = document.getElementById('mood-history-list');
    if (state.moodHistory.length === 0) {
      list.innerHTML = '<p class="empty-state">No moods logged yet. Start by selecting an emotion above! 🌟</p>';
      return;
    }

    list.innerHTML = state.moodHistory.slice(0, 20).map((m, i) => `
      <div class="mood-history-item">
        <span class="mood-hist-emoji">${moodEmojis[m.emotion] || '😐'}</span>
        <div class="mood-hist-info">
          <h4>${m.emotion}</h4>
          <p>${m.note || 'No note'} • ${formatDate(m.date)}</p>
        </div>
        <span class="mood-hist-intensity">${m.intensity}/10</span>
        <button class="mood-hist-delete" onclick="window.MindSpace.deleteMood(${i})" title="Delete">✕</button>
      </div>
    `).join('');
  }

  // Delete mood entry
  function deleteMood(index) {
    state.moodHistory.splice(index, 1);
    localStorage.setItem('mindspace_moods', JSON.stringify(state.moodHistory));
    renderMoodHistory();
    updateDashboardStats();
    updateCharts();
    showToast('Mood entry deleted', 'info');
  }

  // ═══════════ JOURNAL ═══════════
  const journalTitle = document.getElementById('journal-title');
  const journalContent = document.getElementById('journal-content');
  const journalCharCount = document.getElementById('journal-char-count');
  const saveJournalBtn = document.getElementById('save-journal-btn');
  const journalTags = document.querySelectorAll('.journal-tag');

  // Character counter
  journalContent.addEventListener('input', () => {
    journalCharCount.textContent = `${journalContent.value.length} / 5000`;
  });

  // Mood tag selection
  journalTags.forEach(tag => {
    tag.addEventListener('click', () => {
      journalTags.forEach(t => t.classList.remove('selected'));
      tag.classList.add('selected');
      state.selectedJournalMood = tag.dataset.mood;
    });
  });

  // Save journal entry
  saveJournalBtn.addEventListener('click', async () => {
    const title = journalTitle.value.trim();
    const content = journalContent.value.trim();

    if (!title || !content) {
      showToast('Please enter a title and content', 'error');
      return;
    }

    const entry = {
      title,
      content,
      mood: state.selectedJournalMood,
      createdAt: new Date().toISOString(),
      id: Date.now().toString()
    };

    // Try saving to server
    if (state.token) {
      try {
        const data = await apiRequest('/journal', {
          method: 'POST',
          body: JSON.stringify(entry)
        });
        if (data.entry) entry.id = data.entry._id;
      } catch (err) {
        console.log('Saving journal locally');
      }
    }

    // Save locally
    state.journalEntries.unshift(entry);
    localStorage.setItem('mindspace_journals', JSON.stringify(state.journalEntries));

    // Reset form
    journalTitle.value = '';
    journalContent.value = '';
    journalCharCount.textContent = '0 / 5000';
    journalTags.forEach(t => t.classList.remove('selected'));
    state.selectedJournalMood = '';

    showToast('Journal entry saved! 📝', 'success');
    renderJournalEntries();
    updateDashboardStats();
  });

  // Render journal entries
  function renderJournalEntries() {
    const list = document.getElementById('journal-entries-list');
    if (state.journalEntries.length === 0) {
      list.innerHTML = '<p class="empty-state">No entries yet. Start writing your first journal entry! ✍️</p>';
      return;
    }

    list.innerHTML = state.journalEntries.map((entry, i) => `
      <div class="journal-entry-card">
        <div class="entry-header">
          <h4>${escapeHtml(entry.title)}</h4>
          <span class="entry-date">${formatDate(entry.createdAt)}</span>
        </div>
        ${entry.mood ? `<span class="entry-mood-tag">${moodEmojis[entry.mood] || '📝'} ${entry.mood}</span>` : ''}
        <div class="entry-content">${escapeHtml(entry.content).substring(0, 300)}${entry.content.length > 300 ? '...' : ''}</div>
        <div class="entry-actions">
          <button class="delete-btn" onclick="window.MindSpace.deleteJournal(${i})">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  }

  // Delete journal entry
  function deleteJournal(index) {
    const entry = state.journalEntries[index];

    // Delete from server if logged in
    if (state.token && entry.id && entry.id.length > 15) {
      apiRequest(`/journal/${entry.id}`, { method: 'DELETE' }).catch(() => {});
    }

    state.journalEntries.splice(index, 1);
    localStorage.setItem('mindspace_journals', JSON.stringify(state.journalEntries));
    renderJournalEntries();
    updateDashboardStats();
    showToast('Journal entry deleted', 'info');
  }

  // ═══════════ DASHBOARD ═══════════
  let moodPieChart = null;
  let moodLineChart = null;

  // Auto-login only after chart variables exist to avoid TDZ errors
  if (state.user) {
    enterApp();
  }

  function calculateStreak() {
    if (state.moodHistory.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toDateString();

      const hasEntry = state.moodHistory.some(
        m => new Date(m.date).toDateString() === dateStr
      ) || state.journalEntries.some(
        j => new Date(j.createdAt).toDateString() === dateStr
      );

      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  function loadDashboardData() {
    updateDashboardStats();
    updateCharts();
    renderRecentActivity();
    renderMoodHistory();
    renderJournalEntries();
  }

  function updateDashboardStats() {
    animateCounter('stat-moods', state.moodHistory.length);
    animateCounter('stat-journals', state.journalEntries.length);
    animateCounter('stat-sessions', state.sessions);
    animateCounter('stat-streak', calculateStreak());
  }

  function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const current = parseInt(el.textContent) || 0;
    if (current === targetValue) { el.textContent = targetValue; return; }

    const duration = 600;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(current + (targetValue - current) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function updateCharts() {
    if (typeof Chart === 'undefined') return;

    // ─── Mood Distribution Pie Chart ───
    const moodCounts = {};
    state.moodHistory.forEach(m => {
      moodCounts[m.emotion] = (moodCounts[m.emotion] || 0) + 1;
    });

    const labels = Object.keys(moodCounts);
    const data = Object.values(moodCounts);

    const moodColorMap = {
      happy: '#fbbf24', calm: '#34d399', anxious: '#f97316',
      sad: '#60a5fa', stressed: '#f87171', angry: '#ef4444'
    };
    const bgColors = labels.map(l => moodColorMap[l] || '#a78bfa');

    const pieCtx = document.getElementById('mood-pie-chart')?.getContext('2d');
    if (pieCtx) {
      if (moodPieChart) moodPieChart.destroy();
      moodPieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)) : ['No data'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: bgColors.length ? bgColors : ['rgba(255,255,255,0.1)'],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#a8a3b5', padding: 15, usePointStyle: true }
            }
          }
        }
      });
    }

    // ─── Weekly Mood Trend Line Chart ───
    const last7Days = [];
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayLabels.push(d.toLocaleDateString('en', { weekday: 'short' }));

      const dayStr = d.toDateString();
      const dayMoods = state.moodHistory.filter(m => new Date(m.date).toDateString() === dayStr);
      const avgIntensity = dayMoods.length > 0
        ? dayMoods.reduce((sum, m) => sum + m.intensity, 0) / dayMoods.length
        : 0;
      last7Days.push(avgIntensity);
    }

    const lineCtx = document.getElementById('mood-line-chart')?.getContext('2d');
    if (lineCtx) {
      if (moodLineChart) moodLineChart.destroy();
      moodLineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: dayLabels,
          datasets: [{
            label: 'Avg Mood Intensity',
            data: last7Days,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#a78bfa',
            pointBorderColor: '#7c3aed',
            pointRadius: 5,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              min: 0, max: 10,
              ticks: { color: '#a8a3b5', stepSize: 2 },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            x: {
              ticks: { color: '#a8a3b5' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            }
          },
          plugins: {
            legend: { labels: { color: '#a8a3b5' } }
          }
        }
      });
    }
  }

  function renderRecentActivity() {
    const list = document.getElementById('recent-activity-list');
    const activities = [];

    // Combine moods and journals for recent activity
    state.moodHistory.slice(0, 5).forEach(m => {
      activities.push({
        emoji: moodEmojis[m.emotion] || '📊',
        text: `Logged mood: ${m.emotion} (${m.intensity}/10)`,
        date: m.date
      });
    });

    state.journalEntries.slice(0, 3).forEach(j => {
      activities.push({
        emoji: '📝',
        text: `Journal: ${j.title}`,
        date: j.createdAt
      });
    });

    // Sort by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (activities.length === 0) {
      list.innerHTML = '<p class="empty-state">Start tracking your mood to see activity here ✨</p>';
      return;
    }

    list.innerHTML = activities.slice(0, 8).map(a => `
      <div class="activity-item-card">
        <span class="activity-emoji">${a.emoji}</span>
        <span class="activity-text">${escapeHtml(a.text)}</span>
        <span class="activity-time">${formatDate(a.date)}</span>
      </div>
    `).join('');
  }

  // ═══════════ SHOP ═══════════
  async function loadProducts() {
    // Try loading from server
    try {
      const data = await apiRequest('/products');
      if (data.products && data.products.length > 0) {
        state.products = data.products;
      } else {
        loadFallbackProducts();
      }
    } catch {
      loadFallbackProducts();
    }
    renderProducts('all');
  }

  function loadFallbackProducts() {
    state.products = [
      { name: 'Calm Stress Ball Set', description: 'Soft, squeezable stress balls in calming colors.', price: 1099, category: 'stress-relief', rating: 5, image: '' },
      { name: 'Premium Fidget Cube', description: 'Six-sided fidget cube with buttons, switches, and spinners.', price: 849, category: 'stress-relief', rating: 4, image: '' },
      { name: 'Mindfulness Journal', description: 'Guided journal with daily prompts for gratitude and reflection.', price: 2099, category: 'journal', rating: 5, image: '' },
      { name: 'Bamboo Meditation Cushion', description: 'Ergonomic meditation cushion with organic buckwheat filling.', price: 3349, category: 'meditation', rating: 5, image: '' },
      { name: 'Lavender Essential Oil Set', description: 'Pure lavender essential oil kit with diffuser.', price: 2499, category: 'aromatherapy', rating: 4, image: '' },
      { name: 'Yoga Mat – Extra Thick', description: 'Premium 6mm thick yoga mat with alignment lines.', price: 2949, category: 'fitness', rating: 5, image: '' },
      { name: 'The Anxiety Toolkit', description: 'Practical guide with evidence-based strategies for managing anxiety.', price: 1449, category: 'books', rating: 4, image: '' },
      { name: 'Weighted Blanket – 15 lbs', description: 'Glass bead weighted blanket for deep pressure stimulation.', price: 4999, category: 'accessories', rating: 5, image: '' },
      { name: 'Tibetan Singing Bowl', description: 'Hand-hammered singing bowl for meditation and sound healing.', price: 3749, category: 'meditation', rating: 5, image: '' },
      { name: 'Resistance Band Set', description: 'Color-coded resistance bands for stress-relieving workouts.', price: 1649, category: 'fitness', rating: 4, image: '' },
      { name: 'Aromatherapy Candle Set', description: 'Set of 4 soy wax candles in calming scents.', price: 2349, category: 'aromatherapy', rating: 4, image: '/Users/prashanttripathi/.gemini/antigravity/brain/cae8f9f6-515f-42c8-b2c6-0b0e727e46df/aromatherapy_candle_set_1774429016560.png' },
      { name: 'Gratitude Card Deck', description: 'Weekly gratitude prompts in a beautiful card deck.', price: 1249, category: 'journal', rating: 4, image: '' }
    ];
  }

  function renderProducts(category) {
    const grid = document.getElementById('products-grid');
    const filtered = category === 'all'
      ? state.products
      : state.products.filter(p => p.category === category);

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="empty-state">No products found in this category.</p>';
      return;
    }

    grid.innerHTML = filtered.map((p, idx) => {
      // Generate gradient placeholders for products without images
      const gradients = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)',
        'linear-gradient(135deg, #fa709a, #fee140)',
        'linear-gradient(135deg, #a18cd1, #fbc2eb)'
      ];
      const randomGrad = gradients[idx % gradients.length];
      const imgStyle = p.image
        ? `background-image: url(${p.image}); background-size: cover; background-position: center;`
        : `background: ${randomGrad}; display: flex; align-items: center; justify-content: center; font-size: 3rem;`;
      const imgContent = p.image ? '' : getCategoryEmoji(p.category);
      const productIndex = state.products.indexOf(p);

      return `
        <div class="product-card">
          <div class="product-image" style="${imgStyle}">${imgContent}</div>
          <div class="product-info">
            <span class="product-category-tag">${p.category}</span>
            <h3>${escapeHtml(p.name)}</h3>
            <p>${escapeHtml(p.description)}</p>
            <div class="product-meta">
              <span class="product-price">₹${p.price}</span>
              <span class="product-rating">${'★'.repeat(p.rating)}${'☆'.repeat(5 - p.rating)}</span>
            </div>
            <button class="btn btn-primary buy-now-btn" onclick="window.MindSpace.openCheckout(${productIndex})">🛒 Buy Now</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function getCategoryEmoji(cat) {
    const map = {
      'stress-relief': '🧸', meditation: '🧘', journal: '📓',
      aromatherapy: '🕯️', fitness: '💪', books: '📚', accessories: '🎁'
    };
    return map[cat] || '🛍️';
  }

  // Shop filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.category);
    });
  });

  // ═══════════ CHECKOUT MODAL ═══════════
  const checkoutModal = document.getElementById('checkout-modal');
  const orderSuccessModal = document.getElementById('order-success-modal');

  function openCheckout(productIndex) {
    const product = state.products[productIndex];
    if (!product) return;

    // Store product reference
    state.checkoutProduct = product;

    // Populate modal with product info
    document.getElementById('checkout-product-name').textContent = product.name;
    document.getElementById('checkout-product-price').textContent = `₹${product.price}`;
    const imgEl = document.getElementById('checkout-product-img');
    if (product.image) {
      imgEl.style.backgroundImage = `url(${product.image})`;
      imgEl.style.backgroundSize = 'cover';
      imgEl.textContent = '';
    } else {
      imgEl.style.backgroundImage = '';
      imgEl.textContent = getCategoryEmoji(product.category);
    }

    // Pre-fill name from user profile
    const nameInput = document.getElementById('checkout-name');
    if (state.user && state.user.name && state.user.name !== 'Guest') {
      nameInput.value = state.user.name;
    }

    // Reset form errors
    const errorEl = document.getElementById('checkout-form-error');
    errorEl.style.display = 'none';
    errorEl.textContent = '';

    // Show modal
    checkoutModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    checkoutModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function closeOrderSuccess() {
    orderSuccessModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  document.getElementById('checkout-close-btn').addEventListener('click', closeCheckout);
  document.getElementById('order-success-close').addEventListener('click', closeOrderSuccess);

  // Close on backdrop click
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) closeCheckout();
  });
  orderSuccessModal.addEventListener('click', (e) => {
    if (e.target === orderSuccessModal) closeOrderSuccess();
  });

  // Handle form submission
  document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address').value.trim();
    const city = document.getElementById('checkout-city').value.trim();
    const stateVal = document.getElementById('checkout-state').value.trim();
    const pincode = document.getElementById('checkout-pincode').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';

    const errorEl = document.getElementById('checkout-form-error');

    // Validation
    if (!name || !phone || !address || !city || !stateVal || !pincode) {
      errorEl.textContent = '⚠️ Please fill in all required fields.';
      errorEl.style.display = 'block';
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      errorEl.textContent = '⚠️ Please enter a valid 10-digit phone number.';
      errorEl.style.display = 'block';
      return;
    }
    if (!/^[0-9]{6}$/.test(pincode)) {
      errorEl.textContent = '⚠️ Please enter a valid 6-digit pincode.';
      errorEl.style.display = 'block';
      return;
    }

    errorEl.style.display = 'none';

    // Animate button — disable immediately to prevent double-submit
    const submitBtn = document.getElementById('checkout-submit-btn');
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.textContent = '⏳ Processing...';

    const product = state.checkoutProduct;
    const orderDetails = { name, phone, address, city, state: stateVal, pincode, payment, product };

    if (payment === 'razorpay') {
      // Check if Razorpay SDK is loaded
      if (typeof window.Razorpay === 'undefined') {
        showToast('Payment gateway not loaded. Check your internet connection and try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
      }
      try {
        // 1. Get Razorpay Key
        const keyData = await apiRequest('/payment/key');
        const RAZORPAY_KEY = keyData.key;

        // 2. Create Order
        const orderData = await apiRequest('/payment/order', {
          method: 'POST',
          body: JSON.stringify({
            amount: product.price,
            productId: product._id || product.name
          })
        });

        // 3. Open Razorpay Checkout
        const options = {
          key: RAZORPAY_KEY,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "MindSpace 3D",
          description: `Purchase of ${product.name}`,
          image: "/logo.jpeg",
          order_id: orderData.id,
          handler: async function (response) {
            // 4. Verify Payment
            try {
              submitBtn.textContent = '⏳ Verifying Payment...';
              const verification = await apiRequest('/payment/verify', {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  customerDetails: { name, phone, address, city, state: stateVal, pincode },
                  productDetails: { id: product._id || product.name, name: product.name, price: product.price }
                })
              });

              if (verification.status === 'success' || verification.status === 'partial_success') {
                showSuccessModal(orderDetails, response.razorpay_order_id);
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (err) {
              showToast('Payment verification failed. Please contact support.', 'error');
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnText;
            }
          },
          prefill: {
            name: name,
            contact: phone,
            email: state.user?.email || ""
          },
          theme: {
            color: "#7c3aed"
          },
          modal: {
            ondismiss: function() {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnText;
            }
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Razorpay Init Error:', err);
        const errMsg = err?.message?.includes('Request failed')
          ? 'Could not connect to payment server. Make sure you are logged in or try again.'
          : 'Failed to initialize payment. Check your internet connection and try again.';
        showToast(errMsg, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    } else {
      // Simulate COD processing
      setTimeout(() => {
        showSuccessModal(orderDetails, 'MS' + Date.now().toString().slice(-8).toUpperCase());
      }, 1500);
    }
  });

  function showSuccessModal(details, orderId) {
    const submitBtn = document.getElementById('checkout-submit-btn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="check-circle"></i> Place Order';

    const paymentLabels = { cod: 'Cash on Delivery', razorpay: 'Razorpay (Online)' };

    // Show success modal
    closeCheckout();
    document.getElementById('order-details-box').innerHTML = `
      <div class="order-detail-row"><span>Order ID</span><strong>#${orderId}</strong></div>
      <div class="order-detail-row"><span>Product</span><strong>${escapeHtml(details.product.name)}</strong></div>
      <div class="order-detail-row"><span>Amount</span><strong>₹${details.product.price}</strong></div>
      <div class="order-detail-row"><span>Payment</span><strong>${paymentLabels[details.payment]}</strong></div>
      <div class="order-detail-row"><span>Deliver To</span><strong>${escapeHtml(details.address)}, ${escapeHtml(details.city)}, ${escapeHtml(details.state)} - ${details.pincode}</strong></div>
      <div class="order-detail-row"><span>Phone</span><strong>${details.phone}</strong></div>
    `;

    // Reset form
    document.getElementById('checkout-form').reset();

    orderSuccessModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    showToast(`Order placed for ${details.product.name}! 🎉`, 'success');
    
    // Refresh Lucide Icons in modal
    if (window.lucide) lucide.createIcons();
  }

  // ═══════════ ACTIVITIES MAP ═══════════
  function initMap() {
    if (typeof L === 'undefined') {
      document.getElementById('activity-map').innerHTML =
        '<p style="padding:20px;text-align:center;color:#a8a3b5;">Map library not available. Check your internet connection.</p>';
      return;
    }

    // Initialize Leaflet map centered on a default location
    state.map = L.map('activity-map').setView([28.6139, 77.2090], 13); // Delhi default

    // Set initial map theme
    updateMapTheme();

    // Setup manual location button
    document.getElementById('locate-me-btn').addEventListener('click', getUserLocation);
    
    // Automatically trigger the location after a small delay for a dynamic feel
    setTimeout(() => {
      getUserLocation();
    }, 1200);

    // Auto-rotate activity types after some time to make it dynamic
    setInterval(() => {
      if (state.currentSection === 'activities') {
        const btns = Array.from(document.querySelectorAll('.activity-type-btn'));
        const activeIdx = btns.findIndex(b => b.classList.contains('active'));
        const nextIdx = (activeIdx + 1) % btns.length;
        // Don't auto rotate if hovered to avoid annoying the user
        if (!document.querySelector('.activity-types:hover')) {
           btns[nextIdx].click();
        }
      }
    }, 15000);
  }

  function updateMapTheme() {
    if (!state.map) return;
    
    // Remove existing tile layer if any
    if (state.tileLayer) {
      state.map.removeLayer(state.tileLayer);
    }

    const tileUrl = state.theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    state.tileLayer = L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors, © CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    });
    
    state.tileLayer.addTo(state.map);
  }

  function getUserLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    showToast('Finding your location...', 'info');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        state.map.setView([latitude, longitude], 14);

        // Remove old markers if any
        if (state.userMarker) state.map.removeLayer(state.userMarker);

        // Add user marker
        state.userMarker = L.marker([latitude, longitude])
          .addTo(state.map)
          .bindPopup('📍 You are here!')
          .openPopup();

        // Search for nearby places
        searchNearbyPlaces(latitude, longitude);
        showToast('Location found! 📍', 'success');
      },
      (err) => {
        let msg = 'Unable to get location. Using default view.';
        if (err.code === 1) msg = 'Location access denied. Please enable permissions in your browser.';
        else if (err.code === 2) msg = 'Location unavailable. Check your network.';
        else if (err.code === 3) msg = 'Location request timed out.';
        
        showToast(msg, 'error');
        console.error('Geolocation error:', err);
        searchNearbyPlaces(28.6139, 77.2090); // Default to Delhi
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  let apiCache = {};
  let mapMarkers = [];

  function searchNearbyPlaces(lat, lng) {
    // Use Overpass API to find nearby parks, gyms, yoga centers
    const activeType = document.querySelector('.activity-type-btn.active')?.dataset.type || 'park';
    
    // Check cache first
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}-${activeType}`;
    if (apiCache[cacheKey]) {
      renderMarkers(apiCache[cacheKey], activeType);
      return;
    }
    const typeMap = {
      park: 'leisure=park',
      yoga: 'sport=yoga',
      gym: 'leisure=fitness_centre',
      spa: 'leisure=spa',
      library: 'amenity=library'
    };

    // Optimize query: use smaller radius (3km) and include ways/relations for better accuracy
    const query = `[out:json];(node[${typeMap[activeType]}](around:3000,${lat},${lng});way[${typeMap[activeType]}](around:3000,${lat},${lng});relation[${typeMap[activeType]}](around:3000,${lat},${lng}););out center 15;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    showToast(`Searching for nearby ${activeType}s...`, 'info');

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.elements) {
          apiCache[cacheKey] = data.elements;
          renderMarkers(data.elements, activeType);
          if (data.elements.length > 0) {
            showToast(`Found ${data.elements.length} ${activeType} spots nearby!`, 'success');
          }
        }
      })
      .catch(() => {
        // Silently fail – map still works
      });
  }

  function renderMarkers(elements, activeType) {
    // Clear old markers for this category if we wanted to (omitted for cumulative map)
    // Currently, we just add them, taking care not to add duplicates could be done, but
    // Overpass gives us fixed unique nodes anyway. Let's just clear ALL markers and redraw
    // to keep the map clean when switching tabs.
    mapMarkers.forEach(m => state.map.removeLayer(m));
    mapMarkers = [];
    
    // Add User location back
    const center = state.map.getCenter();
    const userMarker = L.marker([center.lat, center.lng]).bindPopup('📍 You are here!').openPopup();
    userMarker.addTo(state.map);
    mapMarkers.push(userMarker);

    elements.forEach(el => {
      const name = el.tags?.name || `${activeType} spot`;
      const pos = el.center ? [el.center.lat, el.center.lon] : [el.lat, el.lon];
      const m = L.marker(pos)
        .addTo(state.map)
        .bindPopup(`<strong>${name}</strong><br>${activeType}`);
      mapMarkers.push(m);
    });
  }

  // Activity type buttons
  document.querySelectorAll('.activity-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.activity-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (state.map) {
        const center = state.map.getCenter();
        searchNearbyPlaces(center.lat, center.lng);
      }
    });
  });

  // ═══════════ UTILITY FUNCTIONS ═══════════
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════ EXPOSE GLOBAL FUNCTIONS ═══════════
  window.MindSpace = {
    deleteMood,
    deleteJournal,
    openCheckout,
    incrementSessions: () => {
      state.sessions++;
      localStorage.setItem('mindspace_sessions', state.sessions.toString());
      updateDashboardStats();
    }
  };

  console.log('🧠 MindSpace 3D app initialized');
})();
