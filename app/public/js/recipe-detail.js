document.addEventListener("DOMContentLoaded", () => {
  // Review banner stars (radio based): persistent selection + label update
  const reviewStarGroups = document.querySelectorAll(".review-stars");
  reviewStarGroups.forEach((fieldset) => {
    const legend = fieldset.querySelector(".review-stars__label");
    const inputs = Array.from(fieldset.querySelectorAll("input[type='radio']"));
    const labels = inputs
      .map((input) => ({
        input,
        label: fieldset.querySelector(`label[for='${input.id}']`),
        value: Number(input.value || input.id.replace(/\D+/g, "")),
      }))
      .filter(({ label }) => !!label)
      // Assure un ordre ascendant 1..5 pour gérer l'activation
      .sort((a, b) => a.value - b.value);

    let selected = 0;

    const render = (value) => {
      const active = typeof value === "number" ? value : selected || 0;
      labels.forEach(({ label, value }) => {
        label.classList.toggle("is-active", value <= active);
      });
      if (legend) {
        legend.innerHTML = `Ta note pour la recette <span class="review-stars__value">${active}/5</span> :`;
      }
    };

    inputs.forEach((inputObj) => {
      inputObj.addEventListener("change", () => {
        selected = Number(inputObj.value);
        render();
      });
    });

    // Cliquer sur l'étoile (label) coche l'input et déclenche render
    labels.forEach(({ label, input, value }) => {
      label.addEventListener("click", (e) => {
        e.preventDefault();
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      // Aperçu au survol (facultatif, non persistant)
      label.addEventListener("mouseenter", () => render(value));
      label.addEventListener("mouseleave", () => render());
    });

    render(0);
  });
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

// Gestion du bouton "Voir Plus" pour afficher les avis supplémentaires
document.addEventListener("DOMContentLoaded", () => {
  const seeMoreButton = document.getElementById("seeMoreReviews");
  const hiddenReviews = document.querySelectorAll(".review-card-hidden");

  if (!seeMoreButton || !hiddenReviews.length) {
    return;
  }

  let isExpanded = false;

  seeMoreButton.addEventListener("click", () => {
    if (!isExpanded) {
      // Afficher tous les avis cachés avec animation
      hiddenReviews.forEach((review, index) => {
        setTimeout(() => {
          review.classList.add("show");
          // Réorganiser la grille pour les nouveaux avis
          const grid = document.getElementById("reviewsList");
          if (grid) {
            // Calculer la position dans la grille
            const totalIndex = index + 5; // 5 avis déjà affichés
            const cardType =
              totalIndex % 3 === 0
                ? "large"
                : totalIndex % 3 === 1
                ? "medium"
                : "small";
            review.className = `review-card review-card-${cardType} show`;
          }
        }, index * 100); // Délai progressif pour l'animation
      });

      // Mettre à jour le bouton
      seeMoreButton.classList.add("expanded");
      const currentText = seeMoreButton.innerHTML;
      const countMatch = currentText.match(/\((\d+)\)/);
      if (countMatch) {
        seeMoreButton.innerHTML = `
          <i class="fa-solid fa-chevron-up"></i>
          Voir Moins
        `;
      }

      isExpanded = true;

      // Scroll vers le premier avis affiché
      setTimeout(() => {
        hiddenReviews[0].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 300);
    } else {
      // Masquer les avis supplémentaires
      hiddenReviews.forEach((review) => {
        review.classList.remove("show");
      });

      // Mettre à jour le bouton
      seeMoreButton.classList.remove("expanded");
      const totalHidden = hiddenReviews.length;
      seeMoreButton.innerHTML = `
        <i class="fa-solid fa-chevron-down"></i>
        Voir Plus (${totalHidden})
      `;

      isExpanded = false;

      // Scroll vers le bouton
      seeMoreButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
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
