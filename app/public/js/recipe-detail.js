// ── Contexte hero — Lire plus / Lire moins ──
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById('rh-ctx-toggle');
  const lead   = document.querySelector('.rh-ctx-lead');
  const extra  = document.getElementById('rh-ctx-extra');
  if (!toggle || !lead) return;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    lead.classList.toggle('is-open', !open);
    if (extra) extra.hidden = open;
    toggle.querySelector('span').textContent = open ? 'Lire plus' : 'Lire moins';
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // ── Star picker (avis-form-block) ──
  let selectedStars = 0;
  const starPicks = document.querySelectorAll(".star-pick");
  const quoteInput = document.getElementById("avisQuoteInput");
  if (starPicks.length) {
    starPicks.forEach((el) => {
      el.addEventListener("click", () => {
        selectedStars = parseInt(el.dataset.v);
        if (quoteInput) quoteInput.value = selectedStars;
        starPicks.forEach((s) => s.classList.toggle("on", parseInt(s.dataset.v) <= selectedStars));
      });
      el.addEventListener("mouseenter", () => {
        const v = parseInt(el.dataset.v);
        starPicks.forEach((s) => { s.style.color = parseInt(s.dataset.v) <= v ? "var(--dore-clair)" : ""; });
      });
      el.addEventListener("mouseleave", () => {
        starPicks.forEach((s) => { s.style.color = parseInt(s.dataset.v) <= selectedStars ? "var(--dore-clair)" : ""; });
      });
    });
  }
});

// Smooth scroll vers la section avis depuis les CTAs
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href="#avis"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = document.getElementById("avis");
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const ratingContainers = document.querySelectorAll(".rating-stars");
  if (!ratingContainers.length) {
    return;
  }

  ratingContainers.forEach((ratingContainer) => {
    const stars = Array.from(ratingContainer.querySelectorAll(".rating-star"));
    if (!stars.length) {
      return;
    }

    let committedValue = Number(ratingContainer.dataset.currentRating) || 0;
    const outputSelector = ratingContainer.dataset.output;
    const outputElement = outputSelector
      ? document.querySelector(outputSelector)
      : ratingContainer
          .closest("[data-rating-container]")
          ?.querySelector("[data-rating-output]");

    const inputSelector = ratingContainer.dataset.input;
    const inputElement = inputSelector
      ? document.querySelector(inputSelector)
      : ratingContainer.querySelector("input[type='hidden']");

    const isReadonly = ratingContainer.dataset.readonly === "true";

    const renderStars = (value) => {
      const activeValue =
        typeof value === "number" ? value : committedValue || 0;

      stars.forEach((star) => {
        const starValue = Number(star.dataset.value);
        star.classList.toggle("is-active", starValue <= activeValue);
      });

      if (outputElement) {
        outputElement.textContent = `${activeValue}/5`;
      }
    };

    renderStars();

    if (!isReadonly) {
      stars.forEach((star) => {
        const starValue = Number(star.dataset.value);
        const preview = () => renderStars(starValue);
        const reset = () => renderStars();

        star.addEventListener("mouseenter", preview);
        star.addEventListener("focus", preview);
        star.addEventListener("mouseleave", reset);
        star.addEventListener("blur", reset);
        star.addEventListener("click", () => {
          committedValue = starValue;
          ratingContainer.dataset.currentRating = starValue;
          ratingContainer.setAttribute(
            "aria-label",
            `Note proposée ${starValue} sur 5`
          );

          if (inputElement) {
            inputElement.value = starValue;
          }

          renderStars();
        });
      });
    } else {
      stars.forEach((star) => {
        star.setAttribute("tabindex", "-1");
        star.style.pointerEvents = "none";
      });
    }

    ratingContainer.addEventListener("mouseleave", () => {
      renderStars();
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("recipe-lightbox");
  const triggers = document.querySelectorAll("[data-lightbox-trigger]");

  if (!lightbox || !triggers.length) {
    return;
  }

  const imageElement = lightbox.querySelector(".recipe-lightbox__image");
  const closeElements = lightbox.querySelectorAll("[data-lightbox-close]");
  const stepBadge = lightbox.querySelector("[data-lightbox-step-badge]");
  const prevBtn = lightbox.querySelector("[data-lightbox-prev]");
  const nextBtn = lightbox.querySelector("[data-lightbox-next]");

  // Groupes de photos navigables (ex. les 8 photos de préparation) — un
  // trigger sans data-lightbox-group reste une image isolée, sans flèches.
  const groups = {};
  triggers.forEach((trigger) => {
    const group = trigger.dataset.lightboxGroup;
    if (!group) return;
    (groups[group] ||= []).push({
      src: trigger.dataset.lightboxImage,
      alt: trigger.dataset.lightboxAlt,
      step: trigger.dataset.lightboxStep,
    });
  });

  let currentGroup = null; // tableau de {src, alt, step} ou null (image isolée)
  let currentIndex = 0;

  const renderCurrent = () => {
    const item = currentGroup
      ? currentGroup[currentIndex]
      : { src: imageElement.dataset.singleSrc, alt: imageElement.dataset.singleAlt };
    imageElement.src = item.src;
    imageElement.alt = item.alt || "Recette Ciné Délices";

    const hasNav = !!currentGroup && currentGroup.length > 1;
    prevBtn.classList.toggle("is-visible", hasNav);
    nextBtn.classList.toggle("is-visible", hasNav);

    const showBadge = !!currentGroup && item.step;
    stepBadge.classList.toggle("is-visible", showBadge);
    if (showBadge) stepBadge.textContent = `Étape ${item.step}`;
  };

  const openLightbox = (trigger) => {
    const src = trigger.dataset.lightboxImage;
    if (!src) return;
    const groupName = trigger.dataset.lightboxGroup;
    if (groupName && groups[groupName]) {
      currentGroup = groups[groupName];
      currentIndex = currentGroup.findIndex((item) => item.src === src);
      if (currentIndex < 0) currentIndex = 0;
    } else {
      currentGroup = null;
      currentIndex = 0;
      imageElement.dataset.singleSrc = src;
      imageElement.dataset.singleAlt = trigger.dataset.lightboxAlt || "";
    }
    renderCurrent();
    lightbox.classList.add("is-visible");
    document.body.classList.add("lightbox-open");
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-visible");
    document.body.classList.remove("lightbox-open");
    setTimeout(() => {
      // Ne vide le src que si la lightbox n'a pas été rouverte entre-temps
      // (sinon ce clear différé écraserait la photo qui vient de s'ouvrir).
      if (!lightbox.classList.contains("is-visible")) {
        imageElement.src = "";
      }
    }, 300);
  };

  const showDelta = (delta) => {
    if (!currentGroup || currentGroup.length <= 1) return;
    currentIndex = (currentIndex + delta + currentGroup.length) % currentGroup.length;
    renderCurrent();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });

  closeElements.forEach((element) => {
    element.addEventListener("click", closeLightbox);
  });

  prevBtn.addEventListener("click", () => showDelta(-1));
  nextBtn.addEventListener("click", () => showDelta(1));

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-visible")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showDelta(-1);
    if (event.key === "ArrowRight") showDelta(1);
  });

  // Swipe tactile (mobile/tablette) — glisser horizontalement pour passer
  // à la photo suivante/précédente du même groupe.
  let touchStartX = null;
  const dialog = lightbox.querySelector(".recipe-lightbox__dialog");
  dialog.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });
  dialog.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(deltaX) < 40) return; // seuil anti-tap accidentel
    showDelta(deltaX > 0 ? -1 : 1);
  }, { passive: true });
});

// ── Photos jointes à l'avis : sélection + aperçus (jusqu'à 3) ──
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("avisPhotos");
  const previews = document.getElementById("avisPhotoPreviews");
  if (!input || !previews) return;

  const NOTICE_MAX_PICTURES = 3;
  let selectedFiles = [];

  const renderPreviews = () => {
    previews.innerHTML = "";
    selectedFiles.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const cell = document.createElement("div");
      cell.className = "avis-photo-upload__preview";
      cell.innerHTML = `<img src="${url}" alt="Aperçu photo ${idx + 1}" /><button type="button" aria-label="Retirer cette photo">&times;</button>`;
      cell.querySelector("button").addEventListener("click", () => {
        selectedFiles.splice(idx, 1);
        syncInputFiles();
        renderPreviews();
      });
      previews.appendChild(cell);
    });
  };

  const syncInputFiles = () => {
    const dt = new DataTransfer();
    selectedFiles.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  };

  input.addEventListener("change", () => {
    const incoming = Array.from(input.files || []);
    selectedFiles = [...selectedFiles, ...incoming].slice(0, NOTICE_MAX_PICTURES);
    syncInputFiles();
    renderPreviews();
  });

  // Exposé pour être vidé après une soumission réussie (cf. handler du formulaire plus bas)
  window._resetAvisPhotos = () => {
    selectedFiles = [];
    input.value = "";
    previews.innerHTML = "";
  };
});

// ── Soumission du formulaire d'avis via fetch (FormData — supporte les photos) ──
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("avisForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl   = document.getElementById("avisFormError");
    const successEl = document.getElementById("avisFormSuccess");
    const submitBtn = document.getElementById("avisSubmitBtn");

    errorEl.style.display = "none";
    successEl.style.display = "none";

    const comment = form.querySelector("#avisTexte")?.value?.trim();
    const quote   = form.querySelector("#avisQuoteInput")?.value;

    if (!quote || quote < 1) {
      errorEl.textContent = "Veuillez sélectionner une note avant de publier.";
      errorEl.style.display = "block";
      return;
    }
    if (!comment) {
      errorEl.textContent = "Veuillez rédiger votre avis avant de publier.";
      errorEl.style.display = "block";
      return;
    }

    submitBtn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
      });
      const data = await res.json();
      if (data.success) {
        successEl.textContent = data.message;
        successEl.style.display = "block";
        form.reset();
        document.querySelectorAll(".star-pick").forEach((s) => s.classList.remove("on"));
        if (document.getElementById("avisQuoteInput")) document.getElementById("avisQuoteInput").value = "";
        if (window._resetAvisPhotos) window._resetAvisPhotos();
        // Toast XP (membres uniquement — xpGained = 0 pour admin/superadmin)
        if (data.xpGained) {
          const msg = data.leveledUp
            ? `+${data.xpGained} XP — Niveau supérieur ! ${data.rank}`
            : `+${data.xpGained} XP pour votre avis`;
          if (window._cdToast) {
            window._cdToast(msg, "success");
          } else {
            const t = document.createElement("div");
            t.textContent = msg;
            t.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;background:#1a7a46;color:#fff;padding:10px 18px;border-radius:6px;font-size:.85rem;box-shadow:0 4px 16px rgba(0,0,0,.4);pointer-events:none;";
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 3200);
          }
        }
      } else {
        errorEl.textContent = data.message || "Une erreur est survenue.";
        errorEl.style.display = "block";
        submitBtn.disabled = false;
      }
    } catch {
      errorEl.textContent = "Erreur de connexion. Veuillez réessayer.";
      errorEl.style.display = "block";
      submitBtn.disabled = false;
    }
  });
});

// ── Portions control ──
document.addEventListener("DOMContentLoaded", () => {
  const BASE = parseInt(document.getElementById('rd-ing-portions-val')?.dataset.base || '4', 10);
  let current = BASE;

  const btnMinus2 = document.getElementById('rd-srv-minus2');
  const btnPlus2  = document.getElementById('rd-srv-plus2');
  const portEl    = document.getElementById('rd-ing-portions-val');
  const ingEls    = Array.from(document.querySelectorAll('.rd-ing-text'));
  ingEls.forEach(el => { el.dataset.original = el.textContent; });

  function fmtQty(n) {
    const r = Math.round(n * 100) / 100;
    return r % 1 === 0 ? String(r) : String(r).replace('.', ',');
  }
  function updateIngredients() {
    const ratio = current / BASE;
    ingEls.forEach(el => {
      const txt = el.dataset.original;
      const m = txt.match(/^(\d+(?:[.,]\d+)?)(.*)/);
      if (m) {
        const orig = parseFloat(m[1].replace(',', '.'));
        el.textContent = fmtQty(orig * ratio) + m[2];
      }
    });
  }
  function updateDisplay() {
    if (portEl) portEl.textContent = current + ' pers.';
    if (btnMinus2) btnMinus2.disabled = current <= 1;
    updateIngredients();
  }

  if (btnMinus2) btnMinus2.addEventListener('click', () => { if (current > 1) { current--; updateDisplay(); } });
  if (btnPlus2)  btnPlus2.addEventListener('click',  () => { current++; updateDisplay(); });
});

// ── Ingredient checkboxes ──
document.addEventListener("DOMContentLoaded", () => {
  const ingItems = document.querySelectorAll('.rd-ing-item');
  const ingTotal = ingItems.length;
  const progressFill  = document.getElementById('ing-progress-fill');
  const progressLabel = document.getElementById('ing-progress-label');

  function updateIngProgress() {
    const checked = document.querySelectorAll('.rd-ing-item.is-checked').length;
    const pct = ingTotal > 0 ? Math.round((checked / ingTotal) * 100) : 0;
    if (progressFill)  progressFill.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = checked + ' / ' + ingTotal;
  }

  ingItems.forEach(item => {
    const btn = item.querySelector('.rd-ing-chk');
    function toggle() {
      item.classList.toggle('is-checked');
      btn && btn.setAttribute('aria-pressed', item.classList.contains('is-checked'));
      updateIngProgress();
    }
    item.addEventListener('click', toggle);
  });
});

// ── Step checkboxes + progress ──
document.addEventListener("DOMContentLoaded", () => {
  const stepsEl    = document.querySelectorAll('.rd-step-item');
  const stepsTotal = stepsEl.length;
  const stepsProgressEl = document.getElementById('steps-progress');

  function updateStepsProgress() {
    const done = document.querySelectorAll('.rd-step-item.is-done').length;
    if (stepsProgressEl) stepsProgressEl.textContent = done + ' / ' + stepsTotal + ' étapes';
  }

  stepsEl.forEach(item => {
    const btn = item.querySelector('.rd-step-check');
    btn && btn.addEventListener('click', (e) => {
      e.stopPropagation();
      item.classList.toggle('is-done');
      btn.setAttribute('aria-pressed', item.classList.contains('is-done'));
      updateStepsProgress();
    });
    item.addEventListener('click', (e) => {
      if (e.target.closest('.rd-step-check')) return;
      item.classList.toggle('is-done');
      updateStepsProgress();
    });
  });
});

// ── Hero parallax ──
// Applique le décalage sur .recipe-hero__media (image + fondu ensemble),
// pas sur .recipe-hero__img directement, pour ne pas entrer en conflit avec
// sa transition CSS de hover (scale au survol). Désactivé sous 1100px : le
// hero passe en image fixe pleine largeur au-dessus du texte (voir CSS).
document.addEventListener("DOMContentLoaded", () => {
  const heroMedia = document.querySelector('.recipe-hero__media');
  if (!heroMedia) return;
  const mq = window.matchMedia('(min-width: 1100.1px)');
  // Batching via requestAnimationFrame : évite d'écrire le style à chaque
  // event scroll brut (qui peut se déclencher plus souvent que le taux de
  // rafraîchissement de l'écran), pour un rendu plus fluide au scroll.
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!mq.matches) return;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      heroMedia.style.transform = `scale(1.05) translateY(${window.scrollY * 0.08}px)`;
      ticking = false;
    });
  }, { passive: true });
});

// ── IntersectionObserver : steps + gallery reveal ──
document.addEventListener("DOMContentLoaded", () => {
  if (!('IntersectionObserver' in window)) return;

  const steps = document.querySelectorAll('.rd-step-item');
  if (steps.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateX(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    steps.forEach((s, i) => {
      s.style.opacity = '0';
      s.style.transform = 'translateX(-8px)';
      s.style.transition = `opacity .45s ease ${i * 0.08}s, transform .45s cubic-bezier(.22,1,.36,1) ${i * 0.08}s`;
      obs.observe(s);
    });
  }

  const galleryItems = document.querySelectorAll('.rd-gallery__main, .rd-gallery__secondary, .rd-gallery__detail');
  if (galleryItems.length) {
    const gObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          gObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    galleryItems.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
      el.style.transition = `opacity .5s ease ${i * 0.1}s, transform .5s cubic-bezier(.22,1,.36,1) ${i * 0.1}s`;
      gObs.observe(el);
    });
  }
});

/* Bouton "Partager" — Web Share API si disponible (mobile principalement),
   sinon copie du lien dans le presse-papiers avec confirmation visuelle. */
document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.querySelector(".js-share-recipe");
  if (!shareBtn) return;

  shareBtn.addEventListener("click", async () => {
    const shareData = {
      title: shareBtn.dataset.shareTitle || document.title,
      text: shareBtn.dataset.shareText || "",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Annulation utilisateur ou erreur — silencieux, pas de fallback nécessaire
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      const original = shareBtn.innerHTML;
      shareBtn.innerHTML = '<i data-lucide="check" width="15" height="15" aria-hidden="true"></i> Lien copié !';
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        shareBtn.innerHTML = original;
        if (window.lucide) window.lucide.createIcons();
      }, 2000);
    } catch (err) {
      // Presse-papiers indisponible — dernier recours silencieux
    }
  });
});

/* Carrousel "Vous aimerez aussi" — flèches latérales, défilement d'environ
   une carte et demie par clic. */
document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("rdRecoCarousel");
  const prevBtn = document.getElementById("rdRecoPrev");
  const nextBtn = document.getElementById("rdRecoNext");
  if (!track || !prevBtn || !nextBtn) return;

  const scrollByCard = (dir) => {
    const card = track.querySelector(".rd-reco-card");
    const step = card ? card.getBoundingClientRect().width + 20 : 280;
    track.scrollBy({ left: dir * step * 1.5, behavior: "smooth" });
  };

  prevBtn.addEventListener("click", () => scrollByCard(-1));
  nextBtn.addEventListener("click", () => scrollByCard(1));

  const updateNavState = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft >= max;
  };
  track.addEventListener("scroll", updateNavState, { passive: true });
  window.addEventListener("resize", updateNavState);
  updateNavState();
});

// ── Avis : like, réponse, tri, bascule vue grille/liste ──
document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".avis-section");
  const avisRow = document.querySelector(".rd-avis-row");
  if (!section && !avisRow) return;

  // -- Like (délégation sur toute la page — présent aussi dans "Derniers avis") --
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-notice-like]");
    if (!btn) return;
    const noticeId = btn.dataset.noticeId;
    btn.disabled = true;
    try {
      const res = await fetch(`/api/notices/${noticeId}/like`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        btn.classList.toggle("is-liked", data.liked);
        btn.setAttribute("aria-pressed", String(data.liked));
        const countEl = btn.querySelector("[data-notice-like-count]");
        if (countEl) countEl.textContent = data.likesCount;
      } else if (res.status === 401) {
        window._cdToast ? window._cdToast("Connectez-vous pour aimer un avis.", "error") : null;
      }
    } catch {
      /* silencieux — pas bloquant pour l'utilisateur */
    } finally {
      btn.disabled = false;
    }
  });

  // -- Répondre : clone le gabarit #avisReplyTemplate sous l'avis ciblé --
  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-notice-reply-toggle]");
    if (!toggleBtn) return;
    const noticeId = toggleBtn.dataset.noticeId;

    // Toggle : si un formulaire est déjà ouvert pour cet avis, on le referme.
    const existing = document.querySelector(`.avis-reply-form[data-parent-id="${noticeId}"]`);
    if (existing) {
      existing.remove();
      return;
    }
    const template = document.getElementById("avisReplyTemplate");
    if (!template) return; // non connecté — pas de gabarit rendu
    const form = template.content.firstElementChild.cloneNode(true);
    form.dataset.parentId = noticeId;
    // Insère juste après les actions (like/répondre) de cet avis
    const actions = toggleBtn.closest(".avis-card__actions");
    (actions || toggleBtn.parentElement).insertAdjacentElement("afterend", form);
    form.querySelector("textarea")?.focus();
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-notice-reply-cancel]")) {
      e.target.closest(".avis-reply-form")?.remove();
    }
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target.closest("[data-notice-reply-form]");
    if (!form) return;
    e.preventDefault();
    const textarea = form.querySelector("textarea");
    const errorEl = form.querySelector(".avis-reply-form__error");
    const submitBtn = form.querySelector('button[type="submit"]');
    const comment = textarea.value.trim();
    if (!comment) {
      errorEl.textContent = "Écrivez votre réponse avant d'envoyer.";
      errorEl.style.display = "block";
      return;
    }
    submitBtn.disabled = true;
    try {
      const fd = new FormData();
      fd.append("comment", comment);
      fd.append("parentId", form.dataset.parentId);
      const action = document.getElementById("avisForm")?.action
        || window.location.pathname + "/avis";
      const res = await fetch(action, { method: "POST", headers: { Accept: "application/json" }, body: fd });
      const data = await res.json();
      if (data.success) {
        form.innerHTML = `<p class="avis-reply-form__sent">${data.message}</p>`;
        setTimeout(() => form.remove(), 4000);
      } else {
        errorEl.textContent = data.message || "Une erreur est survenue.";
        errorEl.style.display = "block";
        submitBtn.disabled = false;
      }
    } catch {
      errorEl.textContent = "Erreur de connexion. Veuillez réessayer.";
      errorEl.style.display = "block";
      submitBtn.disabled = false;
    }
  });

  // -- Pagination (client-side — tous les avis sont déjà dans le DOM, cf.
  //    recipe-detail.ejs) : évite de scroller une longue liste dès qu'une
  //    recette a beaucoup d'avis, sans aller-retour serveur. --
  const AVIS_PER_PAGE = 9;
  const avisGrid = document.getElementById("avisGrid");
  const paginationNav = document.getElementById("avisPagination");
  const paginationPages = document.getElementById("avisPaginationPages");
  let avisCurrentPage = 1;

  function buildPageList(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("…");
    pages.push(total);
    return pages;
  }

  function showAvisPage(page) {
    if (!avisGrid) return;
    const cards = Array.from(avisGrid.querySelectorAll(":scope > .avis-card"));
    const totalPages = Math.max(1, Math.ceil(cards.length / AVIS_PER_PAGE));
    avisCurrentPage = Math.min(Math.max(1, page), totalPages);

    cards.forEach((card, i) => {
      const onPage = Math.floor(i / AVIS_PER_PAGE) + 1 === avisCurrentPage;
      card.hidden = !onPage;
    });

    if (!paginationNav) return;
    if (totalPages <= 1) {
      paginationNav.hidden = true;
      return;
    }
    paginationNav.hidden = false;
    paginationNav.querySelector("[data-avis-page-prev]").disabled = avisCurrentPage === 1;
    paginationNav.querySelector("[data-avis-page-next]").disabled = avisCurrentPage === totalPages;

    paginationPages.innerHTML = buildPageList(avisCurrentPage, totalPages)
      .map((p) =>
        p === "…"
          ? `<span class="avis-pagination__ellipsis">…</span>`
          : `<button type="button" class="avis-pagination__page${p === avisCurrentPage ? " is-active" : ""}" data-avis-page="${p}">${p}</button>`
      )
      .join("");
  }

  if (avisGrid && paginationNav) {
    showAvisPage(1);
    paginationNav.querySelector("[data-avis-page-prev]").addEventListener("click", () => {
      showAvisPage(avisCurrentPage - 1);
      avisGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    paginationNav.querySelector("[data-avis-page-next]").addEventListener("click", () => {
      showAvisPage(avisCurrentPage + 1);
      avisGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    paginationPages.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-avis-page]");
      if (!btn) return;
      showAvisPage(parseInt(btn.dataset.avisPage, 10));
      avisGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // -- Tri (client-side, sur les cards déjà rendues) --
  const sortSelect = document.getElementById("avisSortSelect");
  if (sortSelect && avisGrid) {
    sortSelect.addEventListener("change", () => {
      const mode = sortSelect.value;
      const cards = Array.from(avisGrid.querySelectorAll(":scope > .avis-card"));
      cards.sort((a, b) => {
        if (mode === "top") return (parseInt(b.dataset.rating) || 0) - (parseInt(a.dataset.rating) || 0);
        if (mode === "liked") return (parseInt(b.dataset.likes) || 0) - (parseInt(a.dataset.likes) || 0);
        return 0; // "recent" = ordre serveur déjà du plus récent au plus ancien
      });
      cards.forEach((c) => avisGrid.appendChild(c));
      showAvisPage(1);
    });
  }

  // -- Bascule vue grille / liste --
  document.querySelectorAll("[data-avis-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-avis-view]").forEach((b) => b.classList.toggle("is-active", b === btn));
      const isList = btn.dataset.avisView === "list";
      document.querySelectorAll(".avis-grid").forEach((g) => g.classList.toggle("avis-grid--list", isList));
    });
  });
});
