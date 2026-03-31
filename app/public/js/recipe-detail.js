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

  const openLightbox = (src, alt) => {
    if (!src) return;
    imageElement.src = src;
    imageElement.alt = alt || "Recette Ciné Délices";
    lightbox.classList.add("is-visible");
    document.body.classList.add("lightbox-open");
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-visible");
    document.body.classList.remove("lightbox-open");
    setTimeout(() => {
      imageElement.src = "";
    }, 300);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const src = trigger.dataset.lightboxImage;
      const alt = trigger.dataset.lightboxAlt;
      openLightbox(src, alt);
    });
  });

  closeElements.forEach((element) => {
    element.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-visible")) {
      closeLightbox();
    }
  });
});

// ── Soumission du formulaire d'avis via fetch ──
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
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ comment, quote }),
      });
      const data = await res.json();
      if (data.success) {
        successEl.textContent = data.message;
        successEl.style.display = "block";
        form.reset();
        document.querySelectorAll(".star-pick").forEach((s) => s.classList.remove("on"));
        if (document.getElementById("avisQuoteInput")) document.getElementById("avisQuoteInput").value = "";
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

// ── Carrousel poster hero ──
document.addEventListener("DOMContentLoaded", () => {
  const track   = document.getElementById('rh-poster-track');
  if (!track) return;
  const slides  = Array.from(track.querySelectorAll('.rh-poster__img-btn'));
  if (slides.length <= 1) return;

  const btnPrev = document.getElementById('rh-nav-prev');
  const btnNext = document.getElementById('rh-nav-next');
  const dots    = Array.from(document.querySelectorAll('.rh-poster__dot'));
  const curEl   = document.getElementById('rh-poster-cur');
  let current   = 0;

  function goTo(idx) {
    current = Math.max(0, Math.min(slides.length - 1, idx));
    track.scrollTo({ left: current * track.offsetWidth, behavior: 'smooth' });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    if (curEl) curEl.textContent = current + 1;
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.disabled = current === slides.length - 1;
  }

  btnPrev && btnPrev.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); });
  btnNext && btnNext.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); });
  dots.forEach((d) => d.addEventListener('click', () => goTo(parseInt(d.dataset.idx, 10))));

  track.addEventListener('scroll', () => {
    const idx = Math.round(track.scrollLeft / track.offsetWidth);
    if (idx !== current) goTo(idx);
  }, { passive: true });

  goTo(0);
});

// ── "Charger plus" avis ──
document.addEventListener("DOMContentLoaded", () => {
  const seeMoreBtn = document.getElementById("seeMoreAvis");
  const extraGrid = document.getElementById("avisGridExtra");
  const loadmore = document.getElementById("avisLoadmore");

  if (!seeMoreBtn || !extraGrid) return;

  seeMoreBtn.addEventListener("click", () => {
    extraGrid.removeAttribute("hidden");
    loadmore.style.display = "none";
    extraGrid.querySelector(".avis-card")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
document.addEventListener("DOMContentLoaded", () => {
  const heroBg = document.querySelector('.recipe-hero__bg');
  if (!heroBg) return;
  window.addEventListener('scroll', () => {
    heroBg.style.transform = `scale(1.08) translateY(${window.scrollY * 0.15}px)`;
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
