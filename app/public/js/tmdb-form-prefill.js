/**
 * Script de pré-remplissage du formulaire depuis TMDB
 * Détecte le tmdb_id dans l'URL et pré-remplit le formulaire
 */

(function () {
  "use strict";

  /**
   * Initialisation au chargement de la page
   */
  function init() {
    // Vérifier si on est sur la page add-recipes-movies
    if (!document.querySelector("#unified-form")) {
      return;
    }

    // Récupérer les données du film depuis les query params de l'URL
    // Ces params sont transmis par le dropdown de recherche sur /movies
    // quand l'utilisateur sélectionne un film inexistant (résultat TMDB)
    const urlParams = new URLSearchParams(window.location.search);
    const tmdbId = urlParams.get("tmdb_id");
    const title = urlParams.get("title");
    const year = urlParams.get("year");
    const genre = urlParams.get("genre");
    const type = urlParams.get("type"); // 'film' ou 'serie'

    // Écouter les modifications du film pour réinitialiser l'image et mettre à jour l'URL
    // Doit être fait AVANT le pré-remplissage
    setupFilmChangeListeners();

    // S'assurer que l'image par défaut est affichée au démarrage
    resetFilmImage();

    // Pré-remplissage depuis les query params
    if (tmdbId && title) {
      // Remplissage immédiat des champs visibles (sans attendre l'API)
      prefillForm({
        tmdb_id: tmdbId,
        title_fr: title,
        year: year ? parseInt(year, 10) : null,
        genre: genre || null,
        overview: null,
      });
      // Appel API TMDB pour récupérer le poster et le synopsis complet
      // prefillForm() sera rappelé avec les données complètes (poster inclus)
      loadTmdbInfo(tmdbId, type);
    }
  }

  /**
   * Configurer les listeners pour détecter les changements de film
   */
  function setupFilmChangeListeners() {
    const filmNameInput = document.getElementById("film-name");
    const filmYearInput = document.getElementById("film-year");
    const filmGenreSelect = document.getElementById("film-genre");

    if (!filmNameInput) return;

    // Fonction pour réinitialiser quand l'utilisateur modifie le film
    const handleFilmChange = () => {
      // Réinitialiser l'image à l'image par défaut
      resetFilmImage();

      // Mettre à jour l'URL pour supprimer les paramètres tmdb_id et title
      // Refactoring : utilisation de la fonction centralisée
      if (window.cleanMovieParamsFromURL) {
        window.cleanMovieParamsFromURL();
      }

      // Réinitialiser les champs cachés TMDB
      resetTmdbHiddenFields();
    };

    // Écouter les modifications manuelles du nom du film
    filmNameInput.addEventListener("input", () => {
      // Attendre un peu pour éviter de déclencher pendant la saisie
      setTimeout(() => {
        // Vérifier si c'est une modification manuelle (pas une sélection depuis dropdown)
        if (!document.querySelector("#film-search-results.active")) {
          handleFilmChange();
        }
      }, 100);
    });

    // Écouter les modifications de l'année
    if (filmYearInput) {
      filmYearInput.addEventListener("change", handleFilmChange);
    }

    // Écouter les modifications du genre
    if (filmGenreSelect) {
      filmGenreSelect.addEventListener("change", handleFilmChange);
    }

    // Écouter les sélections depuis l'autocomplétion locale (via événement personnalisé)
    document.addEventListener("filmSelected", (event) => {
      handleFilmChange();
    });

    // Écouter les sélections depuis TMDB validator
    document.addEventListener("tmdbMovieSelected", (event) => {
      handleFilmChange();
    });
  }

  /**
   * Réinitialiser les champs cachés TMDB
   */
  function resetTmdbHiddenFields() {
    const tmdbIdHidden = document.getElementById("tmdbId-hidden");
    if (tmdbIdHidden) {
      tmdbIdHidden.value = "";
    }

    const titleFRHidden = document.getElementById("titleFR-hidden");
    if (titleFRHidden) {
      titleFRHidden.value = "";
    }

    const tmdbYearHidden = document.getElementById("tmdbYear-hidden");
    if (tmdbYearHidden) {
      tmdbYearHidden.value = "";
    }

    const tmdbGenreHidden = document.getElementById("tmdbGenre-hidden");
    if (tmdbGenreHidden) {
      tmdbGenreHidden.value = "";
    }
  }

  /**
   * Charger les informations complètes du film ou de la série depuis TMDB
   * @param {string|number} tmdbId - ID TMDB du film/série
   * @param {string} type - Type optionnel : 'film' ou 'serie'
   */
  async function loadTmdbInfo(tmdbId, type = null) {
    try {
      // Afficher un indicateur de chargement
      showLoading();

      // Construire l'URL avec le type si disponible
      const url = type
        ? `/movies/get-tmdb-info/${tmdbId}?type=${encodeURIComponent(type)}`
        : `/movies/get-tmdb-info/${tmdbId}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Erreur ${response.status}: ${
            response.statusText || "Film non trouvé"
          }`
        );
      }

      const data = await response.json();

      if (!data.success || !data.movie) {
        throw new Error("Aucune donnée de film reçue");
      }

      // Pré-remplir le formulaire avec les données TMDB
      prefillForm(data.movie);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des infos TMDB:", error);
      showError(error.message || "Erreur lors du chargement des informations");
    }
  }

  /**
   * Pré-remplir tous les champs du formulaire
   * @param {object} movie - Objet film avec toutes les informations TMDB
   */
  function prefillForm(movie) {
    // 1. Pré-remplir les champs visibles du formulaire film
    const filmNameInput = document.getElementById("film-name");
    if (filmNameInput && movie.title_fr) {
      filmNameInput.value = movie.title_fr;
    }

    const filmYearInput = document.getElementById("film-year");
    if (filmYearInput && movie.year) {
      filmYearInput.value = movie.year;
    }

    const filmGenreSelect = document.getElementById("film-genre");
    if (filmGenreSelect && movie.genre) {
      // Trouver l'option correspondant au genre
      const options = Array.from(filmGenreSelect.options);
      const matchingOption = options.find(
        (opt) => opt.value.toLowerCase() === movie.genre.toLowerCase()
      );
      if (matchingOption) {
        filmGenreSelect.value = matchingOption.value;
      } else {
        // Si le genre n'existe pas dans la liste, sélectionner la première option vide
        filmGenreSelect.selectedIndex = 0;
      }
    }

    // Pré-remplir le synopsis (overview de TMDB)
    const filmSynopsisInput = document.getElementById("film-synopsis");
    if (filmSynopsisInput && movie.overview) {
      filmSynopsisInput.value = movie.overview;
      if (window.autoResizeSynopsis) window.autoResizeSynopsis();
    }

    // 2. Pré-remplir les champs cachés du formulaire unifié
    const tmdbIdHidden = document.getElementById("tmdbId-hidden");
    if (tmdbIdHidden) {
      tmdbIdHidden.value = movie.tmdb_id || "";
    }

    const titleFRHidden = document.getElementById("titleFR-hidden");
    if (titleFRHidden) {
      titleFRHidden.value = movie.title_fr || "";
    }

    const tmdbYearHidden = document.getElementById("tmdbYear-hidden");
    if (tmdbYearHidden) {
      tmdbYearHidden.value = movie.year || "";
    }

    const tmdbGenreHidden = document.getElementById("tmdbGenre-hidden");
    if (tmdbGenreHidden) {
      tmdbGenreHidden.value = movie.genre || "";
    }

    // Pré-remplir aussi les champs cachés standards (pour nouveau film)
    const filmTitleHidden = document.getElementById("film-title-hidden");
    if (filmTitleHidden) {
      filmTitleHidden.value = movie.title_fr || "";
    }

    const filmYearHidden = document.getElementById("film-year-hidden");
    if (filmYearHidden) {
      filmYearHidden.value = movie.year || "";
    }

    const filmGenreHidden = document.getElementById("film-genre-hidden");
    if (filmGenreHidden) {
      filmGenreHidden.value = movie.genre || "";
    }

    // 3. Mettre à jour la colonne de gauche (film-info-box)
    updateFilmInfoBox(movie);

    // 4. Afficher le poster TMDB si disponible, sinon image par défaut
    // "poster" = URL CDN TMDB (ex: https://image.tmdb.org/t/p/w500/...)
    // L'affiche sera importée automatiquement côté serveur lors de la soumission
    updateFilmPosterPreview(movie.poster || null);

    // 5. Synchroniser les champs cachés du formulaire unifié
    syncHiddenFields();

    // Masquer le chargement
    hideLoading();

    // Afficher un message de succès subtil
    showSuccess();

    // Déclencher un événement pour notifier les autres scripts
    const event = new CustomEvent("tmdbFormPrefilled", {
      detail: { movie },
    });
    document.dispatchEvent(event);
  }

  /**
   * Mettre à jour la boîte d'infos du film dans la colonne de gauche
   * @param {object} movie - Objet film
   */
  function updateFilmInfoBox(movie) {
    const displayFilmName = document.getElementById("display-film-name");
    if (displayFilmName && movie.title_fr) {
      displayFilmName.textContent = movie.title_fr;
    }

    const displayFilmGenre = document.getElementById("display-film-genre");
    if (displayFilmGenre && movie.genre) {
      displayFilmGenre.textContent = movie.genre;
    }

    const displayFilmYear = document.getElementById("display-film-year");
    if (displayFilmYear && movie.year) {
      displayFilmYear.textContent = movie.year;
    }

    const displayFilmSynopsis = document.getElementById("display-film-synopsis");
    if (displayFilmSynopsis && movie.overview) {
      displayFilmSynopsis.textContent = movie.overview;
    }
  }

  /**
   * Met à jour l'affiche dans .film-selected-image img.
   * @param {string|null} posterUrl - URL du poster TMDB (CDN) ou null pour l'image par défaut
   */
  function updateFilmPosterPreview(posterUrl) {
    const filmSelectedImage = document.querySelector(".film-selected-image img");
    if (!filmSelectedImage) return;
    if (posterUrl) {
      filmSelectedImage.src = posterUrl;
      filmSelectedImage.alt = "Affiche du film";
    } else {
      filmSelectedImage.src = "/images/movie-default-img.png";
      filmSelectedImage.alt = "Image de film par defaut";
    }
  }

  /**
   * Réinitialiser l'image à l'image par défaut (utilisé lors de changement de film)
   */
  function resetFilmImage() {
    updateFilmPosterPreview(null);
  }

  // Refactoring : fonction updateURL() supprimée, maintenant centralisée dans
  // /js/utils/url-utils.js et exposée globalement (window.cleanMovieParamsFromURL)
  // Le script utils/url-utils.js doit être chargé avant ce fichier dans la vue

  /**
   * Afficher un indicateur de chargement
   */
  function showLoading() {
    // Optionnel : ajouter un spinner ou un message de chargement
    const filmNameInput = document.getElementById("film-name");
    if (filmNameInput) {
      filmNameInput.disabled = true;
      filmNameInput.placeholder = "Chargement des informations...";
    }
  }

  /**
   * Masquer l'indicateur de chargement
   */
  function hideLoading() {
    const filmNameInput = document.getElementById("film-name");
    if (filmNameInput) {
      filmNameInput.disabled = false;
      if (!filmNameInput.value) {
        filmNameInput.placeholder = "Nom du film";
      }
    }
  }

  /**
   * Afficher un message d'erreur
   * @param {string} message - Message d'erreur
   */
  function showError(message) {
    hideLoading();
    console.error("❌ Erreur pré-remplissage:", message);
    // Optionnel : afficher un message d'erreur à l'utilisateur
    // On peut utiliser une alerte ou un message inline
  }

  /**
   * Synchroniser les champs cachés du formulaire unifié avec les valeurs visibles
   */
  function syncHiddenFields() {
    const filmNameInput = document.getElementById("film-name");
    const filmYearInput = document.getElementById("film-year");
    const filmGenreSelect = document.getElementById("film-genre");
    const filmSynopsisInput = document.getElementById("film-synopsis");

    // Synchroniser les champs cachés standards
    if (filmNameInput) {
      const filmTitleHidden = document.getElementById("film-title-hidden");
      if (filmTitleHidden) {
        filmTitleHidden.value = filmNameInput.value || "";
      }
    }

    if (filmYearInput) {
      const filmYearHidden = document.getElementById("film-year-hidden");
      if (filmYearHidden) {
        filmYearHidden.value = filmYearInput.value || "";
      }
    }

    if (filmGenreSelect) {
      const filmGenreHidden = document.getElementById("film-genre-hidden");
      if (filmGenreHidden) {
        filmGenreHidden.value = filmGenreSelect.value || "";
      }
    }

    if (filmSynopsisInput) {
      const filmSynopsisHidden = document.getElementById("film-synopsis-hidden");
      if (filmSynopsisHidden) {
        filmSynopsisHidden.value = filmSynopsisInput.value || "";
      }
    }
  }

  /**
   * Afficher un message de succès subtil
   */
  function showSuccess() {
    // Optionnel : afficher un message de confirmation
    console.log("✅ Formulaire pré-rempli avec succès");
  }

  // Initialiser au chargement du DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM déjà chargé
    init();
  }
})();
