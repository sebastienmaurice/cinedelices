/* ══════════════════════════════════════════
   CURSOR TRAIL — Poussière de Projecteur
   Ciné Délices | Particules cinématographiques
   ══════════════════════════════════════════

   Intelligence :
   · Désactivé sur tactile (pointer: coarse) et reduced-motion
   · Émission nulle si la souris est quasi-immobile
   · Count proportionnel à la vitesse de déplacement
   · Couleur rouge projecteur (+ spread) sur survol interactif
   · Dérive vers le haut — poussière dans un faisceau de lumière
   · Boucle RAF auto-suspendue quand aucune particule vivante
   ══════════════════════════════════════════ */

(function initCinemaTrail() {

  // ── Guards ────────────────────────────────────────────────────────────────
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ── Palette Ciné Délices ──────────────────────────────────────────────────
  // Or popcorn ×3 pour que ce soit la teinte dominante
  const PALETTE = [
    '#c6a664', // or popcorn
    '#c6a664',
    '#c6a664',
    '#d2b16e', // doré chaud
    '#e8d5a3', // or clair
    '#f7c948', // étincelle jaune blond
    '#e8e8e8', // argent écran
  ];
  const RED_SPARK = '#d72638'; // rouge projecteur — survol interactif

  // ── Pool de particules ────────────────────────────────────────────────────
  const POOL = 28;
  const pool = [];

  for (let i = 0; i < POOL; i++) {
    const el = document.createElement('div');
    // Styles fixes posés une seule fois — jamais retouchés en animation
    el.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'z-index:9999',
      'border-radius:50%',
      'opacity:0',
      'mix-blend-mode:screen',
      'will-change:transform,opacity',
      'transform:translate(-50%,-50%)',
    ].join(';');
    document.body.appendChild(el);
    pool.push({ el, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1 });
  }

  let cursor     = 0;
  let prevX      = 0;
  let prevY      = 0;
  let isOnTarget = false; // survol d'un élément interactif
  let frameId    = null;  // null = boucle suspendue

  // ── Détection contexte interactif ─────────────────────────────────────────
  document.addEventListener('mouseover', e => {
    isOnTarget = !!(e.target.closest('a, button, [role="button"], label[for], .btn'));
  });

  // ── Émission ──────────────────────────────────────────────────────────────
  window.addEventListener('mousemove', e => {
    const dx    = e.clientX - prevX;
    const dy    = e.clientY - prevY;
    const speed = Math.sqrt(dx * dx + dy * dy);
    prevX = e.clientX;
    prevY = e.clientY;

    // Pas d'émission si la souris se déplace à peine
    if (speed < 2) return;

    // Nombre de particules émises selon la vitesse + contexte
    const count = isOnTarget
      ? Math.min(3, Math.ceil(speed / 7) + 1)
      : Math.min(2, Math.ceil(speed / 14));

    for (let c = 0; c < count; c++) {
      const p      = pool[cursor % POOL];
      const isRed  = isOnTarget && Math.random() < 0.38;
      const color  = isRed
        ? RED_SPARK
        : PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const spread = isOnTarget ? 12 : 5;
      const size   = isOnTarget
        ? (Math.random() * 5 + 3)   // 3 – 8 px sur interactif
        : (Math.random() * 3 + 1.5); // 1.5 – 4.5 px en navigation

      // Position de départ avec léger aléa pour un aspect organique
      p.x = e.clientX + (Math.random() - 0.5) * spread;
      p.y = e.clientY + (Math.random() - 0.5) * spread;

      // Vélocité : légère dérive latérale + montée (projecteur)
      p.vx      = (Math.random() - 0.5) * 0.55;
      p.vy      = -(Math.random() * 0.55 + 0.12);
      p.life    = isOnTarget ? 1.35 : 1.0;
      p.maxLife = p.life;

      // Styles variant par particule — posés à l'émission, pas chaque frame
      p.el.style.width     = size + 'px';
      p.el.style.height    = size + 'px';
      p.el.style.background = color;
      p.el.style.boxShadow  = `0 0 ${Math.round(size * 2.5)}px ${color}`;

      cursor++;
    }

    // Démarrer la boucle si elle est suspendue
    if (!frameId) frameId = requestAnimationFrame(tick);
  });

  // ── Boucle RAF ────────────────────────────────────────────────────────────
  function tick() {
    let alive = false;

    for (const p of pool) {
      if (p.life <= 0) {
        // Masquer sans recréer l'élément
        if (p.el.style.opacity !== '0') p.el.style.opacity = '0';
        continue;
      }

      p.life -= 0.048;
      p.x    += p.vx;
      p.y    += p.vy;

      const ratio = Math.max(0, p.life / p.maxLife);
      const scale = 0.25 + ratio * 0.88;
      const op    = ratio * 0.74;

      p.el.style.left      = p.x + 'px';
      p.el.style.top       = p.y + 'px';
      p.el.style.opacity   = op;
      p.el.style.transform = `translate(-50%,-50%) scale(${scale})`;

      if (p.life > 0) alive = true;
    }

    // Suspendre la boucle si plus aucune particule vivante → économie CPU
    frameId = alive ? requestAnimationFrame(tick) : null;
  }

})();
