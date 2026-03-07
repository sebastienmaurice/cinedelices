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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>
              Aucun film trouvé pour "${escapeHtml(query)}"
            </p>
            <a href="/add-recipes-movies/?query=${encodeURIComponent(
              query
            )}" class="btn btn--primary btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
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
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
           ${movie.note.toFixed(1)}
         </span>`
      : "";

    // Déterminer le lien : film local ou film TMDB à créer
    // Si film existant : rediriger vers add-recipes-movies avec l'ID pour pré-remplir et afficher l'image
    // Si nouveau film : rediriger vers add-recipes-movies avec les paramètres TMDB
    // Lien vers la page d'ajout :
    // - Film existant (isLocal) → /add-recipes-movies/:id (pré-remplissage côté serveur)
    // - Film TMDB (nouveau) → /add-recipes-movies/?tmdb_id=...&title=...&year=...&genre=...&type=...
    //   Les query params permettent un pré-remplissage instantané du formulaire côté client
    const movieLink =
      isLocal && movie.id
        ? `/add-recipes-movies/${movie.id}`
        : `/add-recipes-movies/?tmdb_id=${movie.tmdb_id || ""}` +
          `&title=${encodeURIComponent(movie.title_fr || movie.title || "")}` +
          `${movie.year ? `&year=${movie.year}` : ""}` +
          `${movie.genre ? `&genre=${encodeURIComponent(movie.genre)}` : ""}` +
          `${movie.type ? `&type=${encodeURIComponent(movie.type)}` : ""}`;

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
              <span class="search-result-card-title-text">
                ${highlightedTitle}
              </span>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="m9 18 6-6-6-6"/></svg>
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
    let hasHighlighted = false;

    keywords.forEach((keyword) => {
      if (hasHighlighted) return;
      // Rechercher le mot dans le texte (insensible à la casse)
      const regex = new RegExp(`(${escapeRegex(keyword)})`, "i");
      if (regex.test(highlighted)) {
        highlighted = highlighted.replace(
          regex,
          '<mark class="search-result-highlight">$1</mark>'
        );
        hasHighlighted = true;
      }
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
    removeInjectCard();
    moviesList.querySelectorAll("article.fcard").forEach((a) => (a.style.display = ""));
  }

  /**
   * Affiche un état de chargement
   */
  function showLoading() {
    searchResults.innerHTML = `
      <div class="search-result-loading">
        <div class="search-result-loading-content">
          <i class="lucide-icon lucide-spin"></i>
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
          <i class="lucide-icon"></i>
          <span>${escapeHtml(message)}</span>
        </div>
      </div>
    `;
    searchResults.classList.add("active");
  }

  /**
   * Efface les résultats et restaure la grille
   */
  function clearResults() {
    searchResults.innerHTML = "";
    searchResults.classList.remove("active");
    currentSearchQuery = "";
    currentResults = [];
    selectedIndex = -1;
    removeInjectCard();
    if (moviesList) {
      moviesList.querySelectorAll("article").forEach((a) => (a.style.display = ""));
    }
  }

  /**
   * Supprime la carte "film non disponible" injectée dans la grille
   */
  function removeInjectCard() {
    if (!moviesList) return;
    const existing = moviesList.querySelector(".add-film-card-inject");
    if (existing) existing.remove();
  }

  /**
   * Injecte une carte "Proposer ce film" dans la grille quand aucun film local ne correspond
   * @param {string} query - terme saisi
   * @param {Array} apiResults - résultats TMDB (pour récupérer le meilleur candidat)
   */
  function injectAddFilmCard(query, apiResults) {
    removeInjectCard();
    if (!moviesList) return;

    // Premier résultat non-local (TMDB)
    const tmdb = (apiResults || []).find((r) => !r.isLocal);

    const filmTitle = tmdb ? (tmdb.title_fr || tmdb.title || query) : query;
    const posterImg = tmdb && tmdb.poster
      ? `<img src="${escapeHtml(tmdb.poster)}" alt="" loading="lazy" />`
      : "";

    const addUrl = tmdb
      ? `/add-recipes-movies/?tmdb_id=${encodeURIComponent(tmdb.tmdb_id || "")}&title=${encodeURIComponent(filmTitle)}&year=${tmdb.year || ""}&genre=${encodeURIComponent(tmdb.genre || "")}&type=${encodeURIComponent(tmdb.type || "film")}`
      : `/add-recipes-movies/?query=${encodeURIComponent(query)}`;

    const card = document.createElement("div");
    card.className = "add-film-card-inject";
    card.innerHTML = `
      <a href="${addUrl}" class="add-film-card-inject-inner">
        <div class="add-film-card-inject-poster">${posterImg}</div>
        <div class="add-film-card-inject-body">
          <p class="add-film-card-inject-hint">Film non disponible dans Ciné Délices</p>
          <h3 class="add-film-card-inject-title">${escapeHtml(filmTitle)}</h3>
          <span class="add-film-card-inject-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Proposer ce film
          </span>
        </div>
      </a>
    `;
    moviesList.appendChild(card);
  }

  /**
   * Filtre la liste des films affichés dans #movies__list
   * Affiche uniquement les films correspondant aux résultats de recherche
   */
  function filterMoviesList(query, apiResults) {
    if (!moviesList) return;

    const normalizeTextFn = window.normalizeText || ((t) => t?.toLowerCase().trim() || "");
    const normalizedQuery = normalizeTextFn(query);
    const articles = moviesList.querySelectorAll("article.fcard");
    let visibleCount = 0;

    articles.forEach((article) => {
      const normalizedTitle = normalizeTextFn(article.dataset.title || "");
      const normalizedGenre = normalizeTextFn(article.dataset.genre || "");

      if (!normalizedTitle) { article.style.display = "none"; return; }

      const isInApiResults = (apiResults || []).some((result) => {
        const resultTitle = normalizeTextFn(result.title_fr || result.title || "");
        return resultTitle === normalizedTitle || article.id === `film-${result.id}`;
      });

      const matchesQuery =
        normalizedTitle.includes(normalizedQuery) ||
        normalizedGenre.includes(normalizedQuery);

      if (isInApiResults || matchesQuery) {
        article.style.display = "";
        visibleCount++;
      } else {
        article.style.display = "none";
      }
    });

    // Aucun film local trouvé → proposer d'ajouter le film
    if (visibleCount === 0) {
      injectAddFilmCard(query, apiResults);
    } else {
      removeInjectCard();
    }
  }

  /**
   * Filtre la liste des films avec un terme partiel (frappe en cours)
   */
  function filterMoviesListPartial(query) {
    if (!moviesList) return;

    const normalizeTextFn = window.normalizeText || ((t) => t?.toLowerCase().trim() || "");
    const normalizedQuery = normalizeTextFn(query);
    const articles = moviesList.querySelectorAll("article.fcard");
    let visibleCount = 0;

    articles.forEach((article) => {
      const normalizedTitle = normalizeTextFn(article.dataset.title || "");
      const normalizedGenre = normalizeTextFn(article.dataset.genre || "");

      if (!normalizedTitle) { article.style.display = "none"; return; }

      const matchesQuery =
        normalizedTitle.startsWith(normalizedQuery) ||
        normalizedTitle.includes(normalizedQuery) ||
        normalizedGenre.includes(normalizedQuery);

      if (matchesQuery) {
        article.style.display = "";
        visibleCount++;
      } else {
        article.style.display = "none";
      }
    });

    // Pour la frappe partielle, on n'injecte pas encore (attendre la recherche complète)
    if (visibleCount > 0) removeInjectCard();
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
