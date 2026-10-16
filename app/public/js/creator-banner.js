/**
 * Bannière « Les créations de … » : deux rails de publications qui défilent en continu dans des
 * sens opposés (boucle sans saut), tout en restant parcourables à la main (glisser, trackpad,
 * flèches, clavier).
 *
 * Chaque rail est un conteneur à défilement horizontal natif. La série de vignettes est répétée
 * pour couvrir la largeur visible, puis doublée : quand le défilement dépasse la longueur d'une
 * série, on la retranche (image identique, donc aucun saut visible). L'automatisme se met en
 * pause au survol, au focus et après une interaction, et il est coupé si l'utilisateur demande
 * moins d'animations.
 */
(function () {
  const rows = document.querySelectorAll(".creator-banner .cb-row");
  if (!rows.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const instances = [];

  rows.forEach((row) => {
    const viewport = row.querySelector(".cb-viewport");
    const track = row.querySelector(".cb-track");
    const prev = row.querySelector(".cb-nav--prev");
    const next = row.querySelector(".cb-nav--next");
    if (!viewport || !track) return;

    const originals = Array.from(track.children);
    if (!originals.length) return;
    const dir = row.dataset.dir === "right" ? 1 : -1; // "left" : le contenu va vers la gauche
    const speed = parseFloat(row.dataset.speed) || 30; // px par seconde

    let setWidth = 0;
    let pos = 0;
    let lastSet = 0;
    let pausedUntil = 0;
    let hovering = false;

    const addClones = (nodes) => {
      nodes.forEach((n) => {
        const c = n.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.tabIndex = -1;
        track.appendChild(c);
      });
    };

    const build = () => {
      Array.from(track.children).slice(originals.length).forEach((n) => n.remove());
      const gap = parseFloat(getComputedStyle(track).columnGap) || 14;
      const one = originals.reduce((w, n) => w + n.getBoundingClientRect().width + gap, 0) || 1;
      const reps = Math.max(1, Math.ceil((viewport.clientWidth * 1.25) / one));
      for (let i = 1; i < reps; i++) addClones(originals);
      const set = Array.from(track.children);
      addClones(set);
      setWidth = one * reps;
      pos = dir === 1 ? setWidth * 0.5 : 0;
      viewport.scrollLeft = pos;
      lastSet = viewport.scrollLeft;
    };

    const wrap = () => {
      if (pos >= setWidth) pos -= setWidth;
      else if (pos < 0) pos += setWidth;
    };

    const pause = (ms) => { pausedUntil = performance.now() + ms; };

    ["pointerdown", "touchstart", "wheel", "keydown"].forEach((ev) => viewport.addEventListener(ev, () => pause(3500), { passive: true }));
    row.addEventListener("mouseenter", () => { hovering = true; });
    row.addEventListener("mouseleave", () => { hovering = false; });
    viewport.addEventListener("focusin", () => { hovering = true; });
    viewport.addEventListener("focusout", () => { hovering = false; });

    const manualStep = (sign) => {
      pause(3500);
      viewport.scrollBy({ left: sign * Math.max(220, viewport.clientWidth * 0.6), behavior: "smooth" });
    };
    prev?.addEventListener("click", () => manualStep(-1));
    next?.addEventListener("click", () => manualStep(1));

    viewport.addEventListener("scroll", () => {
      // Défilement manuel détecté : on adopte la nouvelle position et on garde la boucle
      if (Math.abs(viewport.scrollLeft - lastSet) > 1.5) {
        pos = viewport.scrollLeft;
        if (pos >= setWidth * 2 - viewport.clientWidth || pos < 1) {
          wrap();
          viewport.scrollLeft = pos;
        }
        lastSet = viewport.scrollLeft;
      }
    }, { passive: true });

    build();
    instances.push({
      build,
      step: (dt) => {
        if (hovering || performance.now() < pausedUntil) return;
        pos += dir * -1 * speed * dt; // dir -1 : le contenu avance vers la gauche => scrollLeft augmente
        wrap();
        viewport.scrollLeft = pos;
        lastSet = viewport.scrollLeft;
      },
    });
  });

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => instances.forEach((i) => i.build()), 200);
  });

  if (reduceMotion) return;

  // Ne tourne que lorsque la bannière est à l'écran et l'onglet visible
  let visible = true;
  const banner = document.querySelector(".creator-banner");
  if ("IntersectionObserver" in window && banner) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0.05 }).observe(banner);
  }
  let last = performance.now();
  const loop = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (visible && !document.hidden) instances.forEach((i) => i.step(dt));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
