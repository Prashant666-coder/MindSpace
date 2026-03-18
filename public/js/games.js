/**
 * MindSpace 3D – Stress Relief Games
 * Interactive mini-games for relaxation:
 * 1. Bubble Popping – Pop colorful bubbles
 * 2. Zen Garden – Place stones, plants, and ripples
 * 3. Color Flow – Paint with flowing colors
 */

(function () {
  'use strict';

  // ─── Game Tab Switching ────────────────────────────────
  const gameTabs = document.querySelectorAll('.game-tab');
  const gameAreas = document.querySelectorAll('.game-area');

  gameTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      gameTabs.forEach(t => t.classList.remove('active'));
      gameAreas.forEach(a => a.classList.remove('active'));
      tab.classList.add('active');
      const gameId = `game-${tab.dataset.game}`;
      document.getElementById(gameId)?.classList.add('active');

      // Initialize the selected game canvas
      if (tab.dataset.game === 'bubbles') initBubbleGame();
      if (tab.dataset.game === 'garden') initZenGarden();
      if (tab.dataset.game === 'coloring') initColorFlow();
    });
  });

  // ═══════════════════════════════════════════════════════
  // WEBAUDIO SETUP FOR GAMES
  // ═══════════════════════════════════════════════════════
  let audioCtx = null;
  function playRelaxingPop() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Gentle sine wave for a water drop/marimba feel
      osc.type = 'sine';
      // Harmonic frequency based on pentatonic scale for pleasant sound
      const frequencies = [329.63, 392.00, 440.00, 523.25, 659.25, 783.99]; 
      const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      // Soft attack, smooth decay
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.7);
    } catch (err) {
      console.warn('Audio context not supported or failed to play', err);
    }
  }

  // ═══════════════════════════════════════════════════════
  // GAME 1: BUBBLE POPPING
  // ═══════════════════════════════════════════════════════
  const bubbleCanvas = document.getElementById('bubble-canvas');
  const bubbleCtx = bubbleCanvas?.getContext('2d');
  let bubbles = [];
  let bubbleScore = 0;
  let bubbleAnimId = null;
  let bubbleGameRunning = false;

  initBubbleGame();

  function initBubbleGame() {
    if (!bubbleCanvas || !bubbleCtx) return;
    resizeCanvas(bubbleCanvas);
  }

  function resizeCanvas(canvas) {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 48; // Account for padding
    canvas.height = 400;
  }

  // Bubble class
  class Bubble {
    constructor(canvasWidth, canvasHeight) {
      // Larger bubbles for easier trackpad clicking
      this.radius = Math.random() * 40 + 25;
      this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
      this.y = canvasHeight + this.radius;
      // Slower rising speed for relaxation
      this.speed = Math.random() * 0.8 + 0.2;
      this.wobble = Math.random() * 2 - 1;
      this.wobbleSpeed = Math.random() * 0.02 + 0.01;
      this.wobblePhase = Math.random() * Math.PI * 2;
      this.opacity = 0.7 + Math.random() * 0.3;
      this.popped = false;
      this.popProgress = 0;

      // Calming colors
      const colors = [
        'rgba(124, 58, 237, ', 'rgba(6, 182, 212, ',
        'rgba(167, 139, 250, ', 'rgba(103, 232, 249, ',
        'rgba(244, 114, 182, ', 'rgba(52, 211, 153, ',
        'rgba(96, 165, 250, '
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      if (this.popped) {
        this.popProgress += 0.05;
        this.radius += 2;
        this.opacity -= 0.05;
        return this.opacity <= 0;
      }

      this.y -= this.speed;
      this.wobblePhase += this.wobbleSpeed;
      this.x += Math.sin(this.wobblePhase) * this.wobble;
      return this.y + this.radius < 0;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${this.color}${this.opacity})`;
      ctx.fill();

      // Shine effect
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.5})`;
      ctx.fill();

      // Border
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${this.color}${this.opacity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    isHit(mx, my) {
      const dx = mx - this.x;
      const dy = my - this.y;
      return Math.sqrt(dx * dx + dy * dy) < this.radius;
    }
  }

  // Start bubble game
  document.getElementById('bubble-start')?.addEventListener('click', () => {
    cancelAnimationFrame(bubbleAnimId);
    initBubbleGame();
    bubbleGameRunning = true;
    bubbleScore = 0;
    bubbles = [];
    document.getElementById('bubble-score').textContent = '0';
    animateBubbles();
  });

  // Reset bubble game
  document.getElementById('bubble-reset')?.addEventListener('click', () => {
    bubbleGameRunning = false;
    cancelAnimationFrame(bubbleAnimId);
    bubbles = [];
    bubbleScore = 0;
    document.getElementById('bubble-score').textContent = '0';
    if (bubbleCtx) {
      bubbleCtx.clearRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);
    }
  });

  // Pop bubbles on click
  bubbleCanvas?.addEventListener('click', (e) => {
    if (!bubbleGameRunning) return;
    const rect = bubbleCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    bubbles.forEach(bubble => {
      if (!bubble.popped && bubble.isHit(mx, my)) {
        bubble.popped = true;
        bubbleScore++;
        document.getElementById('bubble-score').textContent = bubbleScore;
        playRelaxingPop();
      }
    });
  });

  function animateBubbles() {
    if (!bubbleGameRunning || !bubbleCtx) return;

    bubbleCtx.clearRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);

    // Spawn new bubbles at a much slower rate (fewer balloons)
    if (Math.random() < 0.015) {
      bubbles.push(new Bubble(bubbleCanvas.width, bubbleCanvas.height));
    }

    // Update and draw
    bubbles = bubbles.filter(bubble => {
      const shouldRemove = bubble.update();
      if (!shouldRemove) bubble.draw(bubbleCtx);
      return !shouldRemove;
    });

    bubbleAnimId = requestAnimationFrame(animateBubbles);
  }

  // ═══════════════════════════════════════════════════════
  // GAME 2: ZEN GARDEN
  // ═══════════════════════════════════════════════════════
  const gardenCanvas = document.getElementById('garden-canvas');
  const gardenCtx = gardenCanvas?.getContext('2d');
  let gardenElements = [];
  let currentTool = 'stone';
  let gardenInitialized = false;

  function initZenGarden() {
    if (!gardenCanvas || !gardenCtx || gardenInitialized) return;
    resizeCanvas(gardenCanvas);
    gardenInitialized = true;
    drawSandPattern();
  }

  function drawSandPattern() {
    if (!gardenCtx) return;
    // Draw sand background with subtle lines
    gardenCtx.fillStyle = '#1a1133';
    gardenCtx.fillRect(0, 0, gardenCanvas.width, gardenCanvas.height);

    gardenCtx.strokeStyle = 'rgba(167, 139, 250, 0.06)';
    gardenCtx.lineWidth = 1;
    for (let y = 0; y < gardenCanvas.height; y += 8) {
      gardenCtx.beginPath();
      gardenCtx.moveTo(0, y);
      for (let x = 0; x < gardenCanvas.width; x += 5) {
        gardenCtx.lineTo(x, y + Math.sin(x * 0.02) * 3);
      }
      gardenCtx.stroke();
    }
  }

  // Garden tool selection
  document.querySelectorAll('.garden-tool').forEach(tool => {
    tool.addEventListener('click', () => {
      document.querySelectorAll('.garden-tool').forEach(t => t.classList.remove('active'));
      tool.classList.add('active');
      currentTool = tool.dataset.tool;
    });
  });

  // Place garden elements
  gardenCanvas?.addEventListener('click', (e) => {
    const rect = gardenCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gardenElements.push({ type: currentTool, x, y, time: Date.now() });
    redrawGarden();
  });

  // Clear garden
  document.getElementById('garden-clear')?.addEventListener('click', () => {
    gardenElements = [];
    if (gardenCtx) {
      drawSandPattern();
    }
  });

  function redrawGarden() {
    if (!gardenCtx) return;
    drawSandPattern();

    gardenElements.forEach(el => {
      gardenCtx.save();
      gardenCtx.translate(el.x, el.y);

      switch (el.type) {
        case 'stone':
          // Draw a rounded stone
          gardenCtx.beginPath();
          gardenCtx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
          gardenCtx.fillStyle = 'rgba(120, 100, 140, 0.8)';
          gardenCtx.fill();
          gardenCtx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
          gardenCtx.lineWidth = 1;
          gardenCtx.stroke();
          // Highlight
          gardenCtx.beginPath();
          gardenCtx.ellipse(-4, -4, 6, 4, -0.3, 0, Math.PI * 2);
          gardenCtx.fillStyle = 'rgba(200, 180, 220, 0.3)';
          gardenCtx.fill();
          break;

        case 'plant':
          // Draw a small plant
          gardenCtx.fillStyle = 'rgba(52, 211, 153, 0.7)';
          for (let i = 0; i < 5; i++) {
            gardenCtx.beginPath();
            const angle = (i * 72 - 90) * Math.PI / 180;
            gardenCtx.ellipse(
              Math.cos(angle) * 8, Math.sin(angle) * 8,
              8, 4, angle, 0, Math.PI * 2
            );
            gardenCtx.fill();
          }
          // Center
          gardenCtx.beginPath();
          gardenCtx.arc(0, 0, 4, 0, Math.PI * 2);
          gardenCtx.fillStyle = 'rgba(34, 197, 94, 0.8)';
          gardenCtx.fill();
          break;

        case 'ripple':
          // Draw water ripples
          for (let r = 3; r > 0; r--) {
            gardenCtx.beginPath();
            gardenCtx.arc(0, 0, r * 12, 0, Math.PI * 2);
            gardenCtx.strokeStyle = `rgba(6, 182, 212, ${0.3 / r})`;
            gardenCtx.lineWidth = 2;
            gardenCtx.stroke();
          }
          break;

        case 'flower':
          // Draw a flower
          const petalColors = ['rgba(244, 114, 182, 0.7)', 'rgba(251, 191, 36, 0.7)', 'rgba(167, 139, 250, 0.7)'];
          const color = petalColors[Math.floor(Math.random() * petalColors.length)];
          for (let i = 0; i < 6; i++) {
            gardenCtx.beginPath();
            const angle = (i * 60) * Math.PI / 180;
            gardenCtx.ellipse(
              Math.cos(angle) * 10, Math.sin(angle) * 10,
              8, 5, angle, 0, Math.PI * 2
            );
            gardenCtx.fillStyle = color;
            gardenCtx.fill();
          }
          gardenCtx.beginPath();
          gardenCtx.arc(0, 0, 5, 0, Math.PI * 2);
          gardenCtx.fillStyle = 'rgba(251, 191, 36, 0.9)';
          gardenCtx.fill();
          break;
      }

      gardenCtx.restore();
    });
  }

  // ═══════════════════════════════════════════════════════
  // GAME 3: COLOR FLOW
  // ═══════════════════════════════════════════════════════
  const colorCanvas = document.getElementById('color-canvas');
  const colorCtx = colorCanvas?.getContext('2d');
  let isDrawing = false;
  let hue = 0;
  let colorFlowInitialized = false;

  function initColorFlow() {
    if (!colorCanvas || !colorCtx || colorFlowInitialized) return;
    resizeCanvas(colorCanvas);
    colorFlowInitialized = true;
    // Dark background
    colorCtx.fillStyle = '#0f0b1a';
    colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
  }

  // Drawing events
  colorCanvas?.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = colorCanvas.getBoundingClientRect();
    drawColor(e.clientX - rect.left, e.clientY - rect.top);
  });
  colorCanvas?.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = colorCanvas.getBoundingClientRect();
    drawColor(e.clientX - rect.left, e.clientY - rect.top);
  });
  colorCanvas?.addEventListener('mouseup', () => isDrawing = false);
  colorCanvas?.addEventListener('mouseleave', () => isDrawing = false);

  // Touch support
  colorCanvas?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const rect = colorCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    drawColor(touch.clientX - rect.left, touch.clientY - rect.top);
  });
  colorCanvas?.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const rect = colorCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    drawColor(touch.clientX - rect.left, touch.clientY - rect.top);
  });
  colorCanvas?.addEventListener('touchend', () => isDrawing = false);

  function drawColor(x, y) {
    if (!colorCtx) return;
    const brushSize = document.getElementById('brush-size')?.value || 20;

    hue = (hue + 1) % 360;

    colorCtx.beginPath();
    colorCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    colorCtx.fillStyle = `hsla(${hue}, 80%, 60%, 0.4)`;
    colorCtx.fill();

    // Glow effect
    colorCtx.beginPath();
    colorCtx.arc(x, y, brushSize / 1.5, 0, Math.PI * 2);
    colorCtx.fillStyle = `hsla(${hue}, 90%, 70%, 0.1)`;
    colorCtx.fill();
  }

  // Clear color canvas
  document.getElementById('color-clear')?.addEventListener('click', () => {
    if (!colorCtx) return;
    colorCtx.fillStyle = '#0f0b1a';
    colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
  });

  // ─── Handle Window Resize ──────────────────────────────
  window.addEventListener('resize', () => {
    if (bubbleCanvas) resizeCanvas(bubbleCanvas);
    if (gardenCanvas) {
      resizeCanvas(gardenCanvas);
      redrawGarden();
    }
    if (colorCanvas) {
      resizeCanvas(colorCanvas);
      if (colorCtx) {
        colorCtx.fillStyle = '#0f0b1a';
        colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
      }
    }
  });

  // Initialize first game on load
  setTimeout(initBubbleGame, 500);

  console.log('🎮 Games module initialized');
})();
