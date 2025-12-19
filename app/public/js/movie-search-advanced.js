/**
 * Recherche avancée de films avec fuzzy search
 * Fonctionnalités :
 * - Debounce dynamique 200-600ms selon vitesse de frappe
 * - Dropdown avec mini-cartes (60x90px)
 * - Navigation clavier (↑ ↓ Enter Escape)
 * - Highlight des mots correspondants
 * - Pré-remplissage formulaire si aucun résultat
 * - Responsive mobile
 */

(function () {
  "use strict";

  // Configuration
  const MIN_SEARCH_LENGTH = 2;
  const MAX_RESULTS = 5;
  const API_ENDPOINT = "/movies/search-advanced";

  // Debounce dynamique
  const DEBOUNCE_FAST = 600; // Si l'utilisateur tape rapidement
  const DEBOUNCE_NORMAL = 400; // Vitesse normale
  const DEBOUNCE_SLOW = 200; // Si l'utilisateur tape lentement
  const KEY_INTERVAL_FAST = 100; // Seuil pour frappe rapide (ms)
  const KEY_INTERVAL_SLOW = 500; // Seuil pour frappe lente (ms)

  // Éléments DOM
  const searchInput = document.getElementById("search-movie");
  const searchResults = document.getElementById("search-results");
  const moviesList = document.getElementById("movies__list");
  const searchBoostButton = document.getElementById("search-boost-button");
  const searchInputWrapper = searchInput?.closest(".search-input-wrapper");

  // Variables d'état
  let debounceTimer = null;
  let lastKeyTime = Date.now();
  let currentSearchQuery = "";
  let isSearching = false;
  let currentResults = [];
  let selectedIndex = -1; // Pour la navigation clavier

  /**
   * Initialisation
   */
  function init() {
    if (!searchInput || !searchResults) {
      console.warn("⚠️ Éléments de recherche non trouvés");
      return;
    }

    // Événements sur l'input
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("keydown", handleKeyDown);
    searchInput.addEventListener("focus", handleSearchFocus);
    searchInput.addEventListener("blur", handleSearchBlur);

    // Fermer le dropdown si on clique en dehors
    document.addEventListener("click", handleClickOutside);

    console.log("✅ Recherche avancée initialisée");
  }

  /**
   * Gère la saisie dans le champ de recherche avec debounce dynamique
   */
  function handleSearchInput(event) {
    const query = event.target.value.trim();
    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTime;
    lastKeyTime = now;

    // Calculer le délai de debounce selon la vitesse de frappe
    let debounceDelay = DEBOUNCE_NORMAL;
    if (timeSinceLastKey < KEY_INTERVAL_FAST) {
      // Frappe rapide → debounce plus long
      debounceDelay = DEBOUNCE_FAST;
    } else if (timeSinceLastKey > KEY_INTERVAL_SLOW) {
      // Frappe lente → debounce plus court
      debounceDelay = DEBOUNCE_SLOW;
    }

    // Effacer le timer précédent
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Si la query est trop courte, vider les résultats
    if (query.length < MIN_SEARCH_LENGTH) {
      clearResults();
      if (query.length === 0) {
        loadAllMovies();
      } else {
        // Filtrer avec le terme partiel (afficher les films dont le titre commence par le terme)
        filterMoviesListPartial(query);
      }
      return;
    }

    // Débounce dynamique
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, debounceDelay);
  }

  /**
   * Gère la navigation au clavier
   */
  function handleKeyDown(event) {
    if (
      !searchResults.classList.contains("active") ||
      currentResults.length === 0
    ) {
      if (event.key === "Escape") {
        clearResults();
        searchInput.blur();
      }
      return;
    }

    const items = searchResults.querySelectorAll(".search-result-card");

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection(items);
        break;

      case "ArrowUp":
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection(items);
        break;

      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const link = items[selectedIndex].querySelector("a");
          if (link) {
            window.location.href = link.href;
          }
        }
        break;

      case "Escape":
        event.preventDefault();
        clearResults();
        searchInput.blur();
        break;
    }
  }

  /**
   * Met à jour la sélection visuelle pour la navigation clavier
   */
  function updateSelection(items) {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add("selected");
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else {
        item.classList.remove("selected");
      }
    });
  }

  /**
   * Gère le focus sur le champ de recherche
   */
  function handleSearchFocus() {
    if (
      currentSearchQuery.length >= MIN_SEARCH_LENGTH &&
      currentResults.length > 0
    ) {
      searchResults.classList.add("active");
    }
  }

  /**
   * Gère le blur (perte de focus) sur le champ de recherche
   */
  function handleSearchBlur() {
    // Délai pour permettre le clic sur les résultats
    setTimeout(() => {
      searchResults.classList.remove("active");
    }, 200);
  }

  /**
   * Gère les clics en dehors de la zone de recherche
   */
  function handleClickOutside(event) {
    if (
      !searchInput.contains(event.target) &&
      !searchResults.contains(event.target)
    ) {
      searchResults.classList.remove("active");
    }
  }

  /**
   * Effectue la recherche via l'API avancée
   */
  async function performSearch(query) {
    if (isSearching) return;

    currentSearchQuery = query;
    isSearching = true;
    selectedIndex = -1;
    showLoading();

    try {
      const response = await fetch(
        `${API_ENDPOINT}?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        currentResults = data.results || [];
        displayResults(data.results, data.hasResults, query);

        // Filtrer également la liste des films affichés dans #movies__list
        filterMoviesList(query, data.results || []);

        // Afficher message cache si applicable
        if (data.cached) {
          console.log("📦 Résultats depuis le cache");
        }
      } else {
        showError(data.message || "Erreur lors de la recherche");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      showError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      isSearching = false;
      hideLoading();
    }
  }

  /**
   * Affiche les résultats dans le dropdown avec mini-cartes
   */
  function displayResults(results, hasResults, query) {
    searchResults.innerHTML = "";

    if (!hasResults || !results || results.length === 0) {
      // Aucun résultat : proposer de créer une fiche film
      searchResults.innerHTML = `
        <div class="search-result-empty">
          <div class="search-result-empty-content">
            <p class="search-result-empty-message">
              <i class="fa-solid fa-film"></i>
              Aucun film trouvé pour "${escapeHtml(query)}"
            </p>
            <a href="/add-recipes-movies/?query=${encodeURIComponent(
              query
            )}" class="btn btn--gold btn-sm">
              <i class="fa-solid fa-plus"></i>
              Créer une fiche film
            </a>
          </div>
        </div>
      `;
      searchResults.classList.add("active");
      return;
    }

    // Afficher les films avec mini-cartes
    results.forEach((movie, index) => {
      const card = createMovieCard(movie, query);
      searchResults.appendChild(card);
    });

    searchResults.classList.add("active");
  }

  /**
   * Crée une mini-carte pour un film (60x90px)
   */
  function createMovieCard(movie, query) {
    const card = document.createElement("div");
    const isLocal = movie.isLocal === true;

    // Ajouter la classe is-local pour les films existants dans Ciné Délices
    card.className = isLocal
      ? "search-result-card is-local"
      : "search-result-card";
    card.setAttribute("data-movie-id", movie.id);
    card.setAttribute("role", "option");
    card.setAttribute("aria-selected", "false");

    // Poster (60x90px)
    const posterUrl = movie.poster || "/images/image-default-movie.jpg";

    // Highlight du titre avec les mots correspondants
    const highlightedTitle = highlightMatches(
      movie.title_fr || movie.title,
      query
    );

    // Mini synopsis (tronqué à 80 caractères)
    const overview = movie.overview ? truncateText(movie.overview, 80) : null;

    // Note (si disponible)
    const noteHtml = movie.note
      ? `<span class="search-result-note">
           <i class="fa-solid fa-star"></i>
           ${movie.note.toFixed(1)}
         </span>`
      : "";

    // Déterminer le lien : film local ou film TMDB à créer
    // Si film existant : rediriger vers add-recipes-movies avec l'ID pour pré-remplir et afficher l'image
    // Si nouveau film : rediriger vers add-recipes-movies avec les paramètres TMDB
    const movieLink =
      isLocal && movie.id
        ? `/add-recipes-movies/${movie.id}`
        : `/add-recipes-movies/?tmdb_id=${
            movie.tmdb_id || ""
          }&title=${encodeURIComponent(movie.title_fr || movie.title || "")}${
            movie.type ? `&type=${encodeURIComponent(movie.type)}` : ""
          }`;

    // Badge pour films locaux
    const localBadge = isLocal
      ? `<span class="search-result-card-badge">Ciné Délices</span>`
      : "";

    // Badge pour type (Film ou Série)
    const typeBadge =
      movie.type && movie.type === "serie"
        ? `<span class="search-result-card-type search-result-card-type--serie">Série</span>`
        : `<span class="search-result-card-type search-result-card-type--film">Film</span>`;

    card.innerHTML = `
      <a href="${movieLink}" class="search-result-card-link">
        <div class="search-result-card-poster">
          <img 
            src="${posterUrl}" 
            alt="${escapeHtml(movie.title_fr || movie.title)}" 
            loading="lazy"
            width="60"
            height="90"
          />
        </div>
        <div class="search-result-card-content">
          <div class="search-result-card-header">
            <h4 class="search-result-card-title">
              ${highlightedTitle}
              ${localBadge}
            </h4>
            ${typeBadge}
          </div>
          <div class="search-result-card-meta">
            <span class="search-result-card-year">${movie.year || "N/A"}</span>
            <span class="search-result-card-separator">•</span>
            <span class="search-result-card-genre">${escapeHtml(
              movie.genre || ""
            )}</span>
            ${noteHtml}
          </div>
          ${
            overview
              ? `<p class="search-result-card-overview">${escapeHtml(
                  overview
                )}</p>`
              : ""
          }
          ${
            movie.score !== undefined
              ? `<span class="search-result-card-score">Score: ${movie.score}%</span>`
              : ""
          }
        </div>
        <div class="search-result-card-arrow">
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      </a>
    `;

    return card;
  }

  /**
   * Met en évidence les mots correspondants dans un texte
   */
  function highlightMatches(text, query) {
    if (!text || !query) return escapeHtml(text);

    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const keywords = normalizedQuery
      .split(/\s+/)
      .filter((word) => word.length > 1);

    let highlighted = escapeHtml(text);

    keywords.forEach((keyword) => {
      // Rechercher le mot dans le texte (insensible à la casse)
      const regex = new RegExp(`(${escapeRegex(keyword)})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<mark class="search-result-highlight">$1</mark>'
      );
    });

    return highlighted;
  }

  /**
   * Tronque un texte à une longueur maximale
   */
  function truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  /**
   * Charge tous les films (quand le champ est vide)
   */
  async function loadAllMovies() {
    if (!moviesList) return;

    try {
      const response = await fetch("/movies/api/search");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.movies) {
          // Mettre à jour la liste des films (logique existante)
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des films:", error);
    }
  }

  /**
   * Affiche un état de chargement
   */
  function showLoading() {
    searchResults.innerHTML = `
      <div class="search-result-loading">
        <div class="search-result-loading-content">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>Recherche en cours...</span>
        </div>
      </div>
    `;
    searchResults.classList.add("active");
  }

  /**
   * Cache l'état de chargement
   */
  function hideLoading() {
    // Le chargement sera remplacé par les résultats
  }

  /**
   * Affiche une erreur
   */
  function showError(message) {
    searchResults.innerHTML = `
      <div class="search-result-error">
        <div class="search-result-error-content">
          <i class="fa-solid fa-exclamation-triangle"></i>
          <span>${escapeHtml(message)}</span>
        </div>
      </div>
    `;
    searchResults.classList.add("active");
  }

  /**
   * Efface les résultats
   */
  function clearResults() {
    searchResults.innerHTML = "";
    searchResults.classList.remove("active");
    currentSearchQuery = "";
    currentResults = [];
    selectedIndex = -1;
    // Restaurer l'affichage de tous les films
    if (moviesList) {
      const allArticles = moviesList.querySelectorAll("article");
      allArticles.forEach((article) => {
        article.style.display = "";
      });
    }
  }

  /**
   * Filtre la liste des films affichés dans #movies__list
   * Affiche uniquement les films correspondant aux résultats de recherche
   */
  function filterMoviesList(query, searchResults) {
    if (!moviesList) return;

    // Refactoring : utilisation de la fonction centralisée normalizeText
    const normalizeTextFn = window.normalizeText || ((t) => t?.toLowerCase().trim() || "");
    const normalizedQuery = normalizeTextFn(query);
    const articles = moviesList.querySelectorAll("article");

    articles.forEach((article) => {
      const titleElement = article.querySelector(".film-title");
      const genreElement = article.querySelector(".film-genre");

      if (!titleElement) return;

      const title = titleElement.textContent || "";
      const genre = genreElement ? genreElement.textContent || "" : "";

      // Normaliser les textes pour la recherche
      const normalizedTitle = normalizeTextFn(title);
      const normalizedGenre = normalizeTextFn(genre);

      // Vérifier si le film correspond aux résultats de recherche
      const isInSearchResults = searchResults.some((result) => {
        const resultTitle = normalizeTextFn(
          result.title_fr || result.title || ""
        );
        return (
          resultTitle === normalizedTitle || article.id === `film-${result.id}`
        );
      });

      // Vérifier si le titre ou le genre contient le terme de recherche
      const matchesQuery =
        normalizedTitle.includes(normalizedQuery) ||
        normalizedGenre.includes(normalizedQuery);

      // Afficher si le film est dans les résultats OU correspond au terme de recherche
      if (isInSearchResults || matchesQuery) {
        article.style.display = "";
      } else {
        article.style.display = "none";
      }
    });
  }

  /**
   * Filtre la liste des films avec un terme partiel
   * Affiche les films dont le titre commence par le terme saisi
   */
  function filterMoviesListPartial(query) {
    if (!moviesList) return;

    // Refactoring : utilisation de la fonction centralisée normalizeText
    const normalizeTextFn = window.normalizeText || ((t) => t?.toLowerCase().trim() || "");
    const normalizedQuery = normalizeTextFn(query);
    const articles = moviesList.querySelectorAll("article");

    articles.forEach((article) => {
      const titleElement = article.querySelector(".film-title");
      const genreElement = article.querySelector(".film-genre");

      if (!titleElement) {
        article.style.display = "none";
        return;
      }

      const title = titleElement.textContent || "";
      const genre = genreElement ? genreElement.textContent || "" : "";

      // Normaliser les textes pour la recherche
      const normalizedTitle = normalizeTextFn(title);
      const normalizedGenre = normalizeTextFn(genre);

      // Vérifier si le titre commence par le terme ou le contient
      const matchesQuery =
        normalizedTitle.startsWith(normalizedQuery) ||
        normalizedTitle.includes(normalizedQuery) ||
        normalizedGenre.includes(normalizedQuery);

      if (matchesQuery) {
        article.style.display = "";
      } else {
        article.style.display = "none";
      }
    });
  }

  // Refactoring : fonction normalizeTextForSearch() supprimée, maintenant centralisée dans
  // /js/utils/text-utils.js et exposée globalement (window.normalizeText)
  // Le script utils/text-utils.js doit être chargé avant ce fichier dans la vue

  /**
   * Échappe le HTML pour éviter les XSS
   */
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Échappe les caractères spéciaux pour les regex
   */
  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Gestion de l'état focus pour le bouton robot (amélioration visuelle)
  function initBoostButton() {
    if (!searchInput || !searchInputWrapper) return;

    searchInput.addEventListener("focus", () => {
      searchInputWrapper.classList.add("input-focused");
    });

    searchInput.addEventListener("blur", () => {
      searchInputWrapper.classList.remove("input-focused");
    });
  }

  // Initialisation au chargement du DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
      initBoostButton();
    });
  } else {
    init();
    initBoostButton();
  }
})();
