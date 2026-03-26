/**
 * category-badges.js — Carousel de genres cinéma V3
 * ============================================================
 * Ce script gère 5 grandes fonctionnalités :
 *
 * 1. CAROUSEL INFINI     → défilement automatique de gauche à droite,
 *                          ralenti au hover, stoppé au tooltip
 *
 * 2. SPOTLIGHT           → effet de projecteur cinéma sur le badge
 *                          le plus proche du centre de l'écran
 *
 * 3. BORDURE ANIMÉE      → animation canvas au hover selon le genre
 *                          (flamme, sang, scan vert, orbes magiques…)
 *
 * 4. TOOLTIP             → fiche genre au clic avec liste de films
 *
 * 5. RING AU CLIC        → anneau de lumière discret au clic
 * ============================================================
 */

/* L'IIFE (Immediately Invoked Function Expression) isole tout le code.
   Variables et fonctions ne "fuient" pas dans l'espace global window. */
(function () {
  "use strict"; /* Mode strict : erreurs plus claires, bonnes pratiques forcées */

  /* ============================================================
     CONSTANTE GLOBALE
     PAD = espace (en pixels) autour du badge dans le canvas.
     Permet aux effets de la bordure animée de déborder légèrement
     sans être coupés par le bord du badge.
     ============================================================ */
  const PAD = 14;

  /* ============================================================
     1. SÉCURITÉ — VÉRIFICATION DES ÉLÉMENTS REQUIS
     Si un élément clé n'existe pas dans le DOM, on arrête tout.
     ============================================================ */
  const track = document.getElementById("track");
  if (!track) return;

  const outer = document.getElementById("carouselOuter");
  if (!outer) return;

  /* ============================================================
     2. CANVAS DE RINGS (effet au clic)
     Canvas fixe plein écran. Le JS y dessine des anneaux
     lumineux à chaque clic de badge.
     ============================================================ */
  const ringCanvas = document.getElementById("burst-canvas");
  if (ringCanvas) {
    ringCanvas.width = window.innerWidth;
    ringCanvas.height = window.innerHeight;
    /* Redimensionner le canvas quand la fenêtre change de taille */
    window.addEventListener("resize", () => {
      ringCanvas.width = window.innerWidth;
      ringCanvas.height = window.innerHeight;
    });
  }

  /* Tableau de tous les rings actifs. Chaque ring est un objet avec
     sa position, sa couleur, sa taille et sa durée de vie. */
  let rings = [];

  /* Crée 2 rings au centre du badge cliqué :
     - un anneau qui s'agrandit (type 'ring')
     - un flash central qui disparaît vite (type 'flash') */
  function triggerRing(badge) {
    const rect = badge.getBoundingClientRect();
    const rgb =
      badge.style.getPropertyValue("--glow-rgb").trim() || "196,160,82";
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    rings.push({
      cx,
      cy,
      rgb,
      r: 0,
      maxR: Math.max(rect.width, rect.height) * 0.88,
      life: 1 /* vie de 0 à 1 → décroit à chaque frame */,
      type: "ring",
    });
    rings.push({
      cx,
      cy,
      rgb,
      r: 0,
      maxR: 20,
      life: 1,
      type: "flash",
    });
  }

  /* Dessine et met à jour tous les rings actifs, frame par frame */
  function renderRings() {
    if (!ringCanvas) return;
    const ctx = ringCanvas.getContext("2d");

    /* Rien à dessiner → on efface et on sort */
    if (!rings.length) {
      ctx.clearRect(0, 0, ringCanvas.width, ringCanvas.height);
      return;
    }

    ctx.clearRect(0, 0, ringCanvas.width, ringCanvas.height);

    /* Supprime les rings "morts" (life ≤ 0.01) */
    rings = rings.filter((r) => r.life > 0.01);

    rings.forEach((r) => {
      if (r.type === "ring") {
        /* Le rayon s'approche de maxR de façon exponentielle (lerp) */
        r.r = r.r + (r.maxR - r.r) * 0.12;
        r.life = r.life * 0.91; /* Diminue de 9% par frame */

        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.rgb}, ${(r.life * 0.58).toFixed(3)})`;
        ctx.lineWidth = 1.5 * r.life;
        ctx.stroke();
      } else {
        /* Flash : cercle rempli avec dégradé radial */
        r.r = r.r + (r.maxR - r.r) * 0.18;
        r.life = r.life * 0.84;

        const g = ctx.createRadialGradient(r.cx, r.cy, 0, r.cx, r.cy, r.r);
        g.addColorStop(0, `rgba(${r.rgb}, ${(r.life * 0.32).toFixed(3)})`);
        g.addColorStop(0.5, `rgba(${r.rgb}, ${(r.life * 0.1).toFixed(3)})`);
        g.addColorStop(1, `rgba(${r.rgb}, 0)`);

        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    });
  }

  /* ============================================================
     3. LAZY LOADING DES IMAGES
     Les images ne se chargent que quand elles approchent de
     l'écran (rootMargin: '200px' = anticipation de 200px).
     Avantage : la page charge plus vite au démarrage.
     ============================================================ */
  const imgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          /* Remet le vrai src stocké dans data-src → déclenche le chargement */
          if (img.dataset.src) img.src = img.dataset.src;
          imgObserver.unobserve(img); /* Arrête d'observer cette image */
        }
      });
    },
    { rootMargin: "200px" },
  );

  /* Transforme une image en image lazy :
     déplace son src vers data-src, l'Observer reprendra le relais */
  function lazyObserve(img) {
    const currentSrc = img.getAttribute("src") || "";
    if (currentSrc) {
      img.dataset.src = currentSrc;
      img.removeAttribute("src");
    }
    imgObserver.observe(img);
  }

  /* Active le lazy loading sur toutes les images de badges */
  track.querySelectorAll(".badge__img").forEach(lazyObserve);

  /* ============================================================
     4. INJECTION DU HALO AU SOL
     Le JS ajoute un div.badge__floor-glow dans chaque badge.
     Il est stylisé en CSS avec --spot pour créer l'effet de
     lueur au sol qui grandit selon le spotlight.
     ============================================================ */
  track.querySelectorAll(".badge").forEach((badge) => {
    if (!badge.querySelector(".badge__floor-glow")) {
      const floorGlow = document.createElement("div");
      floorGlow.className = "badge__floor-glow";
      badge.appendChild(floorGlow);
    }
  });

  /* ============================================================
     5. CLONAGE DES BADGES — Carousel infini
     ============================================================
     Pour un carousel infini, on a besoin que la piste soit
     toujours plus large que l'écran, même avec peu de genres.

     Stratégie : on clone les originaux 3 fois.
     Quand la piste a scrollé d'une longueur d'originaux (halfW),
     on "reset" la position au début → boucle invisible.

     Originaux    : data-badge-id="0", "1", "2"...
     Clones       : data-clone-of="0", "1", "2"...
     Les clones n'ont pas de tooltip (évite les doublons).
     ============================================================ */
  const originals = Array.from(track.children);
  originals.forEach((badge, index) => {
    badge.dataset.badgeId = index;
  });

  /* 3 copies suffisent pour garantir un défilement infini */
  for (let copy = 0; copy < 3; copy++) {
    originals.forEach((original) => {
      const clone =
        original.cloneNode(true); /* true = copie profonde (avec enfants) */
      clone.querySelectorAll(".badge__img").forEach(lazyObserve);
      clone.dataset.cloneOf = original.dataset.badgeId;

      /* Supprime le tooltip du clone s'il en a un */
      const tooltip = clone.querySelector(".tooltip");
      if (tooltip) tooltip.remove();

      track.appendChild(clone);
    });
  }

  /* ============================================================
     6. TOOLTIP
     ============================================================
     Le tooltip est un div#global-tooltip dans le HTML.
     Le JS le remplit dynamiquement au clic et le positionne
     au-dessus du badge cliqué avec position: fixed.
     ============================================================ */
  const globalTT = document.getElementById("global-tooltip");
  let openBadge = null; /* Badge dont le tooltip est ouvert */
  let openBadgeEl =
    null; /* Element cliqué (pour le repositionnement au scroll) */

  /* Remplit le tooltip avec les données du badge */
  function buildTooltipContent(badge) {
    if (!globalTT) return;

    const genre = badge.dataset.genre || "";
    const rgb = badge.style.getPropertyValue("--glow-rgb") || "196,160,82";

    /* Parse le JSON des films (data-films='[{"t":"Titre","n":"9.5"}]') */
    let films = [];
    try {
      films = JSON.parse(badge.dataset.films || "[]");
    } catch (e) {}

    /* Colore la ligne en haut du tooltip selon le genre */
    globalTT.style.setProperty("--tt-rgb", rgb);
    globalTT.style.borderColor = `rgba(${rgb}, .32)`;

    globalTT.innerHTML = `
      <div class="tooltip__genre">${genre}</div>
      <div class="tooltip__films">
        ${films
          .map(
            (film) => `
          <div class="tooltip__film">
            <span class="tooltip__film-title">${film.t}</span>
            <span class="tooltip__film-note">★ ${film.n}</span>
          </div>
        `,
          )
          .join("")}
      </div>
      <a class="tooltip__hint" href="/movies?genre=${encodeURIComponent(genre)}">
        Cliquer pour explorer →
      </a>
    `;
  }

  /* Positionne et affiche le tooltip au-dessus du badge cliqué */
  function showTooltip(sourceBadge, clickedBadge) {
    buildTooltipContent(sourceBadge);
    if (!globalTT) return;

    const rect = (clickedBadge || sourceBadge).getBoundingClientRect();
    const ttW = 230; /* Largeur du tooltip définie en CSS */

    /* Centre le tooltip sur le badge, mais le garde dans la fenêtre */
    let left = rect.left + rect.width / 2 - ttW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - ttW - 8));

    globalTT.style.left = left + "px";
    globalTT.style.top = rect.top - 10 + "px";

    /* Lance l'animation d'entrée :
       - frame 1 : position de départ (translateY(-100%) scale(.96))
       - frame 2 : position finale (translateY(-100%-4px) scale(1)) */
    globalTT.style.transform = "translateY(-100%) scale(.96)";
    globalTT.classList.add("is-open");
    requestAnimationFrame(() => {
      if (globalTT)
        globalTT.style.transform = "translateY(calc(-100% - 4px)) scale(1)";
    });
  }

  function hideTooltip() {
    if (!globalTT) return;
    globalTT.classList.remove("is-open");
    globalTT.style.transform = "translateY(-100%) scale(.96)";
  }

  /* Gestion des clics sur les badges */
  track.querySelectorAll(".badge").forEach((badge) => {
    badge.addEventListener("click", (event) => {
      /* Laisse le lien "Explorer" naviguer normalement */
      if (event.target.closest(".tooltip__hint")) return;

      event.stopPropagation(); /* Empêche le clic de remonter jusqu'au document */

      /*
        Si le badge cliqué est un clone, on trouve son original
        pour avoir les bonnes données (les clones n'ont pas data-films).
      */
      const sourceId = badge.dataset.cloneOf;
      const target =
        sourceId != null
          ? track.querySelector(`.badge[data-badge-id="${sourceId}"]`) || badge
          : badge;

      const wasOpen = target.classList.contains("tooltip-open");

      /* Ferme le tooltip ouvert s'il y en a un autre */
      if (openBadge && openBadge !== target) {
        openBadge.classList.remove("tooltip-open");
      }

      /* Toggle : ouvre ou ferme */
      target.classList.toggle("tooltip-open");

      if (target.classList.contains("tooltip-open")) {
        showTooltip(
          target,
          badge,
        ); /* badge = position écran, target = données */
        openBadge = target;
        openBadgeEl = badge;
      } else {
        hideTooltip();
        openBadge = null;
        openBadgeEl = null;
      }

      /* Déclenche l'effet visuel uniquement à l'ouverture */
      if (!wasOpen) triggerRing(badge);
    });
  });

  /* Ferme le tooltip en cliquant ailleurs sur la page */
  document.addEventListener("click", () => {
    if (openBadge) {
      hideTooltip();
      openBadge.classList.remove("tooltip-open");
      openBadge = null;
      openBadgeEl = null;
    }
  });

  /* Repositionne le tooltip si la page scrolle */
  window.addEventListener(
    "scroll",
    () => {
      if (!openBadgeEl || !globalTT || !globalTT.classList.contains("is-open"))
        return;

      const rect = openBadgeEl.getBoundingClientRect();
      const ttW = 230;
      let left = rect.left + rect.width / 2 - ttW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - ttW - 8));

      globalTT.style.left = left + "px";
      globalTT.style.top = rect.top - 10 + "px";
    },
    { passive: true },
  ); /* passive: true = meilleure performance scroll */

  /* ============================================================
     7. COMPTEURS ANIMÉS
     ============================================================
     Deux compteurs distincts pour le même élément :
     - animateCounter    : déclenché au hover (une seule fois)
     - animateSpotCounter: déclenché quand le badge est en spotlight
     ============================================================ */

  /* Animation easeOutCubic : accélère au début, ralentit à la fin */
  function animateCounter(el, target) {
    if (el.dataset.animated) return; /* Ne s'exécute qu'une seule fois */
    el.dataset.animated = "1";

    const startTime = performance.now();
    const duration = 650; /* ms */

    function step(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); /* easeOutCubic */
      el.textContent = Math.round(eased * target);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target; /* Valeur exacte à la fin */
      }
    }
    requestAnimationFrame(step);
  }

  function animateSpotCounter(el, target) {
    if (el.dataset.spotAnim) return;
    el.dataset.spotAnim = "1";

    const startTime = performance.now();
    const duration = 900;

    function step(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased =
        1 - Math.pow(1 - progress, 4); /* easeOutQuart : encore plus doux */
      el.textContent = Math.round(eased * target);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }

  /* Active le compteur hover sur les badges originaux uniquement */
  track.querySelectorAll(".badge:not([data-clone-of])").forEach((badge) => {
    const countEl = badge.querySelector("[data-target]");
    if (!countEl) return;
    badge.addEventListener(
      "mouseenter",
      () => animateCounter(countEl, parseInt(countEl.dataset.target)),
      {
        once: true,
      } /* { once: true } = supprime le listener après le premier appel */,
    );
  });

  /* ============================================================
     8. GÉOMÉTRIE DU CANVAS — Fonctions utilitaires
     ============================================================
     Ces fonctions calculent des positions sur le pourtour
     d'un rectangle arrondi (le badge) pour déplacer la "tête"
     de l'animation de bordure.
     ============================================================ */

  /**
   * Dessine un rectangle aux coins arrondis dans un contexte canvas.
   * (ctx.roundRect n'est pas disponible sur tous les navigateurs)
   */
  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /** Calcule le périmètre total d'un rectangle arrondi */
  function getRectPerimeter(w, h, r) {
    return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  }

  /**
   * Retourne le point {x, y} situé à la distance `t` (de 0 à 1)
   * sur le périmètre d'un rectangle arrondi.
   * t=0 → coin haut-gauche, t=0.5 → coin bas-droit, t=1 → retour au départ.
   */
  function getPointOnRect(t, w, h, r) {
    /* Distance parcourue = t * périmètre total */
    let dist = (((t % 1) + 1) % 1) * getRectPerimeter(w, h, r);

    /* Les 8 segments du rectangle arrondi (4 droites + 4 arcs de quart de cercle) */
    const segments = [
      { len: w - 2 * r, point: (u) => ({ x: r + u * (w - 2 * r), y: 0 }) },
      {
        len: (Math.PI * r) / 2,
        point: (u) => {
          const a = -Math.PI / 2 + (u * Math.PI) / 2;
          return { x: w - r + Math.cos(a) * r, y: r + Math.sin(a) * r };
        },
      },
      { len: h - 2 * r, point: (u) => ({ x: w, y: r + u * (h - 2 * r) }) },
      {
        len: (Math.PI * r) / 2,
        point: (u) => {
          const a = (u * Math.PI) / 2;
          return { x: w - r + Math.cos(a) * r, y: h - r + Math.sin(a) * r };
        },
      },
      { len: w - 2 * r, point: (u) => ({ x: w - r - u * (w - 2 * r), y: h }) },
      {
        len: (Math.PI * r) / 2,
        point: (u) => {
          const a = Math.PI / 2 + (u * Math.PI) / 2;
          return { x: r + Math.cos(a) * r, y: h - r + Math.sin(a) * r };
        },
      },
      { len: h - 2 * r, point: (u) => ({ x: 0, y: h - r - u * (h - 2 * r) }) },
      {
        len: (Math.PI * r) / 2,
        point: (u) => {
          const a = Math.PI + (u * Math.PI) / 2;
          return { x: r + Math.cos(a) * r, y: r + Math.sin(a) * r };
        },
      },
    ];

    /* Trouve dans quel segment on est et retourne le point */
    for (const seg of segments) {
      if (dist <= seg.len) return seg.point(dist / seg.len);
      dist -= seg.len;
    }
    return segments[0].point(0);
  }

  /**
   * Retourne le point sur le pourtour du canvas, en tenant compte du PAD.
   * Le badge occupe le canvas moins PAD px de chaque côté.
   */
  function getBorderPoint(t, canvasW, canvasH) {
    const badgeW = canvasW - 2 * PAD;
    const badgeH = canvasH - 2 * PAD;
    const p = getPointOnRect(t, badgeW, badgeH, 22); /* 22 = rayon des coins */
    return { x: p.x + PAD, y: p.y + PAD };
  }

  /** Convertit une couleur hexadécimale en tableau [r, g, b] */
  function hexToRgb(hex) {
    hex = hex.trim().replace("#", "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /** Retourne le rectangle du badge dans le canvas (hors PAD) */
  function getBadgeRect(state) {
    return {
      x: PAD,
      y: PAD,
      w: state.canvas.width - 2 * PAD,
      h: state.canvas.height - 2 * PAD,
    };
  }

  /* ============================================================
     9. ÉTAT PAR BADGE
     ============================================================
     makeBadgeState() crée un objet qui stocke toutes les données
     propres à un badge : son canvas, son animation, ses particules,
     ses timers, ses paramètres de glow, etc.
     ============================================================ */
  function makeBadgeState(badge) {
    const canvas = badge.querySelector(".badge__border-canvas");
    const imgWrap = badge.querySelector(".badge__img-wrap");
    if (!canvas) return null;

    const state = {
      badge,
      canvas,
      imgWrap,
      animType: badge.dataset.anim || "fuse",

      /* Timer général (en ms, s'incrémente chaque frame) */
      t: 0,

      /* Timers par animation — chacun de 0 à 1 en boucle */
      bloodT: 0,
      fuseT: 0,
      scanT: 0,
      magicT: 0,
      bulletT: 0,
      heartT: 0,
      torchT: 0,
      notesT: 0,
      sirenT: 0,
      strobeT: 0,
      brushT: 0,
      viewfinderT: 0,
      radarAngle: 0,
      tearT: 0,

      /* États spéciaux */
      scanGlitch: 0,
      sirenPhase: 0,
      brushWobble: 0,
      vfTimer: 0,

      /* Pools de particules (tableaux d'objets particule) */
      bloodDrops: [],
      fuseSmoke: [],
      magicOrbs: [],
      confetti: [],
      torchEmbers: [],
      noteParticles: [],
      tearDrops: [],
      heartParticles: [],

      /* Hover */
      hovered: false,

      /*
        Glow ambiant : la position du glow CSS suit la "tête" de l'animation.
        glowLerpX/Y est une interpolation douce vers la position réelle
        pour éviter les sauts brusques.
      */
      glowHeadX: 50,
      glowHeadY: 50,
      glowLerpX: 50,
      glowLerpY: 50,
      glowIntensity: 0,
      glowIntensityTarget: 0,

      /* Adapte la taille du canvas à celle du badge */
      resizeCanvas() {
        const bW = badge.offsetWidth;
        const bH = badge.offsetHeight;
        canvas.width = bW + 2 * PAD;
        canvas.height = bH + 2 * PAD;
        canvas.style.position = "absolute";
        canvas.style.top = -PAD + "px";
        canvas.style.left = -PAD + "px";
        canvas.style.width = bW + 2 * PAD + "px";
        canvas.style.height = bH + 2 * PAD + "px";
      },
    };

    state.resizeCanvas();

    /* Active l'animation quand la souris entre */
    badge.addEventListener("mouseenter", () => {
      state.hovered = true;
      state.glowIntensityTarget = 1;
    });

    /* Réinitialise tout quand la souris sort */
    badge.addEventListener("mouseleave", () => {
      state.hovered = false;
      state.glowIntensityTarget = 0;

      /* Efface le canvas */
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      /* Vide tous les pools de particules */
      state.bloodDrops = [];
      state.fuseSmoke = [];
      state.magicOrbs = [];
      state.confetti = [];
      state.torchEmbers = [];
      state.noteParticles = [];
      state.tearDrops = [];
      state.heartParticles = [];
      state.scanGlitch = 0;
    });

    return state;
  }

  /* ============================================================
     10. GLOW AMBIANT
     ============================================================
     Met à jour les variables CSS --glow-x/y/intensity sur le badge
     pour que la lueur intérieure suive la tête de l'animation.
     Utilise une interpolation linéaire (lerp) pour un mouvement doux.
     ============================================================ */
  function updateAmbientGlow(state, headT, dt) {
    const W = state.canvas.width;
    const H = state.canvas.height;
    const badgeW = W - 2 * PAD;
    const badgeH = H - 2 * PAD;

    /* Position réelle de la tête (en px dans le canvas) */
    const raw = getBorderPoint(headT, W, H);
    const bx = raw.x - PAD;
    const by = raw.y - PAD;

    /* Convertit en pourcentage par rapport au badge */
    state.glowHeadX = (bx / badgeW) * 100;
    state.glowHeadY = (by / badgeH) * 100;

    /*
      Interpolation linéaire (lerp) :
      Déplace glowLerpX vers glowHeadX de k% à chaque frame.
      k dépend du dt pour être indépendant du framerate.
      Résultat : la lueur suit la tête avec un léger retard (effet smooth).
    */
    const k = 1 - Math.pow(1 - 0.055, dt / 16);
    state.glowLerpX += (state.glowHeadX - state.glowLerpX) * k;
    state.glowLerpY += (state.glowHeadY - state.glowLerpY) * k;

    /* Interpole également l'intensité (apparaît/disparaît doucement) */
    state.glowIntensity +=
      (state.glowIntensityTarget - state.glowIntensity) * k * 0.7;

    /* Applique les variables CSS sur le badge */
    const style = state.badge.style;
    style.setProperty("--glow-x", state.glowLerpX.toFixed(2) + "%");
    style.setProperty("--glow-y", state.glowLerpY.toFixed(2) + "%");
    style.setProperty("--glow-intensity", state.glowIntensity.toFixed(3));

    /* Calcule la position du glow dans la zone image uniquement */
    if (state.imgWrap) {
      const imgRect = state.imgWrap.getBoundingClientRect();
      const badgeRect = state.badge.getBoundingClientRect();
      const ix = ((bx - (imgRect.left - badgeRect.left)) / imgRect.width) * 100;
      const iy = ((by - (imgRect.top - badgeRect.top)) / imgRect.height) * 100;
      style.setProperty(
        "--img-glow-x",
        Math.max(-20, Math.min(120, ix)).toFixed(2) + "%",
      );
      style.setProperty(
        "--img-glow-y",
        Math.max(-20, Math.min(120, iy)).toFixed(2) + "%",
      );
    }
  }

  /* ============================================================
     11. ANIMATIONS DE BORDURE — une fonction par genre
     ============================================================
     Chaque fonction reçoit :
     - state : l'état du badge (timers, particules, canvas…)
     - dt    : delta time en ms depuis la dernière frame
               → sert à rendre l'animation indépendante du framerate

     Convention : state.fuseT (par exemple) va de 0 à 1 en boucle.
     bp(state.fuseT, W, H) retourne le point {x,y} sur la bordure.
     ============================================================ */

  /* BLOOD — traîne rouge + gouttes qui tombent */
  function drawBlood(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.bloodT = (state.bloodT + dt * 0.00018) % 1;
    const rect = getBadgeRect(state);

    /* Contour rouge très discret */
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = "rgba(160,0,0,.20)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    /* Traîne : 45 points décalés en arrière (du plus vif au plus transparent) */
    for (let i = 1; i <= 45; i++) {
      const u = (state.bloodT - (i / 45) * 0.16 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 45;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * fade + 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,0,0,${fade * 0.65})`;
      ctx.fill();
    }

    /* Tête lumineuse (le point le plus brillant) */
    const head = getBorderPoint(state.bloodT, W, H);
    const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 14);
    grd.addColorStop(0, "rgba(255,60,60,1)");
    grd.addColorStop(0.4, "rgba(180,0,0,.7)");
    grd.addColorStop(1, "rgba(120,0,0,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x, head.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,180,180,.9)";
    ctx.fill();

    /* Gouttes qui tombent depuis le haut du badge */
    if (state.bloodDrops.length < 7 && Math.random() < 0.06) {
      state.bloodDrops.push({
        x: PAD + 16 + Math.random() * (rect.w - 32),
        y: PAD,
        vy: 0.4 + Math.random() * 0.5 /* vitesse de chute */,
        len: 0 /* longueur actuelle du trait */,
        maxLen: 14 + Math.random() * 22 /* longueur maximale */,
        alpha: 1,
        dripLen: 0 /* longueur de la "goutte" au bout */,
      });
    }

    state.bloodDrops = state.bloodDrops.filter((d) => d.alpha > 0.01);
    state.bloodDrops.forEach((drop) => {
      drop.len = Math.min(drop.len + drop.vy * dt * 0.14, drop.maxLen);

      /* Quand le trait est complet, la goutte grossit et s'estompe */
      if (drop.len >= drop.maxLen) {
        drop.dripLen += drop.vy * dt * 0.07;
        if (drop.dripLen > 20) drop.alpha -= 0.013 * dt;
      }

      /* Trait de sang dégradé */
      const grad = ctx.createLinearGradient(
        drop.x,
        drop.y,
        drop.x,
        drop.y + drop.len,
      );
      grad.addColorStop(0, `rgba(180,0,0,${drop.alpha * 0.9})`);
      grad.addColorStop(1, `rgba(90,0,0,${drop.alpha * 0.2})`);
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, drop.y + drop.len);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Goutte ronde au bas du trait */
      if (drop.dripLen > 0) {
        const radius = 2.5 + Math.min(drop.dripLen, 10) * 0.28;
        ctx.beginPath();
        ctx.arc(
          drop.x,
          drop.y + drop.len + Math.min(drop.dripLen, 16),
          radius,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgba(160,0,0,${drop.alpha * 0.8})`;
        ctx.fill();
      }
    });
  }

  /* FUSE — mèche qui brûle avec braises volantes */
  function drawFuse(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.fuseT = (state.fuseT + dt * 0.00025) % 1;
    const rect = getBadgeRect(state);

    /* Contour façon corde brûlée */
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = "rgba(100,60,10,.22)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    /* Traîne brune */
    for (let i = 0; i < 60; i++) {
      const u = (state.fuseT - (i / 60) * 0.18 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 60;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(110,70,15,${fade * 0.5})`;
      ctx.fill();
    }

    /* Tête de flamme */
    const head = getBorderPoint(state.fuseT, W, H);
    const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 18);
    grd.addColorStop(0, "rgba(255,230,90,1)");
    grd.addColorStop(0.3, "rgba(255,130,20,.6)");
    grd.addColorStop(1, "rgba(255,50,0,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fffde0";
    ctx.fill();

    /* Braises volantes (petites particules orange) */
    state.fuseSmoke = state.fuseSmoke.filter((p) => p.life > 0);
    if (Math.random() < 0.6) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      state.fuseSmoke.push({
        x: head.x,
        y: head.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.2,
        life: 0.9,
      });
    }
    state.fuseSmoke.forEach((ember) => {
      ember.x += ember.vx * dt * 0.06;
      ember.y += ember.vy * dt * 0.06;
      ember.vy += 0.06 * dt * 0.06; /* gravité */
      ember.life -= 0.022 * dt * 0.06 * 16;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,180,40,${Math.max(0, ember.life)})`;
      ctx.fill();
    });
  }

  /* SCAN — traîne vert néon avec glitch numérique */
  function drawScan(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.scanT = (state.scanT + dt * 0.00028) % 1;
    state.scanGlitch += dt;

    const rect = getBadgeRect(state);
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = "rgba(0,255,136,.09)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    /* Glitch : décale légèrement la traîne pendant un court instant */
    const glitch =
      state.scanGlitch > 80 && state.scanGlitch < 90
        ? Math.random() * 5 - 2.5
        : 0;
    if (state.scanGlitch > 120) {
      state.scanGlitch = Math.random() < 0.7 ? 0 : 80;
    }

    for (let i = 0; i <= 80; i++) {
      const u = (state.scanT - (i / 80) * 0.22 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 80;
      ctx.beginPath();
      ctx.arc(p.x + (i < 5 ? glitch : 0), p.y, 2 * fade + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,136,${fade * 0.85})`;
      ctx.fill();
    }

    const head = getBorderPoint(state.scanT, W, H);
    const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 15);
    grd.addColorStop(0, "rgba(200,255,220,1)");
    grd.addColorStop(0.4, "rgba(0,255,136,.6)");
    grd.addColorStop(1, "rgba(0,200,80,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Ligne de glitch horizontale aléatoire */
    if (glitch !== 0) {
      ctx.fillStyle = "rgba(0,255,136,.10)";
      ctx.fillRect(
        PAD,
        PAD + 5 + Math.random() * (rect.h - 10),
        rect.w,
        1 + Math.random() * 2,
      );
    }
  }

  /* MAGIC — 5 orbes colorés qui orbitent avec traîne arc-en-ciel */
  function drawMagic(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);
    state.t += dt;

    /* Initialise les 5 orbes une seule fois */
    if (!state.magicOrbs.length) {
      const colors = ["#C084FC", "#60A5FA", "#F59E0B", "#34D399", "#F472B6"];
      for (let i = 0; i < 5; i++) {
        state.magicOrbs.push({
          t: i / 5,
          speed: 0.00014 + Math.random() * 0.00012,
          trail: [],
          color: colors[i],
          size: 2 + Math.random() * 2,
        });
      }
    }

    /* Contour violet doux */
    const rect = getBadgeRect(state);
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = "rgba(160,100,220,.13)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(192,132,252,.3)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    /* Déplace et dessine chaque orbe + sa traîne */
    state.magicOrbs.forEach((orb) => {
      orb.t = (orb.t + orb.speed * dt) % 1;
      const pos = getBorderPoint(orb.t, W, H);

      /* Ajoute le point actuel à la traîne (max 20 points) */
      orb.trail.push({ x: pos.x, y: pos.y });
      if (orb.trail.length > 20) orb.trail.shift();

      /* Dessine la traîne (de plus en plus petite vers l'arrière) */
      orb.trail.forEach((tp, i) => {
        const fade = i / orb.trail.length;
        const [r, g, b] = hexToRgb(orb.color);
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, orb.size * fade, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${fade * 0.7})`;
        ctx.fill();
      });

      /* Tête de l'orbe : gradient radial blanc → couleur */
      const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 9);
      const [r, g, b] = hexToRgb(orb.color);
      grd.addColorStop(0, "rgba(255,255,255,.9)");
      grd.addColorStop(0.3, `rgba(${r},${g},${b},.8)`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    });

    /* Étincelles aléatoires sur la bordure */
    if (Math.random() < 0.018) {
      const p = getBorderPoint(Math.random(), W, H);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(angle) * 11, p.y + Math.sin(angle) * 11);
        ctx.strokeStyle = "rgba(255,240,180,.5)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    state.magicT = state.magicOrbs[0].t;
  }

  /* BULLET — traîne orange rapide (genre Action) */
  function drawBullet(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.bulletT = (state.bulletT + dt * 0.00075) % 1;

    for (let i = 1; i <= 55; i++) {
      const u = (state.bulletT - (i / 55) * 0.1 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.8 * fade + 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${70 + Math.floor(fade * 150)},0,${fade * 0.9})`;
      ctx.fill();
    }

    const head = getBorderPoint(state.bulletT, W, H);
    const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 14);
    grd.addColorStop(0, "rgba(255,255,200,1)");
    grd.addColorStop(0.5, "rgba(255,120,0,.8)");
    grd.addColorStop(1, "rgba(255,40,0,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }

  /* HEART — tête en forme de cœur + petits cœurs qui s'envolent */
  function drawHeart(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.heartT = (state.heartT + dt * 0.0002) % 1;
    state.t += dt;

    /* Bordure rose pulsante */
    const pulse = 0.12 + 0.1 * Math.abs(Math.sin(state.t * 0.008));
    const rect = getBadgeRect(state);
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = `rgba(255,107,138,${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(255,107,138,.4)";
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();

    /* Traîne rose */
    for (let i = 1; i <= 40; i++) {
      const u = (state.heartT - (i / 40) * 0.14 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 40;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * fade, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,150,170,${fade * 0.7})`;
      ctx.fill();
    }

    /* Tête en forme de cœur (courbes de Bézier) */
    const head = getBorderPoint(state.heartT, W, H);
    const bs = (0.9 + 0.2 * Math.abs(Math.sin(state.t * 0.012))) * 6;
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.beginPath();
    ctx.moveTo(0, -bs * 0.4);
    /* Moitié droite du cœur */
    ctx.bezierCurveTo(bs * 0.5, -bs, bs, -bs * 0.5, 0, bs * 0.5);
    /* Moitié gauche du cœur */
    ctx.bezierCurveTo(-bs, -bs * 0.5, -bs * 0.5, -bs, 0, -bs * 0.4);
    ctx.fillStyle = "rgba(255,107,138,.92)";
    ctx.shadowColor = "rgba(255,107,138,.8)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    /* Petits cœurs ronds qui flottent vers le haut */
    state.heartParticles = state.heartParticles.filter((p) => p.life > 0);
    if (Math.random() < 0.09 && state.heartParticles.length < 14) {
      state.heartParticles.push({
        x: head.x,
        y: head.y,
        vx: (Math.random() - 0.5) * 2,
        vy: -1.2 - Math.random() * 1.6,
        life: 1,
        size: 1.2 + Math.random() * 2,
      });
    }
    state.heartParticles.forEach((p) => {
      p.x += p.vx * dt * 0.05;
      p.y += p.vy * dt * 0.05;
      p.life -= 0.013 * dt * 0.05 * 16;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,160,180,${Math.max(0, p.life)})`;
      ctx.fill();
    });
  }

  /* TORCH — flamme vacillante + braises qui montent */
  function drawTorch(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.torchT = (state.torchT + dt * 0.0002) % 1;
    state.t += dt;

    /* Vacillement : la taille de la flamme oscille */
    const flicker =
      0.7 + 0.3 * Math.sin(state.t * 0.04 + Math.sin(state.t * 0.012) * 4);

    /* Traîne chaude orange→rouge */
    for (let i = 0; i <= 55; i++) {
      const u = (state.torchT - (i / 55) * 0.18 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = (1 - i / 55) * flicker;
      const rv = Math.floor(200 + 55 * fade);
      const gv = Math.floor(80 + 100 * fade * fade);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2 * fade + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rv},${gv},10,${fade * 0.85})`;
      ctx.fill();
    }

    /* Tête flamboyante */
    const head = getBorderPoint(state.torchT, W, H);
    const grd = ctx.createRadialGradient(
      head.x,
      head.y,
      0,
      head.x,
      head.y,
      16 * flicker,
    );
    grd.addColorStop(0, "rgba(255,255,180,.95)");
    grd.addColorStop(0.3, "rgba(255,160,20,.7)");
    grd.addColorStop(0.7, "rgba(200,60,0,.3)");
    grd.addColorStop(1, "rgba(100,20,0,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 16 * flicker, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Braises montantes */
    state.torchEmbers = state.torchEmbers.filter((e) => e.life > 0);
    if (Math.random() < 0.3) {
      state.torchEmbers.push({
        x: head.x,
        y: head.y,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 1.5,
        life: 1,
        color: Math.random() < 0.5 ? "#FFC040" : "#FF8020",
      });
    }
    state.torchEmbers.forEach((ember) => {
      ember.x += ember.vx * dt * 0.05;
      ember.y += ember.vy * dt * 0.05;
      ember.vy += 0.045 * dt * 0.05; /* gravité */
      ember.life -= 0.018 * dt * 0.05 * 16;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = ember.color;
      ctx.globalAlpha = Math.max(0, ember.life);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  /* NOTES — notes de musique qui flottent + tête dorée pulsante */
  function drawNotes(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.notesT = (state.notesT + dt * 0.00022) % 1;
    state.t += dt;

    /* Bordure dorée pulsante */
    const pulse = 0.12 + 0.1 * Math.sin(state.t * 0.006);
    const rect = getBadgeRect(state);
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = `rgba(196,160,82,${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    /* Traîne dorée */
    for (let i = 1; i <= 30; i++) {
      const u = (state.notesT - (i / 30) * 0.12 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5 * fade, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,224,133,${fade * 0.6})`;
      ctx.fill();
    }

    /* Tête pulsante */
    const head = getBorderPoint(state.notesT, W, H);
    const bpVal = 0.8 + 0.2 * Math.sin(state.t * 0.018);
    const grd = ctx.createRadialGradient(
      head.x,
      head.y,
      0,
      head.x,
      head.y,
      14 * bpVal,
    );
    grd.addColorStop(0, "rgba(255,240,160,.9)");
    grd.addColorStop(0.4, "rgba(196,160,82,.5)");
    grd.addColorStop(1, "rgba(196,160,82,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 14 * bpVal, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Notes musicales flottantes */
    const SYMBOLS = ["♪", "♫", "♩", "♬"];
    state.noteParticles = state.noteParticles.filter((n) => n.life > 0);
    if (Math.random() < 0.07 && state.noteParticles.length < 9) {
      const spawn = getBorderPoint(Math.random(), W, H);
      state.noteParticles.push({
        x: spawn.x,
        y: spawn.y,
        vx: (Math.random() - 0.5) * 0.9,
        vy: -1 - Math.random() * 0.8,
        life: 1,
        sym: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      });
    }
    state.noteParticles.forEach((note) => {
      note.x += note.vx * dt * 0.05;
      note.y += note.vy * dt * 0.05;
      note.life -= 0.012 * dt * 0.05 * 16;
      ctx.font = "11px serif";
      ctx.globalAlpha = Math.max(0, note.life);
      ctx.fillStyle = "#FFE085";
      ctx.fillText(note.sym, note.x - 5, note.y + 4);
      ctx.globalAlpha = 1;
    });
  }

  /* SIREN — deux gyrophares bleu et rouge qui tournent en sens opposés */
  function drawSiren(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.sirenPhase += dt * 0.004;

    /* Deux faisceaux : [décalage en phase, couleur RGB] */
    const beams = [
      [0, [0, 100, 255]] /* bleu */,
      [Math.PI, [210, 20, 20]] /* rouge */,
    ];

    beams.forEach(([offset, [r, g, b]]) => {
      /* Position t de chaque faisceau (décalés de 0.5 tour l'un par rapport à l'autre) */
      const t = (state.sirenPhase * 0.28 + offset / (Math.PI * 2)) % 1;
      const pulse =
        0.5 +
        0.5 *
          Math.abs(
            Math.sin(state.sirenPhase * 1.5 + (offset > 0 ? Math.PI : 0)),
          );

      /* Traîne */
      for (let i = 0; i <= 50; i++) {
        const u = (t - (i / 50) * 0.18 + 1) % 1;
        const p = getBorderPoint(u, W, H);
        const fade = (1 - i / 50) * pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.8 * fade + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${fade * 0.92})`;
        ctx.fill();
      }

      /* Tête avec halo */
      const head = getBorderPoint(t, W, H);
      const grd = ctx.createRadialGradient(
        head.x,
        head.y,
        0,
        head.x,
        head.y,
        16,
      );
      grd.addColorStop(0, `rgba(255,255,255,${pulse * 0.95})`);
      grd.addColorStop(0.35, `rgba(${r},${g},${b},${pulse * 0.75})`);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(head.x, head.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* Halo large diffus */
      const halo = ctx.createRadialGradient(
        head.x,
        head.y,
        8,
        head.x,
        head.y,
        36,
      );
      halo.addColorStop(0, `rgba(${r},${g},${b},${pulse * 0.18})`);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(head.x, head.y, 36, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();
    });

    /* Bord qui clignote en alternant bleu et rouge */
    const rect = getBadgeRect(state);
    const blinkB = 0.5 + 0.5 * Math.sin(state.sirenPhase * 3);
    const blinkR = 0.5 + 0.5 * Math.sin(state.sirenPhase * 3 + Math.PI);

    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = `rgba(0,100,255,${blinkB * 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = `rgba(210,20,20,${blinkR * 0.25})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    state.sirenT = (state.sirenPhase * 0.28) % 1;
  }

  /* STROBE — traîne bleu-gris + flash blanc pulsant */
  function drawStrobe(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.strobeT = (state.strobeT + dt * 0.003) % (Math.PI * 2);
    state.fuseT = (state.fuseT + dt * 0.00011) % 1;

    /* Traîne gris-bleu */
    for (let i = 0; i <= 60; i++) {
      const u = (state.fuseT - (i / 60) * 0.3 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 60;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5 * fade + 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,200,240,${fade * 0.45})`;
      ctx.fill();
    }

    /* Tête pulsante */
    const head = getBorderPoint(state.fuseT, W, H);
    const pulse = 0.6 + 0.4 * Math.sin(state.strobeT * 2.5);
    const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 17);
    grd.addColorStop(0, `rgba(240,248,255,${pulse})`);
    grd.addColorStop(0.5, `rgba(100,140,200,${pulse * 0.4})`);
    grd.addColorStop(1, "rgba(60,80,150,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 17, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Flash de bordure aléatoire */
    if (Math.random() < 0.01) {
      const rect = getBadgeRect(state);
      ctx.save();
      drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
      ctx.strokeStyle = `rgba(200,220,255,${Math.random() * 0.5 + 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  /* BRUSH — traîne multicolore arc-en-ciel avec oscillation */
  function drawBrush(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.brushT = (state.brushT + dt * 0.00022) % 1;
    state.brushWobble += dt * 0.01;

    const COLORS = [
      "#FF6B6B",
      "#FFE085",
      "#6BFFA0",
      "#6BCFFF",
      "#FF9F40",
      "#DA77FF",
      "#F2C84B",
    ];

    for (let i = 0; i <= 70; i++) {
      const u = (state.brushT - (i / 70) * 0.15 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 70;
      const ci = Math.floor(u * COLORS.length) % COLORS.length;
      const [r, g, b] = hexToRgb(COLORS[ci]);

      /* Oscillation de taille */
      const wobble = 1 + 0.6 * Math.sin(state.brushWobble + i * 0.3);

      ctx.beginPath();
      ctx.arc(p.x, p.y, (2.5 + wobble) * fade, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${fade * 0.85})`;
      ctx.fill();
    }

    /* Point blanc à la tête */
    const head = getBorderPoint(state.brushT, W, H);
    ctx.beginPath();
    ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fill();
  }

  /* VIEWFINDER — viseur de caméra (documentaire) */
  function drawViewfinder(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.viewfinderT = (state.viewfinderT + dt * 0.00018) % 1;
    state.vfTimer += dt;

    /* Contour en pointillés discret */
    const rect = getBadgeRect(state);
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = "rgba(123,167,188,.20)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Réticule aux 4 coins de la tête */
    const head = getBorderPoint(state.viewfinderT, W, H);
    const bs = 9; /* taille du réticule */
    ctx.strokeStyle = "rgba(200,240,255,.85)";
    ctx.lineWidth = 1.5;

    /* Pour chaque coin : [-1,-1], [1,-1], [-1,1], [1,1] */
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].forEach(([sx, sy]) => {
      ctx.beginPath();
      /* Segment horizontal du coin */
      ctx.moveTo(head.x + sx * bs, head.y + sy * bs);
      ctx.lineTo(head.x + sx * (bs - 4), head.y + sy * bs);
      /* Segment vertical du coin */
      ctx.moveTo(head.x + sx * bs, head.y + sy * bs);
      ctx.lineTo(head.x + sx * bs, head.y + sy * (bs - 4));
      ctx.stroke();
    });

    /* Point central pulsant */
    const pulse = 0.5 + 0.5 * Math.sin(state.vfTimer * 0.008);
    ctx.beginPath();
    ctx.arc(head.x, head.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,240,255,${pulse * 0.9})`;
    ctx.fill();

    /* Pixels parasites aléatoires (effet CCD) */
    if (Math.random() < 0.18) {
      const p = getBorderPoint(Math.random(), W, H);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(123,167,188,.45)";
      ctx.fill();
    }
  }

  /* RADAR — balayage angulaire vert (genre Guerre) */
  function drawRadar(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.radarAngle = (state.radarAngle + dt * 0.0022) % (Math.PI * 2);

    /* Contour en pointillés gris acier */
    const rect = getBadgeRect(state);
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = "rgba(119,136,153,.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const cx = W / 2,
      cy = H / 2;
    const sweep = Math.PI * 0.4; /* Angle de la traîne du radar */

    /*
      Pour chaque angle de la traîne, trouve le point sur la bordure
      le plus proche de cet angle (vue depuis le centre du badge).
    */
    function findClosestBorderPoint(targetAngle) {
      let bestT = 0,
        bestDist = 1e9;
      for (let j = 0; j < 200; j++) {
        const t = j / 200;
        const p = getBorderPoint(t, W, H);
        const angle = Math.atan2(p.y - cy, p.x - cx);
        /* Distance angulaire (tient compte des 360°) */
        const dist = Math.abs(
          ((angle - targetAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI,
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestT = t;
        }
      }
      return getBorderPoint(bestT, W, H);
    }

    /* Dessine la traîne du radar */
    for (let i = 0; i <= 60; i++) {
      const p = findClosestBorderPoint(state.radarAngle - (i / 60) * sweep);
      const fade = (1 - i / 60) * 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * fade + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,200,100,${fade * 0.85})`;
      ctx.fill();
    }

    /* Tête du radar */
    const head = findClosestBorderPoint(state.radarAngle);
    const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 12);
    grd.addColorStop(0, "rgba(180,255,180,.9)");
    grd.addColorStop(1, "rgba(0,100,0,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    state.radarT = state.radarAngle / (Math.PI * 2);
  }

  /* TEAR — larmes bleues + prismes colorés */
  function drawTear(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);

    state.tearT = (state.tearT + dt * 0.00015) % 1;
    state.t += dt;

    /* Contour doré très discret */
    const rect = getBadgeRect(state);
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = "rgba(184,136,42,.13)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    /* Traîne bleu argenté */
    for (let i = 1; i <= 40; i++) {
      const u = (state.tearT - (i / 40) * 0.14 + 1) % 1;
      const p = getBorderPoint(u, W, H);
      const fade = 1 - i / 40;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8 * fade + 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,210,255,${fade * 0.55})`;
      ctx.fill();
    }

    /* Tête */
    const head = getBorderPoint(state.tearT, W, H);
    const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 12);
    grd.addColorStop(0, "rgba(220,240,255,1)");
    grd.addColorStop(0.4, "rgba(140,180,240,.7)");
    grd.addColorStop(1, "rgba(100,150,220,0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fill();

    /* Larmes latérales qui tombent depuis les bords */
    if (state.tearDrops.length < 5 && Math.random() < 0.04) {
      const fromLeft = Math.random() < 0.5;
      state.tearDrops.push({
        x: fromLeft ? PAD : W - PAD,
        y: PAD + 26 + Math.random() * (rect.h - 60),
        vy: 0.28 + Math.random() * 0.4,
        len: 0,
        maxLen: 14 + Math.random() * 20,
        alpha: 0.85,
        dripLen: 0,
        hasPrism: Math.random() > 0.5 /* prisme = décomposition en RGB */,
      });
    }
    state.tearDrops = state.tearDrops.filter((d) => d.alpha > 0.01);
    state.tearDrops.forEach((drop) => {
      drop.len = Math.min(drop.len + drop.vy * dt * 0.12, drop.maxLen);
      if (drop.len >= drop.maxLen) {
        drop.dripLen += drop.vy * dt * 0.07;
        if (drop.dripLen > 18) drop.alpha -= 0.012 * dt;
      }

      /* Trait de larme */
      const grad = ctx.createLinearGradient(
        drop.x,
        drop.y,
        drop.x,
        drop.y + drop.len,
      );
      grad.addColorStop(0, `rgba(180,200,240,${drop.alpha * 0.7})`);
      grad.addColorStop(1, `rgba(150,180,220,${drop.alpha * 0.2})`);
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, drop.y + drop.len);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();

      /* Goutte avec optionnel effet prisme */
      if (drop.dripLen > 0) {
        const radius = 2.5 + Math.min(drop.dripLen, 9) * 0.25;
        const dropY = drop.y + drop.len + Math.min(drop.dripLen, 14);

        /* Effet prisme : 3 petits cercles R, V, B décalés */
        if (drop.hasPrism) {
          const prismColors = [
            "rgba(255,100,100,.3)",
            "rgba(100,255,100,.3)",
            "rgba(100,100,255,.3)",
          ];
          prismColors.forEach((color, i) => {
            ctx.beginPath();
            ctx.arc(drop.x + (i - 1) * 2, dropY, radius * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          });
        }

        ctx.beginPath();
        ctx.arc(drop.x, dropY, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,210,250,${drop.alpha * 0.75})`;
        ctx.fill();
      }
    });
  }

  /* CONFETTI — rectangles colorés volants (genre Comédie) */
  function drawConfetti(state, dt) {
    const ctx = state.canvas.getContext("2d");
    const W = state.canvas.width,
      H = state.canvas.height;
    ctx.clearRect(0, 0, W, H);
    state.t += dt;

    /* Contour jaune très discret */
    const rect = getBadgeRect(state);
    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22);
    ctx.strokeStyle = "rgba(255,220,100,.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    /* Génère de nouveaux confettis depuis la bordure */
    const COLORS = [
      "#FF6B6B",
      "#FFE085",
      "#6BFFA0",
      "#6BCFFF",
      "#FF9F40",
      "#DA77FF",
    ];
    if (state.confetti.length < 30 && Math.random() < 0.3) {
      const spawn = getBorderPoint(Math.random(), W, H);
      state.confetti.push({
        x: spawn.x,
        y: spawn.y,
        vx: (Math.random() - 0.5) * 4,
        vy: -2.2 - Math.random() * 2.2,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.35,
        life: 1,
        w: 4 + Math.random() * 5,
        h: 3 + Math.random() * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    state.confetti = state.confetti.filter((c) => c.life > 0);
    state.confetti.forEach((c) => {
      c.x += c.vx * dt * 0.05;
      c.y += c.vy * dt * 0.05;
      c.vy += 0.07 * dt * 0.05; /* gravité */
      c.rot += c.vrot * dt * 0.05;
      c.life -= 0.013 * dt * 0.05 * 16;

      /* ctx.save/restore pour ne pas propager la rotation aux autres éléments */
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     12. TABLE DE DISPATCH DES ANIMATIONS
     Associe chaque valeur de data-anim à sa fonction de dessin.
     ============================================================ */
  const DRAW_FNS = {
    blood: drawBlood,
    fuse: drawFuse,
    scan: drawScan,
    magic: drawMagic,
    bullet: drawBullet,
    heart: drawHeart,
    torch: drawTorch,
    notes: drawNotes,
    siren: drawSiren,
    strobe: drawStrobe,
    brush: drawBrush,
    viewfinder: drawViewfinder,
    radar: drawRadar,
    tear: drawTear,
    confetti: drawConfetti,
  };

  /*
    Retourne la position t (0→1) de la "tête" de chaque animation.
    Utilisée pour synchroniser le glow ambiant avec la tête.
  */
  function getHeadT(state) {
    switch (state.animType) {
      case "blood":
        return state.bloodT;
      case "fuse":
        return state.fuseT;
      case "scan":
        return state.scanT;
      case "bullet":
        return state.bulletT;
      case "heart":
        return state.heartT;
      case "torch":
        return state.torchT;
      case "notes":
        return state.notesT;
      case "brush":
        return state.brushT;
      case "viewfinder":
        return state.viewfinderT;
      case "tear":
        return state.tearT;
      case "strobe":
        return state.fuseT; /* strobe réutilise fuseT */
      case "magic":
        return state.magicOrbs.length ? state.magicOrbs[0].t : 0;
      case "siren":
        return state.sirenT || 0;
      case "radar":
        return state.radarAngle / (Math.PI * 2);
      default:
        return state.fuseT;
    }
  }

  /* ============================================================
     13. INITIALISATION DES ÉTATS DES BADGES
     ============================================================ */

  /* Crée un état pour chaque badge original (pas les clones) */
  const badgeStates = [];
  track.querySelectorAll(".badge:not([data-clone-of])").forEach((badge) => {
    const state = makeBadgeState(badge);
    if (state) badgeStates.push(state);
  });

  /* Redimensionne les canvas si la fenêtre change de taille */
  window.addEventListener("resize", () => {
    badgeStates.forEach((state) => state.resizeCanvas());
  });

  /* ============================================================
     14. ÉLÉMENTS VISUELS INJECTÉS PAR LE JS
     ============================================================
     Ces éléments sont créés en JS plutôt qu'en HTML/EJS
     pour ne pas alourdir le template et parce qu'ils dépendent
     de mesures dynamiques (taille de la section, etc.).
     ============================================================ */
  const genresSection = document.querySelector(".genres-section");

  /* Liste des genres pour le compteur de films */
  const genreList = Array.from(
    track.querySelectorAll(".badge:not([data-clone-of])"),
  )
    .map((b) => b.dataset.genre)
    .filter(Boolean);
  const genreTotal = genreList.length;

  /* Met à jour la valeur totale dans le compteur "01 / 15" */
  const filmCounterTotal = document.querySelector(".film-counter__total");
  if (filmCounterTotal) {
    filmCounterTotal.textContent = String(genreTotal).padStart(2, "0");
  }

  /* --- Bande perforée de pellicule en haut --- */
  if (genresSection) {
    const band = document.createElement("div");
    band.className = "film-perfs film-perfs--top";
    genresSection.appendChild(band);
  }

  /* --- Label "À l'affiche" au-dessus du badge en spotlight --- */
  const nowShowing = document.createElement("div");
  nowShowing.className = "now-showing";
  nowShowing.innerHTML = '<span class="now-showing__dot"></span>À l\'affiche';
  nowShowing.style.cssText = "opacity: 0; left: 50%; top: 64px;";
  if (genresSection) genresSection.appendChild(nowShowing);

  /* --- Faisceau de projecteur cinéma --- */
  const spotBeam = document.createElement("div");
  spotBeam.className = "spotlight-beam";
  spotBeam.style.cssText = "left: 50%; opacity: 0;";
  if (genresSection) genresSection.appendChild(spotBeam);

  /* ============================================================
     15. SYSTÈME SPOTLIGHT
     ============================================================
     Calcule pour chaque badge sa "distance au centre de l'écran"
     et en déduit une valeur --spot (0 à 1).
     Badge au centre → --spot = 1 (plein spotlight)
     Badge en bord   → --spot = 0 (sombre)

     Cette valeur est utilisée dans le CSS pour :
     - opacité du badge
     - intensité de la bordure, du halo
     - filtres image (saturation, luminosité…)
     ============================================================ */
  const spotMap =
    new WeakMap(); /* Stocke --spot précédent pour l'interpolation */
  let washAlpha = 0;
  let lastGenre = "";
  let spotPauseActive = false;
  let lastPauseTime = -9999;

  const reactiveSub = document.getElementById("section-reactive-sub");
  const filmCounterIdx = document.querySelector(".film-counter__idx");

  /* Textes de sous-titre selon le genre en spotlight */
  const GENRE_SUBS = {
    Action: "Des films qui ne font aucun prisonnier",
    Horreur: "Pour ceux qui aiment avoir peur dans le noir",
    Aventure: "Des voyages qui coupent le souffle",
    Comédie: "Pour rire aux larmes du début à la fin",
    Animation: "Des mondes animés à couper le souffle",
    Romance: "Des histoires d'amour inoubliables",
    "Science-Fiction": "Aux confins de l'espace et du temps",
    Drame: "Des histoires qui marquent à jamais",
    Thriller: "Des films qui vous tiennent en haleine",
    Fantastique: "Des univers impossibles à oublier",
    Policier: "Des enquêtes qui tiennent en éveil",
    Documentaire: "La réalité dépasse la fiction",
    Biopic: "Des vies exceptionnelles sur grand écran",
    Guerre: "Des fresques historiques épiques",
    Western: "La loi du plus fort sous le soleil",
    Musical: "Quand la musique s'empare de l'écran",
    "Sci-Fi": "Aux confins de l'espace et du temps",
    Historique: "Des fresques qui traversent les âges",
  };

  function applySpotlight(ts) {
    const viewportCenter = window.innerWidth / 2;
    const RADIUS = window.innerWidth * 0.66; /* Rayon d'influence du spotlight en px */
    const LERP_SPEED = 0.075;

    let beamX = viewportCenter;
    let maxSpot = 0;
    let beamRGB = "196,160,82";
    let dominantBadge = null;
    let dominantGenre = "";

    track.querySelectorAll(".badge").forEach((badge) => {
      const rect = badge.getBoundingClientRect();
      if (!rect.width) return;

      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(centerX - viewportCenter);

      /*
        Calcule le spotlight :
        1. raw    : linéaire (1 au centre, 0 à RADIUS)
        2. target : quadratique (1 au centre, dégradé doux sur ~3 badges)
        3. sp     : interpolé depuis la frame précédente → transition douce
      */
      const raw = Math.max(0, 1 - dist / RADIUS);
      const target = raw * raw;
      const prev = spotMap.has(badge) ? spotMap.get(badge) : 0;
      const sp = prev + (target - prev) * LERP_SPEED;
      spotMap.set(badge, sp);

      /* Garde en mémoire le badge le plus illuminé */
      if (sp > maxSpot) {
        maxSpot = sp;
        beamX = centerX;
        beamRGB = badge.style.getPropertyValue("--glow-rgb").trim() || beamRGB;
        dominantBadge = badge;
        dominantGenre = badge.dataset.genre || "";
      }

      /* Applique les variables CSS directement sur le badge */
      badge.style.setProperty("--spot", sp.toFixed(4));
      badge.style.setProperty("--tx", (-sp * 8).toFixed(2) + "px"); /* monte de 8px au centre */
      badge.style.setProperty(
        "--ts",
        (1 + sp * 0.05).toFixed(4),
      ); /* grossit de 5% au centre — valeur réduite pour éviter l'écartement visuel */

      /* Filtres image contrôlés par le spotlight */
      badge.style.setProperty("--img-sat", (sp * 1.55).toFixed(3));
      badge.style.setProperty("--img-bri", (0.10 + sp * 1.05).toFixed(3));
      badge.style.setProperty("--img-con", (1.14 - sp * 0.06).toFixed(3));
      badge.style.setProperty("--img-sep", (0.5 * (1 - sp)).toFixed(3));
      badge.style.setProperty("--img-hue", (215 * (1 - sp)).toFixed(1) + "deg");

      /* Anime le compteur quand le badge est bien centré */
      if (sp > 0.72 && !badge.dataset.cloneOf) {
        const countEl = badge.querySelector("[data-target]");
        if (countEl)
          animateSpotCounter(countEl, parseInt(countEl.dataset.target));
      }
    });

    /* --- Wash coloré sur la section --- */
    /* Lerp vers max 0.04 d'opacité → effet très subtil */
    washAlpha += (Math.min(maxSpot * 0.065, 0.04) - washAlpha) * 0.014;
    if (genresSection) {
      genresSection.style.setProperty("--wash-rgb", beamRGB);
      genresSection.style.setProperty("--wash-alpha", washAlpha.toFixed(4));
    }

    /* --- Sous-titre réactif --- */
    if (maxSpot > 0.65 && dominantGenre !== lastGenre && reactiveSub) {
      /* Fade out → change le texte → fade in */
      reactiveSub.classList.add("fading");
      setTimeout(() => {
        reactiveSub.textContent =
          GENRE_SUBS[dominantGenre] ||
          "Le goût du cinéma se décline en mille saveurs";
        reactiveSub.classList.remove("fading");
      }, 300);
      lastGenre = dominantGenre;
    }

    /* --- Compteur "01 / 15" --- */
    if (filmCounterIdx && dominantGenre) {
      const idx = genreList.indexOf(dominantGenre);
      if (idx >= 0)
        filmCounterIdx.textContent = String(idx + 1).padStart(2, "0");
    }

    /* --- À l'affiche label --- */
    if (genresSection && dominantBadge && maxSpot > 0.55) {
      const secRect = genresSection.getBoundingClientRect();
      const badgeRect = dominantBadge.getBoundingClientRect();
      nowShowing.style.left = beamX - secRect.left + "px";
      nowShowing.style.top = badgeRect.top - secRect.top - 22 + "px";
      nowShowing.style.opacity = Math.min(1, (maxSpot - 0.55) * 2.8).toFixed(3);
    } else {
      nowShowing.style.opacity = "0";
    }

    /* --- Auto-pause spectaculaire ---
       Quand un badge est parfaitement centré, le carousel s'arrête
       brièvement pour "le mettre en scène". */
    if (
      maxSpot > 0.88 &&
      !isDragging &&
      !spotPauseActive &&
      ts - lastPauseTime > 2800
    ) {
      spotPauseActive = true;
      lastPauseTime = ts;
      setTimeout(() => {
        spotPauseActive = false;
      }, 1500);
    }
  }

  /* ============================================================
     16. CAROUSEL — AUTO-SCROLL
     ============================================================ */
  const BASE_SPEED = 0.045; /* Vitesse normale (px par ms) */
  const SLOW_SPEED = 0.008; /* Vitesse ralentie quand la souris est sur le carousel */

  let txPx = 0; /* Position de défilement actuelle en px */
  let halfW = 0; /* Largeur d'UN groupe d'originaux (seuil de reset) */
  let currentSpeed = BASE_SPEED;
  let targetSpeed = BASE_SPEED;
  let mouseProx = 0; /* 1 si la souris est sur le carousel */
  let isDragging = false;
  let touchLastX = 0;
  let touchVel = 0; /* Vélocité du swipe (inertie) */

  /*
    Mesure la largeur d'un groupe d'originaux.
    Méthode : offsetLeft du 1er clone − offsetLeft du 1er original.
    Plus robuste que sommer les largeurs (images lazy non encore chargées).
  */
  function measureHalf() {
    const firstOriginal = track.querySelector('.badge[data-badge-id="0"]');
    const firstClone = track.querySelector('.badge[data-clone-of="0"]');
    if (!firstOriginal || !firstClone) return;
    const width = firstClone.offsetLeft - firstOriginal.offsetLeft;
    if (width > 0) halfW = width;
  }

  window.addEventListener("resize", measureHalf);
  /* Plusieurs tentatives car les images lazy peuvent changer les tailles */
  setTimeout(measureHalf, 100);
  setTimeout(measureHalf, 400);
  setTimeout(measureHalf, 1200);
  if (window.ResizeObserver) {
    new ResizeObserver(() => measureHalf()).observe(track);
  }

  /* Détection hover */
  outer.addEventListener("mouseenter", () => {
    mouseProx = 1;
  });
  outer.addEventListener("mouseleave", () => {
    mouseProx = 0;
  });

  /* Touch / swipe mobile */
  outer.addEventListener(
    "touchstart",
    (e) => {
      touchLastX = e.touches[0].clientX;
      touchVel = 0;
      isDragging = true;
    },
    { passive: true },
  );

  outer.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - touchLastX;
      touchVel = dx;
      txPx -= dx; /* Déplace la piste dans la direction du swipe */
      touchLastX = e.touches[0].clientX;
    },
    { passive: true },
  );

  outer.addEventListener("touchend", () => {
    isDragging = false;
  });

  /* ============================================================
     17. BOUCLE PRINCIPALE (requestAnimationFrame)
     ============================================================
     requestAnimationFrame(tick) demande au navigateur d'appeler
     tick() avant le prochain rendu à l'écran (~60fps).
     C'est la méthode recommandée pour les animations fluides.
     ============================================================ */
  let lastFrameTime = null;

  function tick(now) {
    requestAnimationFrame(tick); /* Planifie la prochaine frame */

    /* dt = temps écoulé depuis la dernière frame, limité à 50ms
       (évite les sauts si l'onglet était en arrière-plan) */
    const dt = lastFrameTime !== null ? Math.min(now - lastFrameTime, 50) : 16;
    lastFrameTime = now;

    /* --- Gestion de la vitesse ---
       Priorité : tooltip ouvert > auto-pause > hover souris > normal */
    const targetSpeedCalc =
      openBadge || spotPauseActive ? 0 : mouseProx ? SLOW_SPEED : BASE_SPEED;

    targetSpeed = targetSpeedCalc;
    /* Lerp vers la cible → accélération/décélération progressive */
    currentSpeed += (targetSpeed - currentSpeed) * 0.06;

    /* --- Déplacement de la piste --- */
    if (!isDragging) {
      if (Math.abs(touchVel) > 0.1) {
        /* Inertie post-swipe : décélération progressive */
        txPx -= touchVel * 0.85;
        touchVel *= 0.88;
      } else {
        txPx += currentSpeed * dt;
      }
    }

    /* Boucle infinie : quand on dépasse la largeur d'un groupe, on repart au début */
    if (halfW > 0 && txPx >= halfW) txPx -= halfW;
    if (txPx < 0) txPx += halfW > 0 ? halfW : 0;

    if (halfW > 0) {
      track.style.transform = `translateX(${-txPx}px)`;
    }

    /* --- Spotlight --- */
    applySpotlight(now);

    /* --- Animations de bordure et glow ambiant --- */
    badgeStates.forEach((state) => {
      if (state.hovered) {
        /* Badge au hover : dessine l'animation et met à jour le glow */
        const drawFn = DRAW_FNS[state.animType];
        if (drawFn) drawFn(state, dt);
        updateAmbientGlow(state, getHeadT(state), dt);
      } else if (state.glowIntensity > 0.005) {
        /* Badge pas au hover mais glow pas encore à 0 : continue d'interpoler */
        updateAmbientGlow(state, getHeadT(state), dt);
      }
    });

    /* --- Rings au clic --- */
    renderRings();
  }

  requestAnimationFrame(tick);

  /* Resize observer global pour recalculer les canvas */
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      badgeStates.forEach((state) => state.resizeCanvas());
    }).observe(document.body);
  }
})(); /* Fin de l'IIFE */
