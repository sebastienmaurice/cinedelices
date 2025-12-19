/**
 * Hero Slider - Parallaxe et pagination verticale
 * Gère le changement de slides avec parallaxe du premier plan,
 * pagination verticale et autoplay
 */

(function () {
  "use strict";

  // Initialisation au chargement du DOM
  document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".hero-slider");
    if (!slider) return;

    const slides = slider.querySelectorAll(".hero-slider__slide");
    const paginationNumbers = slider.querySelectorAll(
      ".hero-slider__pagination-number"
    );

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval = null;
    const AUTO_PLAY_INTERVAL = 7000; // 7 secondes
    const PARALLAX_OFFSET = 30; // Décalage parallaxe en pixels

    /**
     * Applique l'effet de parallaxe au premier plan PNG
     * @param {HTMLElement} foreground - Élément PNG de premier plan
     * @param {number} direction - Direction du déplacement (1 = droite, -1 = gauche)
     */
    function applyParallax(foreground, direction) {
      if (!foreground) return;

      // Le PNG se déplace plus vite que le background
      // Décalage horizontal léger pour effet parallaxe
      const offsetX = direction * PARALLAX_OFFSET;
      const offsetY = direction * (PARALLAX_OFFSET * 0.5); // Décalage vertical plus faible

      foreground.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    }

    /**
     * Affiche un slide spécifique
     * @param {number} index - Index du slide à afficher (0-based)
     */
    function showSlide(index) {
      // S'assurer que l'index est valide
      if (index < 0) {
        index = totalSlides - 1;
      } else if (index >= totalSlides) {
        index = 0;
      }

      const previousSlide = currentSlide;
      const direction = index > previousSlide ? 1 : -1; // Direction du changement

      // Retirer la classe active de toutes les slides
      slides.forEach((slide) =>
        slide.classList.remove("hero-slider__slide--active")
      );

      // Retirer la classe active de tous les numéros de pagination
      paginationNumbers.forEach((number) => {
        number.classList.remove("hero-slider__pagination-number--active");
        number.setAttribute("aria-selected", "false");
      });

      // Activer la slide correspondante
      const activeSlide = slides[index];
      activeSlide.classList.add("hero-slider__slide--active");

      // Appliquer la parallaxe au premier plan PNG
      const foreground = activeSlide.querySelector(".hero-slider__foreground");
      if (foreground) {
        // Reset puis appliquer la parallaxe
        foreground.style.transform = "translate(-50%, -50%)";
        setTimeout(() => {
          applyParallax(foreground, direction);
        }, 50);
      }

      // Activer le numéro de pagination correspondant
      if (paginationNumbers[index]) {
        paginationNumbers[index].classList.add(
          "hero-slider__pagination-number--active"
        );
        paginationNumbers[index].setAttribute("aria-selected", "true");
      }

      currentSlide = index;
    }

    /**
     * Slide suivant
     */
    function nextSlide() {
      showSlide(currentSlide + 1);
    }

    /**
     * Slide précédent
     */
    function prevSlide() {
      showSlide(currentSlide - 1);
    }

    /**
     * Démarre l'autoplay
     */
    function startAutoplay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
      autoPlayInterval = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    }

    /**
     * Arrête l'autoplay
     */
    function stopAutoplay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    }

    // Écouter les clics sur les numéros de pagination
    paginationNumbers.forEach((number, index) => {
      number.addEventListener("click", () => {
        showSlide(index);
        startAutoplay(); // Redémarrer l'autoplay après navigation manuelle
      });
    });

    // Navigation au clavier (accessibilité)
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        prevSlide();
        startAutoplay();
      } else if (e.key === "ArrowRight") {
        nextSlide();
        startAutoplay();
      }
    });

    // Rendre le slider focusable pour la navigation clavier
    slider.setAttribute("tabindex", "0");

    // Auto-play avec pause au hover
    startAutoplay(); // Démarrer l'autoplay au chargement

    // Pause au hover
    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);

    // Pause lors de l'interaction tactile (mobile)
    slider.addEventListener("touchstart", stopAutoplay);
    slider.addEventListener("touchend", () => {
      setTimeout(startAutoplay, 3000); // Reprendre après 3 secondes
    });

    // Initialiser la parallaxe du slide actif au chargement
    const activeForeground = slides[0]?.querySelector(".hero-slider__foreground");
    if (activeForeground) {
      activeForeground.style.transform = "translate(-50%, -50%)";
    }
  });
})();
