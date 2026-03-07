document.addEventListener("DOMContentLoaded", () => {
  // ── Star picker (rd-star-picker) ──
  const starPickers = document.querySelectorAll(".rd-star-picker");
  starPickers.forEach((fieldset) => {
    const valueDisplay = fieldset.querySelector(".rd-stars-value");
    const inputs = Array.from(fieldset.querySelectorAll("input[type='radio']"));
    const items = inputs
      .map((input) => ({
        input,
        label: fieldset.querySelector(`label[for='${input.id}']`),
        value: Number(input.value),
      }))
      .filter(({ label }) => !!label)
      .sort((a, b) => a.value - b.value);

    let selected = 0;

    const render = (hovered) => {
      const active = typeof hovered === "number" ? hovered : selected;
      items.forEach(({ label, value }) => {
        label.style.color = value <= active
          ? "var(--dore-clair, #f2c84b)"
          : "rgba(196, 160, 82, 0.2)";
      });
      if (valueDisplay) valueDisplay.textContent = `${active}/5`;
    };

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        selected = Number(input.value);
        render();
      });
    });

    items.forEach(({ label, input, value }) => {
      label.addEventListener("click", (e) => {
        e.preventDefault();
        input.checked = true;
        selected = value;
        render();
      });
      label.addEventListener("mouseenter", () => render(value));
      label.addEventListener("mouseleave", () => render());
    });

    render(0);
  });

  // ── Compteur de caractères (rd-review-textarea) ──
  const reviewTextarea = document.querySelector(".rd-review-textarea");
  const charCount = document.getElementById("charCount");
  if (reviewTextarea && charCount) {
    reviewTextarea.addEventListener("input", () => {
      charCount.textContent = reviewTextarea.value.length;
    });
  }
});

// Smooth scroll to review banner from the top CTA
document.addEventListener("DOMContentLoaded", () => {
  const ctaAnchor = document.querySelector(
    'a.rating-hint__cta--primary[href="#review-banner"]'
  );
  if (!ctaAnchor) return;
  ctaAnchor.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.getElementById("review-banner");
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (target) {
      // fallback
      window.location.hash = "#review-banner";
    }
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

// ── "Voir Plus" avis ──
document.addEventListener("DOMContentLoaded", () => {
  const seeMoreBtn = document.getElementById("seeMoreReviews");
  const extraReviews = document.querySelectorAll("[data-review-extra]");

  if (!seeMoreBtn || !extraReviews.length) return;

  let isExpanded = false;

  seeMoreBtn.addEventListener("click", () => {
    if (!isExpanded) {
      extraReviews.forEach((review, i) => {
        setTimeout(() => review.classList.add("show"), i * 80);
      });
      seeMoreBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="m18 15-6-6-6 6"/></svg>
        Voir Moins
      `;
      isExpanded = true;
      setTimeout(() => {
        extraReviews[0].scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, extraReviews.length * 80 + 50);
    } else {
      extraReviews.forEach((review) => review.classList.remove("show"));
      seeMoreBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="m6 9 6 6 6-6"/></svg>
        Voir Plus (${extraReviews.length})
      `;
      isExpanded = false;
      seeMoreBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
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
