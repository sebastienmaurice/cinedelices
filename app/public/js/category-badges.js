/**
 * category-badges.js — Badges genre cinéma
 * Canvas border animé par genre + burst au clic + carousel infini
 */
(function () {
  'use strict';

  /* ═══ ESPACE DE DÉBORDEMENT CANVAS ═══
     PAD px autour du badge dans le canvas → les particules peuvent déborder.
     Le border tracé commence à (PAD, PAD) dans le canvas. */
  const PAD = 20;

  /* ═══ GUARDS ═══ */
  const track = document.getElementById('track');
  if (!track) return;
  const outer = document.getElementById('carouselOuter');
  if (!outer) return;

  /* ═══ BURST CANVAS (fixed, global) ═══ */
  const burstCanvas = document.getElementById('burst-canvas');
  if (burstCanvas) {
    burstCanvas.width = window.innerWidth;
    burstCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      burstCanvas.width = window.innerWidth;
      burstCanvas.height = window.innerHeight;
    });
  }

  /* ═══ LAZY LOAD ═══ */
  const imgObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const i = e.target;
        if (i.dataset.src) i.src = i.dataset.src;
        imgObserver.unobserve(i);
      }
    });
  }, { rootMargin: '200px' });

  function lazyObserve(img) {
    const s = img.getAttribute('src') || '';
    if (s) { img.dataset.src = s; img.removeAttribute('src'); }
    imgObserver.observe(img);
  }

  track.querySelectorAll('.badge__img').forEach(lazyObserve);

  /* ═══ TRACK DUPE — infinite scroll ═══
     Les originaux reçoivent data-badge-id.
     Les clones reçoivent data-clone-of (pas de tooltip).
     On clone 3× pour garantir que le track dépasse toujours le viewport,
     même avec peu de genres. */
  const originals = Array.from(track.children);
  originals.forEach((n, i) => { n.dataset.badgeId = i; });
  for (let copy = 0; copy < 3; copy++) {
    originals.forEach(n => {
      const c = n.cloneNode(true);
      c.querySelectorAll('.badge__img').forEach(lazyObserve);
      c.dataset.cloneOf = n.dataset.badgeId;
      const tt = c.querySelector('.tooltip');
      if (tt) tt.remove();
      track.appendChild(c);
    });
  }

  /* ═══ TOOLTIPS ═══ */
  track.querySelectorAll('.badge:not([data-clone-of])').forEach(badge => {
    const tt = badge.querySelector('.tooltip');
    if (!tt) return;
    const genre = badge.dataset.genre || '';
    let films = [];
    try { films = JSON.parse(badge.dataset.films || '[]'); } catch (e) {}
    tt.innerHTML = `
      <div class="tooltip__genre">${genre}</div>
      <div class="tooltip__films">${films.map(f =>
        `<div class="tooltip__film">
          <span class="tooltip__film-title">${f.t}</span>
          <span class="tooltip__film-note">★ ${f.n}</span>
        </div>`).join('')}
      </div>
      <a class="tooltip__hint" href="/movies?genre=${encodeURIComponent(genre)}">Cliquer pour explorer →</a>`;
  });

  /* ═══════════════════════════════════════════
     BURST SYSTEM — particules au clic
  ═══════════════════════════════════════════ */
  let burstParticles = [];

  const BURST_DEFS = {
    blood: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 22; i++) {
          const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 7;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, decay: .022 + Math.random() * .012, r: 2 + Math.random() * 4, col: `rgba(${rgb},`, type: 'drop', gravity: .12 });
        }
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .04, r: 55, col: `rgba(${rgb},`, type: 'flash' });
      }
    },
    confetti: {
      fn(cx, cy, rgb) {
        const cols = ['#FF6B6B', '#FFE085', '#6BFFA0', '#6BCFFF', '#FF9F40', '#DA77FF', '#FF8FA3'];
        for (let i = 0; i < 45; i++) {
          const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 9;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, life: 1, decay: .013 + Math.random() * .008, w: 4 + Math.random() * 7, h: 3 + Math.random() * 4, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - .5) * .35, col: cols[Math.floor(Math.random() * cols.length)], type: 'confetti', gravity: .09 });
        }
      }
    },
    scan: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2, len = 30 + Math.random() * 50;
          burstParticles.push({ x: cx, y: cy, a, len, life: 1, decay: .045, col: `rgba(${rgb},`, type: 'ray' });
        }
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .025, r: 2 + Math.random() * 3, col: `rgba(${rgb},`, type: 'dot', gravity: 0 });
        }
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .06, r: 40, col: `rgba(${rgb},`, type: 'flash' });
      }
    },
    magic: {
      fn(cx, cy, rgb) {
        const oc = ['#C084FC', '#60A5FA', '#F59E0B', '#34D399', '#F472B6', '#fff'];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          for (let j = 0; j < 3; j++) {
            const sp = 3 + j * 2.5;
            burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .018 + j * .005, r: 3 - j * .5, col: oc[i % oc.length], type: 'orb', gravity: -.01 });
          }
        }
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 7;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1, decay: .02, r: 2, col: '#fff', type: 'star', gravity: .02 });
        }
      }
    },
    fuse: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 30; i++) {
          const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 8;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, life: 1, decay: .018, r: 2 + Math.random() * 4, col: `rgba(${rgb},`, type: 'ember', gravity: .14 });
        }
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .05, r: 48, col: `rgba(${rgb},`, type: 'flash' });
      }
    },
    bullet: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2, sp = 4 + Math.random() * 10;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .020 + Math.random() * .010, r: 1.5 + Math.random() * 3.5, col: `rgba(${rgb},`, type: 'shard', gravity: .08 });
        }
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .07, r: 60, col: `rgba(255,220,100,`, type: 'flash' });
      }
    },
    heart: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, life: 1, decay: .016, r: 4 + Math.random() * 5, col: `rgba(${rgb},`, type: 'heart', gravity: .05 });
        }
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .04, r: 50, col: `rgba(${rgb},`, type: 'flash' });
      }
    },
    torch: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 35; i++) {
          const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI, sp = 3 + Math.random() * 9;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, decay: .018, r: 2 + Math.random() * 4, col: Math.random() < .5 ? `rgba(255,180,40,` : `rgba(${rgb},`, type: 'ember', gravity: .10 });
        }
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .04, r: 55, col: `rgba(${rgb},`, type: 'flash' });
      }
    },
    notes: {
      fn(cx, cy, rgb) {
        const syms = ['♪', '♫', '♩', '♬', '♭', '♮'];
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, life: 1, decay: .013, sym: syms[Math.floor(Math.random() * syms.length)], col: `rgba(${rgb},`, type: 'note', gravity: .04 });
        }
      }
    },
    siren: {
      fn(cx, cy, rgb) {
        [[0, 100, 255], [210, 20, 20]].forEach(([r, g, b]) => {
          for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 8;
            burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .022, r: 3 + Math.random() * 4, col: `rgba(${r},${g},${b},`, type: 'dot', gravity: .05 });
          }
        });
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .05, r: 55, col: `rgba(255,200,200,`, type: 'flash' });
      }
    },
    strobe: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 5; i++) setTimeout(() => burstParticles.push({ x: cx, y: cy, life: 1, decay: .12, r: 70 + i * 15, col: `rgba(${rgb},`, type: 'flash' }), i * 60);
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .022, r: 2 + Math.random() * 3, col: `rgba(${rgb},`, type: 'dot', gravity: .03 });
        }
      }
    },
    brush: {
      fn(cx, cy, rgb) {
        const cols = ['#FF6B6B', '#FFE085', '#6BFFA0', '#6BCFFF', '#FF9F40', '#DA77FF', '#F2C84B'];
        for (let i = 0; i < 30; i++) {
          const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 8;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, decay: .015 + Math.random() * .010, r: 3 + Math.random() * 5, col: cols[Math.floor(Math.random() * cols.length)], type: 'dot', gravity: .06 });
        }
      }
    },
    viewfinder: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2, len = 20 + Math.random() * 35;
          burstParticles.push({ x: cx, y: cy, a, len: len * .3, maxLen: len, life: 1, decay: .035, col: `rgba(${rgb},`, type: 'ray' });
        }
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .06, r: 38, col: `rgba(${rgb},`, type: 'flash' });
      }
    },
    radar: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .018, r: 2 + Math.random() * 3, col: `rgba(100,200,100,`, type: 'dot', gravity: .02 });
        }
        for (let i = 0; i < 3; i++) setTimeout(() => burstParticles.push({ x: cx, y: cy, life: 1, decay: .08, r: 30 + i * 25, col: `rgba(100,255,100,`, type: 'ring' }), i * 80);
      }
    },
    tear: {
      fn(cx, cy, rgb) {
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .016, r: 3 + Math.random() * 4, col: `rgba(${rgb},`, type: 'drop', gravity: .09 });
        }
        ['rgba(255,100,100,', 'rgba(100,255,100,', 'rgba(100,100,255,'].forEach((c, i) => {
          const a = (i / 3) * Math.PI * 2, sp = 5 + Math.random() * 5;
          burstParticles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, decay: .020, r: 5, col: c, type: 'dot', gravity: .07 });
        });
        burstParticles.push({ x: cx, y: cy, life: 1, decay: .04, r: 42, col: `rgba(${rgb},`, type: 'flash' });
      }
    },
  };

  function triggerBurst(badge) {
    const anim = badge.dataset.anim || 'confetti';
    const rgb = getComputedStyle(badge).getPropertyValue('--glow-rgb').trim();
    const rect = badge.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const def = BURST_DEFS[anim] || BURST_DEFS.confetti;
    def.fn(cx, cy, rgb);
  }

  function renderBursts() {
    if (!burstCanvas) return;
    const ctx = burstCanvas.getContext('2d');
    if (!burstParticles.length) { ctx.clearRect(0, 0, burstCanvas.width, burstCanvas.height); return; }
    ctx.clearRect(0, 0, burstCanvas.width, burstCanvas.height);
    burstParticles = burstParticles.filter(p => p.life > 0);
    burstParticles.forEach(p => {
      const a = Math.max(0, p.life);
      if (p.type === 'flash') {
        p.r *= .88; p.life -= p.decay;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, p.col + a * .5 + ')'); g.addColorStop(.5, p.col + a * .18 + ')'); g.addColorStop(1, p.col + '0)');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      } else if (p.type === 'ring') {
        p.r += 2; p.life -= p.decay;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = p.col + a * .7 + ')'; ctx.lineWidth = 2; ctx.stroke();
      } else if (p.type === 'ray') {
        p.len = Math.min((p.len || 0) + 3, (p.maxLen || p.len)); p.life -= p.decay;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(p.a) * p.len, p.y + Math.sin(p.a) * p.len);
        ctx.strokeStyle = p.col + a * .85 + ')'; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (p.type === 'note') {
        p.x += p.vx * .6; p.y += p.vy * .6; p.vy += (p.gravity || 0) * .6; p.vx *= .97; p.life -= p.decay;
        ctx.font = `${14 + p.life * 6}px serif`; ctx.globalAlpha = a; ctx.fillStyle = p.col + '.9)'; ctx.fillText(p.sym, p.x - 6, p.y + 5); ctx.globalAlpha = 1;
      } else if (p.type === 'confetti') {
        p.x += p.vx * .7; p.y += p.vy * .7; p.vy += (p.gravity || 0) * .7; p.vx *= .98; p.rot += p.vrot * .7; p.life -= p.decay;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = a; ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); ctx.globalAlpha = 1;
      } else if (p.type === 'heart') {
        p.x += p.vx * .6; p.y += p.vy * .6; p.vy += (p.gravity || 0) * .6; p.vx *= .97; p.life -= p.decay;
        const hs = p.r;
        ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = a;
        ctx.beginPath(); ctx.moveTo(0, -hs * .4); ctx.bezierCurveTo(hs * .5, -hs, hs, -hs * .5, 0, hs * .5); ctx.bezierCurveTo(-hs, -hs * .5, -hs * .5, -hs, 0, -hs * .4);
        ctx.fillStyle = p.col + a * .9 + ')'; ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
      } else {
        p.x += p.vx * .7; p.y += p.vy * .7; p.vy += (p.gravity || 0) * .7; p.vx *= .97; p.life -= p.decay;
        if (p.type === 'orb') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2);
          g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.4, p.col + a * .8 + ')'); g.addColorStop(1, p.col + '0)');
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = p.col + a * .9 + ')'; ctx.fill();
        }
      }
    });
  }

  /* ═══ CLICK — TOOLTIP + BURST ═══ */
  let openBadge = null;
  track.querySelectorAll('.badge').forEach(b => {
    b.addEventListener('click', e => {
      if (e.target.closest('.tooltip__hint')) return; // laisser le lien naviguer
      e.stopPropagation();
      const sourceId = b.dataset.cloneOf;
      const target = sourceId != null
        ? track.querySelector(`.badge[data-badge-id="${sourceId}"]`) || b
        : b;
      const wasOpen = target.classList.contains('tooltip-open');
      if (openBadge && openBadge !== target) openBadge.classList.remove('tooltip-open');
      target.classList.toggle('tooltip-open');
      openBadge = target.classList.contains('tooltip-open') ? target : null;
      if (!wasOpen) triggerBurst(b);
    });
  });
  document.addEventListener('click', () => {
    if (openBadge) { openBadge.classList.remove('tooltip-open'); openBadge = null; }
  });

  /* ═══ COUNTER ANIMÉ ═══ */
  function animateCounter(el, target) {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    const s = performance.now();
    function step(n) {
      const p = Math.min((n - s) / 650, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(e * target);
      if (p < 1) requestAnimationFrame(step); else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  track.querySelectorAll('.badge:not([data-clone-of])').forEach(b => {
    const st = b.querySelector('[data-target]');
    if (!st) return;
    b.addEventListener('mouseenter', () => animateCounter(st, parseInt(st.dataset.target)), { once: true });
  });

  /* ═══════════════════════════════════════════
     GÉOMÉTRIE CANVAS
  ═══════════════════════════════════════════ */

  function rrp(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function bperim(w, h, r) { return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r; }

  function ponb(t, w, h, r) {
    let d = ((t % 1) + 1) % 1 * bperim(w, h, r);
    const S = [
      { l: w - 2 * r, f: u => ({ x: r + u * (w - 2 * r), y: 0 }) },
      { l: Math.PI * r / 2, f: u => { const a = -Math.PI / 2 + u * Math.PI / 2; return { x: w - r + Math.cos(a) * r, y: r + Math.sin(a) * r }; } },
      { l: h - 2 * r, f: u => ({ x: w, y: r + u * (h - 2 * r) }) },
      { l: Math.PI * r / 2, f: u => { const a = u * Math.PI / 2; return { x: w - r + Math.cos(a) * r, y: h - r + Math.sin(a) * r }; } },
      { l: w - 2 * r, f: u => ({ x: w - r - u * (w - 2 * r), y: h }) },
      { l: Math.PI * r / 2, f: u => { const a = Math.PI / 2 + u * Math.PI / 2; return { x: r + Math.cos(a) * r, y: h - r + Math.sin(a) * r }; } },
      { l: h - 2 * r, f: u => ({ x: 0, y: h - r - u * (h - 2 * r) }) },
      { l: Math.PI * r / 2, f: u => { const a = Math.PI + u * Math.PI / 2; return { x: r + Math.cos(a) * r, y: r + Math.sin(a) * r }; } },
    ];
    for (const s of S) { if (d <= s.l) return s.f(d / s.l); d -= s.l; }
    return S[0].f(0);
  }

  function bp(t, W, H) {
    const bW = W - 2 * PAD, bH = H - 2 * PAD;
    const p = ponb(t, bW, bH, 22);
    return { x: p.x + PAD, y: p.y + PAD };
  }

  function borderRect(s) {
    return { x: PAD, y: PAD, w: s.canvas.width - 2 * PAD, h: s.canvas.height - 2 * PAD };
  }

  /* Hex → [r,g,b] (utilisé par drawMagic) */
  function h2r(hex) {
    hex = hex.trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* ═══════════════════════════════════════════
     ÉTAT PAR BADGE
  ═══════════════════════════════════════════ */
  function makeBadgeState(badge) {
    const canvas = badge.querySelector('.badge__border-canvas');
    const imgWrap = badge.querySelector('.badge__img-wrap');
    if (!canvas) return null;

    const state = {
      badge, canvas, imgWrap,
      animType: badge.dataset.anim || 'fuse',
      hovered: false,
      /* Temps global monotone (partagé par plusieurs draw functions) */
      t: 0,
      /* Timers par animation */
      bloodT: 0, fuseT: 0, scanT: 0, magicT: 0, bulletT: 0,
      heartT: 0, torchT: 0, notesT: 0, sirenT: 0, strobeT: 0,
      brushT: 0, viewfinderT: 0, radarT: 0, tearT: 0,
      /* États spéciaux */
      scanGlitch: 0,
      sirenPhase: 0,
      brushWobble: 0,
      vfTimer: 0,
      /* Pools de particules */
      bloodDrops: [], fuseSmoke: [], magicOrbs: [], confetti: [],
      torchEmbers: [], noteParticles: [], tearDrops: [],
      heartParticles: [], radarAngle: 0,
      /* Glow ambiant interpolé */
      glowHeadX: 50, glowHeadY: 50,
      glowLerpX: 50, glowLerpY: 50,
      glowIntensity: 0, glowIntensityTarget: 0,
      resizeCanvas() {
        const bW = badge.offsetWidth, bH = badge.offsetHeight;
        canvas.width = bW + 2 * PAD;
        canvas.height = bH + 2 * PAD;
        canvas.style.position = 'absolute';
        canvas.style.top = (-PAD) + 'px';
        canvas.style.left = (-PAD) + 'px';
        canvas.style.width = (bW + 2 * PAD) + 'px';
        canvas.style.height = (bH + 2 * PAD) + 'px';
      }
    };

    state.resizeCanvas();
    badge.addEventListener('mouseenter', () => { state.hovered = true; state.glowIntensityTarget = 1; });
    badge.addEventListener('mouseleave', () => {
      state.hovered = false; state.glowIntensityTarget = 0;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.bloodDrops = []; state.fuseSmoke = []; state.magicOrbs = []; state.confetti = [];
      state.torchEmbers = []; state.noteParticles = []; state.tearDrops = [];
      state.heartParticles = []; state.scanGlitch = 0;
    });
    return state;
  }

  /* ═══ GLOW AMBIANT — mis à jour chaque frame ═══ */
  function updateAmbientGlow(s, headT, dt) {
    const W = s.canvas.width, H = s.canvas.height;
    const bW = W - 2 * PAD, bH = H - 2 * PAD;
    const raw = bp(headT, W, H);
    const bx = raw.x - PAD, by = raw.y - PAD;
    s.glowHeadX = (bx / bW) * 100;
    s.glowHeadY = (by / bH) * 100;
    const k = 1 - Math.pow(1 - 0.055, dt / 16);
    s.glowLerpX += (s.glowHeadX - s.glowLerpX) * k;
    s.glowLerpY += (s.glowHeadY - s.glowLerpY) * k;
    s.glowIntensity += (s.glowIntensityTarget - s.glowIntensity) * k * 0.7;
    const st = s.badge.style;
    st.setProperty('--glow-x', s.glowLerpX.toFixed(2) + '%');
    st.setProperty('--glow-y', s.glowLerpY.toFixed(2) + '%');
    st.setProperty('--glow-intensity', s.glowIntensity.toFixed(3));
    if (s.imgWrap) {
      const iRect = s.imgWrap.getBoundingClientRect();
      const bRect = s.badge.getBoundingClientRect();
      const ix = ((bx - (iRect.left - bRect.left)) / iRect.width * 100);
      const iy = ((by - (iRect.top - bRect.top)) / iRect.height * 100);
      st.setProperty('--img-glow-x', Math.max(-20, Math.min(120, ix)).toFixed(2) + '%');
      st.setProperty('--img-glow-y', Math.max(-20, Math.min(120, iy)).toFixed(2) + '%');
    }
  }

  /* ═══════════════════════════════════════════
     DRAW FUNCTIONS (par genre / animation)
  ═══════════════════════════════════════════ */

  /* BLOOD — rouge vif, gouttes qui tombent du haut */
  function drawBlood(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H); s.bloodT = (s.bloodT + dt * .00018) % 1;
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22); ctx.strokeStyle = 'rgba(160,0,0,.20)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    /* Traîne rouge */
    for (let i = 1; i <= 45; i++) {
      const u = (s.bloodT - (i / 45) * .16 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 45;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 * f + .3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,0,0,${f * .65})`; ctx.fill();
    }
    /* Tête lumineuse */
    const ph = bp(s.bloodT, W, H);
    const gh = ctx.createRadialGradient(ph.x, ph.y, 0, ph.x, ph.y, 14);
    gh.addColorStop(0, 'rgba(255,60,60,1)'); gh.addColorStop(.4, 'rgba(180,0,0,.7)'); gh.addColorStop(1, 'rgba(120,0,0,0)');
    ctx.beginPath(); ctx.arc(ph.x, ph.y, 14, 0, Math.PI * 2); ctx.fillStyle = gh; ctx.fill();
    ctx.beginPath(); ctx.arc(ph.x, ph.y, 3.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,180,180,.9)'; ctx.fill();
    /* Gouttes */
    if (s.bloodDrops.length < 7 && Math.random() < .06) {
      s.bloodDrops.push({ x: PAD + 16 + Math.random() * (br.w - 32), y: PAD, vy: .4 + Math.random() * .5, len: 0, maxLen: 14 + Math.random() * 22, alpha: 1, dripLen: 0 });
    }
    s.bloodDrops = s.bloodDrops.filter(d => d.alpha > .01);
    s.bloodDrops.forEach(d => {
      d.len = Math.min(d.len + d.vy * dt * .14, d.maxLen);
      if (d.len >= d.maxLen) { d.dripLen += d.vy * dt * .07; if (d.dripLen > 20) d.alpha -= .013 * dt; }
      const gr = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.len);
      gr.addColorStop(0, `rgba(180,0,0,${d.alpha * .9})`); gr.addColorStop(1, `rgba(90,0,0,${d.alpha * .2})`);
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.len); ctx.strokeStyle = gr; ctx.lineWidth = 2.5; ctx.stroke();
      if (d.dripLen > 0) { const br2 = 2.5 + Math.min(d.dripLen, 10) * .28; ctx.beginPath(); ctx.arc(d.x, d.y + d.len + Math.min(d.dripLen, 16), br2, 0, Math.PI * 2); ctx.fillStyle = `rgba(160,0,0,${d.alpha * .8})`; ctx.fill(); }
    });
  }

  /* FUSE — mèche qui brûle, braises volantes */
  function drawFuse(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H); s.fuseT = (s.fuseT + dt * .00025) % 1;
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22); ctx.strokeStyle = 'rgba(100,60,10,.22)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    for (let i = 0; i < 60; i++) {
      const u = (s.fuseT - (i / 60) * .18 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 60;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(110,70,15,${f * .5})`; ctx.fill();
    }
    const p = bp(s.fuseT, W, H);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
    g.addColorStop(0, 'rgba(255,230,90,1)'); g.addColorStop(.3, 'rgba(255,130,20,.6)'); g.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#fffde0'; ctx.fill();
    s.fuseSmoke = s.fuseSmoke.filter(q => q.life > 0);
    if (Math.random() < .6) {
      const a = Math.random() * Math.PI * 2, sp = 1.2 + Math.random() * 3.5;
      s.fuseSmoke.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.2, life: .9 });
    }
    s.fuseSmoke.forEach(q => {
      q.x += q.vx * dt * .06; q.y += q.vy * dt * .06; q.vy += .06 * dt * .06; q.life -= .022 * dt * .06 * 16;
      ctx.beginPath(); ctx.arc(q.x, q.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,180,40,${Math.max(0, q.life)})`; ctx.fill();
    });
  }

  /* SCAN — vert néon, glitch numérique */
  function drawScan(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H); s.scanT = (s.scanT + dt * .00028) % 1;
    s.scanGlitch += dt;
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22); ctx.strokeStyle = 'rgba(0,255,136,.09)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    const gl = (s.scanGlitch > 80 && s.scanGlitch < 90) ? Math.random() * 5 - 2.5 : 0;
    if (s.scanGlitch > 120) s.scanGlitch = Math.random() < .7 ? 0 : 80;
    for (let i = 0; i <= 80; i++) {
      const u = (s.scanT - (i / 80) * .22 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 80;
      ctx.beginPath(); ctx.arc(p.x + (i < 5 ? gl : 0), p.y, 2 * f + .5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,136,${f * .85})`; ctx.fill();
    }
    const p = bp(s.scanT, W, H);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 15);
    g.addColorStop(0, 'rgba(200,255,220,1)'); g.addColorStop(.4, 'rgba(0,255,136,.6)'); g.addColorStop(1, 'rgba(0,200,80,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    if (gl !== 0) {
      ctx.fillStyle = 'rgba(0,255,136,.10)';
      ctx.fillRect(PAD, PAD + 5 + Math.random() * (br.h - 10), br.w, 1 + Math.random() * 2);
    }
  }

  /* MAGIC — multi-orbes arc-en-ciel orbitants */
  function drawMagic(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H); s.t += dt;
    if (!s.magicOrbs.length) {
      const oc = ['#C084FC', '#60A5FA', '#F59E0B', '#34D399', '#F472B6'];
      for (let i = 0; i < 5; i++)
        s.magicOrbs.push({ t: i / 5, speed: .00014 + Math.random() * .00012, trail: [], col: oc[i], size: 2 + Math.random() * 2 });
    }
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22);
    ctx.strokeStyle = 'rgba(160,100,220,.13)'; ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(192,132,252,.3)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore();
    s.magicOrbs.forEach(orb => {
      orb.t = (orb.t + orb.speed * dt) % 1;
      const p = bp(orb.t, W, H);
      orb.trail.push({ x: p.x, y: p.y });
      if (orb.trail.length > 20) orb.trail.shift();
      orb.trail.forEach((tp, i) => {
        const f = i / orb.trail.length;
        const [r, g, b] = h2r(orb.col);
        ctx.beginPath(); ctx.arc(tp.x, tp.y, orb.size * f, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${f * .7})`; ctx.fill();
      });
      const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
      const [r2, g2c, b2] = h2r(orb.col);
      g2.addColorStop(0, 'rgba(255,255,255,.9)'); g2.addColorStop(.3, `rgba(${r2},${g2c},${b2},.8)`); g2.addColorStop(1, `rgba(${r2},${g2c},${b2},0)`);
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fillStyle = g2; ctx.fill();
    });
    /* Étincelle aléatoire */
    if (Math.random() < .018) {
      const p = bp(Math.random(), W, H);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(a) * 11, p.y + Math.sin(a) * 11);
        ctx.strokeStyle = 'rgba(255,240,180,.5)'; ctx.lineWidth = .8; ctx.stroke();
      }
    }
    /* Tracker pour glow */
    s.magicT = s.magicOrbs.length ? s.magicOrbs[0].t : 0;
  }

  /* BULLET — orange vif, traîne rapide */
  function drawBullet(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H); s.bulletT = (s.bulletT + dt * .00075) % 1;
    for (let i = 1; i <= 55; i++) {
      const u = (s.bulletT - (i / 55) * .1 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 55;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.8 * f + .3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${70 + Math.floor(f * 150)},0,${f * .9})`; ctx.fill();
    }
    const p = bp(s.bulletT, W, H);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
    g.addColorStop(0, 'rgba(255,255,200,1)'); g.addColorStop(.5, 'rgba(255,120,0,.8)'); g.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  }

  /* HEART — rose, cœur battant + particules */
  function drawHeart(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H);
    s.heartT = (s.heartT + dt * .0002) % 1; s.t += dt;
    const pulse = .12 + .1 * Math.abs(Math.sin(s.t * .008));
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22);
    ctx.strokeStyle = `rgba(255,107,138,${pulse})`; ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(255,107,138,.4)'; ctx.shadowBlur = 6; ctx.stroke(); ctx.restore();
    /* Traîne rose */
    const bs = .9 + .2 * Math.abs(Math.sin(s.t * .012));
    for (let i = 1; i <= 40; i++) {
      const u = (s.heartT - (i / 40) * .14 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 40;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 * f, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,150,170,${f * .7})`; ctx.fill();
    }
    /* Tête en forme de cœur */
    const p = bp(s.heartT, W, H);
    const hs = 6 * bs;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.moveTo(0, -hs * .4);
    ctx.bezierCurveTo(hs * .5, -hs, hs, -hs * .5, 0, hs * .5);
    ctx.bezierCurveTo(-hs, -hs * .5, -hs * .5, -hs, 0, -hs * .4);
    ctx.fillStyle = 'rgba(255,107,138,.92)';
    ctx.shadowColor = 'rgba(255,107,138,.8)'; ctx.shadowBlur = 10;
    ctx.fill(); ctx.restore();
    /* Petits cœurs qui s'envolent */
    s.heartParticles = s.heartParticles.filter(q => q.life > 0);
    if (Math.random() < .09 && s.heartParticles.length < 14)
      s.heartParticles.push({ x: p.x, y: p.y, vx: (Math.random() - .5) * 2, vy: -1.2 - Math.random() * 1.6, life: 1, size: 1.2 + Math.random() * 2 });
    s.heartParticles.forEach(q => {
      q.x += q.vx * dt * .05; q.y += q.vy * dt * .05; q.life -= .013 * dt * .05 * 16;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,160,180,${Math.max(0, q.life)})`; ctx.fill();
    });
  }

  /* TORCH — ambre, flamme vacillante + braises montantes */
  function drawTorch(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H);
    s.torchT = (s.torchT + dt * .0002) % 1; s.t += dt;
    const fl = .7 + .3 * Math.sin(s.t * .04 + Math.sin(s.t * .012) * 4);
    /* Traîne chaude */
    for (let i = 0; i <= 55; i++) {
      const u = (s.torchT - (i / 55) * .18 + 1) % 1;
      const p = bp(u, W, H); const f = (1 - i / 55) * fl;
      const rv = Math.floor(200 + 55 * f), gv = Math.floor(80 + 100 * f * f);
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 * f + .5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rv},${gv},10,${f * .85})`; ctx.fill();
    }
    /* Tête flamboyante */
    const p = bp(s.torchT, W, H);
    const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16 * fl);
    gg.addColorStop(0, 'rgba(255,255,180,.95)'); gg.addColorStop(.3, 'rgba(255,160,20,.7)');
    gg.addColorStop(.7, 'rgba(200,60,0,.3)'); gg.addColorStop(1, 'rgba(100,20,0,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, 16 * fl, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
    /* Braises qui montent */
    s.torchEmbers = s.torchEmbers.filter(e => e.life > 0);
    if (Math.random() < .3)
      s.torchEmbers.push({ x: p.x, y: p.y, vx: (Math.random() - .5) * 2, vy: -2 - Math.random() * 1.5, life: 1, col: Math.random() < .5 ? '#FFC040' : '#FF8020' });
    s.torchEmbers.forEach(e => {
      e.x += e.vx * dt * .05; e.y += e.vy * dt * .05; e.vy += .045 * dt * .05;
      e.life -= .018 * dt * .05 * 16;
      ctx.beginPath(); ctx.arc(e.x, e.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = e.col; ctx.globalAlpha = Math.max(0, e.life); ctx.fill(); ctx.globalAlpha = 1;
    });
  }

  /* NOTES — or, notes de musique + tête pulsante */
  function drawNotes(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H);
    s.notesT = (s.notesT + dt * .00022) % 1; s.t += dt;
    const pulse = .12 + .1 * Math.sin(s.t * .006);
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22);
    ctx.strokeStyle = `rgba(196,160,82,${pulse})`; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    const bp2val = .8 + .2 * Math.sin(s.t * .018);
    for (let i = 1; i <= 30; i++) {
      const u = (s.notesT - (i / 30) * .12 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 30;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 * f, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,224,133,${f * .6})`; ctx.fill();
    }
    const p = bp(s.notesT, W, H);
    const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14 * bp2val);
    gg.addColorStop(0, 'rgba(255,240,160,.9)'); gg.addColorStop(.4, 'rgba(196,160,82,.5)'); gg.addColorStop(1, 'rgba(196,160,82,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, 14 * bp2val, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
    /* Notes volantes */
    s.noteParticles = s.noteParticles.filter(n => n.life > 0);
    if (Math.random() < .07 && s.noteParticles.length < 9) {
      const p2 = bp(Math.random(), W, H);
      s.noteParticles.push({ x: p2.x, y: p2.y, vx: (Math.random() - .5) * .9, vy: -1 - Math.random() * .8, life: 1, sym: ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)] });
    }
    s.noteParticles.forEach(n => {
      n.x += n.vx * dt * .05; n.y += n.vy * dt * .05; n.life -= .012 * dt * .05 * 16;
      ctx.font = '11px serif'; ctx.globalAlpha = Math.max(0, n.life);
      ctx.fillStyle = '#FFE085'; ctx.fillText(n.sym, n.x - 5, n.y + 4); ctx.globalAlpha = 1;
    });
  }

  /* SIREN — deux gyrophares bleu + rouge simultanés */
  function drawSiren(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H);
    s.sirenPhase += dt * .004;
    [[0, [0, 100, 255]], [.5, [210, 20, 20]]].forEach(([offset, [r, g, b]]) => {
      const t = (s.sirenPhase * .3 + offset) % 1;
      const pulse = .4 + .6 * Math.abs(Math.sin(s.sirenPhase * 1.5 + (offset > 0 ? Math.PI : 0)));
      for (let i = 0; i <= 50; i++) {
        const u = (t - (i / 50) * .2 + 1) % 1;
        const p = bp(u, W, H); const f = (1 - i / 50) * pulse;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 * f + .3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${f * .9})`; ctx.fill();
      }
      const p = bp(t, W, H);
      const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
      gg.addColorStop(0, `rgba(255,255,255,${pulse * .9})`);
      gg.addColorStop(.4, `rgba(${r},${g},${b},${pulse * .6})`);
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
    });
    s.sirenT = (s.sirenPhase * .3) % 1;
  }

  /* STROBE — blanc, flash pulsé */
  function drawStrobe(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H);
    s.strobeT = (s.strobeT + dt * .003) % (Math.PI * 2);
    s.fuseT = (s.fuseT + dt * .00011) % 1;
    const br = borderRect(s);
    const pulse = .6 + .4 * Math.sin(s.strobeT * 2.5);
    /* Traîne gris-bleu */
    for (let i = 0; i <= 60; i++) {
      const u = (s.fuseT - (i / 60) * .3 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 60;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 * f + .3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,200,240,${f * .45})`; ctx.fill();
    }
    /* Tête pulsante */
    const p = bp(s.fuseT, W, H);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 17);
    g.addColorStop(0, `rgba(240,248,255,${pulse})`);
    g.addColorStop(.5, `rgba(100,140,200,${pulse * .4})`);
    g.addColorStop(1, 'rgba(60,80,150,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    /* Flash de bordure aléatoire */
    if (Math.random() < .01) {
      ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22);
      ctx.strokeStyle = `rgba(200,220,255,${Math.random() * .5 + .1})`; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }
  }

  /* BRUSH — arc-en-ciel, traîne multicolore vibrante */
  function drawBrush(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H);
    s.brushT = (s.brushT + dt * .00022) % 1; s.brushWobble += dt * .01;
    const cols = ['#FF6B6B', '#FFE085', '#6BFFA0', '#6BCFFF', '#FF9F40', '#DA77FF', '#F2C84B'];
    for (let i = 0; i <= 70; i++) {
      const u = (s.brushT - (i / 70) * .15 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 70;
      const ci = Math.floor(u * cols.length) % cols.length;
      const [r, g, b] = h2r(cols[ci]);
      const wob = 1 + .6 * Math.sin(s.brushWobble + i * .3);
      ctx.beginPath(); ctx.arc(p.x, p.y, (2.5 + wob) * f, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${f * .85})`; ctx.fill();
    }
    const p = bp(s.brushT, W, H);
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
  }

  /* VIEWFINDER — bleu-teal, réticule de caméra */
  function drawViewfinder(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H); s.viewfinderT = (s.viewfinderT + dt * .00018) % 1; s.vfTimer += dt;
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22);
    ctx.strokeStyle = 'rgba(123,167,188,.20)'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    /* Tête avec coins de réticule */
    const p = bp(s.viewfinderT, W, H), bs = 9;
    ctx.strokeStyle = 'rgba(200,240,255,.85)'; ctx.lineWidth = 1.5;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(p.x + sx * bs, p.y + sy * bs); ctx.lineTo(p.x + sx * (bs - 4), p.y + sy * bs);
      ctx.moveTo(p.x + sx * bs, p.y + sy * bs); ctx.lineTo(p.x + sx * bs, p.y + sy * (bs - 4)); ctx.stroke();
    });
    const vfPulse = .5 + .5 * Math.sin(s.vfTimer * .008);
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,240,255,${vfPulse * .9})`; ctx.fill();
    /* Pixels aléatoires */
    if (Math.random() < .18) {
      const p2 = bp(Math.random(), W, H);
      ctx.beginPath(); ctx.arc(p2.x, p2.y, .8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(123,167,188,.45)'; ctx.fill();
    }
  }

  /* RADAR — vert, balayage angulaire depuis le centre */
  function drawRadar(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H);
    s.radarAngle = (s.radarAngle + dt * .0022) % (Math.PI * 2);
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22);
    ctx.strokeStyle = 'rgba(119,136,153,.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    const cx = W / 2, cy = H / 2, sweep = Math.PI * .4;
    /* Trouve le point de bordure le plus proche d'un angle donné */
    function closest(ang) {
      let bT = 0, bD = 1e9;
      for (let j = 0; j < 150; j++) {
        const t = j / 150;
        const p = bp(t, W, H);
        const a = Math.atan2(p.y - cy, p.x - cx);
        const d = Math.abs(((a - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d < bD) { bD = d; bT = t; }
      }
      return bp(bT, W, H);
    }
    for (let i = 0; i <= 60; i++) {
      const p = closest(s.radarAngle - (i / 60) * sweep);
      const f = (1 - i / 60) * .8;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 * f + .5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,200,100,${f * .85})`; ctx.fill();
    }
    const p = closest(s.radarAngle);
    const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
    gg.addColorStop(0, 'rgba(180,255,180,.9)'); gg.addColorStop(1, 'rgba(0,100,0,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
    s.radarT = s.radarAngle / (Math.PI * 2);
  }

  /* CONFETTI — comédie, confettis rectangulaires volants */
  function drawConfetti(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H); s.t += dt;
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22); ctx.strokeStyle = 'rgba(255,220,100,.15)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    const cols = ['#FF6B6B', '#FFE085', '#6BFFA0', '#6BCFFF', '#FF9F40', '#DA77FF'];
    if (s.confetti.length < 30 && Math.random() < .3) {
      const p = bp(Math.random(), W, H);
      s.confetti.push({ x: p.x, y: p.y, vx: (Math.random() - .5) * 4, vy: -2.2 - Math.random() * 2.2, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - .5) * .35, life: 1, w: 4 + Math.random() * 5, h: 3 + Math.random() * 3, col: cols[Math.floor(Math.random() * cols.length)] });
    }
    s.confetti = s.confetti.filter(c => c.life > 0);
    s.confetti.forEach(c => {
      c.x += c.vx * dt * .05; c.y += c.vy * dt * .05; c.vy += .07 * dt * .05; c.rot += c.vrot * dt * .05; c.life -= .013 * dt * .05 * 16;
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.globalAlpha = Math.max(0, c.life);
      ctx.fillStyle = c.col; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  /* TEAR — bleu-argent, larmes latérales avec prismes */
  function drawTear(s, dt) {
    const ctx = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    ctx.clearRect(0, 0, W, H);
    s.tearT = (s.tearT + dt * .00015) % 1; s.t += dt;
    const br = borderRect(s);
    ctx.save(); rrp(ctx, br.x, br.y, br.w, br.h, 22); ctx.strokeStyle = 'rgba(184,136,42,.13)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    /* Traîne bleue-argentée */
    for (let i = 1; i <= 40; i++) {
      const u = (s.tearT - (i / 40) * .14 + 1) % 1;
      const p = bp(u, W, H); const f = 1 - i / 40;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.8 * f + .2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,210,255,${f * .55})`; ctx.fill();
    }
    /* Tête en larme bleue */
    const pt = bp(s.tearT, W, H);
    const gt = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 12);
    gt.addColorStop(0, 'rgba(220,240,255,1)'); gt.addColorStop(.4, 'rgba(140,180,240,.7)'); gt.addColorStop(1, 'rgba(100,150,220,0)');
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2); ctx.fillStyle = gt; ctx.fill();
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
    /* Larmes latérales avec prismes */
    if (s.tearDrops.length < 5 && Math.random() < .04) {
      const left = Math.random() < .5;
      s.tearDrops.push({ x: left ? PAD : W - PAD, y: PAD + 26 + Math.random() * (br.h - 60), vy: .28 + Math.random() * .4, len: 0, maxLen: 14 + Math.random() * 20, alpha: .85, dripLen: 0, prism: Math.random() > .5 });
    }
    s.tearDrops = s.tearDrops.filter(d => d.alpha > .01);
    s.tearDrops.forEach(d => {
      d.len = Math.min(d.len + d.vy * dt * .12, d.maxLen);
      if (d.len >= d.maxLen) { d.dripLen += d.vy * dt * .07; if (d.dripLen > 18) d.alpha -= .012 * dt; }
      const gr = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.len);
      gr.addColorStop(0, `rgba(180,200,240,${d.alpha * .7})`); gr.addColorStop(1, `rgba(150,180,220,${d.alpha * .2})`);
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.len);
      ctx.strokeStyle = gr; ctx.lineWidth = 2; ctx.stroke();
      if (d.dripLen > 0) {
        const br2 = 2.5 + Math.min(d.dripLen, 9) * .25;
        if (d.prism) {
          ['rgba(255,100,100,.3)', 'rgba(100,255,100,.3)', 'rgba(100,100,255,.3)'].forEach((c, i) => {
            ctx.beginPath(); ctx.arc(d.x + (i - 1) * 2, d.y + d.len + Math.min(d.dripLen, 14), br2 * .7, 0, Math.PI * 2);
            ctx.fillStyle = c; ctx.fill();
          });
        }
        ctx.beginPath(); ctx.arc(d.x, d.y + d.len + Math.min(d.dripLen, 14), br2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,210,250,${d.alpha * .75})`; ctx.fill();
      }
    });
  }

  /* Dispatch */
  const DRAW_FNS = {
    blood: drawBlood, fuse: drawFuse, scan: drawScan, magic: drawMagic,
    bullet: drawBullet, heart: drawHeart, torch: drawTorch, notes: drawNotes,
    siren: drawSiren, strobe: drawStrobe, brush: drawBrush,
    viewfinder: drawViewfinder, radar: drawRadar, tear: drawTear,
    confetti: drawConfetti,
  };

  /* Retourne la position [0..1] de la tête pour le glow ambiant */
  function currentHeadT(s) {
    switch (s.animType) {
      case 'magic':  return s.magicOrbs.length ? s.magicOrbs[0].t : 0;
      case 'siren':  return s.sirenT || 0;
      case 'radar':  return s.radarAngle / (Math.PI * 2);
      case 'strobe': return s.fuseT;
      case 'confetti': return 0;
      default: return s[s.animType + 'T'] || 0;
    }
  }

  /* ═══ INIT STATES ═══ */
  const states = [];
  track.querySelectorAll('.badge:not([data-clone-of])').forEach(badge => {
    const st = makeBadgeState(badge);
    if (st) states.push(st);
  });
  window.addEventListener('resize', () => states.forEach(s => s.resizeCanvas()));

  /* ═══ CAROUSEL AUTO-SCROLL ═══ */
  const BASE_SPEED = 0.07, SLOW_SPEED = 0.012;
  let txPx = 0, halfW = 0, currentSpeed = BASE_SPEED, targetSpeed = BASE_SPEED;
  let isDragging = false, touchLastX = 0, touchVel = 0, mouseProx = 0;

  function measureHalf() {
    /* Utilise la position DOM réelle pour éviter les erreurs dues au lazy-load */
    const firstOriginal = track.querySelector('.badge[data-badge-id="0"]');
    const firstClone    = track.querySelector('.badge[data-clone-of="0"]');
    if (!firstOriginal || !firstClone) return;
    const w = firstClone.offsetLeft - firstOriginal.offsetLeft;
    if (w > 0) halfW = w;
  }
  window.addEventListener('resize', measureHalf);
  /* Tentatives initiales */
  setTimeout(measureHalf, 100);
  setTimeout(measureHalf, 400);
  setTimeout(measureHalf, 1200);
  /* Recalcul automatique quand les images chargent et changent la taille des badges */
  if (window.ResizeObserver) {
    new ResizeObserver(() => measureHalf()).observe(track);
  }

  outer.addEventListener('mouseenter', () => { mouseProx = 1; });
  outer.addEventListener('mouseleave', () => { mouseProx = 0; });
  outer.addEventListener('touchstart', e => { touchLastX = e.touches[0].clientX; touchVel = 0; isDragging = true; }, { passive: true });
  outer.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - touchLastX;
    touchVel = dx; txPx -= dx; touchLastX = e.touches[0].clientX;
  }, { passive: true });
  outer.addEventListener('touchend', () => { isDragging = false; });

  /* ═══ MAIN TICK ═══ */
  let lastNow = null;

  function tick(now) {
    requestAnimationFrame(tick);
    const dt = lastNow !== null ? Math.min(now - lastNow, 50) : 16;
    lastNow = now;

    /* Carousel — pause si tooltip ouvert */
    if (!isDragging) {
      if (openBadge) {
        /* Tooltip ouvert : arrêt complet + reset inertie */
        currentSpeed = 0;
        touchVel = 0;
      } else if (Math.abs(touchVel) > 0.5) {
        /* Inertie post-swipe : décélération fluide */
        txPx -= touchVel;
        touchVel *= 0.88;
        if (halfW > 0) { if (txPx < 0) txPx += halfW; if (txPx >= halfW) txPx -= halfW; }
      } else {
        /* Auto-scroll normal : ralenti si souris sur le carousel */
        touchVel = 0;
        targetSpeed = mouseProx ? SLOW_SPEED : BASE_SPEED;
        currentSpeed += (targetSpeed - currentSpeed) * 0.05;
        txPx += currentSpeed * dt;
        if (halfW > 0 && txPx >= halfW) txPx -= halfW;
        if (txPx < 0) txPx += halfW > 0 ? halfW : 0;
      }
    } else {
      /* En cours de drag tactile — wrap-around uniquement */
      if (halfW > 0) { if (txPx < 0) txPx += halfW; if (txPx >= halfW) txPx -= halfW; }
    }
    if (halfW > 0) track.style.transform = `translateX(${-txPx}px)`;

    /* Badge animations */
    states.forEach(s => {
      updateAmbientGlow(s, currentHeadT(s), dt);
      if (!s.hovered) return;
      const fn = DRAW_FNS[s.animType];
      if (fn) fn(s, dt);
    });

    renderBursts();
  }

  requestAnimationFrame(tick);
})();
