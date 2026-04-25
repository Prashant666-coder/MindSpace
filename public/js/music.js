/**
 * MindSpace 3D – Calming Music Player
 * Plays MP3 files for main tracks while keeping procedural audio
 * via Web Audio API for ambient background layers.
 */

(function () {
  'use strict';

  // ─── Audio Context Setup (For Ambient Mixer Only) ────────
  let audioCtx = null;
  let masterGain = null;

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      console.error('Web Audio API not supported:', e);
    }
  }

  // ─── Main Music Player State ─────────────────────────────
  let currentAudio = null;
  let isPlaying = false;
  let currentTrackIndex = -1;
  let progressInterval = null;

  // ─── Track Definitions ─────────────────────────────────
  const tracks = [
    { name: 'Forest Morning', category: 'nature', icon: '🌲', file: 'musics/forestmorning.mp3' },
    { name: 'Gentle Rain', category: 'rain', icon: '🌧️', file: 'musics/gentlerain.mp3' },
    { name: 'Ocean Waves', category: 'ocean', icon: '🌊', file: 'musics/oceanwaves.mp3' },
    { name: 'Cosmic Drift', category: 'ambient', icon: '✨', file: 'musics/cosmicdrift.mp3' },
    { name: 'Lo-Fi Chill', category: 'lofi', icon: '🎹', file: 'musics/lofichill.mp3' },
    { name: 'Midnight Rain', category: 'rain', icon: '🌙', file: 'musics/midnightrain.mp3' },
    { name: 'Deep Ocean', category: 'ocean', icon: '🐋', file: 'musics/deepocean.mp3' },
    { name: 'Wind Chimes', category: 'nature', icon: '🎐', file: 'musics/windchimes.mp3' },
    { name: 'Ethereal Pads', category: 'ambient', icon: '🔮', file: 'musics/ethernalpads.mp3' },
    { name: 'Soft Piano', category: 'lofi', icon: '🎶', file: 'musics/softpiano.mp3' }
  ];

  // ─── Render Track List ─────────────────────────────────
  function renderTrackList(filterCategory = 'all') {
    const trackListEl = document.getElementById('track-list');
    if (!trackListEl) return;

    const filtered = filterCategory === 'all'
      ? tracks
      : tracks.filter(t => t.category === filterCategory);

    if (filtered.length === 0) {
      trackListEl.innerHTML = '<p class="no-tracks">No tracks found in this category.</p>';
      return;
    }

    trackListEl.innerHTML = filtered.map(track => {
      const idx = tracks.indexOf(track);
      const isCurrentlyPlaying = idx === currentTrackIndex;
      return `
        <div class="track-item ${isCurrentlyPlaying ? 'playing' : ''}" data-index="${idx}">
          <span class="track-icon">${track.icon}</span>
          <div class="track-details">
            <h4>${track.name}</h4>
            <p>${track.category}</p>
          </div>
          <span class="track-duration">MP3</span>
        </div>
      `;
    }).join('');

    // Add click handlers
    trackListEl.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        playTrack(idx);
      });
    });
  }

  // ─── Play Track ────────────────────────────────────────
  function playTrack(index) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentTrackIndex = index;
    isPlaying = true;
    const track = tracks[index];

    // Initialize HTML5 Audio
    currentAudio = new Audio(track.file);
    currentAudio.loop = true; 
    
    // Sync with existing volume slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      currentAudio.volume = volumeSlider.value / 100;
    }

    // Playback with error catching
    currentAudio.play().catch(err => {
      console.warn('Audio playback failed (interaction likely required):', err);
      isPlaying = false;
      const playPauseBtn = document.getElementById('play-pause');
      if (playPauseBtn) playPauseBtn.textContent = '▶';
    });

    // Update UI
    const trackNameEl = document.getElementById('track-name');
    const trackCatEl = document.getElementById('track-category');
    const albumArtEl = document.getElementById('album-art');
    const playPauseBtn = document.getElementById('play-pause');

    if (trackNameEl) trackNameEl.textContent = track.name;
    if (trackCatEl) trackCatEl.textContent = track.category;
    if (albumArtEl) {
      albumArtEl.textContent = track.icon;
      albumArtEl.classList.add('playing');
    }
    if (playPauseBtn) playPauseBtn.textContent = '⏸';

    clearInterval(progressInterval);
    progressInterval = setInterval(updateProgress, 250);

    renderTrackList(getCurrentFilter());
  }

  function stopCurrentTrack() {
    isPlaying = false;
    if (currentAudio) {
      currentAudio.pause();
    }
    clearInterval(progressInterval);
    const albumArtEl = document.getElementById('album-art');
    const progressFillEl = document.getElementById('progress-fill');
    if (albumArtEl) albumArtEl.classList.remove('playing');
    if (progressFillEl) progressFillEl.style.width = '0%';
    
    const playPauseBtn = document.getElementById('play-pause');
    if (playPauseBtn) playPauseBtn.textContent = '▶';
  }

  function updateProgress() {
    if (!currentAudio || !currentAudio.duration) return;
    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
    const progressFillEl = document.getElementById('progress-fill');
    if (progressFillEl) progressFillEl.style.width = `${progress}%`;
  }

  function getCurrentFilter() {
    const active = document.querySelector('.sound-cat-btn.active');
    return active?.dataset.cat || 'nature';
  }

  // ─── Initialization ─────────────────────────────────────
  function init() {
    // Initial Render
    renderTrackList('nature');

    // Player Controls
    document.getElementById('play-pause')?.addEventListener('click', () => {
      if (isPlaying) {
        stopCurrentTrack();
      } else if (currentAudio && currentTrackIndex >= 0) {
        isPlaying = true;
        currentAudio.play();
        const playPauseBtn = document.getElementById('play-pause');
        if (playPauseBtn) playPauseBtn.textContent = '⏸';
        document.getElementById('album-art')?.classList.add('playing');
        progressInterval = setInterval(updateProgress, 250);
      } else {
        playTrack(0);
      }
    });

    document.getElementById('next-track')?.addEventListener('click', () => {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      playTrack(nextIndex);
    });

    document.getElementById('prev-track')?.addEventListener('click', () => {
      const prevIndex = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
      playTrack(prevIndex);
    });

    // Volume control
    document.getElementById('volume-slider')?.addEventListener('input', (e) => {
      const val = e.target.value / 100;
      if (currentAudio) {
        currentAudio.volume = val;
      }
      if (masterGain) {
        masterGain.gain.value = val;
      }
    });

    // Sound category filters
    document.querySelectorAll('.sound-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sound-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTrackList(btn.dataset.cat);
        
        // Auto-scroll to tracks on mobile
        if (window.innerWidth <= 480) {
          document.getElementById('track-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Mixer Sliders
    document.querySelectorAll('.mixer-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const sound = slider.dataset.sound;
        const value = slider.value / 100;

        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

        handleMixerChange(sound, value);
      });
    });

    console.log('🎵 Music Player Initialized');
  }

  // ─── Ambient Mixer Internal Logic ───────────────────────
  const mixerSources = {};
  const soundConfigs = {
    rain: { type: 'bandpass', freq: 1200, q: 0.4, noise: 'pink' },
    waves: { type: 'lowpass', freq: 500, q: 0.4, noise: 'white' },
    birds: { type: 'highpass', freq: 3000, q: 0.2, noise: 'white' },
    wind: { type: 'lowpass', freq: 800, q: 0.7, noise: 'pink' }
  };

  function handleMixerChange(sound, value) {
    if (!audioCtx) return;

    if (value === 0 && mixerSources[sound]) {
      if (mixerSources[sound].interval) clearInterval(mixerSources[sound].interval);
      try { mixerSources[sound].source.stop(); } catch (e) { }
      try { mixerSources[sound].source.disconnect(); } catch (e) { }
      delete mixerSources[sound];
      return;
    }

    if (value > 0 && !mixerSources[sound]) {
      const bufferSize = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      const config = soundConfigs[sound] || { type: 'lowpass', freq: 1000, q: 0.5 };
      let lastOut = 0;
      if (config.noise === 'pink') {
        // Pink Noise Approximation
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          let white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.11; b6 = white * 0.115926;
        }
      } else {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      filter.type = config.type;
      filter.frequency.value = config.freq;
      filter.Q.value = config.q;
      gain.gain.value = value * 0.4;

      mixerSources[sound] = { source, filter, gain, currentValue: value };
      
      // Birds only use random chirps (playBirdChirp), not continuous noise
      if (sound !== 'birds') {
        source.connect(filter).connect(gain).connect(masterGain);
        source.start();
      }

      if (sound === 'birds') {
        mixerSources[sound].interval = setInterval(() => {
          if (mixerSources[sound] && Math.random() > 0.1) playBirdChirp(mixerSources[sound].currentValue);
        }, 1500);
      }
      
      if (sound === 'wind') {
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 0.1;
        lfoGain.gain.value = 400;
        lfo.connect(lfoGain).connect(filter.frequency);
        lfo.start();
        mixerSources[sound].lfo = lfo;
      }
    } else if (value > 0 && mixerSources[sound]) {
      mixerSources[sound].currentValue = value;
      mixerSources[sound].gain.gain.setTargetAtTime(value * 0.4, audioCtx.currentTime, 0.1);
    }
  }

  function playBirdChirp(volume) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const freq = 2000 + Math.random() * 2000;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.3, audioCtx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
