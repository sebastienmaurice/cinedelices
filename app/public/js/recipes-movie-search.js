/**
 * recipes-movie-search.js — Page /recipes-movie/ (all-recipes.ejs)
 * ─────────────────────────────────────────────────────────────────────
 * Recherche live combinée : recettes ET films, dans un seul dropdown.
 * Avant : simple formulaire GET, aucune suggestion pendant la frappe.
 * Interroge en parallèle /recipes-movie/search-advanced (nouveau) et
 * /movies/search-advanced (déjà existant, movie-search-advanced.js) —
 * aucune logique de recherche dupliquée côté films, juste réutilisée.
 * Mêmes classes CSS que le dropdown de /movies (.search-result-card...,
 * movies.css, déjà chargé sur cette page) pour un rendu cohérent.
 *
 * Le formulaire GET existant (submit → /recipes-movie/?q=...) reste
 * fonctionnel tel quel : ce script ne fait qu'ajouter la prévisualisation
 * live, il n'empêche jamais la soumission classique (Entrée sur le
 * bouton, ou aucun JS disponible).
 */
(function () {
  "use strict";

  const MIN_SEARCH_LENGTH = 2;
  const RECIPES_ENDPOINT = "/recipes-movie/search-advanced";
  const MOVIES_ENDPOINT = "/movies/search-advanced";
  const DEBOUNCE_MS = 350;

  const searchInput = document.getElementById("ar-search-input");
  const searchResults = document.getElementById("ar-search-results");

  if (!searchInput || !searchResults) return;

  let debounceTimer = null;
  let abortController = null;

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function truncate(text, max) {
    if (!text) return "";
    return text.length <= max ? text : text.substring(0, max - 3) + "...";
  }

  /**
   * "Portail" du dropdown directement dans <body>. Indispensable pour que
   * position:fixed soit réellement relatif au viewport : .page-hero__search-col
   * porte une animation d'entrée (fadeUp) qui laisse un transform actif
   * (même une matrice identité) une fois terminée — et tout transform != none
   * sur un ancêtre transforme le point de référence de position:fixed en
   * CE conteneur au lieu du viewport (règle CSS peu connue mais réelle).
   * C'est très probablement aussi la cause du bug de rendu initial en
   * position:absolute (le dropdown était piégé dans un contexte
   * d'empilement local imprévu). Sortir l'élément du DOM de cette zone
   * élimine le problème à la racine plutôt que de le contourner.
   */
  function ensurePortaled() {
    if (searchResults.parentElement !== document.body) {
      document.body.appendChild(searchResults);
    }
  }

  /**
   * Recalcule top/left/width du dropdown en position:fixed (viewport),
   * à partir du champ de recherche.
   */
  function positionDropdown() {
    ensurePortaled();
    const rect = searchInput.getBoundingClientRect();
    searchResults.style.top = `${rect.bottom + 8}px`;
    searchResults.style.left = `${rect.left}px`;
    searchResults.style.right = "auto";
    searchResults.style.width = `${rect.width}px`;
  }

  function showLoading() {
    positionDropdown();
    searchResults.innerHTML = `
      <div class="search-result-loading">
        <div class="search-result-loading-content">
          <span>Recherche en cours...</span>
        </div>
      </div>
    `;
    searchResults.classList.add("active");
  }

  function clearResults() {
    searchResults.innerHTML = "";
    searchResults.classList.remove("active");
  }

  function recipeCardHtml(recipe) {
    const posterUrl = recipe.picture || "/images/image-default-recipe-1.jpg";
    const sub = recipe.movieTitle ? escapeHtml(truncate(recipe.movieTitle, 40)) : escapeHtml(recipe.category || "");
    return `
      <div class="search-result-card is-local" role="option" aria-selected="false">
        <a href="/recipes-movie/details/${encodeURIComponent(recipe.slug || recipe.id)}" class="search-result-card-link">
          <div class="search-result-card-poster">
            <img src="${posterUrl}" alt="${escapeHtml(recipe.name)}" loading="lazy" width="60" height="90" />
          </div>
          <div class="search-result-card-content">
            <div class="search-result-card-header">
              <h4 class="search-result-card-title">
                <span class="search-result-card-title-text">${escapeHtml(recipe.name)}</span>
              </h4>
              <span class="search-result-card-type search-result-card-type--film">Recette</span>
            </div>
            <div class="search-result-card-meta">
              <span class="search-result-card-genre">${sub}</span>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  function movieCardHtml(movie) {
    const posterUrl = movie.poster || "/images/movie-default-img.png";
    const isLocal = movie.isLocal === true;
    const movieLink =
      isLocal && movie.id
        ? `/add-recipes-movies/${movie.id}`
        : `/add-recipes-movies/?tmdb_id=${movie.tmdb_id || ""}` +
          `&title=${encodeURIComponent(movie.title_fr || movie.title || "")}` +
          `${movie.year ? `&year=${movie.year}` : ""}` +
          `${movie.genre ? `&genre=${encodeURIComponent(movie.genre)}` : ""}` +
          `${movie.type ? `&type=${encodeURIComponent(movie.type)}` : ""}`;
    const localBadge = isLocal ? `<span class="search-result-card-badge">Ciné Délices</span>` : "";
    const typeBadge =
      movie.type === "serie"
        ? `<span class="search-result-card-type search-result-card-type--serie">Série</span>`
        : `<span class="search-result-card-type search-result-card-type--film">Film</span>`;
    return `
      <div class="search-result-card${isLocal ? " is-local" : ""}" role="option" aria-selected="false">
        <a href="${movieLink}" class="search-result-card-link">
          <div class="search-result-card-poster">
            <img src="${posterUrl}" alt="${escapeHtml(movie.title_fr || movie.title)}" loading="lazy" width="60" height="90" />
          </div>
          <div class="search-result-card-content">
            <div class="search-result-card-header">
              <h4 class="search-result-card-title">
                <span class="search-result-card-title-text">${escapeHtml(movie.title_fr || movie.title)}</span>
                ${localBadge}
              </h4>
              ${typeBadge}
            </div>
            <div class="search-result-card-meta">
              <span class="search-result-card-year">${movie.year || "N/A"}</span>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  function sectionLabelHtml(text) {
    return `<p style="margin:10px 12px 4px;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(232,232,232,.45);">${text}</p>`;
  }

  function emptyStateHtml(query) {
    return `
      <div class="search-result-empty">
        <div class="search-result-empty-content">
          <p class="search-result-empty-message">
            &ldquo;${escapeHtml(query)}&rdquo; ne correspond à aucune recette ni aucun film sur Ciné Délices
          </p>
          <a href="/add-recipes-movies/?query=${encodeURIComponent(query)}" class="btn btn--primary btn-sm">
            Ajoutez ce film !
          </a>
        </div>
      </div>
    `;
  }

  function render(query, recipes, movies) {
    if (recipes.length === 0 && movies.length === 0) {
      searchResults.innerHTML = emptyStateHtml(query);
      searchResults.classList.add("active");
      return;
    }

    let html = "";
    if (recipes.length > 0) {
      html += sectionLabelHtml("Recettes");
      html += recipes.map(recipeCardHtml).join("");
    }
    if (movies.length > 0) {
      html += sectionLabelHtml("Films");
      html += movies.map(movieCardHtml).join("");
    }
    searchResults.innerHTML = html;
    searchResults.classList.add("active");
  }

  async function performSearch(query) {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    showLoading();

    try {
      const [recipesRes, moviesRes] = await Promise.all([
        fetch(`${RECIPES_ENDPOINT}?query=${encodeURIComponent(query)}`, { signal: controller.signal }),
        fetch(`${MOVIES_ENDPOINT}?query=${encodeURIComponent(query)}`, { signal: controller.signal }),
      ]);
      const [recipesData, moviesData] = await Promise.all([recipesRes.json(), moviesRes.json()]);

      render(query, recipesData.results || [], moviesData.results || []);
    } catch (err) {
      if (err.name === "AbortError") return; // requête suivante déjà en vol, ignorée sciemment
      clearResults();
    }
  }

  function handleInput(event) {
    const query = event.target.value.trim();

    if (debounceTimer) clearTimeout(debounceTimer);

    if (query.length < MIN_SEARCH_LENGTH) {
      clearResults();
      return;
    }

    debounceTimer = setTimeout(() => performSearch(query), DEBOUNCE_MS);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      clearResults();
      searchInput.blur();
    }
  }

  function handleFocus() {
    const query = searchInput.value.trim();
    if (query.length >= MIN_SEARCH_LENGTH && searchResults.innerHTML.trim()) {
      searchResults.classList.add("active");
    }
  }

  function handleClickOutside(event) {
    if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
      searchResults.classList.remove("active");
    }
  }

  function handleReposition() {
    if (searchResults.classList.contains("active")) positionDropdown();
  }

  searchInput.addEventListener("input", handleInput);
  searchInput.addEventListener("keydown", handleKeyDown);
  searchInput.addEventListener("focus", handleFocus);
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("resize", handleReposition);
  window.addEventListener("scroll", handleReposition, { passive: true });
})();
