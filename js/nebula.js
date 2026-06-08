/* ============================================
   NEBULA · Lógica principal
   Detección de dispositivo + soporte móvil
   ============================================ */
(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let W, H;

  /* ========================================
     DETECCIÓN DE DISPOSITIVO
     ======================================== */
  const detectDevice = () => {
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;

    // Heurística: touch + pantalla chica = móvil, touch + pantalla mediana = tablet
    let type = 'desktop';
    let label = 'Desktop';
    let defaultParticles = 180;

    if (hasTouch) {
      if (width < 768) {
        type = 'mobile';
        label = 'Mobile';
        defaultParticles = 90; // menos partículas para mejor rendimiento
      } else if (width < 1024) {
        type = 'tablet';
        label = 'Tablet';
        defaultParticles = 140;
      } else {
        type = 'touch-laptop';
        label = 'Touch Laptop';
        defaultParticles = 160;
      }
    }

    return { type, label, hasTouch, isPortrait, defaultParticles };
  };

  const device = detectDevice();

  /* ---------- Mostrar badge del dispositivo ---------- */
  const deviceBadge = document.getElementById('deviceBadge');
  const deviceIcons = {
    desktop: '🖥',
    'touch-laptop': '💻',
    tablet: '📱',
    mobile: '📱'
  };
  deviceBadge.textContent = `${deviceIcons[device.type] || '●'} ${device.label}`;
  // El badge se desvanece después de 3 segundos
  setTimeout(() => deviceBadge.classList.add('fade-out'), 2500);
  setTimeout(() => deviceBadge.remove(), 3200);

  /* ---------- Texto informativo según dispositivo ---------- */
  const infoText = document.getElementById('infoText');
  const infoMessages = {
    desktop: 'Mueve el mouse · Clic para enlazar · Scroll para zoom',
    'touch-laptop': 'Toca o mueve el mouse · Clic/tap para enlazar',
    tablet: 'Toca y desliza · Tap para enlazar · Pellizca para zoom',
    mobile: 'Toca y desliza · Tap para enlazar · Pellizca para zoom'
  };
  infoText.textContent = infoMessages[device.type] || infoMessages.desktop;

  /* ========================================
     SETTINGS (valores por defecto según dispositivo)
     ======================================== */
  const settings = {
    count: device.defaultParticles,
    magnetStrength: 1.0,
    captureRadius: device.type === 'mobile' ? 110 : 90, // radio mayor en móvil para compensar dedos
    maxFollowing: device.type === 'mobile' ? 8 : 12,
    zoom: 1.0,
    MAX_LEASH: 140
  };

  /* ========================================
     MOUSE / TOUCH (coordenadas en pantalla y mundo)
     ======================================== */
  const mouseScreen = { x: -9999, y: -9999 };
  const mouse = { x: -9999, y: -9999, clicked: false, clickX: 0, clickY: 0 };

  const screenToWorld = (sx, sy) => ({
    x: (sx - W / 2) / settings.zoom + W / 2,
    y: (sy - H / 2) / settings.zoom + H / 2
  });

  const updateMouseWorld = () => {
    const w = screenToWorld(mouseScreen.x, mouseScreen.y);
    mouse.x = w.x;
    mouse.y = w.y;
  };

  /* ---------- Eventos de mouse (todos los dispositivos) ---------- */
  window.addEventListener('mousemove', e => {
    mouseScreen.x = e.clientX;
    mouseScreen.y = e.clientY;
    updateMouseWorld();
  });

  window.addEventListener('mousedown', e => {
    if (e.target.closest('#panel') || e.target.closest('#toggleBtn')) return;
    mouse.clicked = true;
    const w = screenToWorld(e.clientX, e.clientY);
    mouse.clickX = w.x;
    mouse.clickY = w.y;
  });

  /* ---------- Eventos de touch (solo dispositivos táctiles) ---------- */
  if (device.hasTouch) {
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let isPinching = false;

    const getTouchDist = (t1, t2) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    window.addEventListener('touchstart', e => {
      if (e.target.closest('#panel') || e.target.closest('#toggleBtn')) return;

      if (e.touches.length === 1) {
        // Un dedo: seguir + clic
        const t = e.touches[0];
        mouseScreen.x = t.clientX;
        mouseScreen.y = t.clientY;
        updateMouseWorld();
        mouse.clicked = true;
        mouse.clickX = mouse.x;
        mouse.clickY = mouse.y;
        isPinching = false;
      } else if (e.touches.length === 2) {
        // Dos dedos: iniciar pinch-to-zoom
        e.preventDefault();
        isPinching = true;
        pinchStartDist = getTouchDist(e.touches[0], e.touches[1]);
        pinchStartZoom = settings.zoom;
      }
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      if (e.target.closest('#panel') || e.target.closest('#toggleBtn')) return;

      if (e.touches.length === 1 && !isPinching) {
        const t = e.touches[0];
        mouseScreen.x = t.clientX;
        mouseScreen.y = t.clientY;
        updateMouseWorld();
      } else if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        // Calcular nuevo zoom basado en el ratio de distancia
        const currentDist = getTouchDist(e.touches[0], e.touches[1]);
        const ratio = currentDist / pinchStartDist;
        settings.zoom = Math.max(1, Math.min(4, pinchStartZoom * ratio));
        syncZoomSlider();
      }
    }, { passive: false });

    window.addEventListener('touchend', e => {
      if (e.touches.length < 2) {
        isPinching = false;
      }
      if (e.touches.length === 0) {
        // Mover mouse fuera de la pantalla al soltar todo
        mouseScreen.x = -9999;
        mouseScreen.y = -9999;
        updateMouseWorld();
      }
    });
  }

  /* ---------- Zoom con rueda del mouse ---------- */
  window.addEventListener('wheel', e => {
    if (e.target.closest('#panel')) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    settings.zoom = Math.max(1, Math.min(4, settings.zoom + delta));
    updateMouseWorld();
    syncZoomSlider();
  }, { passive: false });

  /* ========================================
     PARTÍCULAS
     ======================================== */
  const particles = [];
  let clickLinks = [];
  let clickAlpha = 0;

  /* ---------- Pulso magnético del clic ---------- */
  let clickPulse = null;

  const startClickPulse = (px, py) => {
    const mag = settings.magnetStrength;
    const radius = settings.captureRadius * (0.3 + mag * 1.4);
    const force  = 0.04 + mag * 0.14;
    const life   = Math.round(22 + mag * 10);
    clickPulse = { x: px, y: py, life, maxLife: life, radius, force };
  };

  const updateClickPulse = () => {
    if (!clickPulse) return;
    const cp = clickPulse;
    cp.life--;

    for (const p of particles) {
      const dx = cp.x - p.x;
      const dy = cp.y - p.y;
      const d = Math.hypot(dx, dy) + 0.01;
      if (d < cp.radius) {
        const t = 1 - d / cp.radius;
        const fade = cp.life / cp.maxLife;
        const pull = cp.force * t * fade;
        p.x += (dx / d) * pull * 12;
        p.y += (dy / d) * pull * 12;
      }
    }

    if (cp.life <= 0) {
      clickLinks = findNearest(cp.x, cp.y, 6);
      clickAlpha = 1;
      clickPulse = null;
    }
  };

  class Particle {
    constructor() {
      this.baseX = Math.random() * W;
      this.baseY = Math.random() * H;
      this.x = this.baseX;
      this.y = this.baseY;
      this.baseR = 1.5 + Math.random() * 2;
      this.r = this.baseR;
      this.hue = 190 + Math.random() * 80;
      this.following = false;
      this.phaseX = Math.random() * Math.PI * 2;
      this.phaseY = Math.random() * Math.PI * 2;
      this.speedX = 0.003 + Math.random() * 0.004;
      this.speedY = 0.003 + Math.random() * 0.004;
      this.amplitudeX = 2 + Math.random() * 4;
      this.amplitudeY = 2 + Math.random() * 4;
    }
    update(t) {
      const driftX = Math.sin(t * this.speedX + this.phaseX) * this.amplitudeX;
      const driftY = Math.cos(t * this.speedY + this.phaseY) * this.amplitudeY;

      let targetX = this.baseX + driftX;
      let targetY = this.baseY + driftY;

      if (this.following) {
        targetX = mouse.x + driftX * 0.3;
        targetY = mouse.y + driftY * 0.3;

        const distToBase = Math.hypot(this.x - this.baseX, this.y - this.baseY);
        if (distToBase > settings.MAX_LEASH) {
          this.following = false;
        }

        const pull = 0.18 * settings.magnetStrength;
        this.x += (targetX - this.x) * pull;
        this.y += (targetY - this.y) * pull;
      } else {
        const distToMouse = Math.hypot(mouse.x - this.x, mouse.y - this.y);
        if (distToMouse < settings.captureRadius) {
          const followingCount = particles.filter(p => p.following).length;
          if (followingCount < settings.maxFollowing) {
            this.following = true;
          }
        }

        this.x += (targetX - this.x) * 0.08;
        this.y += (targetY - this.y) * 0.08;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      if (this.following) {
        ctx.fillStyle = 'hsl(185, 90%, 85%)';
        ctx.shadowColor = 'hsl(185, 100%, 75%)';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = `hsl(${this.hue}, 85%, 65%)`;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;
        ctx.shadowBlur = 6;
      }
      ctx.fill();
    }
  }

  const initParticles = (n) => {
    particles.length = 0;
    for (let i = 0; i < n; i++) particles.push(new Particle());
  };

  const adjustParticleCount = (target) => {
    while (particles.length < target) particles.push(new Particle());
    while (particles.length > target) particles.pop();
  };

  const resize = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    particles.forEach(p => {
      p.baseX = Math.random() * W;
      p.baseY = Math.random() * H;
      p.x = p.baseX;
      p.y = p.baseY;
    });
  };

  resize();
  initParticles(settings.count);
  window.addEventListener('resize', resize);

  // Sincronizar slider de partículas al valor inicial
  document.getElementById('sCount').value = settings.count;
  document.getElementById('vCount').textContent = settings.count;
  document.getElementById('sRadius').value = settings.captureRadius;
  document.getElementById('vRadius').textContent = settings.captureRadius + 'px';
  document.getElementById('sMax').value = settings.maxFollowing;
  document.getElementById('vMax').textContent = settings.maxFollowing;

  /* ========================================
     UTILIDADES
     ======================================== */
  const findNearest = (px, py, count) => {
    const withDist = particles.map(p => ({
      p,
      d: Math.hypot(p.x - px, p.y - py)
    }));
    withDist.sort((a, b) => a.d - b.d);
    return withDist.slice(0, count);
  };

  /* ========================================
     DIBUJO · Pulso + Enlaces galaxia
     ======================================== */
  const drawClickPulse = () => {
    if (!clickPulse) return;
    const cp = clickPulse;
    const fade = cp.life / cp.maxLife;
    const expand = 1 + (1 - fade) * 0.3;

    ctx.strokeStyle = `hsla(185, 100%, 70%, ${fade * 0.35})`;
    ctx.lineWidth = 1;
    ctx.shadowColor = 'hsl(185, 100%, 75%)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, cp.radius * expand, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `hsla(180, 100%, 90%, ${fade * 0.7})`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, 2.5 * fade, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawClickLinks = (t) => {
    if (clickLinks.length === 0 || clickAlpha <= 0) return;
    ctx.shadowBlur = 0;
    const pts = clickLinks;

    const pulse = 0.85 + Math.sin(t * 0.008) * 0.15;
    const baseAlpha = clickAlpha * pulse;

    const galaxyColors = [
      { h: 180, s: 100, l: 60 },
      { h: 270, s: 95,  l: 70 },
      { h: 320, s: 100, l: 65 },
      { h: 200, s: 100, l: 65 },
    ];

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i].p, b = pts[j].p;
        const c1 = galaxyColors[(i + j) % galaxyColors.length];
        const c2 = galaxyColors[(i + j + 1) % galaxyColors.length];

        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `hsla(${c1.h}, ${c1.s}%, ${c1.l}%, ${baseAlpha * 0.7})`);
        grad.addColorStop(1, `hsla(${c2.h}, ${c2.s}%, ${c2.l}%, ${baseAlpha * 0.7})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = `hsl(${c1.h}, 100%, 70%)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        const gradInner = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        gradInner.addColorStop(0, `hsla(${c1.h}, 100%, 90%, ${baseAlpha * 0.95})`);
        gradInner.addColorStop(1, `hsla(${c2.h}, 100%, 90%, ${baseAlpha * 0.95})`);
        ctx.strokeStyle = gradInner;
        ctx.lineWidth = 0.4;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;

    const nodeGrad = ctx.createRadialGradient(
      mouse.clickX, mouse.clickY, 0,
      mouse.clickX, mouse.clickY, 4 * clickAlpha
    );
    nodeGrad.addColorStop(0, `hsla(180, 100%, 95%, ${clickAlpha * 0.9})`);
    nodeGrad.addColorStop(0.5, `hsla(270, 100%, 75%, ${clickAlpha * 0.5})`);
    nodeGrad.addColorStop(1, `hsla(320, 100%, 65%, 0)`);
    ctx.fillStyle = nodeGrad;
    ctx.shadowColor = 'hsl(270, 100%, 75%)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(mouse.clickX, mouse.clickY, 4 * clickAlpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    clickAlpha -= 0.006;
    if (clickAlpha < 0) clickAlpha = 0;
  };

  const handleClick = () => {
    if (mouse.clicked) {
      mouse.clicked = false;
      startClickPulse(mouse.clickX, mouse.clickY);
    }
  };

  /* ========================================
     LOOP PRINCIPAL
     ======================================== */
  const loop = (t) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    const z = settings.zoom;
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-W / 2, -H / 2);

    handleClick();
    updateClickPulse();
    drawClickPulse();
    drawClickLinks(t);

    for (const p of particles) { p.update(t); p.draw(); }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* ========================================
     PANEL DE CONTROL
     ======================================== */
  const panel = document.getElementById('panel');
  const toggleBtn = document.getElementById('toggleBtn');
  let panelOpen = true;

  const syncZoomSlider = () => {
    document.getElementById('sZoom').value = settings.zoom;
    document.getElementById('vZoom').textContent = settings.zoom.toFixed(2) + '×';
  };

  // En móvil, el panel empieza colapsado para no tapar la pantalla
  if (device.type === 'mobile' || device.type === 'tablet') {
    panelOpen = false;
    panel.classList.add('hidden');
    toggleBtn.classList.remove('hide');
  } else {
    toggleBtn.classList.add('hide');
  }

  toggleBtn.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.classList.toggle('hidden', !panelOpen);
    toggleBtn.classList.toggle('hide', panelOpen);
  });

  // Clic en el título del panel para minimizarlo
  panel.querySelector('h2').addEventListener('click', () => {
    panelOpen = false;
    panel.classList.add('hidden');
    toggleBtn.classList.remove('hide');
  });

  // Evitar que los toques en el panel disparen eventos del canvas
  panel.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
  panel.addEventListener('touchmove', e => e.stopPropagation(), { passive: false });
  toggleBtn.addEventListener('touchstart', e => e.stopPropagation());

  /* ---------- Listeners de sliders ---------- */
  document.getElementById('sCount').addEventListener('input', e => {
    settings.count = parseInt(e.target.value);
    document.getElementById('vCount').textContent = settings.count;
    adjustParticleCount(settings.count);
  });

  document.getElementById('sMagnet').addEventListener('input', e => {
    settings.magnetStrength = parseFloat(e.target.value);
    document.getElementById('vMagnet').textContent = settings.magnetStrength.toFixed(1) + '×';
  });

  document.getElementById('sRadius').addEventListener('input', e => {
    settings.captureRadius = parseInt(e.target.value);
    document.getElementById('vRadius').textContent = settings.captureRadius + 'px';
  });

  document.getElementById('sMax').addEventListener('input', e => {
    settings.maxFollowing = parseInt(e.target.value);
    document.getElementById('vMax').textContent = settings.maxFollowing;
  });

  document.getElementById('sZoom').addEventListener('input', e => {
    settings.zoom = parseFloat(e.target.value);
    document.getElementById('vZoom').textContent = settings.zoom.toFixed(2) + '×';
    updateMouseWorld();
  });

  document.getElementById('resetZoom').addEventListener('click', () => {
    settings.zoom = 1.0;
    syncZoomSlider();
    updateMouseWorld();
  });

  /* ---------- Log del dispositivo detectado ---------- */
  console.log(
    `%c✦ NEBULA %c· ${device.label} detectado`,
    'color: #7ff7ff; font-weight: bold; font-size: 14px;',
    'color: #b8e8ff; font-size: 12px;'
  );
  console.log(`  Tipo: ${device.type} | Touch: ${device.hasTouch} | Partículas por defecto: ${device.defaultParticles}`);
})();
