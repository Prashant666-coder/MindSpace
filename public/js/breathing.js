/**
 * MindSpace 3D – Guided Breathing & Meditation
 * Visual breathing exercises with animated circle and timer.
 * Supports: Box Breathing, 4-7-8, Deep Breathing, and Guided Meditation.
 */

(function () {
  'use strict';

  const breathCircle = document.getElementById('breath-circle');
  const breathInstruction = document.getElementById('breath-instruction');
  const breathTimer = document.getElementById('breath-timer');
  const breathCycles = document.getElementById('breath-cycles');
  const breathTotalTime = document.getElementById('breath-total-time');
  const startBtn = document.getElementById('breath-start-btn');
  const stopBtn = document.getElementById('breath-stop-btn');
  const exerciseCards = document.querySelectorAll('.exercise-card');
  const introOverlay = document.getElementById('breath-intro');
  const introStartBtn = document.getElementById('intro-start-btn');
  const introTitle = document.getElementById('intro-title');
  const introDesc = document.getElementById('intro-desc');
  const targetCyclesInput = document.getElementById('target-cycles');

  // Audio Context for subtle sounds
  let audioCtx = null;
  let masterGain = null;

  // ─── Exercise Configurations ───────────────────────────
  const exercises = {
    box: {
      name: 'Box Breathing',
      desc: 'Also known as square breathing. Used by professionals in high-stress situations.',
      steps: [
        { instruction: 'Breathe In', duration: 4, class: 'inhale' },
        { instruction: 'Hold', duration: 4, class: 'hold' },
        { instruction: 'Breathe Out', duration: 4, class: 'exhale' },
        { instruction: 'Hold', duration: 4, class: 'hold' }
      ]
    },
    '478': {
      name: '4-7-8 Technique',
      desc: 'The "natural tranquilizer" for the nervous system. Great for falling asleep.',
      steps: [
        { instruction: 'Breathe In', duration: 4, class: 'inhale' },
        { instruction: 'Hold', duration: 7, class: 'hold' },
        { instruction: 'Breathe Out', duration: 8, class: 'exhale' }
      ]
    },
    deep: {
      name: 'Deep Breathing',
      desc: 'Simple and effective deep breaths to calm your nervous system.',
      steps: [
        { instruction: 'Breathe In', duration: 5, class: 'inhale' },
        { instruction: 'Breathe Out', duration: 5, class: 'exhale' }
      ]
    },
    meditation: {
      name: 'Guided Meditation',
      desc: 'A calming journey to center your mind and find inner peace.',
      steps: [
        { instruction: 'Close your eyes', duration: 5, class: '' },
        { instruction: 'Breathe naturally', duration: 6, class: 'inhale' },
        { instruction: 'Focus on your breath', duration: 8, class: 'exhale' },
        { instruction: 'Let go of all thoughts', duration: 8, class: 'inhale' },
        { instruction: 'Feel the weight of your body', duration: 8, class: 'hold' },
        { instruction: 'Breathe deeply', duration: 6, class: 'inhale' },
        { instruction: 'Slowly exhale', duration: 6, class: 'exhale' },
        { instruction: 'You are at peace', duration: 5, class: 'hold' }
      ]
    }
  };

  let currentExercise = 'box';
  let isRunning = false;
  let currentStep = 0;
  let stepTimeLeft = 0;
  let cycles = 0;
  let totalSeconds = 0;
  let stepInterval = null;
  let totalInterval = null;

  // ─── Exercise Selection ────────────────────────────────
  exerciseCards.forEach(card => {
    card.addEventListener('click', () => {
      if (isRunning) return; // Don't switch during exercise

      exerciseCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentExercise = card.dataset.exercise;
      resetExercise();
    });
  });

  // ─── Start Breathing Exercise ──────────────────────────
  startBtn.addEventListener('click', () => {
    if (isRunning) return;

    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    cycles = 0;
    totalSeconds = 0;
    currentStep = 0;

    breathCycles.textContent = '0';
    breathTotalTime.textContent = '0:00';

    // Start the total timer
    totalInterval = setInterval(() => {
      totalSeconds++;
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      breathTotalTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);

    // Begin the first step
    runStep();
  });

  // ─── Stop Breathing Exercise ───────────────────────────
  stopBtn.addEventListener('click', stopExercise);

  function stopExercise() {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;

    clearInterval(stepInterval);
    clearInterval(totalInterval);

    // Remove animation classes
    breathCircle.classList.remove('inhale', 'exhale', 'hold');
    breathInstruction.textContent = 'Press Start';
    breathTimer.textContent = '';

    // Track session completion
    if (totalSeconds >= 30 && window.MindSpace) {
      window.MindSpace.incrementSessions();
    }
  }

  function resetExercise() {
    stopExercise();
    cycles = 0;
    totalSeconds = 0;
    breathCycles.textContent = '0';
    breathTotalTime.textContent = '0:00';

    // Show intro with correct details
    const ex = exercises[currentExercise];
    introTitle.textContent = ex.name;
    introDesc.textContent = ex.desc;
    introOverlay.classList.remove('hidden');
  }

  // ─── Audio Helpers ─────────────────────────────────────
  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
  }

  function speak(text, callback) {
    if (!window.speechSynthesis) {
      if (callback) callback();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (callback) {
      utterance.onend = () => callback();
    }

    window.speechSynthesis.speak(utterance);
  }

  function playWhoosh(type, duration) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'inhale' ? 300 : 700, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(type === 'inhale' ? 700 : 300, audioCtx.currentTime + duration);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

    source.connect(filter).connect(gain).connect(masterGain);
    source.start();
  }

  // ─── Intro Control ─────────────────────────────────────
  introStartBtn.addEventListener('click', () => {
    introOverlay.classList.add('hidden');
    initAudio();
    speak("Find a comfortable position. Prepare to begin. Follow my voice.", () => {
      if (!isRunning) startBtn.click();
    });
  });

  // ─── Run a Single Step ─────────────────────────────────
  function runStep() {
    if (!isRunning) return;

    const exercise = exercises[currentExercise];
    const step = exercise.steps[currentStep];

    // Update instruction text
    breathInstruction.textContent = step.instruction;
    stepTimeLeft = step.duration;
    breathTimer.textContent = stepTimeLeft;

    // Update circle animation class
    breathCircle.classList.remove('inhale', 'exhale', 'hold');
    if (step.class) {
      breathCircle.classList.add(step.class);
    }

    // Audio cues
    speak(step.instruction);
    if (step.class === 'inhale' || step.class === 'exhale') {
      playWhoosh(step.class, step.duration);
    }

    // Countdown for this step
    clearInterval(stepInterval);
    stepInterval = setInterval(() => {
      stepTimeLeft--;
      breathTimer.textContent = stepTimeLeft > 0 ? stepTimeLeft : '';

      if (stepTimeLeft <= 0) {
        clearInterval(stepInterval);

        // Move to next step
        currentStep++;
        if (currentStep >= exercise.steps.length) {
          currentStep = 0;
          cycles++;
          breathCycles.textContent = cycles;

          const target = parseInt(targetCyclesInput.value) || 10;
          if (cycles >= target) {
            speak("Exercise complete. Great job.");
            stopExercise();
            return;
          } else {
            speak("Cycle complete.");
          }
        }

        // Continue if still running
        if (isRunning) {
          runStep();
        }
      }
    }, 1000);
  }

  console.log('🌬️ Breathing module initialized');
})();
