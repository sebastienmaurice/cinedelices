/**
 * starfield.js — Fond scintillant cinématographique
 * Ciné Délices
 *
 * Effet : micro-poussière dans un faisceau de projecteur.
 * Base  : #142234 plein (fond calibré post-ajustement lisibilité).
 * Tons  : argenté-bleuté (majorité) + quelques dorés (minorité).
 *
 * Optimisations perf mobile (identifié comme cause de latence au scroll
 * sur iPhone 12 / Xiaomi 13 Pro — canvas plein écran, tourne sur TOUTES
 * les pages en boucle infinie) :
 *  - Nombre de particules réduit sur petit viewport (moins à dessiner).
 *  - Halos dorés/argentés pré-rendus une seule fois dans un sprite hors
 *    écran, puis simplement copiés (drawImage) au lieu de recalculer un
 *    createRadialGradient par particule à CHAQUE frame — c'est l'appel
 *    le plus coûteux de l'ancienne version, maintenant hors de la boucle.
 *  - Boucle mise en pause quand l'onglet n'est pas visible (économie
 *    batterie, aucun rendu inutile en arrière-plan).
 *  - Cadence plafonnée à ~30fps sur petit viewport (au lieu de 60fps) —
 *    ce fond est un détail d'ambiance, pas une animation qui a besoin de
 *    fluidité maximale, et ça libère du budget frame pour le scroll.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('cinedelices-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const isSmallViewport = () => window.innerWidth <= 800;

  /* ── Paramètres ── */
  const COUNT_DESKTOP = 200;
  const COUNT_MOBILE  = 70;    // ~1/3 — reste visuellement dense sur petit écran
  const BASE = '#142234';      // aligné sur --bleu-nuit post-ajustement lisibilité
  const TARGET_FRAME_MS_MOBILE = 1000 / 30; // plafond 30fps sur mobile

  let particles = [], W, H, animId, lastFrameTime = 0;
  let goldSprite, silverSprite;

  /* ── Sprites pré-rendus (une fois, hors boucle) ──
     Rayon de référence utilisé pour le pré-rendu ; chaque particule a un
     rayon légèrement différent (r entre 0.2 et 1.3), mais dessiner un
     sprite pré-rendu légèrement mis à l'échelle coûte infiniment moins
     cher que recalculer un dégradé radial par particule par frame. */
  function buildSprites() {
    const REF_R = 1.3;
    const pad = REF_R * 4;
    const size = Math.ceil(pad * 2);

    goldSprite = document.createElement('canvas');
    goldSprite.width = goldSprite.height = size;
    const gctx = goldSprite.getContext('2d');
    const g1 = gctx.createRadialGradient(pad, pad, 0, pad, pad, REF_R * 3.2);
    g1.addColorStop(0, 'rgba(210, 165, 58, 0.85)');
    g1.addColorStop(1, 'transparent');
    gctx.beginPath(); gctx.arc(pad, pad, REF_R * 3.2, 0, Math.PI * 2);
    gctx.fillStyle = g1; gctx.fill();
    gctx.beginPath(); gctx.arc(pad, pad, REF_R, 0, Math.PI * 2);
    gctx.fillStyle = 'rgba(228, 186, 82, 1)'; gctx.fill();

    silverSprite = document.createElement('canvas');
    silverSprite.width = silverSprite.height = size;
    const sctx = silverSprite.getContext('2d');
    sctx.beginPath(); sctx.arc(pad, pad, REF_R * 2.2, 0, Math.PI * 2);
    sctx.fillStyle = 'rgba(155, 192, 240, 0.42)'; sctx.fill();
    sctx.beginPath(); sctx.arc(pad, pad, REF_R, 0, Math.PI * 2);
    sctx.fillStyle = 'rgba(190, 220, 255, 1)'; sctx.fill();
  }

  /* ── Construction des particules ── */
  function build() {
    const count = isSmallViewport() ? COUNT_MOBILE : COUNT_DESKTOP;
    particles = Array.from({ length: count }, () => {
      const roll = Math.random();
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.1 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0004 + Math.random() * 0.0014,
        dx: (Math.random() - 0.5) * 0.07,
        dy: (Math.random() - 0.5) * 0.04,
        gold: roll < 0.09,
        silver: roll >= 0.09 && roll < 0.32,
      };
    });
  }

  /* ── Fond ── */
  function drawBg() {
    ctx.fillStyle = BASE;
    ctx.fillRect(0, 0, W, H);

    const vig = ctx.createRadialGradient(
      W * 0.5, H * 0.5, H * 0.22,
      W * 0.5, H * 0.5, H * 0.90
    );
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(2, 6, 14, 0.22)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Particules — dessin via sprites pré-rendus (drawImage), plus de
     createRadialGradient par particule dans la boucle chaude. ── */
  function drawParticles(t) {
    particles.forEach((p) => {
      const b = 0.15 + 0.70 * (0.5 + 0.5 * Math.sin(t * p.speed + p.phase));

      p.x += p.dx;
      p.y += p.dy;
      if (p.x < -2) p.x = W + 2;
      if (p.x > W + 2) p.x = -2;
      if (p.y < -2) p.y = H + 2;
      if (p.y > H + 2) p.y = -2;

      const scale = p.r / 1.3;

      if (p.gold) {
        const s = goldSprite.width * scale;
        ctx.globalAlpha = b;
        ctx.drawImage(goldSprite, p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      } else if (p.silver) {
        const s = silverSprite.width * scale;
        ctx.globalAlpha = b;
        ctx.drawImage(silverSprite, p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 165, 218, ${b * 0.65})`;
        ctx.fill();
      }
    });
  }

  /* ── Boucle d'animation ── */
  function frame(t) {
    animId = requestAnimationFrame(frame);

    if (isSmallViewport()) {
      if (t - lastFrameTime < TARGET_FRAME_MS_MOBILE) return;
      lastFrameTime = t;
    }

    ctx.clearRect(0, 0, W, H);
    drawBg();
    drawParticles(t);
  }

  /* ── Resize ── */
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    build();
  }

  /* Filet de sécurité perf : même la version allégée fait tourner un
     rAF en continu (clear+redraw à chaque frame, même à 30fps/moins de
     particules). Sur mobile/tablette, on va plus loin — pas de boucle
     du tout : un seul rendu statique (fond + particules figées), comme
     déjà fait pour prefers-reduced-motion. Coût du fond ramené à zéro
     après le premier paint, sur les appareils où le scroll a le plus à
     y gagner. */
  function shouldAnimate() {
    return !isSmallViewport() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function renderStatic() {
    ctx.clearRect(0, 0, W, H);
    drawBg();
    drawParticles(0);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    resize();
    if (document.hidden) return;
    if (shouldAnimate()) {
      animId = requestAnimationFrame(frame);
    } else {
      renderStatic();
    }
  });

  /* Pause hors onglet visible — aucun rendu inutile en arrière-plan,
     et reprise propre sans à-coup au retour. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else if (shouldAnimate()) {
      lastFrameTime = 0;
      animId = requestAnimationFrame(frame);
    }
  });

  buildSprites();
  resize();

  if (shouldAnimate()) {
    animId = requestAnimationFrame(frame);
  } else {
    renderStatic();
  }
})();
