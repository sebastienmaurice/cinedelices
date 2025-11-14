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
