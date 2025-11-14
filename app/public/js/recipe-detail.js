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
