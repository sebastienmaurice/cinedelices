/**
 * starfield.js — Fond scintillant cinématographique
 * Ciné Délices
 *
 * Effet : micro-poussière dans un faisceau de projecteur.
 * Base  : #142234 plein (fond calibré post-ajustement lisibilité).
 * Tons  : argenté-bleuté (majorité) + quelques dorés (minorité).
 */
(function () {
  'use strict';

  const canvas = document.getElementById('cinedelices-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  /* ── Paramètres ── */
  const COUNT = 200;          // densité renforcée (fond plus clair = particules plus visibles nécessaires)
  const BASE  = '#142234';    // aligné sur --bleu-nuit post-ajustement lisibilité

  let particles = [], W, H, animId;

  /* ── Construction des particules ── */
  function build() {
    particles = Array.from({ length: COUNT }, () => {
      const roll = Math.random();
      return {
        x:     Math.random() * W,
        y:     Math.random() * H,
        /* tailles variées — mix poussière fine + quelques points plus nets */
        r:     Math.random() * 1.1 + 0.2,
        /* phase et vitesse de scintillement individuels */
        phase: Math.random() * Math.PI * 2,
        speed: 0.0004 + Math.random() * 0.0014,   // lent, organique
        /* dérive légère — suspension dans l'air */
        dx: (Math.random() - 0.5) * 0.07,
        dy: (Math.random() - 0.5) * 0.04,
        /* typage colorimétrique */
        gold:   roll < 0.09,                       // ~9% dorés
        silver: roll >= 0.09 && roll < 0.32,       // ~23% argentés-bleutés
        /* le reste (~68%) : bleu-gris */
      };
    });
  }

  /* ── Fond ── */
  function drawBg() {
    /* Aplat #0D1B2A strict */
    ctx.fillStyle = BASE;
    ctx.fillRect(0, 0, W, H);

    /* Vignette très douce aux bords — profondeur sans éclaircir */
    const vig = ctx.createRadialGradient(
      W * 0.5, H * 0.5, H * 0.22,
      W * 0.5, H * 0.5, H * 0.90
    );
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(2, 6, 14, 0.22)'); /* alpha 0.42→0.22 — bords moins écrasés */
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Particules ── */
  function drawParticles(t) {
    particles.forEach((p) => {
      /* Scintillement : sinusoïde lente — plage plus ouverte */
      const b = 0.15 + 0.70 * (0.5 + 0.5 * Math.sin(t * p.speed + p.phase));

      /* Dérive lente — reboucle en douceur */
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < -2)    p.x = W + 2;
      if (p.x > W + 2) p.x = -2;
      if (p.y < -2)    p.y = H + 2;
      if (p.y > H + 2) p.y = -2;

      if (p.gold) {
        /* Doré : halo chaud très estompé + point lumineux */
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, `rgba(210, 165, 58, ${b * 0.75})`);
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(228, 186, 82, ${b})`;
        ctx.fill();

      } else if (p.silver) {
        /* Argenté-bleuté : halo + point */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(155, 192, 240, ${b * 0.38})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190, 220, 255, ${b})`;
        ctx.fill();

      } else {
        /* Bleu-gris — présent, crée la texture de fond */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 165, 218, ${b * 0.65})`;
        ctx.fill();
      }
    });
  }

  /* ── Boucle d'animation ── */
  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    drawBg();
    drawParticles(t);
    animId = requestAnimationFrame(frame);
  }

  /* ── Resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    build();
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    resize();
    animId = requestAnimationFrame(frame);
  });

  resize();

  /* prefers-reduced-motion : frame statique unique, pas de boucle */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ctx.clearRect(0, 0, W, H);
    drawBg();
    /* Dessine les particules à un instant t fixe — pas d'animation */
    drawParticles(0);
  } else {
    animId = requestAnimationFrame(frame);
  }
})();
