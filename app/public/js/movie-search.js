/**
 * Barre de recherche avancée pour les films
 * PHASE 4 - Ciné Délices
 *
 * Fonctionnalités :
 * - Recherche asynchrone avec debounce
 * - Autocomplétion avec dropdown
 * - Affichage des résultats en temps réel
 * - Bouton "Créer une fiche film" si aucun résultat
 */

(function () {
  "use strict";

  // Configuration
  const DEBOUNCE_DELAY = 300; // ms avant de lancer la recherche
  const MIN_SEARCH_LENGTH = 2; // Longueur minimale pour lancer une recherche
  const API_ENDPOINT = "/movies/api/search";

  // Éléments DOM
  const searchInput = document.getElementById("search-movie");
  const searchResults = document.getElementById("search-results");
  const moviesList = document.getElementById("movies__list");
  const aiButton = document.getElementById("search-ai-button");

  // Variables d'état
  let debounceTimer = null;
  let currentSearchQuery = "";
  let isSearching = false;

  /**
   * Initialisation
   */
  function init() {
    if (!searchInput || !searchResults) {
      console.warn("Éléments de recherche non trouvés");
      return;
    }

    // Événements sur l'input
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("focus", handleSearchFocus);
    searchInput.addEventListener("blur", handleSearchBlur);

    // Fermer le dropdown si on clique en dehors
    document.addEventListener("click", handleClickOutside);

    // Navigation clavier
    searchInput.addEventListener("keydown", handleKeyDown);

    // Préparer le bouton IA (non activé pour l'instant)
    if (aiButton) {
      aiButton.addEventListener("click", handleAISearch);
      console.log("🔮 Bouton Recherche IA préparé (non activé)");
    }
  }

  /**
   * Gère la saisie dans le champ de recherche avec debounce
   */
  function handleSearchInput(event) {
    const query = event.target.value.trim();

    // Effacer le timer précédent
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Si la query est trop courte, vider les résultats
    if (query.length < MIN_SEARCH_LENGTH) {
      clearResults();
      if (query.length === 0) {
        // Recharger tous les films si le champ est vide
        loadAllMovies();
      }
      return;
    }

    // Débounce : attendre avant de lancer la recherche
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_DELAY);
  }

  /**
   * Gère le focus sur le champ de recherche
   */
  function handleSearchFocus() {
    if (currentSearchQuery.length >= MIN_SEARCH_LENGTH) {
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
   * Gère la navigation au clavier
   */
  function handleKeyDown(event) {
    if (event.key === "Escape") {
      clearResults();
      searchInput.blur();
    }
  }

  /**
   * Effectue la recherche via l'API
   */
  async function performSearch(query) {
    if (isSearching) return;

    currentSearchQuery = query;
    isSearching = true;
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
        displayResults(data.movies, data.hasResults, query);
        updateMoviesList(data.movies);
      } else {
        showError(data.message || "Erreur lors de la recherche");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      showError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      isSearching = false;
    }
  }

  /**
   * Charge tous les films (quand le champ est vide)
   */
  async function loadAllMovies() {
    try {
      const response = await fetch(`${API_ENDPOINT}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.movies) {
          updateMoviesList(data.movies);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des films:", error);
    }
  }

  /**
   * Affiche les résultats dans le dropdown
   */
  function displayResults(movies, hasResults, query) {
    searchResults.innerHTML = "";

    if (!hasResults || movies.length === 0) {
      // Aucun résultat : proposer de créer une fiche film
      searchResults.innerHTML = `
        <div class="search-result-item search-result-empty">
          <div class="search-result-content">
            <p class="search-result-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>
              Aucun film trouvé pour "${query}"
            </p>
            <a href="/add-recipes-movies/" class="btn btn--primary btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Créer une fiche film
            </a>
          </div>
        </div>
      `;
    } else {
      // Afficher les films trouvés
      movies.forEach((movie) => {
        const movieItem = createMovieResultItem(movie);
        searchResults.appendChild(movieItem);
      });
    }

    searchResults.classList.add("active");
  }

  /**
   * Crée un élément de résultat pour un film
   */
  function createMovieResultItem(movie) {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.setAttribute("data-movie-id", movie.id);

    const pictureUrl = movie.picture || "/images/image-default-movie.jpg";

    item.innerHTML = `
      <a href="/recipes-movie/${movie.id}" class="search-result-link">
        <div class="search-result-image">
          <img src="${pictureUrl}" alt="${movie.title}" loading="lazy" />
        </div>
        <div class="search-result-content">
          <h4 class="search-result-title">${escapeHtml(movie.title)}</h4>
          <div class="search-result-meta">
            <span class="search-result-year">${movie.year}</span>
            <span class="search-result-separator">•</span>
            <span class="search-result-genre">${escapeHtml(movie.genre)}</span>
          </div>
        </div>
        <div class="search-result-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </a>
    `;

    return item;
  }

  /**
   * Met à jour la liste des films sur la page
   */
  function updateMoviesList(movies) {
    if (!moviesList) return;

    moviesList.innerHTML = "";

    if (movies.length === 0) {
      moviesList.innerHTML = `
        <p class="no-movies">Aucun film trouvé.</p>
      `;
      return;
    }

    movies.forEach((movie) => {
      const movieCard = createMovieCard(movie);
      moviesList.appendChild(movieCard);
    });

    // Réappliquer le système de "Voir moins/Voir plus" si nécessaire
    // (fonctionnalité existante avec more-views.js)
  }

  /**
   * Crée une carte de film pour la liste principale
   */
  function createMovieCard(movie) {
    const article = document.createElement("article");
    article.id = `film-${movie.id}`;
    article.className = "movie-card";

    const pictureUrl = movie.picture || "/images/image-default-movie.jpg";

    article.innerHTML = `
      <div class="film-card-image">
        <img
          src="${pictureUrl}"
          alt="Affiche du film ${escapeHtml(movie.title)}"
          loading="lazy"
        />
      </div>
      <div class="film-card-info">
        <h4 class="film-title">${escapeHtml(movie.title)}</h4>
        <div class="film-meta">
          <span class="film-year">${movie.year}</span>
          <span class="film-separator">•</span>
          <span class="film-genre">${escapeHtml(movie.genre)}</span>
        </div>
        <a class="btn btn--red" href="/recipes-movie/${movie.id}">
          Voir les recettes
        </a>
      </div>
    `;

    return article;
  }

  /**
   * Affiche un état de chargement
   */
  function showLoading() {
    searchResults.innerHTML = `
      <div class="search-result-item search-result-loading">
        <div class="search-result-content">
          <i class="lucide-icon lucide-spin"></i>
          <span>Recherche en cours...</span>
        </div>
      </div>
    `;
    searchResults.classList.add("active");
  }

  /**
   * Affiche une erreur
   */
  function showError(message) {
    searchResults.innerHTML = `
      <div class="search-result-item search-result-error">
        <div class="search-result-content">
          <i class="lucide-icon"></i>
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
  }

  /**
   * Gère le clic sur le bouton Recherche IA (préparé mais non activé)
   */
  function handleAISearch(event) {
    event.preventDefault();
    console.log("🔮 Recherche IA non encore activée");
    // TODO: Intégrer la recherche IA dans le futur
    alert("La recherche IA sera disponible prochainement !");
  }

  /**
   * Échappe le HTML pour éviter les XSS
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialisation au chargement du DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

