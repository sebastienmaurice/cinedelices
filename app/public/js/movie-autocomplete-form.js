/**
 * Autocomplétion IA pour le formulaire d'ajout de film + recette
 *
 * Fonctionnalités :
 * - Recherche de films existants avec debounce
 * - Suggestion de films depuis la BDD
 * - Pré-remplissage automatique (année, genre)
 * - Option de créer un nouveau film si aucun résultat
 */

(function () {
  "use strict";

  // Configuration
  const DEBOUNCE_DELAY = 300;
  const MIN_SEARCH_LENGTH = 2;
  const API_ENDPOINT = "/movies/api/search";

  // Éléments DOM (seront initialisés plus tard)
  let filmNameInput = null;
  let filmYearInput = null;
  let filmGenreSelect = null;
  let searchResultsDropdown = null;

  // État
  let debounceTimer = null;
  let selectedMovieId = null;
  let isSelectingFromDropdown = false;

  /**
   * Initialisation
   */
  function init() {
    console.log("🔧 Initialisation autocomplétion film...");

    // Récupérer les éléments DOM
    filmNameInput = document.getElementById("film-name");
    filmYearInput = document.getElementById("film-year");
    filmGenreSelect = document.getElementById("film-genre");
    searchResultsDropdown = document.getElementById("film-search-results");

    if (!filmNameInput) {
      console.error("❌ film-name input non trouvé");
      return;
    }

    if (!filmYearInput) {
      console.warn("⚠️ film-year input non trouvé");
    }

    if (!filmGenreSelect) {
      console.warn("⚠️ film-genre select non trouvé");
    }

    // Créer le dropdown si inexistant (mais il devrait être dans le HTML maintenant)
    if (!searchResultsDropdown) {
      console.log("📦 Création du dropdown dynamiquement...");
      createDropdown();
      searchResultsDropdown = document.getElementById("film-search-results");
    }

    if (!searchResultsDropdown) {
      console.error("❌ Impossible de créer le dropdown de résultats");
      return;
    }

    console.log("✅ Dropdown trouvé:", searchResultsDropdown);

    // Événements
    filmNameInput.addEventListener("input", handleFilmNameInput);
    filmNameInput.addEventListener("focus", handleFilmNameFocus);
    filmNameInput.addEventListener("blur", handleFilmNameBlur);
    filmNameInput.addEventListener("keydown", handleKeyDown);

    // Fermer le dropdown si clic en dehors
    document.addEventListener("click", handleClickOutside);

    console.log("✅ Autocomplétion film initialisée avec succès");
  }

  /**
   * Créer le dropdown pour les résultats (fallback si non présent dans le HTML)
   */
  function createDropdown() {
    if (!filmNameInput) return;

    const container = filmNameInput.parentElement;
    if (!container) {
      console.error("Conteneur parent de film-name non trouvé");
      return;
    }

    const dropdown = document.createElement("div");
    dropdown.id = "film-search-results";
    dropdown.className = "film-search-results";
    dropdown.setAttribute("aria-live", "polite");
    container.appendChild(dropdown);
    console.log("✅ Dropdown créé dynamiquement");
  }

  /**
   * Gestion de l'input sur le nom du film
   */
  function handleFilmNameInput(event) {
    if (!filmNameInput) {
      console.warn("filmNameInput non disponible dans handleFilmNameInput");
      return;
    }

    const query = event.target.value.trim();
    console.log("🔍 Recherche film:", query);

    // Réinitialiser la sélection si l'utilisateur modifie manuellement
    if (selectedMovieId) {
      selectedMovieId = null;
      clearHiddenInput();
    }

    // Effacer les champs pré-remplis si l'utilisateur modifie le titre
    if (!isSelectingFromDropdown) {
      if (filmYearInput) filmYearInput.value = "";
      if (filmGenreSelect) filmGenreSelect.value = "";
    }

    // Recherche si assez de caractères
    if (query.length < MIN_SEARCH_LENGTH) {
      clearResults();
      return;
    }

    // Debounce
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_DELAY);
  }

  /**
   * Recherche de films
   */
  async function performSearch(query) {
    if (!query || query.trim().length < MIN_SEARCH_LENGTH) {
      return;
    }

    try {
      console.log("🔍 Lancement recherche pour:", query);
      showLoading();

      const url = `${API_ENDPOINT}?query=${encodeURIComponent(query)}`;
      console.log("📡 Appel API:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("📥 Réponse API:", data);

      if (!data.success) {
        console.error("❌ Erreur API:", data);
        showError("Erreur lors de la recherche");
        return;
      }

      if (data.movies && data.movies.length > 0) {
        console.log("✅ Films trouvés:", data.movies.length);
        displayResults(data.movies);
      } else {
        console.log("⚠️ Aucun film trouvé");
        showNoResults(query);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      showError("Erreur de connexion");
    }
  }

  /**
   * Afficher les résultats
   */
  function displayResults(movies) {
    if (!searchResultsDropdown) {
      searchResultsDropdown = document.getElementById("film-search-results");
    }

    if (!searchResultsDropdown) {
      console.error("Dropdown de résultats non trouvé");
      return;
    }

    searchResultsDropdown.innerHTML = "";
    searchResultsDropdown.classList.add("active");

    movies.forEach((movie) => {
      const item = createMovieResultItem(movie);
      searchResultsDropdown.appendChild(item);
    });
  }

  /**
   * Créer un élément de résultat
   */
  function createMovieResultItem(movie) {
    const item = document.createElement("div");
    item.className = "film-search-result-item";
    item.setAttribute("role", "option");
    item.setAttribute("tabindex", "0");

    item.innerHTML = `
      <div class="film-result-content">
        <span class="film-result-title">${escapeHtml(movie.title)}</span>
        <span class="film-result-meta">
          <span class="film-result-year">${movie.year}</span>
          <span class="film-result-separator">•</span>
          <span class="film-result-genre">${escapeHtml(movie.genre)}</span>
        </span>
      </div>
    `;

    // Clic sur le résultat
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
   * Sélectionner un film
   */
  function selectMovie(movie) {
    isSelectingFromDropdown = true;
    selectedMovieId = movie.id;

    // Pré-remplir les champs
    filmNameInput.value = movie.title;
    filmYearInput.value = movie.year;
    filmGenreSelect.value = movie.genre;

    // Pré-remplir le synopsis (si disponible en BDD)
    const filmSynopsisInput = document.getElementById("film-synopsis");
    if (filmSynopsisInput && movie.synopsis) {
      filmSynopsisInput.value = movie.synopsis;
    }

    // Ajouter un champ hidden pour l'ID du film dans le formulaire unifié
    setHiddenInput("filmId", movie.id);

    // Mettre à jour aussi le champ hidden du formulaire unifié directement
    const unifiedForm = document.getElementById("unified-form");
    if (unifiedForm) {
      const filmIdHidden = document.getElementById("filmId-hidden");
      if (filmIdHidden) {
        filmIdHidden.value = movie.id;
      }
    }

    // Fermer le dropdown
    clearResults();
    isSelectingFromDropdown = false;

    // Mettre à jour l'affichage dans la colonne gauche
    updateFilmDisplayInLeftColumn(movie);

    // Afficher l'image du film si c'est un film existant avec une image, sinon image par défaut
    updateFilmImage(movie);

    // Mettre à jour l'URL pour supprimer les paramètres tmdb_id et title
    // Refactoring : utilisation de la fonction centralisée
    if (window.cleanMovieParamsFromURL) {
      window.cleanMovieParamsFromURL();
    }

    // Focus sur le champ suivant
    filmYearInput.focus();
  }

  // Refactoring : fonction updateFilmImage() supprimée, maintenant centralisée dans
  // /js/utils/film-image-utils.js et exposée globalement (window.updateFilmImage)
  // Le script utils/film-image-utils.js doit être chargé avant ce fichier dans la vue

  // Refactoring : fonction updateURL() supprimée, maintenant centralisée dans
  // /js/utils/url-utils.js et exposée globalement (window.cleanMovieParamsFromURL)
  // Le script utils/url-utils.js doit être chargé avant ce fichier dans la vue

  /**
   * Mettre à jour l'affichage du film dans la colonne gauche
   */
  function updateFilmDisplayInLeftColumn(movie) {
    const displayFilmName = document.getElementById("display-film-name");
    const displayFilmGenre = document.getElementById("display-film-genre");
    const displayFilmYear = document.getElementById("display-film-year");
    const displayFilmSynopsis = document.getElementById("display-film-synopsis");

    if (displayFilmName) {
      displayFilmName.textContent = movie.title || "titre";
    }
    if (displayFilmGenre) {
      displayFilmGenre.textContent = movie.genre || "genre";
    }
    if (displayFilmYear) {
      displayFilmYear.textContent = movie.year || "année";
    }
    if (displayFilmSynopsis) {
      displayFilmSynopsis.textContent = movie.synopsis || "synopsis";
    }
  }

  /**
   * Afficher "aucun résultat"
   */
  function showNoResults(query) {
    if (!searchResultsDropdown) {
      searchResultsDropdown = document.getElementById("film-search-results");
    }

    if (!searchResultsDropdown) {
      console.error("Dropdown de résultats non trouvé pour aucun résultat");
      return;
    }

    searchResultsDropdown.innerHTML = `
      <div class="film-search-result-empty">
        <div class="film-result-content">
          <span class="film-result-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
            Aucun film trouvé pour "${escapeHtml(query)}"
          </span>
          <p class="film-result-help">
            Vous pouvez créer un nouveau film en remplissant le formulaire ci-dessous.
          </p>
        </div>
      </div>
    `;
    searchResultsDropdown.classList.add("active");
  }

  /**
   * Afficher le chargement
   */
  function showLoading() {
    if (!searchResultsDropdown) {
      searchResultsDropdown = document.getElementById("film-search-results");
    }

    if (!searchResultsDropdown) {
      console.error("Dropdown de résultats non trouvé pour le chargement");
      return;
    }

    searchResultsDropdown.innerHTML = `
      <div class="film-search-result-loading">
        <div class="film-result-content">
          <i class="lucide-icon lucide-spin"></i>
          <span>Recherche en cours...</span>
        </div>
      </div>
    `;
    searchResultsDropdown.classList.add("active");
  }

  /**
   * Afficher une erreur
   */
  function showError(message) {
    if (!searchResultsDropdown) {
      searchResultsDropdown = document.getElementById("film-search-results");
    }

    if (!searchResultsDropdown) {
      console.error("Dropdown de résultats non trouvé pour l'erreur");
      return;
    }

    searchResultsDropdown.innerHTML = `
      <div class="film-search-result-error">
        <div class="film-result-content">
          <i class="lucide-icon"></i>
          <span>${escapeHtml(message)}</span>
        </div>
      </div>
    `;
    searchResultsDropdown.classList.add("active");
  }

  /**
   * Effacer les résultats
   */
  function clearResults() {
    if (!searchResultsDropdown) {
      searchResultsDropdown = document.getElementById("film-search-results");
    }

    if (searchResultsDropdown) {
      searchResultsDropdown.innerHTML = "";
      searchResultsDropdown.classList.remove("active");
    }
  }

  /**
   * Gestion du focus
   */
  function handleFilmNameFocus() {
    if (!filmNameInput) return;
    const query = filmNameInput.value.trim();
    if (query.length >= MIN_SEARCH_LENGTH) {
      performSearch(query);
    }
  }

  /**
   * Gestion du blur (fermeture du dropdown avec délai)
   */
  function handleFilmNameBlur() {
    // Délai pour permettre le clic sur un résultat
    setTimeout(() => {
      if (!isSelectingFromDropdown) {
        clearResults();
      }
    }, 200);
  }

  /**
   * Navigation clavier
   */
  function handleKeyDown(event) {
    const dropdown = document.getElementById("film-search-results");
    if (!dropdown || !dropdown.classList.contains("active")) return;

    const items = dropdown.querySelectorAll(".film-search-result-item");
    if (items.length === 0) return;

    // Navigation avec les flèches (à implémenter si nécessaire)
    if (event.key === "Escape") {
      clearResults();
      filmNameInput.focus();
    }
  }

  /**
   * Clic en dehors du dropdown
   */
  function handleClickOutside(event) {
    if (!searchResultsDropdown) {
      searchResultsDropdown = document.getElementById("film-search-results");
    }

    if (!searchResultsDropdown || !filmNameInput) return;

    if (
      !searchResultsDropdown.contains(event.target) &&
      !filmNameInput.contains(event.target)
    ) {
      clearResults();
    }
  }

  /**
   * Définir un champ hidden
   */
  function setHiddenInput(name, value) {
    // Supprimer l'ancien champ s'il existe
    const existing = document.querySelector(`input[name="${name}"]`);
    if (existing && existing.type === "hidden") {
      existing.remove();
    }

    // Créer le nouveau champ
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;

    // Ajouter au formulaire unifié (s'il existe) ou au formulaire du film
    const unifiedForm = document.getElementById("unified-form");
    if (unifiedForm) {
      // Mettre à jour ou créer le champ dans le formulaire unifié
      const existingInUnified = unifiedForm.querySelector(
        `input[name="${name}"]`
      );
      if (existingInUnified) {
        existingInUnified.value = value;
      } else {
        const inputClone = input.cloneNode(true);
        unifiedForm.appendChild(inputClone);
      }
    }

    // Ajouter aussi au formulaire du film (pour compatibilité)
    const form = filmNameInput.closest("form");
    if (form) {
      form.appendChild(input);
    }
  }

  /**
   * Supprimer le champ hidden
   */
  function clearHiddenInput() {
    const existing = document.querySelector('input[name="filmId"]');
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Échapper le HTML pour la sécurité XSS
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialisation au chargement du DOM
  // Le script utilise defer, donc le DOM est déjà chargé
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(init, 100); // Petit délai pour s'assurer que tout est prêt
    });
  } else {
    // DOM déjà chargé, attendre un peu pour s'assurer que les éléments sont disponibles
    setTimeout(init, 100);
  }
})();
