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
      // lecture seule: désactive tab et interactions
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

// Align recipe image height with the context card on wide screens
document.addEventListener("DOMContentLoaded", () => {
  const overviewCard = document.querySelector(".overview-card");
  const recipeMedia = document.querySelector(".recipe-aside__media");

  if (!overviewCard || !recipeMedia) return;

  const shouldSync = () => window.innerWidth >= 901;

  const syncHeight = () => {
    if (!shouldSync()) {
      recipeMedia.style.height = "";
      return;
    }
    const cardHeight = overviewCard.getBoundingClientRect().height;
    if (cardHeight > 0) {
      recipeMedia.style.height = `${cardHeight}px`;
    }
  };

  syncHeight();

  const resizeObserver = new ResizeObserver(syncHeight);
  resizeObserver.observe(overviewCard);
  window.addEventListener("resize", syncHeight);
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

// Ajustement automatique de la hauteur des textarea pour s'adapter au contenu
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Ajuste la hauteur d'un textarea pour qu'elle corresponde à son contenu
   * @param {HTMLTextAreaElement} textarea - L'élément textarea à ajuster
   */
  function adjustTextareaHeight(textarea) {
    // Réinitialiser la hauteur pour obtenir le scrollHeight correct
    textarea.style.height = "auto";
    // Définir la hauteur en fonction du contenu (scrollHeight inclut le padding)
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  // Sélectionner tous les textarea de recette (description, ingrédients, préparation)
  const recipeTextareas = document.querySelectorAll(".recipe-textarea");

  if (recipeTextareas.length === 0) {
    return;
  }

  // Ajuster la hauteur de chaque textarea au chargement
  recipeTextareas.forEach((textarea) => {
    adjustTextareaHeight(textarea);
  });

  // Observer les changements de contenu (pour les cas dynamiques)
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const textarea = entry.target;
      if (textarea.classList.contains("recipe-textarea")) {
        adjustTextareaHeight(textarea);
      }
    });
  });

  recipeTextareas.forEach((textarea) => {
    resizeObserver.observe(textarea);
  });
});
