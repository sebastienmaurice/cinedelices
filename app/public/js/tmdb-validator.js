/**
 * Validation intelligente des films via TMDB
 *
 * Fonctionnalités :
 * - Appel à l'API TMDB avec debounce 400ms
 * - Affichage d'un dropdown avec suggestions TMDB
 * - Sélection manuelle parmi les suggestions
 * - Pré-remplissage automatique après sélection
 * - Correction automatique des fautes via suggestions TMDB
 */

(function () {
  "use strict";

  // Configuration
  const DEBOUNCE_DELAY = 400; // ms
  const MIN_SEARCH_LENGTH = 2;
  const API_ENDPOINT = "/api/tmdb/search";

  // Éléments DOM
  let filmNameInput = null;
  let filmYearInput = null;
  let filmGenreSelect = null;

  // Champs cachés
  let tmdbIdHidden = null;
  let titleFRHidden = null;
  let tmdbYearHidden = null;
  let tmdbGenreHidden = null;

  // Dropdown pour les suggestions TMDB
  let tmdbSuggestionsDropdown = null;

  // État
  let debounceTimer = null;
  let isSearching = false;
  let lastValidatedMovie = null;
  let isSelectingFromDropdown = false;
  let currentSuggestions = [];

  /**
   * Initialisation
   */
  function init() {
    console.log("🔧 Initialisation validation TMDB...");

    // Récupérer les éléments DOM
    filmNameInput = document.getElementById("film-name");
    filmYearInput = document.getElementById("film-year");
    filmGenreSelect = document.getElementById("film-genre");

    // Champs cachés
    tmdbIdHidden = document.getElementById("tmdbId-hidden");
    titleFRHidden = document.getElementById("titleFR-hidden");
    tmdbYearHidden = document.getElementById("tmdbYear-hidden");
    tmdbGenreHidden = document.getElementById("tmdbGenre-hidden");

    if (!filmNameInput) {
      console.error("❌ film-name input non trouvé");
      return;
    }

    // Créer le dropdown pour les suggestions TMDB
    createSuggestionsDropdown();

    // Écouter les changements sur le champ titre
    filmNameInput.addEventListener("input", handleInput);
    filmNameInput.addEventListener("blur", handleBlur);
    filmNameInput.addEventListener("focus", handleFocus);

    // Fermer le dropdown si on clique ailleurs
    document.addEventListener("click", (e) => {
      if (
        !filmNameInput.contains(e.target) &&
        !tmdbSuggestionsDropdown.contains(e.target)
      ) {
        hideSuggestions();
      }
    });

    console.log("✅ Validation TMDB initialisée");
  }

  /**
   * Créer le dropdown pour afficher les suggestions TMDB
   */
  function createSuggestionsDropdown() {
    const wrapper = filmNameInput.closest(".film-name-input-wrapper");
    if (!wrapper) return;

    tmdbSuggestionsDropdown = document.createElement("div");
    tmdbSuggestionsDropdown.id = "tmdb-suggestions";
    tmdbSuggestionsDropdown.className = "tmdb-suggestions";
    tmdbSuggestionsDropdown.style.display = "none";
    wrapper.appendChild(tmdbSuggestionsDropdown);
  }

  /**
   * Gérer la saisie avec debounce
   */
  function handleInput(e) {
    if (isSelectingFromDropdown) return;

    const query = e.target.value.trim();

    // Clear le timer précédent
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Si le champ est vide ou trop court, reset
    if (query.length < MIN_SEARCH_LENGTH) {
      hideSuggestions();
      resetValidation();
      return;
    }

    // Débouncer l'appel API
    debounceTimer = setTimeout(() => {
      searchMovie(query);
    }, DEBOUNCE_DELAY);
  }

  /**
   * Gérer le focus
   */
  function handleFocus() {
    // Si on a des suggestions, les réafficher
    if (currentSuggestions.length > 0) {
      displaySuggestions(currentSuggestions);
    }
  }

  /**
   * Gérer le blur (quand l'utilisateur quitte le champ)
   */
  function handleBlur() {
    // Attendre un peu pour permettre le clic sur une suggestion
    setTimeout(() => {
      if (!isSelectingFromDropdown) {
        hideSuggestions();
        // Pas de blocage ici : on laisse l'utilisateur continuer
        // Le blocage se fera uniquement au moment de la soumission si aucun tmdbId n'est présent
      }
    }, 200);
  }

  /**
   * Normaliser un titre pour comparaison (retirer accents, espaces multiples, etc.)
   */
  function normalizeTitle(title) {
    if (!title) return "";
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
      .replace(/\s+/g, " ") // Remplacer espaces multiples par un seul
      .replace(/[^\w\s]/g, "") // Retirer ponctuation
      .trim();
  }

  /**
   * Comparer deux titres pour détecter si c'est le même film
   */
  function isSameMovie(movie1, movie2) {
    const title1 = normalizeTitle(movie1.title || movie1.original_title || "");
    const title2 = normalizeTitle(movie2.title || movie2.original_title || "");

    // Comparer les titres normalisés
    if (title1 === title2) return true;

    // Vérifier si un titre contient l'autre (pour gérer les variantes)
    if (title1.length > 5 && title2.length > 5) {
      if (title1.includes(title2) || title2.includes(title1)) {
        // Si les années correspondent, c'est probablement le même film
        if (movie1.year && movie2.year && movie1.year === movie2.year) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Rechercher un film (local + TMDB combinés)
   */
  async function searchMovie(query) {
    if (isSearching) return;

    isSearching = true;
    showLoading();

    try {
      console.log("🔍 Recherche combinée:", query);

      // 1. Rechercher d'abord dans la BDD locale
      const localResponse = await fetch(
        `/movies/api/search?query=${encodeURIComponent(query)}`
      );
      const localData = await localResponse.json();

      // 2. Rechercher ensuite sur TMDB
      const tmdbResponse = await fetch(
        `${API_ENDPOINT}?query=${encodeURIComponent(query)}`
      );
      const tmdbData = await tmdbResponse.json();

      // Masquer le dropdown de l'autocomplétion locale pour éviter la confusion
      const localDropdown = document.getElementById("film-search-results");
      if (localDropdown) {
        localDropdown.style.display = "none";
        localDropdown.classList.remove("active");
      }

      // Combiner les résultats : films locaux d'abord, puis suggestions TMDB
      const combinedSuggestions = [];

      // Ajouter les films locaux en premier (marqués comme "local")
      if (
        localData.success &&
        localData.movies &&
        localData.movies.length > 0
      ) {
        localData.movies.forEach((movie) => {
          combinedSuggestions.push({
            ...movie,
            isLocal: true,
            source: "local",
          });
        });
      }

      // Ajouter les suggestions TMDB ensuite (sauf si déjà présent localement)
      if (
        tmdbData.success &&
        tmdbData.suggestions &&
        tmdbData.suggestions.length > 0
      ) {
        tmdbData.suggestions.forEach((movie) => {
          // Ne pas ajouter si le film existe déjà dans les résultats locaux
          const existsLocally = combinedSuggestions.some((localMovie) =>
            isSameMovie(localMovie, movie)
          );

          if (!existsLocally) {
            combinedSuggestions.push({
              ...movie,
              isLocal: false,
              source: "tmdb",
            });
          }
        });
      }

      if (combinedSuggestions.length === 0) {
        // Aucun résultat trouvé
        hideLoading();
        hideSuggestions();
        currentSuggestions = [];
        resetValidation();
        return;
      }

      // Afficher les suggestions combinées
      currentSuggestions = combinedSuggestions;
      displaySuggestions(combinedSuggestions);
      hideLoading();

      const localCount = combinedSuggestions.filter((m) => m.isLocal).length;
      const tmdbCount = combinedSuggestions.filter((m) => !m.isLocal).length;

      console.log(
        "✅ Suggestions trouvées:",
        localCount,
        "locaux +",
        tmdbCount,
        "TMDB"
      );
    } catch (error) {
      console.error("❌ Erreur recherche:", error);
      hideLoading();
      hideSuggestions();
      currentSuggestions = [];
      resetValidation();
    } finally {
      isSearching = false;
    }
  }

  /**
   * Afficher les suggestions dans le dropdown
   */
  function displaySuggestions(suggestions) {
    if (!tmdbSuggestionsDropdown) return;

    // Vider le dropdown
    tmdbSuggestionsDropdown.innerHTML = "";

    // Séparer les films locaux et TMDB
    const localMovies = suggestions.filter((m) => m.isLocal);
    const tmdbMovies = suggestions.filter((m) => !m.isLocal);

    // Créer les éléments de suggestion
    // Films locaux en premier (toujours highlightés s'ils sont premiers)
    localMovies.forEach((movie, index) => {
      const item = createSuggestionItem(
        movie,
        index === 0 && tmdbMovies.length === 0
      );
      tmdbSuggestionsDropdown.appendChild(item);
    });

    // Suggestions TMDB ensuite (highlight sur la première TMDB seulement si pas de films locaux)
    tmdbMovies.forEach((movie, index) => {
      const item = createSuggestionItem(
        movie,
        index === 0 && localMovies.length === 0
      );
      tmdbSuggestionsDropdown.appendChild(item);
    });

    // Afficher le dropdown
    tmdbSuggestionsDropdown.style.display = "block";
    tmdbSuggestionsDropdown.classList.add("active");
  }

  /**
   * Créer un élément de suggestion
   */
  function createSuggestionItem(movie, isHighlighted = false) {
    const item = document.createElement("div");
    item.className = "tmdb-suggestion-item";

    // Ajouter la classe pour les films locaux
    if (movie.isLocal) {
      item.classList.add("suggestion-local");
    }

    if (isHighlighted && !movie.isLocal) {
      item.classList.add("tmdb-suggestion-highlighted");
    }
    item.setAttribute("role", "option");
    item.setAttribute("tabindex", "0");

    // Structure de la suggestion avec miniature
    const suggestionContent = document.createElement("div");
    suggestionContent.className = "tmdb-suggestion-content";

    // Miniature du film (si disponible)
    // Pour les films locaux, utiliser cardPath (ou picture en fallback) de la BDD
    // Pour les films TMDB, utiliser poster_path
    const localImage = movie.cardPath || movie.picture;
    const posterUrl = movie.isLocal
      ? localImage
        ? localImage.startsWith("http")
          ? localImage
          : `/${localImage}`
        : null
      : movie.poster_path;

    if (posterUrl) {
      const poster = document.createElement("img");
      poster.className = "tmdb-suggestion-poster";
      poster.src = posterUrl;
      poster.alt = movie.title || movie.original_title || "";
      poster.loading = "lazy";
      poster.onerror = function () {
        // En cas d'erreur de chargement, cacher l'image
        this.style.display = "none";
      };
      suggestionContent.appendChild(poster);
    }

    // Informations du film
    const movieInfo = document.createElement("div");
    movieInfo.className = "tmdb-suggestion-info";

    const title = document.createElement("span");
    title.className = "tmdb-suggestion-title";
    title.textContent = movie.title || movie.original_title || "";

    // Badge pour les films locaux
    if (movie.isLocal) {
      const badge = document.createElement("span");
      badge.className = "tmdb-suggestion-badge";
      badge.textContent = "Ciné Délices";
      title.appendChild(badge);
    }

    // Badge pour type (Film ou Série)
    const typeBadge = document.createElement("span");
    typeBadge.className =
      movie.type && movie.type === "serie"
        ? "tmdb-suggestion-type tmdb-suggestion-type--serie"
        : "tmdb-suggestion-type tmdb-suggestion-type--film";
    typeBadge.textContent =
      movie.type && movie.type === "serie" ? "Série" : "Film";
    title.appendChild(typeBadge);

    const year = document.createElement("span");
    year.className = "tmdb-suggestion-year";
    year.textContent = movie.year ? ` (${movie.year})` : "";

    const genre = document.createElement("span");
    genre.className = "tmdb-suggestion-genre";
    genre.textContent = movie.genre ? ` • ${movie.genre}` : "";

    movieInfo.appendChild(title);
    movieInfo.appendChild(year);
    movieInfo.appendChild(genre);

    suggestionContent.appendChild(movieInfo);
    item.appendChild(suggestionContent);

    // Événement clic
    item.addEventListener("click", () => selectMovie(movie));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectMovie(movie);
      }
    });

    return item;
  }

  /**
   * Sélectionner un film depuis les suggestions
   */
  function selectMovie(movie) {
    isSelectingFromDropdown = true;

    // Si c'est un film local, utiliser le filmId existant
    if (movie.isLocal && movie.id) {
      const filmIdHidden = document.getElementById("filmId-hidden");
      if (filmIdHidden) {
        filmIdHidden.value = movie.id;
      }
      // Vider les champs cachés TMDB
      if (tmdbIdHidden) tmdbIdHidden.value = "";
      if (titleFRHidden) titleFRHidden.value = "";
      if (tmdbYearHidden) tmdbYearHidden.value = "";
      if (tmdbGenreHidden) tmdbGenreHidden.value = "";
    }

    // Remplir les champs du formulaire
    fillFormWithMovieData(movie);
    lastValidatedMovie = movie;

    // Mettre à jour l'image : afficher l'image si film existant, sinon image par défaut
    if (movie.isLocal && movie.id) {
      // Film existant : récupérer ses données complètes pour avoir l'image
      updateFilmImage(movie);
    } else {
      // Nouveau film : image par défaut
      updateFilmImage(null);
    }

    // Mettre à jour l'URL pour supprimer les paramètres tmdb_id et title
    updateURL();

    // Fermer le dropdown
    hideSuggestions();

    // Focus sur le champ suivant
    setTimeout(() => {
      isSelectingFromDropdown = false;
      if (filmYearInput) filmYearInput.focus();
    }, 100);

    console.log(
      "✅ Film sélectionné:",
      movie.title,
      movie.year,
      movie.isLocal ? "(local)" : "(TMDB)"
    );
  }

  /**
   * Mettre à jour l'image du film
   * Pour les films existants avec image : afficher l'image
   * Pour les nouveaux films : afficher l'image par défaut
   */
  function resetFilmImage() {
    updateFilmImage(null);
  }

  /**
   * Mettre à jour l'image du film
   * Pour les films existants avec image : afficher l'image
   * Pour les nouveaux films : afficher l'image par défaut
   */
  async function updateFilmImage(movie) {
    const filmSelectedImage = document.querySelector(
      ".film-selected-image img"
    );
    if (!filmSelectedImage) return;

    // Si c'est un film existant (movie.id existe), récupérer ses données complètes pour avoir l'image
    if (movie && movie.id) {
      try {
        // Récupérer les informations complètes du film depuis la BDD via une route API
        const response = await fetch(`/movies/api/get/${movie.id}`);

        if (response.ok) {
          const data = await response.json();

          // Si le film existe avec une image, l'afficher (utiliser cardPath si disponible)
          const imagePath = data.movie?.cardPath || data.movie?.picture;
          if (data.success && data.movie && imagePath) {
            filmSelectedImage.src = imagePath.startsWith("/")
              ? imagePath
              : `/${imagePath}`;
            filmSelectedImage.alt = `Affiche du film ${
              data.movie.title || movie.title || movie.original_title || ""
            }`;
            return;
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'image du film:",
          error
        );
      }
    }

    // Nouveau film ou film sans image : image par défaut
    filmSelectedImage.src = "/images/image-default-movie.jpg";
    filmSelectedImage.alt = "Image de film par defaut";
  }

  /**
   * Mettre à jour l'URL pour supprimer les paramètres tmdb_id et title
   */
  function updateURL() {
    const url = new URL(window.location.href);
    url.searchParams.delete("tmdb_id");
    url.searchParams.delete("title");

    // Mettre à jour l'URL sans recharger la page
    window.history.replaceState({}, "", url.toString());
  }

  /**
   * Masquer le dropdown de suggestions
   */
  function hideSuggestions() {
    if (!tmdbSuggestionsDropdown) return;
    tmdbSuggestionsDropdown.style.display = "none";
    tmdbSuggestionsDropdown.classList.remove("active");
  }

  /**
   * Afficher un indicateur de chargement dans le dropdown
   */
  function showLoading() {
    if (!tmdbSuggestionsDropdown) return;

    const loading = document.createElement("div");
    loading.className = "tmdb-suggestion-loading";
    loading.textContent = "Recherche en cours...";
    tmdbSuggestionsDropdown.innerHTML = "";
    tmdbSuggestionsDropdown.appendChild(loading);
    tmdbSuggestionsDropdown.style.display = "block";
    tmdbSuggestionsDropdown.classList.add("active");
  }

  /**
   * Pré-remplir le formulaire avec les données du film
   */
  function fillFormWithMovieData(movie) {
    // Remplacer le titre par le vrai titre français
    if (filmNameInput) {
      filmNameInput.value = movie.title || movie.original_title || "";
    }

    // Pré-remplir l'année
    if (filmYearInput && movie.year) {
      filmYearInput.value = movie.year;
    }

    // Pré-remplir le genre (si le select a l'option correspondante)
    if (filmGenreSelect && movie.genre) {
      // Mapper le genre TMDB vers nos genres (seulement si pas local)
      if (!movie.isLocal) {
        const genreMap = {
          action: "action",
          aventure: "aventure",
          animé: "animé",
          comédie: "comédie",
          drame: "drame",
          fantastique: "fantastique",
          horreur: "horreur",
          "science-fiction": "science-fiction",
          thriller: "thriller",
          romantique: "romantique",
        };

        const mappedGenre =
          genreMap[movie.genre.toLowerCase()] || movie.genre.toLowerCase();
        if (filmGenreSelect.querySelector(`option[value="${mappedGenre}"]`)) {
          filmGenreSelect.value = mappedGenre;
        }
      } else {
        // Pour les films locaux, utiliser directement le genre
        if (filmGenreSelect.querySelector(`option[value="${movie.genre}"]`)) {
          filmGenreSelect.value = movie.genre;
        }
      }
    }

    // Si c'est un film local, ne pas remplir les champs TMDB
    if (movie.isLocal) {
      if (tmdbIdHidden) tmdbIdHidden.value = "";
      if (titleFRHidden) titleFRHidden.value = "";
      if (tmdbYearHidden) tmdbYearHidden.value = "";
      if (tmdbGenreHidden) tmdbGenreHidden.value = "";
      return; // Ne pas remplir les champs TMDB pour les films locaux
    }

    // Remplir les champs cachés TMDB (seulement pour les nouveaux films)
    if (tmdbIdHidden) {
      tmdbIdHidden.value = movie.tmdb_id || "";
    }
    if (titleFRHidden) {
      titleFRHidden.value = movie.title || "";
    }
    if (tmdbYearHidden) {
      tmdbYearHidden.value = movie.year || "";
    }
    if (tmdbGenreHidden) {
      tmdbGenreHidden.value = movie.genre || "";
    }

    // Vider le filmId si présent (on crée un nouveau film avec tmdb_id)
    const filmIdHidden = document.getElementById("filmId-hidden");
    if (filmIdHidden) {
      filmIdHidden.value = "";
    }
  }

  /**
   * Réinitialiser la validation
   */
  function resetValidation() {
    lastValidatedMovie = null;
    if (tmdbIdHidden) tmdbIdHidden.value = "";
    if (titleFRHidden) titleFRHidden.value = "";
    if (tmdbYearHidden) tmdbYearHidden.value = "";
    if (tmdbGenreHidden) tmdbGenreHidden.value = "";
  }

  // Initialiser au chargement du DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
