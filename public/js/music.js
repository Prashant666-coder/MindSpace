/**
 * MindSpace 3D – Calming Music Player
 * Generates calming ambient music using the Web Audio API.
 * No external audio files needed – all sounds are synthesized.
 * Features: track list, playback controls, volume, and ambient mixer.
 */

(function () {
  'use strict';

  // ─── Audio Context Setup ───────────────────────────────
  let audioCtx = null;
  let masterGain = null;
  let currentTrackNodes = [];
  let isPlaying = false;
  let currentTrackIndex = -1;
  let progressInterval = null;
  let trackStartTime = 0;

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioCtx.destination);
  }

  // ─── Track Definitions ─────────────────────────────────
  // Each track defines parameters for procedural audio generation
  const tracks = [
    {
      name: 'Forest Morning',
      category: 'nature',
      icon: '🌲',
      duration: '∞',
      generator: generateForestSounds
    },
    {
      name: 'Gentle Rain',
      category: 'rain',
      icon: '🌧️',
      duration: '∞',
      generator: generateRainSounds
    },
    {
      name: 'Ocean Waves',
      category: 'ocean',
      icon: '🌊',
      duration: '∞',
      generator: generateOceanSounds
    },
    {
      name: 'Cosmic Drift',
      category: 'ambient',
      icon: '✨',
      duration: '∞',
      generator: generateAmbientDrone
    },
    {
      name: 'Lo-Fi Chill',
      category: 'lofi',
      icon: '🎹',
      duration: '∞',
      generator: generateLoFiBeats
    },
    {
      name: 'Midnight Rain',
      category: 'rain',
      icon: '🌙',
      duration: '∞',
      generator: generateNightRain
    },
    {
      name: 'Deep Ocean',
      category: 'ocean',
      icon: '🐋',
      duration: '∞',
      generator: generateDeepOcean
    },
    {
      name: 'Wind Chimes',
      category: 'nature',
      icon: '🎐',
      duration: '∞',
      generator: generateWindChimes
    },
    {
      name: 'Ethereal Pads',
      category: 'ambient',
      icon: '🔮',
      duration: '∞',
      generator: generateEtherealPads
    },
    {
      name: 'Soft Piano',
      category: 'lofi',
      icon: '🎶',
      duration: '∞',
      generator: generateSoftPiano
    }
  ];

  // ─── Sound Generators ──────────────────────────────────

  function generateForestSounds() {
    initAudio();
    const nodes = [];

    // ── Layer 1: Rustling Leaves (filtered noise with slow movement) ──
    const leafBufferSize = audioCtx.sampleRate * 2;
    const leafBuffer = audioCtx.createBuffer(1, leafBufferSize, audioCtx.sampleRate);
    const leafData = leafBuffer.getChannelData(0);
    // Pink-ish noise for natural rustling texture
    let lb0 = 0, lb1 = 0, lb2 = 0, lb3 = 0, lb4 = 0, lb5 = 0, lb6 = 0;
    for (let i = 0; i < leafBufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lb0 = 0.99886 * lb0 + white * 0.0555179;
      lb1 = 0.99332 * lb1 + white * 0.0750759;
      lb2 = 0.96900 * lb2 + white * 0.1538520;
      lb3 = 0.86650 * lb3 + white * 0.3104856;
      lb4 = 0.55000 * lb4 + white * 0.5329522;
      lb5 = -0.7616 * lb5 - white * 0.0168980;
      leafData[i] = (lb0 + lb1 + lb2 + lb3 + lb4 + lb5 + lb6 + white * 0.5362) * 0.08;
      lb6 = white * 0.115926;
    }
    const leafNoise = audioCtx.createBufferSource();
    leafNoise.buffer = leafBuffer;
    leafNoise.loop = true;

    const leafFilter = audioCtx.createBiquadFilter();
    leafFilter.type = 'bandpass';
    leafFilter.frequency.value = 1200;
    leafFilter.Q.value = 0.4;

    // Slow LFO to make rustling breathe naturally
    const leafLfo = audioCtx.createOscillator();
    const leafLfoGain = audioCtx.createGain();
    leafLfo.type = 'sine';
    leafLfo.frequency.value = 0.15; // Gentle swaying
    leafLfoGain.gain.value = 500;
    leafLfo.connect(leafLfoGain).connect(leafFilter.frequency);
    leafLfo.start();

    const leafGain = audioCtx.createGain();
    leafGain.gain.value = 0.14;

    leafNoise.connect(leafFilter).connect(leafGain).connect(masterGain);
    leafNoise.start();
    nodes.push(leafNoise, leafLfo);

    // ── Layer 2: Gentle Creek / Stream ──
    const creekBufferSize = audioCtx.sampleRate * 2;
    const creekBuffer = audioCtx.createBuffer(1, creekBufferSize, audioCtx.sampleRate);
    const creekData = creekBuffer.getChannelData(0);
    for (let i = 0; i < creekBufferSize; i++) {
      creekData[i] = Math.random() * 2 - 1;
    }
    const creekNoise = audioCtx.createBufferSource();
    creekNoise.buffer = creekBuffer;
    creekNoise.loop = true;

    const creekFilter = audioCtx.createBiquadFilter();
    creekFilter.type = 'bandpass';
    creekFilter.frequency.value = 2800;
    creekFilter.Q.value = 1.5;

    // LFO to create babbling/trickling effect
    const creekLfo = audioCtx.createOscillator();
    const creekLfoGain = audioCtx.createGain();
    creekLfo.type = 'sine';
    creekLfo.frequency.value = 0.4;
    creekLfoGain.gain.value = 800;
    creekLfo.connect(creekLfoGain).connect(creekFilter.frequency);
    creekLfo.start();

    const creekGain = audioCtx.createGain();
    creekGain.gain.value = 0.06;

    creekNoise.connect(creekFilter).connect(creekGain).connect(masterGain);
    creekNoise.start();
    nodes.push(creekNoise, creekLfo);

    // ── Layer 3: Warm Harmonic Drone Pads (forest depth) ──
    const padFreqs = [130.81, 196.00, 261.63]; // C3, G3, C4
    padFreqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = i === 1 ? 'triangle' : 'sine';
      osc.frequency.value = freq;

      // Slow detune for warm organic feel
      const lfo = audioCtx.createOscillator();
      const lfoG = audioCtx.createGain();
      lfo.frequency.value = 0.04 + i * 0.015;
      lfoG.gain.value = 1.5;
      lfo.connect(lfoG).connect(osc.frequency);
      lfo.start();

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.022 / (i + 1), audioCtx.currentTime + 3);

      osc.connect(gain).connect(masterGain);
      osc.start();
      nodes.push(osc, lfo);
    });

    // ── Layer 4: Subtle Distant Insect Hum ──
    const insectOsc = audioCtx.createOscillator();
    const insectGain = audioCtx.createGain();
    insectOsc.type = 'sine';
    insectOsc.frequency.value = 4200;
    insectGain.gain.value = 0.006;

    const insectLfo = audioCtx.createOscillator();
    const insectLfoGain = audioCtx.createGain();
    insectLfo.frequency.value = 6;
    insectLfoGain.gain.value = 0.004;
    insectLfo.connect(insectLfoGain).connect(insectGain.gain);
    insectLfo.start();

    insectOsc.connect(insectGain).connect(masterGain);
    insectOsc.start();
    nodes.push(insectOsc, insectLfo);

    // ── Layer 5: Occasional Gentle Bird Chirps (subtle, not dominant) ──
    const birdInterval = setInterval(() => {
      if (isPlaying && Math.random() > 0.4) {
        playBirdChirp(0.5); // Much softer volume
      }
    }, 4000 + Math.random() * 3000); // Less frequent: 4-7 seconds apart

    // Cleanup handle for the interval
    nodes.push({ stop: () => clearInterval(birdInterval), disconnect: () => {} });

    return nodes;
  }


  function generateRainSounds() {
    initAudio();
    const nodes = [];

    // White noise filtered to sound like rain
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 0.5;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.12;

    noise.connect(filter).connect(gain).connect(masterGain);
    noise.start();
    nodes.push(noise);

    // Occasional thunder rumble
    function thunder() {
      if (!isPlaying) return;
      const osc = audioCtx.createOscillator();
      const thunderGain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 40 + Math.random() * 20;

      thunderGain.gain.setValueAtTime(0, audioCtx.currentTime);
      thunderGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.5);
      thunderGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);

      osc.connect(thunderGain).connect(masterGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 3.5);

      setTimeout(thunder, 15000 + Math.random() * 20000);
    }
    setTimeout(thunder, 5000);

    return nodes;
  }

  function generateOceanSounds() {
    initAudio();
    const nodes = [];

    // Ocean: filtered noise with LFO modulation
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    // LFO for wave effect
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Very slow oscillation
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    const mainGain = audioCtx.createGain();
    mainGain.gain.value = 0.15;

    noise.connect(filter).connect(mainGain).connect(masterGain);
    noise.start();
    nodes.push(noise, lfo);

    return nodes;
  }

  function generateAmbientDrone() {
    initAudio();
    const nodes = [];
    const baseFreqs = [110, 165, 220, 330]; // A2, E3, A3, E4

    baseFreqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Slow frequency modulation for movement
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 0.05 + i * 0.02;
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();

      gain.gain.value = 0.04 / (i + 1);

      osc.connect(gain).connect(masterGain);
      osc.start();
      nodes.push(osc, lfo);
    });

    return nodes;
  }

  function generateLoFiBeats() {
    initAudio();
    const nodes = [];

    // Mellow chord progression
    const chords = [
      [261.6, 329.6, 392.0], // C major
      [220.0, 277.2, 329.6], // Am
      [246.9, 311.1, 370.0], // F (approx)
      [196.0, 246.9, 293.7]  // G
    ];

    let chordIndex = 0;

    function playChord() {
      if (!isPlaying) return;

      const chord = chords[chordIndex % chords.length];
      chord.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq / 2; // Lower octave

        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3.5);

        osc.connect(gain).connect(masterGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 4);
      });

      chordIndex++;
      setTimeout(playChord, 4000);
    }

    playChord();

    // Subtle noise layer (vinyl crackle feel)
    const bufferSize = audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.008;
    }
    const crackle = audioCtx.createBufferSource();
    crackle.buffer = buffer;
    crackle.loop = true;

    const crackleFilter = audioCtx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 2000;

    crackle.connect(crackleFilter).connect(masterGain);
    crackle.start();
    nodes.push(crackle);

    return nodes;
  }

  function generateNightRain() {
    initAudio();
    const nodes = [];

    // Heavier rain noise
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.1;

    noise.connect(filter).connect(gain).connect(masterGain);
    noise.start();
    nodes.push(noise);

    // Low ambient pad
    const pad = audioCtx.createOscillator();
    const padGain = audioCtx.createGain();
    pad.type = 'sine';
    pad.frequency.value = 85;
    padGain.gain.value = 0.02;
    pad.connect(padGain).connect(masterGain);
    pad.start();
    nodes.push(pad);

    return nodes;
  }

  function generateDeepOcean() {
    initAudio();
    const nodes = [];

    // Very low frequency rumble
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 55;
    gain1.gain.value = 0.06;

    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain).connect(osc1.frequency);
    lfo.start();

    osc1.connect(gain1).connect(masterGain);
    osc1.start();
    nodes.push(osc1, lfo);

    // Whale-like sounds
    function whaleSong() {
      if (!isPlaying) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      const startFreq = 150 + Math.random() * 100;
      osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, audioCtx.currentTime + 2);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.7, audioCtx.currentTime + 4);

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 4);

      osc.connect(gain).connect(masterGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 4.5);

      setTimeout(whaleSong, 6000 + Math.random() * 8000);
    }
    setTimeout(whaleSong, 2000);

    return nodes;
  }

  function generateWindChimes() {
    initAudio();
    const nodes = [];

    // Pentatonic frequencies for pleasant chime sounds
    const chimeFreqs = [523.3, 587.3, 659.3, 784.0, 880.0, 1047, 1175, 1319];

    function chime() {
      if (!isPlaying) return;
      const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);

      osc.connect(gain).connect(masterGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 3);

      setTimeout(chime, 500 + Math.random() * 2000);
    }

    chime();
    setTimeout(chime, 300);
    setTimeout(chime, 700);

    // Gentle wind background
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }
    const wind = audioCtx.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;

    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 500;

    wind.connect(windFilter).connect(masterGain);
    wind.start();
    nodes.push(wind);

    return nodes;
  }

  function generateEtherealPads() {
    initAudio();
    const nodes = [];

    // Lush chord pads
    const freqs = [174.6, 261.6, 349.2, 440]; // F3, C4, F4, A4

    freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;

      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 0.03 + i * 0.01;
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();

      gain.gain.value = 0.03;

      osc.connect(gain).connect(masterGain);
      osc.start();
      nodes.push(osc, lfo);
    });

    return nodes;
  }

  function generateSoftPiano() {
    initAudio();
    const nodes = [];

    // Simple piano-like tones with decay
    const melody = [261.6, 293.7, 329.6, 349.2, 392.0, 349.2, 329.6, 293.7];
    let noteIndex = 0;

    function playNote() {
      if (!isPlaying) return;

      const freq = melody[noteIndex % melody.length];
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);

      osc.connect(gain).connect(masterGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 3);

      noteIndex++;
      setTimeout(playNote, 2000 + Math.random() * 1000);
    }

    playNote();

    return nodes;
  }

  // ─── Render Track List ─────────────────────────────────
  function renderTrackList(filterCategory = 'all') {
    const trackListEl = document.getElementById('track-list');
    if (!trackListEl) return;

    const filtered = filterCategory === 'all'
      ? tracks
      : tracks.filter(t => t.category === filterCategory);

    trackListEl.innerHTML = filtered.map((track, originalIndex) => {
      const idx = tracks.indexOf(track);
      return `
        <div class="track-item ${idx === currentTrackIndex ? 'playing' : ''}" data-index="${idx}">
          <span class="track-icon">${track.icon}</span>
          <div class="track-details">
            <h4>${track.name}</h4>
            <p>${track.category}</p>
          </div>
          <span class="track-duration">${track.duration}</span>
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

  renderTrackList('nature');

  // ─── Play Track ────────────────────────────────────────
  function playTrack(index) {
    stopCurrentTrack();

    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    currentTrackIndex = index;
    isPlaying = true;

    const track = tracks[index];
    currentTrackNodes = track.generator() || [];

    // Update UI
    document.getElementById('track-name').textContent = track.name;
    document.getElementById('track-category').textContent = track.category;
    document.getElementById('album-art').textContent = track.icon;
    document.getElementById('album-art').classList.add('playing');
    document.getElementById('play-pause').textContent = '⏸';

    trackStartTime = Date.now();
    progressInterval = setInterval(updateProgress, 100);

    renderTrackList(getCurrentFilter());
  }

  function stopCurrentTrack() {
    isPlaying = false;

    // Stop all audio nodes
    currentTrackNodes.forEach(node => {
      try { node.stop(); } catch (e) { }
      try { node.disconnect(); } catch (e) { }
    });
    currentTrackNodes = [];

    clearInterval(progressInterval);
    document.getElementById('album-art')?.classList.remove('playing');
    document.getElementById('progress-fill').style.width = '0%';
  }

  function updateProgress() {
    const elapsed = (Date.now() - trackStartTime) / 1000;
    // Cycle progress bar every 30 seconds for infinite tracks
    const progress = (elapsed % 30) / 30 * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
  }

  function getCurrentFilter() {
    const active = document.querySelector('.sound-cat-btn.active');
    return active?.dataset.cat || 'nature';
  }

  // ─── Player Controls ───────────────────────────────────
  document.getElementById('play-pause')?.addEventListener('click', () => {
    if (isPlaying) {
      stopCurrentTrack();
      document.getElementById('play-pause').textContent = '▶';
      currentTrackIndex = currentTrackIndex; // Remember position
    } else if (currentTrackIndex >= 0) {
      playTrack(currentTrackIndex);
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
    if (masterGain) {
      masterGain.gain.value = e.target.value / 100;
    }
  });

  // Sound category filters
  document.querySelectorAll('.sound-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sound-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTrackList(btn.dataset.cat);
    });
  });

  // ─── Ambient Sound Mixer ───────────────────────────────
  const mixerSources = {};

  // Sound configs must be defined BEFORE the event handler so noise type lookup works
  const soundConfigs = {
    rain: { type: 'bandpass', freq: 1800, q: 0.2, noise: 'white' },
    waves: { type: 'lowpass', freq: 500, q: 0.4, noise: 'white' },
    birds: { type: 'highpass', freq: 3000, q: 0.2, noise: 'white' }
  };

  document.querySelectorAll('.mixer-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const sound = slider.dataset.sound;
      const value = slider.value / 100;

      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      if (value === 0 && mixerSources[sound]) {
        // Stop this sound
        if (mixerSources[sound].interval) clearInterval(mixerSources[sound].interval);
        try { mixerSources[sound].source.stop(); } catch (e) { }
        try { mixerSources[sound].source.disconnect(); } catch (e) { }
        if (mixerSources[sound].lfo) {
          try { mixerSources[sound].lfo.stop(); } catch (e) { }
          try { mixerSources[sound].lfo.disconnect(); } catch (e) { }
        }
        if (mixerSources[sound].gustLfo) {
          try { mixerSources[sound].gustLfo.stop(); } catch (e) { }
          try { mixerSources[sound].gustLfo.disconnect(); } catch (e) { }
        }
        delete mixerSources[sound];
        return;
      }

      if (value > 0 && !mixerSources[sound]) {
        // Create noise source for this sound
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0; // Accumulator for Brown Noise

        if (soundConfigs[sound]?.noise === 'brown') {
          // Brown Noise (Integrated White Noise) - Deep rumble
          for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[i] = lastOut * 3.0; // Boosted for warmth
          }
        } else if (soundConfigs[sound]?.noise === 'pink') {
          // Pink Noise approximation for Wind
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
            data[i] *= 0.11;
            b6 = white * 0.115926;
          }
        } else {
          // White Noise - Sharp texture
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
        }

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        // Filter settings per sound type (config defined above)

        const config = soundConfigs[sound] || { type: 'lowpass', freq: 1000, q: 0.5 };
        filter.type = config.type;
        filter.frequency.value = config.freq;
        filter.Q.value = config.q;

        gain.gain.value = value * 0.4; // Boosted volume

        mixerSources[sound] = { source, filter, gain, currentValue: value };

        if (sound !== 'birds') {
          source.connect(filter).connect(gain).connect(masterGain);

          // FIRE: Flickering and High-Freq CRACKLES
          if (sound === 'fire') {
            const flickerLfo = audioCtx.createOscillator();
            const flickerGain = audioCtx.createGain();
            flickerLfo.type = 'sine';
            flickerLfo.frequency.value = 0.8 + Math.random() * 0.4;
            flickerGain.gain.value = 0.1;
            flickerLfo.connect(flickerGain).connect(gain.gain);
            flickerLfo.start();
            mixerSources[sound].lfo = flickerLfo;
          }

          // WIND: Resonant Whistle (Howling)
          if (sound === 'wind') {
            const whistleFilter = audioCtx.createBiquadFilter();
            whistleFilter.type = 'bandpass';
            whistleFilter.frequency.value = 2500;
            whistleFilter.Q.value = 15; // Very resonant for whistling

            const whistleGain = audioCtx.createGain();
            whistleGain.gain.value = 0; // Starts silent

            const whistleLfo = audioCtx.createOscillator();
            const whistleLfoGain = audioCtx.createGain();
            whistleLfo.frequency.value = 0.05;
            whistleLfoGain.gain.value = 800; // Sweep freq
            whistleLfo.connect(whistleLfoGain).connect(whistleFilter.frequency);
            
            source.connect(whistleFilter).connect(whistleGain).connect(masterGain);
            whistleLfo.start();
            mixerSources[sound].whistleFilter = whistleFilter;
            mixerSources[sound].whistleGain = whistleGain;
            mixerSources[sound].whistleLfo = whistleLfo;
          }

          // WAVES: Slow Ebb and Flow (8 second cycles)
          if (sound === 'waves') {
            const waveLfo = audioCtx.createOscillator();
            const waveLfoGain = audioCtx.createGain();
            waveLfo.type = 'sine';
            waveLfo.frequency.value = 0.125; // 8 second cycle
            waveLfoGain.gain.value = 0.2; 
            waveLfo.connect(waveLfoGain).connect(gain.gain);
            waveLfo.start();
            mixerSources[sound].waveLfo = waveLfo;
          }

          source.start();
        }

        // Special dynamic effects for birds and fire
        if (sound === 'birds') {
          mixerSources[sound].interval = setInterval(() => {
            if (mixerSources[sound] && Math.random() > 0.1) {
              playBirdChirp(mixerSources[sound].currentValue);
            }
          }, 1200);
        } else if (sound === 'fire') {
          mixerSources[sound].interval = setInterval(() => {
            if (mixerSources[sound] && Math.random() > 0.4) {
              playFireCrackle(mixerSources[sound].currentValue);
            }
          }, 450);
        } else if (sound === 'wind' && mixerSources[sound].whistleGain) {
          // Dynamic whistle volume linked to overall wind strength
          mixerSources[sound].whistleGain.gain.setTargetAtTime(value * 0.15, audioCtx.currentTime, 0.5);
        }
      } else if (value > 0 && mixerSources[sound]) {
        // Update volume smoothly
        mixerSources[sound].currentValue = value;
        mixerSources[sound].gain.gain.setTargetAtTime(value * 0.4, audioCtx.currentTime, 0.1);
      }
    });
  });

  function playBirdChirp(volume) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const freq = 2200 + Math.random() * 1800;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, audioCtx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.45, audioCtx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);

    osc.connect(gain).connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  function playFireCrackle(volume) {
    if (!audioCtx) return;

    // Create a short noise burst buffer for each crackle
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.05); // 50ms burst
    const crackleBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = crackleBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = audioCtx.createBufferSource();
    source.buffer = crackleBuffer;
    const gain = audioCtx.createGain();

    gain.gain.setValueAtTime(volume * 0.25, audioCtx.currentTime); // Boosted crackle
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.012);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000; // Slightly brighter pop

    source.connect(filter).connect(gain).connect(masterGain);
    source.start();
  }

  console.log('🎵 Music player initialized');
})();
