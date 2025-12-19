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
    const PARALLAX_INTENSITY = 10; // Intensité parallaxe en pixels (max 10px)
    let parallaxX = 0;
    let parallaxY = 0;

    /**
     * Applique l'effet de parallaxe dynamique au premier plan PNG
     * @param {HTMLElement} foreground - Élément PNG de premier plan
     */
    function applyDynamicParallax(foreground) {
      if (!foreground) return;

      // Combiner transform de base avec parallaxe
      const baseTransform = `translateX(calc(-50% + ${parallaxX}px)) translateY(${parallaxY}px)`;
      foreground.style.transform = baseTransform;
    }

    /**
     * Gère le mouvement de la souris pour la parallaxe dynamique
     * @param {MouseEvent} e - Événement mousemove
     */
    function handleMouseMove(e) {
      const sliderRect = slider.getBoundingClientRect();
      const centerX = sliderRect.left + sliderRect.width / 2;
      const centerY = sliderRect.top + sliderRect.height / 2;

      // Calculer offset relatif au centre (-1 à 1)
      const offsetX = (e.clientX - centerX) / (sliderRect.width / 2);
      const offsetY = (e.clientY - centerY) / (sliderRect.height / 2);

      // Appliquer parallaxe avec intensité limitée
      parallaxX = offsetX * PARALLAX_INTENSITY;
      parallaxY = offsetY * PARALLAX_INTENSITY;

      // Appliquer au foreground du slide actif
      const activeSlide = slides[currentSlide];
      const foreground = activeSlide?.querySelector(".hero-slider__foreground");
      if (foreground && activeSlide.classList.contains("hero-slider__slide--active")) {
        applyDynamicParallax(foreground);
      }
    }

    /**
     * Réinitialise la parallaxe au centre
     */
    function resetParallax() {
      parallaxX = 0;
      parallaxY = 0;

      const activeSlide = slides[currentSlide];
      const foreground = activeSlide?.querySelector(".hero-slider__foreground");
      if (foreground) {
        foreground.style.transform = "translateX(-50%)";
      }
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

      // Si c'est le même slide, ne rien faire
      if (index === currentSlide) return;

      const previousSlideIndex = currentSlide;
      const previousSlide = slides[previousSlideIndex];
      const previousForeground = previousSlide?.querySelector(".hero-slider__foreground");

      // Animation de sortie sur l'ancien slide
      if (previousForeground) {
        previousForeground.classList.remove("slide-in");
        previousForeground.classList.add("slide-out");
      }

      // Retirer la classe active de toutes les slides
      slides.forEach((slide) =>
        slide.classList.remove("hero-slider__slide--active")
      );

      // Retirer la classe active de tous les numéros de pagination
      paginationNumbers.forEach((number) => {
        number.classList.remove("hero-slider__pagination-number--active");
        number.setAttribute("aria-selected", "false");
      });

      // Activer la nouvelle slide
      const activeSlide = slides[index];
      activeSlide.classList.add("hero-slider__slide--active");

      // Animation d'entrée sur le nouveau foreground
      const activeForeground = activeSlide.querySelector(".hero-slider__foreground");
      if (activeForeground) {
        // Réinitialiser les classes et le transform
        activeForeground.classList.remove("slide-out");
        activeForeground.style.transform = "translateX(-50%)";

        // Appliquer slide-in après un petit délai pour transition fluide
        setTimeout(() => {
          activeForeground.classList.add("slide-in");
          
          // Appliquer parallaxe actuelle après l'animation (800ms)
          setTimeout(() => {
            if (parallaxX !== 0 || parallaxY !== 0) {
              applyDynamicParallax(activeForeground);
            }
          }, 800);
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

    // Parallaxe dynamique au mouvement de la souris
    slider.addEventListener("mousemove", handleMouseMove);
    slider.addEventListener("mouseleave", resetParallax);

    // Auto-play avec pause au hover
    startAutoplay(); // Démarrer l'autoplay au chargement

    // Pause au hover
    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", () => {
      resetParallax();
      startAutoplay();
    });

    // Pause lors de l'interaction tactile (mobile)
    slider.addEventListener("touchstart", stopAutoplay);
    slider.addEventListener("touchend", () => {
      setTimeout(startAutoplay, 3000); // Reprendre après 3 secondes
    });

    // Initialiser le slide actif au chargement
    const activeForeground = slides[0]?.querySelector(
      ".hero-slider__foreground"
    );
    if (activeForeground) {
      activeForeground.style.transform = "translateX(-50%)";
      // Appliquer animation d'entrée après un court délai
      setTimeout(() => {
        activeForeground.classList.add("slide-in");
      }, 100);
    }
  });
})();
