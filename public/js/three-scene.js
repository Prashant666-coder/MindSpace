/**
 * MindSpace 3D – Immersive Wellness Scene
 * A calming 3D environment with soft glowing orbs, gentle aurora waves,
 * floating light particles, and smooth camera movement.
 * Performance optimized with requestAnimationFrame and low particle counts.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // ─── Scene Setup ───────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0618, 0.012);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 2, 35);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // ─── Soft Floating Orbs (Large Glowing Spheres) ────────
  const orbGroup = new THREE.Group();
  const orbData = [];

  const orbConfigs = [
    { pos: [-12, 6, -15], color: 0x7c3aed, size: 3.5, speed: 0.15 },
    { pos: [15, -4, -20], color: 0x06b6d4, size: 4, speed: 0.12 },
    { pos: [-8, -6, -10], color: 0xf472b6, size: 2.5, speed: 0.18 },
    { pos: [10, 8, -25], color: 0x34d399, size: 3, speed: 0.1 },
    { pos: [0, -2, -18], color: 0xa78bfa, size: 3.2, speed: 0.14 },
    { pos: [-18, 3, -22], color: 0x67e8f9, size: 2.8, speed: 0.16 },
    { pos: [20, -7, -30], color: 0x60a5fa, size: 3.8, speed: 0.11 }
  ];

  orbConfigs.forEach(function(cfg) {
    var geo = new THREE.SphereGeometry(cfg.size, 24, 24);
    var mat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.07
    });
    var orb = new THREE.Mesh(geo, mat);
    orb.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    orbGroup.add(orb);

    // Outer glow ring
    var ringGeo = new THREE.RingGeometry(cfg.size * 1.2, cfg.size * 1.6, 32);
    var ringMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(orb.position);
    orbGroup.add(ring);

    orbData.push({
      orb: orb, ring: ring, speed: cfg.speed,
      baseY: cfg.pos[1],
      phase: Math.random() * Math.PI * 2
    });
  });

  scene.add(orbGroup);

  // ─── Light Particles (Fireflies) ──────────────────────
  var particleCount = 200;
  var pPositions = new Float32Array(particleCount * 3);
  var pColors = new Float32Array(particleCount * 3);
  var pVelocities = [];

  var palette = [
    new THREE.Color(0x7c3aed),
    new THREE.Color(0x06b6d4),
    new THREE.Color(0xa78bfa),
    new THREE.Color(0x67e8f9),
    new THREE.Color(0xf472b6),
    new THREE.Color(0x34d399),
    new THREE.Color(0x60a5fa),
    new THREE.Color(0xfbbf24)
  ];

  for (var i = 0; i < particleCount; i++) {
    var i3 = i * 3;
    pPositions[i3] = (Math.random() - 0.5) * 70;
    pPositions[i3 + 1] = (Math.random() - 0.5) * 50;
    pPositions[i3 + 2] = (Math.random() - 0.5) * 50 - 10;

    var color = palette[Math.floor(Math.random() * palette.length)];
    pColors[i3] = color.r;
    pColors[i3 + 1] = color.g;
    pColors[i3 + 2] = color.b;

    pVelocities.push({
      x: (Math.random() - 0.5) * 0.008,
      y: (Math.random() - 0.5) * 0.008,
      z: (Math.random() - 0.5) * 0.005,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 1.5
    });
  }

  var pGeometry = new THREE.BufferGeometry();
  pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  pGeometry.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

  var pMaterial = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  var particles = new THREE.Points(pGeometry, pMaterial);
  scene.add(particles);

  // ─── Central Wellness Orb (Breathing Sphere) ──────────
  var centerGeo = new THREE.SphereGeometry(2.5, 48, 48);
  var centerMat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed,
    transparent: true,
    opacity: 0.12,
    wireframe: true
  });
  var centerOrb = new THREE.Mesh(centerGeo, centerMat);
  scene.add(centerOrb);

  var centerInnerGeo = new THREE.SphereGeometry(2, 32, 32);
  var centerInnerMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.06
  });
  var centerInner = new THREE.Mesh(centerInnerGeo, centerInnerMat);
  scene.add(centerInner);

  var glowGeo = new THREE.SphereGeometry(4, 32, 32);
  var glowMat = new THREE.MeshBasicMaterial({
    color: 0xa78bfa,
    transparent: true,
    opacity: 0.03,
    side: THREE.BackSide
  });
  var glowShell = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glowShell);

  // ─── Soft Constellation Lines ─────────────────────────
  var lineCount = 30;
  var linePositions = new Float32Array(lineCount * 6);
  var lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  var lineMat = new THREE.LineBasicMaterial({
    color: 0x7c3aed,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending
  });
  var lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  // ─── Mouse Interaction ─────────────────────────────────
  var mouseX = 0, mouseY = 0;
  var targetMouseX = 0, targetMouseY = 0;

  document.addEventListener('mousemove', function(e) {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ─── Animation Loop ────────────────────────────────────
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var elapsed = clock.getElapsedTime();
    var posArray = pGeometry.attributes.position.array;

    // Smooth mouse following
    mouseX += (targetMouseX - mouseX) * 0.02;
    mouseY += (targetMouseY - mouseY) * 0.02;

    // Animate light particles with gentle drift
    for (var i = 0; i < particleCount; i++) {
      var i3 = i * 3;
      var vel = pVelocities[i];

      posArray[i3] += vel.x + Math.sin(elapsed * 0.2 + vel.phase) * 0.003;
      posArray[i3 + 1] += vel.y + Math.cos(elapsed * 0.15 + vel.phase) * 0.003;
      posArray[i3 + 2] += vel.z;

      // Wrap around
      if (posArray[i3] > 35) posArray[i3] = -35;
      if (posArray[i3] < -35) posArray[i3] = 35;
      if (posArray[i3 + 1] > 25) posArray[i3 + 1] = -25;
      if (posArray[i3 + 1] < -25) posArray[i3 + 1] = 25;
      if (posArray[i3 + 2] > 10) posArray[i3 + 2] = -40;
      if (posArray[i3 + 2] < -40) posArray[i3 + 2] = 10;
    }
    pGeometry.attributes.position.needsUpdate = true;

    // Pulse particle opacity (breathing effect)
    pMaterial.opacity = 0.4 + Math.sin(elapsed * 0.5) * 0.15;

    // Animate floating orbs
    for (var o = 0; o < orbData.length; o++) {
      var d = orbData[o];
      d.orb.position.y = d.baseY + Math.sin(elapsed * d.speed + d.phase) * 2;
      d.orb.rotation.x = elapsed * 0.03;
      d.orb.rotation.z = elapsed * 0.02;
      d.ring.position.y = d.orb.position.y;
      d.ring.rotation.x = elapsed * 0.05 + d.phase;
      d.ring.rotation.y = elapsed * 0.03;
      d.ring.material.opacity = 0.03 + Math.sin(elapsed * d.speed * 2 + d.phase) * 0.015;
    }

    // Central orb breathing animation
    var breathScale = 1 + Math.sin(elapsed * 0.4) * 0.15;
    centerOrb.scale.setScalar(breathScale);
    centerOrb.rotation.x = elapsed * 0.08;
    centerOrb.rotation.y = elapsed * 0.1;
    centerInner.scale.setScalar(breathScale * 0.85);
    centerInner.rotation.x = -elapsed * 0.06;
    centerInner.rotation.z = elapsed * 0.09;
    glowShell.scale.setScalar(breathScale * 1.2);
    centerMat.opacity = 0.08 + Math.sin(elapsed * 0.4) * 0.04;

    // Update constellation lines
    var lPosArray = lineGeo.attributes.position.array;
    var lIdx = 0;
    var maxDist = 14;

    for (var a = 0; a < Math.min(particleCount, 40) && lIdx < lineCount * 6; a++) {
      for (var b = a + 1; b < Math.min(particleCount, 40) && lIdx < lineCount * 6; b++) {
        var a3 = a * 3, b3 = b * 3;
        var dx = posArray[a3] - posArray[b3];
        var dy = posArray[a3 + 1] - posArray[b3 + 1];
        var dz = posArray[a3 + 2] - posArray[b3 + 2];
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDist) {
          lPosArray[lIdx++] = posArray[a3];
          lPosArray[lIdx++] = posArray[a3 + 1];
          lPosArray[lIdx++] = posArray[a3 + 2];
          lPosArray[lIdx++] = posArray[b3];
          lPosArray[lIdx++] = posArray[b3 + 1];
          lPosArray[lIdx++] = posArray[b3 + 2];
        }
      }
    }
    for (var c = lIdx; c < lPosArray.length; c++) lPosArray[c] = 0;
    lineGeo.attributes.position.needsUpdate = true;

    // Gentle camera sway + mouse follow
    camera.position.x += (mouseX * 2.5 - camera.position.x) * 0.015;
    camera.position.y += (-mouseY * 2 + 2 - camera.position.y) * 0.015;
    camera.position.x += Math.sin(elapsed * 0.08) * 0.01;
    camera.position.y += Math.cos(elapsed * 0.06) * 0.008;
    camera.lookAt(0, 0, -5);

    // Slowly rotate particles
    particles.rotation.y = elapsed * 0.01;

    renderer.render(scene, camera);
  }

  animate();

  // ─── Handle Window Resize ──────────────────────────────
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  console.log('✨ MindSpace 3D wellness scene initialized');
})();
