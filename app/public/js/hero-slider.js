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
    const PARALLAX_MAX_X = 15; // Maximum 15px sur X
    const PARALLAX_MAX_Y = 10; // Maximum 10px sur Y
    const PARALLAX_EASE = 0.15; // Facteur d'inertie (0.1 = plus lent, 0.3 = plus rapide)

    // Variables pour parallaxe avec inertie
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;
    let parallaxAnimationFrame = null;
    let isParallaxEnabled = true;

    // Détecter si on est sur mobile ou si reduced-motion est actif
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (isMobile || prefersReducedMotion) {
      isParallaxEnabled = false;
    }

    /**
     * Applique l'effet de parallaxe avec inertie au premier plan PNG
     * Utilise requestAnimationFrame pour une animation fluide
     */
    function updateParallax() {
      if (!isParallaxEnabled) return;

      // Calculer la différence (inertie)
      const diffX = targetParallaxX - currentParallaxX;
      const diffY = targetParallaxY - currentParallaxY;

      // Appliquer l'inertie (effet retard)
      currentParallaxX += diffX * PARALLAX_EASE;
      currentParallaxY += diffY * PARALLAX_EASE;

      // Appliquer au foreground du slide actif
      const activeSlide = slides[currentSlide];
      const foreground = activeSlide?.querySelector(".hero-slider__foreground");
      if (
        foreground &&
        activeSlide.classList.contains("hero-slider__slide--active") &&
        !foreground.classList.contains("slide-in") // Ne pas appliquer pendant l'animation d'entrée
      ) {
        const baseTransform = `translateX(calc(-50% + ${currentParallaxX}px)) translateY(${currentParallaxY}px)`;
        foreground.style.transform = baseTransform;
      }

      // Continuer l'animation si nécessaire
      if (Math.abs(diffX) > 0.1 || Math.abs(diffY) > 0.1) {
        parallaxAnimationFrame = requestAnimationFrame(updateParallax);
      } else {
        parallaxAnimationFrame = null;
      }
    }

    /**
     * Gère le mouvement de la souris pour la parallaxe dynamique
     * @param {MouseEvent} e - Événement mousemove
     */
    function handleMouseMove(e) {
      if (!isParallaxEnabled) return;

      const sliderRect = slider.getBoundingClientRect();
      const centerX = sliderRect.left + sliderRect.width / 2;
      const centerY = sliderRect.top + sliderRect.height / 2;

      // Calculer offset relatif au centre (-1 à 1)
      const offsetX = (e.clientX - centerX) / (sliderRect.width / 2);
      const offsetY = (e.clientY - centerY) / (sliderRect.height / 2);

      // Calculer parallaxe avec limites
      targetParallaxX = offsetX * PARALLAX_MAX_X;
      targetParallaxY = offsetY * PARALLAX_MAX_Y;

      // Démarrer l'animation si elle n'est pas déjà en cours
      if (!parallaxAnimationFrame) {
        parallaxAnimationFrame = requestAnimationFrame(updateParallax);
      }
    }

    /**
     * Réinitialise la parallaxe au centre
     */
    function resetParallax() {
      targetParallaxX = 0;
      targetParallaxY = 0;

      // L'inertie va progressivement ramener le PNG au centre
      if (!parallaxAnimationFrame && isParallaxEnabled) {
        parallaxAnimationFrame = requestAnimationFrame(updateParallax);
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
      const previousForeground = previousSlide?.querySelector(
        ".hero-slider__foreground"
      );

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

      // Réinitialiser parallaxe pour le nouveau slide
      currentParallaxX = 0;
      currentParallaxY = 0;
      targetParallaxX = 0;
      targetParallaxY = 0;

      // Réinitialiser l'animation background (Ken Burns)
      // L'animation CSS se relance automatiquement avec la classe --active
      const activeBg = activeSlide.querySelector(".hero-slider__bg");
      if (activeBg) {
        // Forcer le reset de l'animation pour qu'elle redémarre
        activeBg.style.animation = "none";
        // Trigger reflow pour forcer le reset
        void activeBg.offsetHeight;
        // Réappliquer l'animation
        activeBg.style.animation = "backgroundKenBurns 7s linear forwards";
      }

      // Animation d'entrée sur le nouveau foreground
      const activeForeground = activeSlide.querySelector(
        ".hero-slider__foreground"
      );
      if (activeForeground) {
        // Réinitialiser les classes et le transform
        activeForeground.classList.remove("slide-out");
        activeForeground.style.transform = "translateX(-50%)";

        // Appliquer slide-in après un petit délai pour transition fluide
        setTimeout(() => {
          activeForeground.classList.add("slide-in");

          // Écouter la fin de l'animation slide-in pour activer la parallaxe
          const handleAnimationEnd = () => {
            // Retirer la classe slide-in pour laisser JS gérer le transform
            activeForeground.classList.remove("slide-in");
            // Maintenant le transform peut être géré par la parallaxe JS
            activeForeground.removeEventListener("animationend", handleAnimationEnd);
          };
          activeForeground.addEventListener("animationend", handleAnimationEnd);
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
    const activeSlide = slides[0];
    if (activeSlide) {
      const activeForeground = activeSlide.querySelector(
        ".hero-slider__foreground"
      );
      if (activeForeground) {
        activeForeground.style.transform = "translateX(-50%)";
        // Appliquer animation d'entrée après un court délai
        setTimeout(() => {
          activeForeground.classList.add("slide-in");

          // Écouter la fin de l'animation slide-in pour activer la parallaxe sur le premier slide
          const handleAnimationEnd = () => {
            activeForeground.classList.remove("slide-in");
            activeForeground.removeEventListener("animationend", handleAnimationEnd);
          };
          activeForeground.addEventListener("animationend", handleAnimationEnd);
        }, 100);
      }

      // Démarrer l'animation Ken Burns du background
      const activeBg = activeSlide.querySelector(".hero-slider__bg");
      if (activeBg) {
        // S'assurer que l'animation démarre
        activeBg.style.animation = "backgroundKenBurns 7s linear forwards";
      }
    }
  });
})();
