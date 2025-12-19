/**
 * Hero Slider - Navigation, pagination et autoplay
 * Gère le changement de slides avec les flèches, la pagination et l'autoplay
 */

(function () {
  "use strict";

  // Initialisation au chargement du DOM
  document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".hero-slider");
    if (!slider) return;

    const slides = slider.querySelectorAll(".hero-slider__slide");
    const prevBtn = slider.querySelector(".hero-slider__nav--prev");
    const nextBtn = slider.querySelector(".hero-slider__nav--next");
    const paginationDots = slider.querySelectorAll(".hero-slider__pagination-dot");

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval = null;
    const AUTO_PLAY_INTERVAL = 7000; // 7 secondes

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

      // Retirer la classe active de toutes les slides et dots
      slides.forEach((slide) => slide.classList.remove("hero-slider__slide--active"));
      paginationDots.forEach((dot) => {
        dot.classList.remove("hero-slider__pagination-dot--active");
        dot.setAttribute("aria-selected", "false");
      });

      // Activer la slide et le dot correspondants
      slides[index].classList.add("hero-slider__slide--active");
      paginationDots[index].classList.add("hero-slider__pagination-dot--active");
      paginationDots[index].setAttribute("aria-selected", "true");

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

    // Écouter les clics sur les boutons de navigation
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        nextSlide();
        startAutoplay(); // Redémarrer l'autoplay après navigation manuelle
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        prevSlide();
        startAutoplay(); // Redémarrer l'autoplay après navigation manuelle
      });
    }

    // Écouter les clics sur les points de pagination
    paginationDots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
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
  });
})();
