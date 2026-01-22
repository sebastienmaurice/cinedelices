# Documentation Complète - Fonctionnalités Ajoutées Aujourd'hui

## 📋 Table des Matières

1. [APIs Ajoutées](#apis-ajoutées)
2. [Page /movies - Recherche Avancée](#page-movies-recherche-avancée)
3. [Page /add-recipes-movies - Validation Intelligente TMDB](#page-add-recipes-movies-validation-intelligente-tmdb)
4. [Admin - Validation des Films](#admin-validation-des-films)
5. [Exemples de Code Commentés](#exemples-de-code-commentés)

---

## APIs Ajoutées

### 1. API TMDB - Recherche de Films

**Route :** `GET /api/tmdb/search?query=titre`

**Fichier :** `app/controllers/tmdb.controllers.js`

**Fonctionnalités :**

- Recherche de films via l'API The Movie Database
- Extraction de mots-clés pour tolérer les fautes
- Recherche avec variantes si aucun résultat
- Mappage des genres TMDB vers nos genres
- Retourne jusqu'à 5 suggestions avec miniatures

**Code commenté :**

```javascript
/**
 * Rechercher un film sur TMDB
 * GET /api/tmdb/search?query=titre
 */
async function searchMovie(req, res) {
  try {
    const { query } = req.query;

    // Vérifier que la clé API est configurée
    if (!TMDB_API_KEY) {
      console.error("❌ TMDB_API_KEY non configurée dans .env");
      return res.status(500).json({
        success: false,
        error: "Configuration API manquante",
      });
    }

    // Extraire les mots-clés pour améliorer la recherche
    // Exemple : "harry Poster et sa ceheveux" → ["harry", "poster"]
    const searchTerms = extractKeywords(query.trim());

    // 1. Première tentative : recherche avec la query originale
    let searchUrl = `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(
      query.trim()
    )}`;
    let response = await fetch(searchUrl);
    let data = await response.json();

    // 2. Si aucun résultat, essayer avec les mots-clés extraits
    if (!data.results || data.results.length === 0) {
      if (searchTerms.length > 0) {
        const keywordsQuery = searchTerms.join(" ");
        // Exemple : "harry poster" au lieu de "harry Poster et sa ceheveux"
        searchUrl = `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(
          keywordsQuery
        )}`;
        response = await fetch(searchUrl);

        if (response.ok) {
          const keywordsData = await response.json();
          if (keywordsData.results && keywordsData.results.length > 0) {
            data = keywordsData;
          }
        }
      }
    }

    // 3. Si toujours aucun résultat, essayer avec le premier mot-clé
    // Exemple : "harry" pour trouver "Harry Potter"
    if (
      (!data.results || data.results.length === 0) &&
      searchTerms.length > 0
    ) {
      const firstKeyword = searchTerms[0];
      if (firstKeyword.length >= 3) {
        searchUrl = `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(
          firstKeyword
        )}`;
        response = await fetch(searchUrl);

        if (response.ok) {
          const singleKeywordData = await response.json();
          if (
            singleKeywordData.results &&
            singleKeywordData.results.length > 0
          ) {
            data = singleKeywordData;
          }
        }
      }
    }

    // Formater les résultats (jusqu'à 5)
    const maxResults = Math.min(data.results.length, 5);
    const formattedMovies = [];

    // Mapper les genres TMDB (IDs) vers nos genres (noms)
    const genreMap = {
      28: "action",
      12: "aventure",
      // ... etc
    };

    for (let i = 0; i < maxResults; i++) {
      const result = data.results[i];

      // Récupérer le premier genre ID du film
      const genreId =
        result.genre_ids && result.genre_ids.length > 0
          ? result.genre_ids[0]
          : null;

      // Convertir l'ID en nom de genre
      const genre = genreId && genreMap[genreId] ? genreMap[genreId] : "autre";

      formattedMovies.push({
        tmdb_id: result.id, // ID unique TMDB
        title: result.title, // Titre français
        original_title: result.original_title,
        year: result.release_date
          ? new Date(result.release_date).getFullYear()
          : null,
        genre: genre, // Genre mappé
        overview: result.overview || "",
        poster_path: result.poster_path
          ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
          : null, // URL complète de l'affiche
        release_date: result.release_date || null,
      });
    }

    // Retourner les suggestions
    return res.json({
      success: true,
      hasResults: true,
      movie: formattedMovies[0], // Premier résultat (le plus pertinent)
      suggestions: formattedMovies, // Tous les résultats (jusqu'à 5)
    });
  } catch (error) {
    console.error("❌ Erreur lors de la recherche TMDB:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la recherche",
      message: error.message,
    });
  }
}
```

**Fonction d'extraction de mots-clés :**

```javascript
/**
 * Extraire les mots-clés d'une recherche pour améliorer la tolérance aux fautes
 * Retire les articles et mots communs
 *
 * @param {string} query - La requête de recherche
 * @returns {string[]} - Tableau de mots-clés filtrés
 *
 * @example
 * extractKeywords("harry Poster et sa ceheveux")
 * // Retourne: ["harry", "poster", "ceheveux"]
 */
function extractKeywords(query) {
  // Liste des mots à ignorer (articles, prépositions)
  const stopWords = [
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "de",
    "du",
    "et",
    "ou",
    "sa",
    "son",
    "ses",
    "à",
    "au",
    "aux",
    "avec",
    "pour",
    "dans",
  ];

  // 1. Séparer la query en mots
  // 2. Convertir en minuscules
  // 3. Retirer la ponctuation (garder seulement lettres et accents)
  // 4. Filtrer : garder seulement les mots de plus de 2 caractères et qui ne sont pas dans stopWords
  const words = query
    .toLowerCase()
    .split(/\s+/) // Séparer par espaces
    .map((word) => word.replace(/[^\w\u00C0-\u017F]/g, "")) // Retirer ponctuation
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  return words;
}
```

---

### 2. API Recherche Locale - Films de la BDD

**Route :** `GET /movies/api/search?query=titre`

**Fichier :** `app/controllers/movies.controllers.js`

**Fonctionnalités :**

- Recherche dans la base de données locale
- Recherche par titre, genre, ou année
- Retourne uniquement les films validés (`status: true`)

**Code commenté :**

```javascript
/**
 * Recherche avancée de films dans la BDD locale
 * GET /movies/api/search?query=titre
 */
async searchMovies(req, res) {
  try {
    const { query } = req.query;

    // Si pas de query, retourner tous les films validés (limite 20)
    if (!query || query.trim() === "") {
      const allMovies = await Movie.findAll({
        where: { status: true },  // Uniquement les films validés par l'admin
        limit: 20,
        order: [["title", "ASC"]],
      });

      return res.json({
        success: true,
        movies: allMovies,
        hasResults: allMovies.length > 0,
      });
    }

    const searchTerm = query.trim();

    // Construire les conditions de recherche avec Op.or (recherche dans titre OU genre)
    const searchConditions = [
      // Recherche dans le titre (insensible à la casse, partielle)
      {
        title: {
          [Op.iLike]: `%${searchTerm}%`,  // % pour recherche partielle
        },
      },
      // Recherche par genre (insensible à la casse)
      {
        genre: {
          [Op.iLike]: `%${searchTerm}%`,
        },
      },
    ];

    // Si la query est un nombre, ajouter la recherche par année
    if (!isNaN(parseInt(searchTerm))) {
      searchConditions.push({
        year: parseInt(searchTerm),
      });
    }

    // Recherche avec Op.or : trouve si titre OU genre OU année correspond
    const movies = await Movie.findAll({
      where: {
        status: true,                    // Uniquement les films validés
        [Op.or]: searchConditions,       // Recherche dans titre OU genre OU année
      },
      limit: 20,
      order: [["title", "ASC"]],
    });

    return res.json({
      success: true,
      movies: movies,
      hasResults: movies.length > 0,
      query: searchTerm,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche de films:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche de films",
      error: error.message,
    });
  }
}
```

---

## Page /movies - Recherche Avancée

**Fichier :** `app/views/movies.ejs` + `app/public/js/movie-search.js`

**Fonctionnalités :**

- Barre de recherche avec debounce
- Autocomplétion avec dropdown
- Recherche par titre, année, genre
- Bouton "Recherche IA" préparé (désactivé)
- Bouton "Créer une fiche film" si aucun résultat

**Code commenté - Frontend :**

```javascript
/**
 * Script de recherche avancée pour la page /movies
 * Fichier: app/public/js/movie-search.js
 */

// Configuration
const DEBOUNCE_DELAY = 300; // Attendre 300ms après la dernière frappe
const API_ENDPOINT = "/movies/api/search";

/**
 * Fonction principale de recherche avec debounce
 */
function handleSearch() {
  const query = searchInput.value.trim();

  // Clear le timer précédent
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Si query vide, afficher tous les films
  if (query === "") {
    displayAllMovies();
    hideDropdown();
    return;
  }

  // Attendre DEBOUNCE_DELAY ms avant de faire la recherche
  // Si l'utilisateur continue à taper, le timer est reset
  debounceTimer = setTimeout(() => {
    searchMovies(query);
  }, DEBOUNCE_DELAY);
}

/**
 * Rechercher les films via l'API
 */
async function searchMovies(query) {
  try {
    showLoading();

    // Appel à l'API locale
    const response = await fetch(
      `${API_ENDPOINT}?query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (data.success && data.movies && data.movies.length > 0) {
      // Afficher les résultats dans le dropdown
      displayResults(data.movies);
    } else {
      // Aucun résultat : afficher message + bouton "Créer une fiche film"
      showNoResults(query);
    }
  } catch (error) {
    console.error("❌ Erreur recherche:", error);
    showError("Erreur de connexion");
  } finally {
    hideLoading();
  }
}

/**
 * Afficher les résultats dans le dropdown
 */
function displayResults(movies) {
  searchResultsDropdown.innerHTML = "";

  movies.forEach((movie) => {
    // Créer un élément de résultat cliquable
    const item = document.createElement("div");
    item.className = "movie-search-result-item";

    // Contenu : titre, année, genre
    item.innerHTML = `
      <span class="result-title">${escapeHtml(movie.title)}</span>
      <span class="result-meta">${movie.year} • ${escapeHtml(
      movie.genre
    )}</span>
    `;

    // Au clic, rediriger vers la page du film
    item.addEventListener("click", () => {
      window.location.href = `/recipes-movie/${movie.id}`;
    });

    searchResultsDropdown.appendChild(item);
  });

  // Afficher le dropdown
  searchResultsDropdown.classList.add("active");
}
```

---

## Page /add-recipes-movies - Validation Intelligente TMDB

**Fichier :** `app/public/js/tmdb-validator.js`

**Fonctionnalités principales :**

1. Recherche combinée (BDD locale + TMDB)
2. Dropdown avec miniatures
3. Priorisation des films locaux
4. Pré-remplissage automatique
5. Normalisation des titres pour déduplication

**Code commenté - Recherche Combinée :**

```javascript
/**
 * Rechercher un film (local + TMDB combinés)
 *
 * Cette fonction fait deux recherches en parallèle :
 * 1. Dans la BDD locale (films existants de Ciné Délices)
 * 2. Sur l'API TMDB (films du monde entier)
 *
 * Elle combine ensuite les résultats en priorisant les films locaux.
 */
async function searchMovie(query) {
  if (isSearching) return; // Éviter les recherches multiples simultanées

  isSearching = true;
  showLoading();

  try {
    console.log("🔍 Recherche combinée:", query);

    // 1. Recherche dans la BDD locale (films validés uniquement)
    const localResponse = await fetch(
      `/movies/api/search?query=${encodeURIComponent(query)}`
    );
    const localData = await localResponse.json();

    // 2. Recherche sur TMDB (en parallèle)
    const tmdbResponse = await fetch(
      `${API_ENDPOINT}?query=${encodeURIComponent(query)}`
    );
    const tmdbData = await tmdbResponse.json();

    // Masquer le dropdown de l'autocomplétion locale pour éviter confusion
    const localDropdown = document.getElementById("film-search-results");
    if (localDropdown) {
      localDropdown.style.display = "none";
      localDropdown.classList.remove("active");
    }

    // 3. Combiner les résultats
    const combinedSuggestions = [];

    // Ajouter les films locaux EN PREMIER (marqués comme "local")
    if (localData.success && localData.movies && localData.movies.length > 0) {
      localData.movies.forEach((movie) => {
        combinedSuggestions.push({
          ...movie,
          isLocal: true, // Marqueur pour les films de la BDD
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
        // Vérifier si le film existe déjà dans les résultats locaux
        // Utilise isSameMovie() pour comparer intelligemment (accents, espaces, etc.)
        const existsLocally = combinedSuggestions.some((localMovie) =>
          isSameMovie(localMovie, movie)
        );

        // Ne pas ajouter si le film existe déjà localement (évite doublon)
        if (!existsLocally) {
          combinedSuggestions.push({
            ...movie,
            isLocal: false, // Marqueur pour les films TMDB
            source: "tmdb",
          });
        }
      });
    }

    // Afficher les suggestions combinées
    if (combinedSuggestions.length > 0) {
      currentSuggestions = combinedSuggestions;
      displaySuggestions(combinedSuggestions);
    } else {
      hideSuggestions();
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Erreur recherche:", error);
    hideLoading();
    hideSuggestions();
  } finally {
    isSearching = false;
  }
}
```

**Code commenté - Normalisation et Déduplication :**

```javascript
/**
 * Normaliser un titre pour comparaison
 *
 * Retire les accents, normalise les espaces, retire la ponctuation
 *
 * @param {string} title - Le titre à normaliser
 * @returns {string} - Le titre normalisé
 *
 * @example
 * normalizeTitle("Harry Potter à l'école")
 * // Retourne: "harry potter a lecole"
 */
function normalizeTitle(title) {
  if (!title) return "";

  return title
    .toLowerCase() // Minuscules
    .normalize("NFD") // Décompose les accents
    .replace(/[\u0300-\u036f]/g, "") // Retire les accents
    .replace(/\s+/g, " ") // Normalise espaces multiples
    .replace(/[^\w\s]/g, "") // Retire ponctuation
    .trim();
}

/**
 * Comparer deux films pour détecter si c'est le même film
 *
 * Compare les titres normalisés et les années
 * Gère les variantes de titres (un titre peut contenir l'autre)
 *
 * @param {object} movie1 - Premier film à comparer
 * @param {object} movie2 - Deuxième film à comparer
 * @returns {boolean} - true si c'est le même film
 *
 * @example
 * isSameMovie(
 *   { title: "Indiana Jones", year: 1981 },
 *   { title: "Indiana Jones et les Aventuriers", year: 1981 }
 * )
 * // Retourne: true (titres similaires + même année)
 */
function isSameMovie(movie1, movie2) {
  // Normaliser les titres pour comparaison
  const title1 = normalizeTitle(movie1.title || movie1.original_title || "");
  const title2 = normalizeTitle(movie2.title || movie2.original_title || "");

  // 1. Comparaison exacte des titres normalisés
  if (title1 === title2) return true;

  // 2. Si les titres sont longs (> 5 caractères), vérifier si l'un contient l'autre
  // Cela gère les cas comme "Indiana Jones" vs "Indiana Jones et les Aventuriers..."
  if (title1.length > 5 && title2.length > 5) {
    if (title1.includes(title2) || title2.includes(title1)) {
      // Si un titre contient l'autre ET les années correspondent, c'est le même film
      if (movie1.year && movie2.year && movie1.year === movie2.year) {
        return true;
      }
    }
  }

  return false;
}
```

**Code commenté - Affichage avec Miniatures :**

```javascript
/**
 * Afficher les suggestions dans le dropdown
 *
 * Affiche les films locaux en premier, puis les suggestions TMDB
 * Chaque suggestion a une miniature (60x90px) pour identification visuelle
 */
function displaySuggestions(suggestions) {
  if (!tmdbSuggestionsDropdown) return;

  tmdbSuggestionsDropdown.innerHTML = "";

  // Séparer les films locaux et TMDB
  const localMovies = suggestions.filter((m) => m.isLocal);
  const tmdbMovies = suggestions.filter((m) => !m.isLocal);

  // 1. Films locaux EN PREMIER (avec badge "Ciné Délices")
  localMovies.forEach((movie, index) => {
    const item = createSuggestionItem(
      movie,
      index === 0 && tmdbMovies.length === 0 // Highlight si premier ET pas de TMDB
    );
    tmdbSuggestionsDropdown.appendChild(item);
  });

  // 2. Suggestions TMDB ensuite
  tmdbMovies.forEach((movie, index) => {
    const item = createSuggestionItem(
      movie,
      index === 0 && localMovies.length === 0 // Highlight si premier ET pas de locaux
    );
    tmdbSuggestionsDropdown.appendChild(item);
  });

  tmdbSuggestionsDropdown.style.display = "block";
  tmdbSuggestionsDropdown.classList.add("active");
}

/**
 * Créer un élément de suggestion avec miniature
 *
 * @param {object} movie - Objet film (local ou TMDB)
 * @param {boolean} isHighlighted - Si true, ajoute le style highlight
 * @returns {HTMLElement} - Élément DOM de la suggestion
 */
function createSuggestionItem(movie, isHighlighted = false) {
  const item = document.createElement("div");
  item.className = "tmdb-suggestion-item";

  // Ajouter la classe pour les films locaux (style vert)
  if (movie.isLocal) {
    item.classList.add("suggestion-local");
  }

  // Highlight sur la première suggestion (style doré)
  if (isHighlighted && !movie.isLocal) {
    item.classList.add("tmdb-suggestion-highlighted");
  }

  // Structure avec miniature + infos
  const suggestionContent = document.createElement("div");
  suggestionContent.className = "tmdb-suggestion-content";

  // MINIATURE (60x90px)
  // Pour films locaux : utiliser l'image de la BDD
  // Pour films TMDB : utiliser poster_path depuis l'API
  const posterUrl = movie.isLocal
    ? movie.picture
      ? movie.picture.startsWith("http")
        ? movie.picture
        : `/${movie.picture}` // Chemin relatif depuis public/
      : null
    : movie.poster_path; // URL complète depuis TMDB

  if (posterUrl) {
    const poster = document.createElement("img");
    poster.className = "tmdb-suggestion-poster";
    poster.src = posterUrl;
    poster.alt = movie.title || movie.original_title || "";
    poster.loading = "lazy"; // Chargement différé pour performance

    // Si l'image ne charge pas, la cacher automatiquement
    poster.onerror = function () {
      this.style.display = "none";
    };

    suggestionContent.appendChild(poster);
  }

  // INFORMATIONS DU FILM
  const movieInfo = document.createElement("div");
  movieInfo.className = "tmdb-suggestion-info";

  const title = document.createElement("span");
  title.className = "tmdb-suggestion-title";
  title.textContent = movie.title || movie.original_title || "";

  // Badge "Ciné Délices" pour les films locaux (vert)
  if (movie.isLocal) {
    const badge = document.createElement("span");
    badge.className = "tmdb-suggestion-badge";
    badge.textContent = "Ciné Délices";
    title.appendChild(badge);
  }

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

  // Événement clic : sélectionner le film
  item.addEventListener("click", () => selectMovie(movie));

  return item;
}
```

**Code commenté - Sélection et Pré-remplissage :**

```javascript
/**
 * Sélectionner un film depuis les suggestions
 *
 * Gère deux cas :
 * 1. Film local → utilise filmId existant (pas de création)
 * 2. Film TMDB → remplit champs cachés pour créer un nouveau film
 */
function selectMovie(movie) {
  isSelectingFromDropdown = true;

  // CAS 1 : Film local sélectionné
  if (movie.isLocal && movie.id) {
    const filmIdHidden = document.getElementById("filmId-hidden");
    if (filmIdHidden) {
      filmIdHidden.value = movie.id; // Utiliser l'ID du film existant
    }

    // Vider les champs cachés TMDB (pas nécessaire pour film local)
    if (tmdbIdHidden) tmdbIdHidden.value = "";
    if (titleFRHidden) titleFRHidden.value = "";
    if (tmdbYearHidden) tmdbYearHidden.value = "";
    if (tmdbGenreHidden) tmdbGenreHidden.value = "";
  }

  // Remplir les champs visibles du formulaire
  fillFormWithMovieData(movie);
  lastValidatedMovie = movie;

  // Fermer le dropdown
  hideSuggestions();

  // Focus sur le champ suivant (année)
  setTimeout(() => {
    isSelectingFromDropdown = false;
    if (filmYearInput) filmYearInput.focus();
  }, 100);
}

/**
 * Pré-remplir le formulaire avec les données du film
 *
 * @param {object} movie - Objet film (local ou TMDB)
 */
function fillFormWithMovieData(movie) {
  // 1. Titre : remplacer par le vrai titre français
  if (filmNameInput) {
    filmNameInput.value = movie.title || movie.original_title || "";
  }

  // 2. Année : pré-remplir
  if (filmYearInput && movie.year) {
    filmYearInput.value = movie.year;
  }

  // 3. Genre : pré-remplir (mapper pour films TMDB)
  if (filmGenreSelect && movie.genre) {
    if (!movie.isLocal) {
      // Pour films TMDB : mapper le genre vers nos genres
      const genreMap = {
        action: "action",
        aventure: "aventure",
        // ... etc
      };
      const mappedGenre =
        genreMap[movie.genre.toLowerCase()] || movie.genre.toLowerCase();

      if (filmGenreSelect.querySelector(`option[value="${mappedGenre}"]`)) {
        filmGenreSelect.value = mappedGenre;
      }
    } else {
      // Pour films locaux : utiliser directement le genre
      if (filmGenreSelect.querySelector(`option[value="${movie.genre}"]`)) {
        filmGenreSelect.value = movie.genre;
      }
    }
  }

  // 4. Si film local, ne pas remplir les champs TMDB
  if (movie.isLocal) {
    if (tmdbIdHidden) tmdbIdHidden.value = "";
    if (titleFRHidden) titleFRHidden.value = "";
    if (tmdbYearHidden) tmdbYearHidden.value = "";
    if (tmdbGenreHidden) tmdbGenreHidden.value = "";
    return;
  }

  // 5. Si film TMDB, remplir les champs cachés pour validation backend
  if (tmdbIdHidden) tmdbIdHidden.value = movie.tmdb_id || "";
  if (titleFRHidden) titleFRHidden.value = movie.title || "";
  if (tmdbYearHidden) tmdbYearHidden.value = movie.year || "";
  if (tmdbGenreHidden) tmdbGenreHidden.value = movie.genre || "";

  // 6. Vider le filmId si présent (on crée un nouveau film)
  const filmIdHidden = document.getElementById("filmId-hidden");
  if (filmIdHidden) {
    filmIdHidden.value = "";
  }
}
```

---

## Admin - Validation des Films

**Fichier :** `app/controllers/add-recipes-movies.controllers.js`

**Fonctionnalités :**

- Validation backend avec vérification `tmdb_id`
- Réutilisation des films existants si `tmdb_id` déjà présent
- Création avec `tmdb_id` pour éviter les doublons
- Transaction Sequelize pour atomicité

**Code commenté - Validation Backend :**

```javascript
/**
 * Créer un film et une recette dans une transaction
 *
 * POST /add-recipes-movies/movie-and-recipe
 *
 * Logique :
 * 1. Si filmId fourni → utiliser film existant
 * 2. Sinon → créer nouveau film (vérifier doublons par tmdb_id d'abord)
 * 3. Créer recette liée au film
 * 4. Rollback en cas d'erreur
 */
async function addMovieAndRecipe(req, res) {
  // Démarrer une transaction Sequelize pour atomicité
  const transaction = await sequelize.transaction();

  try {
    // 1. Récupérer les données du formulaire
    const {
      filmId, // ID du film existant (si sélectionné)
      title, // Titre du nouveau film
      year, // Année
      genre, // Genre
      tmdbId, // ID TMDB (pour validation)
      titleFR, // Titre français de TMDB
      // ... données recette
    } = req.body;

    let movie = null;
    let movieId = null;

    // 2. Gérer le film (existant ou nouveau)
    if (filmId) {
      // CAS A : Film existant sélectionné
      movie = await Movie.findByPk(parseInt(filmId), { transaction });
      if (!movie) {
        await transaction.rollback();
        return res.status(400).render("add-recipes-movies", {
          role: req.userRole,
          error: true,
          errorMessage: "Le film sélectionné n'existe pas.",
        });
      }
      movieId = movie.id;
    } else {
      // CAS B : Nouveau film à créer

      // 2.1. Vérifier les champs obligatoires
      if (!title || !year || !genre) {
        await transaction.rollback();
        return res.status(400).render("add-recipes-movies", {
          role: req.userRole,
          error: true,
          errorMessage:
            "Les informations du film sont obligatoires (titre, année, genre).",
        });
      }

      // 2.2. VALIDATION TMDB : Bloquer si aucun tmdbId (empêcher films fictifs)
      if (!tmdbId || tmdbId.trim() === "") {
        await transaction.rollback();
        return res.status(400).render("add-recipes-movies", {
          role: req.userRole,
          error: true,
          errorMessage:
            "Aucun film correspondant trouvé. Veuillez vérifier le titre du film.",
        });
      }

      // 2.3. Vérifier si un film avec ce tmdb_id existe déjà
      const existingMovieByTmdbId = await Movie.findOne({
        where: {
          tmdb_id: parseInt(tmdbId),
        },
        transaction,
      });

      if (existingMovieByTmdbId) {
        // Film avec ce tmdb_id existe déjà : réutiliser (évite doublon)
        movie = existingMovieByTmdbId;
        movieId = existingMovieByTmdbId.id;
      } else {
        // 2.4. Vérifier si un film similaire existe (détection doublons par titre/année)
        const existingMovie = await Movie.findOne({
          where: {
            title: {
              [Op.iLike]: (titleFR || title).trim(), // Utiliser titre FR si disponible
            },
            year: parseInt(year),
            status: false, // Seulement les films non validés
          },
          transaction,
        });

        if (existingMovie) {
          // Film similaire non validé trouvé : mettre à jour avec tmdb_id
          existingMovie.tmdb_id = parseInt(tmdbId);
          await existingMovie.save({ transaction });
          movie = existingMovie;
          movieId = existingMovie.id;
        } else {
          // 2.5. Créer le nouveau film avec tmdb_id
          movie = await Movie.create(
            {
              title: (titleFR || title).trim(), // Utiliser le titre FR de TMDB si disponible
              year: parseInt(year),
              genre: genre.trim(),
              tmdb_id: parseInt(tmdbId), // ID TMDB unique
              status: false, // En attente de validation admin
            },
            { transaction }
          );
          movieId = movie.id;
        }
      }
    }

    // 3. Créer la recette liée au film
    // ... (code création recette)

    // 4. Tout s'est bien passé : commit la transaction
    await transaction.commit();

    return res.render("add-recipes-movies", {
      role: req.userRole,
      success: true,
      successMessage:
        "✅ Votre recette a bien été soumise à Ciné Délices. Elle sera validée prochainement.",
    });
  } catch (error) {
    // 5. Erreur : rollback automatique
    await transaction.rollback();
    console.error("❌ Erreur création film + recette:", error);

    return res.status(500).render("add-recipes-movies", {
      role: req.userRole,
      error: true,
      errorMessage: "Une erreur est survenue. Veuillez réessayer.",
    });
  }
}
```

---

## Validation Frontend

**Fichier :** `app/public/js/unified-form-handler.js`

**Code commenté :**

```javascript
/**
 * Validation avant soumission du formulaire
 *
 * Vérifie :
 * 1. Qu'un film est sélectionné (filmId OU données film complètes)
 * 2. Pour nouveaux films : qu'un tmdbId est présent (validation TMDB)
 * 3. Que tous les champs de la recette sont remplis
 */
function validateUnifiedForm() {
  // Vérifier film
  const hasFilmId = filmIdHidden && filmIdHidden.value;
  const hasFilmData =
    filmTitleHidden &&
    filmTitleHidden.value.trim() &&
    filmYearHidden &&
    filmYearHidden.value.trim() &&
    filmGenreHidden &&
    filmGenreHidden.value.trim();

  // Si film existant sélectionné, validation OK pour le film
  if (hasFilmId) {
    // Film existant : pas besoin de vérifier tmdbId
    // On continue pour valider les champs de la recette
  } else {
    // Nouveau film : vérifier que les champs sont remplis
    if (!hasFilmData) {
      alert(
        "Veuillez sélectionner un film existant ou créer un nouveau film avant de soumettre la recette."
      );
      return false;
    }

    // Pour un nouveau film, vérifier qu'un tmdbId est présent (validation TMDB)
    const tmdbIdHidden = document.getElementById("tmdbId-hidden");

    if (
      !tmdbIdHidden ||
      !tmdbIdHidden.value ||
      tmdbIdHidden.value.trim() === ""
    ) {
      alert(
        "Aucun film correspondant trouvé sur TMDB. Veuillez sélectionner une suggestion ou corriger le titre du film."
      );
      filmNameInput?.focus();
      return false;
    }
  }

  // Vérifier les champs de la recette
  // ... (code validation recette)

  return true;
}
```

---

## Résumé des Fonctionnalités

### ✅ APIs Ajoutées

1. **GET /api/tmdb/search** - Recherche TMDB avec variantes intelligentes
2. **GET /movies/api/search** - Recherche locale (déjà existante, utilisée pour combinaison)

### ✅ Page /movies

- Barre de recherche avancée
- Autocomplétion avec dropdown
- Recherche par titre, année, genre

### ✅ Page /add-recipes-movies

- Validation intelligente TMDB
- Recherche combinée (local + TMDB)
- Miniatures dans suggestions
- Priorisation films locaux
- Pré-remplissage automatique
- Blocage uniquement à la soumission

### ✅ Admin

- Validation backend avec `tmdb_id`
- Réutilisation films existants
- Transaction Sequelize

---

## Page /movies - Recherche Avancée (Détails)

**Fichier :** `app/public/js/movie-search.js`

**Code commenté - Recherche avec Résultats :**

```javascript
/**
 * Affiche les résultats dans le dropdown
 *
 * @param {Array} movies - Liste des films trouvés
 * @param {boolean} hasResults - Si des résultats ont été trouvés
 * @param {string} query - La requête de recherche
 */
function displayResults(movies, hasResults, query) {
  searchResults.innerHTML = "";

  if (!hasResults || movies.length === 0) {
    // AUCUN RÉSULTAT : Afficher message + bouton "Créer une fiche film"
    searchResults.innerHTML = `
      <div class="search-result-item search-result-empty">
        <div class="search-result-content">
          <p class="search-result-message">
            <i class="fa-solid fa-film"></i>
            Aucun film trouvé pour "${escapeHtml(query)}"
          </p>
          <!-- Bouton pour créer un nouveau film -->
          <a href="/add-recipes-movies/" class="btn btn--gold btn-sm">
            <i class="fa-solid fa-plus"></i>
            Créer une fiche film
          </a>
        </div>
      </div>
    `;
  } else {
    // RÉSULTATS TROUVÉS : Afficher chaque film avec image
    movies.forEach((movie) => {
      const movieItem = createMovieResultItem(movie);
      searchResults.appendChild(movieItem);
    });
  }

  searchResults.classList.add("active");
}

/**
 * Crée un élément de résultat pour un film
 *
 * Chaque résultat affiche :
 * - L'image du film (carte)
 * - Le titre
 * - L'année et le genre
 *
 * @param {object} movie - Objet film depuis la BDD
 * @returns {HTMLElement} - Élément DOM du résultat
 */
function createMovieResultItem(movie) {
  const item = document.createElement("div");
  item.className = "search-result-item";
  item.setAttribute("data-movie-id", movie.id);

  // Image du film (avec fallback si absente)
  const pictureUrl = movie.picture || "/images/image-default-movie.jpg";

  // Structure HTML du résultat
  item.innerHTML = `
    <a href="/recipes-movie/${movie.id}" class="search-result-link">
      <div class="search-result-image">
        <img src="${pictureUrl}" alt="${movie.title}" loading="lazy" />
      </div>
      <div class="search-result-info">
        <h3 class="search-result-title">${escapeHtml(movie.title)}</h3>
        <p class="search-result-meta">
          ${movie.year} • ${escapeHtml(movie.genre)}
        </p>
      </div>
    </a>
  `;

  return item;
}
```

---

## Admin - Validation des Films et Recettes

**Fichier :** `app/controllers/admin.controllers.js`

**Fonctionnalités :**

- Affichage des films et recettes en attente de validation (`status: false`)
- Validation/refus par l'admin
- Gestion des uploads d'images

**Code commenté - Dashboard Admin :**

```javascript
/**
 * Page principale admin
 * GET /admin
 *
 * Affiche :
 * - Films en attente de validation (status: false)
 * - Recettes en attente de validation (status: false)
 * - Avis (notices)
 * - Utilisateurs
 */
async admin(req, res) {
  try {
    // Récupérer les recettes en attente de validation
    const recipes = await Recipe.findAll({
      where: { status: false },  // Seulement les non validées
    });

    // Récupérer les films en attente de validation
    const movies = await Movie.findAll({
      where: { status: false },  // Seulement les non validés
    });

    // Récupérer tous les avis
    const avis = await Notice.findAll();

    // Récupérer tous les utilisateurs
    const users = await User.findAll();

    // Rendre la vue admin avec toutes les données
    res.render("admin-dashboard", {
      recipes,      // Recettes à valider
      movies,       // Films à valider
      avis,         // Tous les avis
      users,        // Tous les utilisateurs
      success: req.query.success,  // Message de succès si présent
      role: req.userRole,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      error: "500",
      message: "Erreur serveur.",
      role: req.userRole,
    });
  }
}
```

**Code commenté - Validation d'un Film :**

```javascript
/**
 * Valider un film (passer status de false à true)
 *
 * POST /admin/movie/:id/validate
 *
 * Cette fonction :
 * 1. Récupère le film à valider
 * 2. Met à jour son status à true
 * 3. Gère l'upload de l'image si fournie
 */
async validateMovie(req, res) {
  try {
    const movieId = req.params.id;

    // Récupérer le film à valider
    const movie = await Movie.findByPk(movieId);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Film non trouvé",
      });
    }

    // Vérifier si une image est fournie (upload)
    if (req.file) {
      // L'image a été uploadée via Multer
      // Le chemin est dans req.file.path
      movie.picture = req.file.path.replace(/\\/g, "/").replace("app/public", "");

      // Journaliser l'upload réussi
      logUpload({
        type: IMAGE_TYPES.MOVIE_CARD,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      });
    }

    // Mettre à jour le status du film (validation)
    movie.status = true;
    await movie.save();

    // Rediriger vers la page admin avec message de succès
    res.redirect("/admin?success=movie-validated");
  } catch (error) {
    console.error("❌ Erreur validation film:", error);

    // Journaliser l'erreur
    if (req.file) {
      logUploadError({
        type: IMAGE_TYPES.MOVIE_CARD,
        filename: req.file?.filename,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de la validation du film",
    });
  }
}
```

---

## Exemples de Code Commentés - Workflow Complet

### Exemple 1 : Recherche "Indiana Jones"

**Flux complet commenté :**

```javascript
/**
 * EXEMPLE COMPLET : Recherche "Indiana Jones et les Aventuriers de l'Arche perdue"
 *
 * 1. UTILISATEUR TAPE : "Indiana Jones et les Aventuriers de l'Arche perdue"
 *
 * 2. DÉCLENCHEMENT (après 400ms de debounce) :
 *    - handleInput() → searchMovie("Indiana Jones...")
 *
 * 3. RECHERCHE COMBINÉE EN PARALLÈLE :
 *
 *    A. Recherche locale (BDD) :
 *       GET /movies/api/search?query=Indiana Jones...
 *       → Trouve : { id: 5, title: "Indiana Jones...", year: 1981, ... }
 *       → Marqué comme isLocal: true
 *
 *    B. Recherche TMDB :
 *       GET /api/tmdb/search?query=Indiana Jones...
 *       → Trouve plusieurs films "Indiana Jones"
 *       → Formate en suggestions avec poster_path
 *
 * 4. COMBINAISON ET DÉDUPLICATION :
 *
 *    combinedSuggestions = [
 *      // Film local EN PREMIER
 *      {
 *        id: 5,
 *        title: "Indiana Jones et les Aventuriers de l'Arche perdue",
 *        year: 1981,
 *        genre: "aventure",
 *        picture: "/images/movies/...",
 *        isLocal: true,        // ← Marqueur local
 *        source: "local"
 *      },
 *      // Films TMDB ensuite (si pas déjà présent localement)
 *      {
 *        tmdb_id: 85,
 *        title: "Indiana Jones et le Temple maudit",
 *        year: 1984,
 *        genre: "aventure",
 *        poster_path: "https://image.tmdb.org/...",
 *        isLocal: false,       // ← Marqueur TMDB
 *        source: "tmdb"
 *      },
 *      // ... autres suggestions TMDB
 *    ]
 *
 * 5. AFFICHAGE DANS LE DROPDOWN :
 *
 *    - Film local en PREMIER avec :
 *      * Badge vert "Ciné Délices"
 *      * Miniature depuis la BDD
 *      * Style vert (fond + bordure)
 *
 *    - Films TMDB ensuite avec :
 *      * Miniature depuis TMDB (poster_path)
 *      * Style normal
 *
 * 6. UTILISATEUR CLIQUE SUR LE FILM LOCAL :
 *
 *    - selectMovie(movie) est appelé
 *    - movie.isLocal = true → utilise filmId
 *    - filmIdHidden.value = 5 (ID du film existant)
 *    - Champs visibles pré-remplis (titre, année, genre)
 *    - Champs TMDB vidés (pas nécessaire)
 *
 * 7. UTILISATEUR REMPLIT LA RECETTE ET SOUMET :
 *
 *    - Validation frontend : filmId présent → OK
 *    - Soumission POST /add-recipes-movies/movie-and-recipe
 *    - Backend : filmId = 5 → utilise film existant
 *    - Crée uniquement la recette liée au film
 *    - Transaction commit → succès
 */
```

### Exemple 2 : Recherche "harry Poster et sa ceheveux" (avec fautes)

**Flux complet commenté :**

```javascript
/**
 * EXEMPLE COMPLET : Recherche avec fautes de frappe
 *
 * 1. UTILISATEUR TAPE : "harry Poster et sa ceheveux"
 *
 * 2. BACKEND - EXTRACTION DE MOTS-CLÉS :
 *
 *    extractKeywords("harry Poster et sa ceheveux")
 *    → Retire "et", "sa" (stopWords)
 *    → Résultat : ["harry", "poster", "ceheveux"]
 *
 * 3. BACKEND - RECHERCHE TMDB AVEC VARIANTES :
 *
 *    A. Première tentative : query originale
 *       GET /search/movie?query=harry Poster et sa ceheveux
 *       → Aucun résultat
 *
 *    B. Deuxième tentative : mots-clés
 *       GET /search/movie?query=harry poster
 *       → Trouve "Harry Potter" ! ✅
 *
 *    C. Si toujours rien : premier mot-clé
 *       GET /search/movie?query=harry
 *       → Trouve plusieurs "Harry Potter"
 *
 * 4. FRONTEND - AFFICHAGE DES SUGGESTIONS :
 *
 *    Dropdown avec :
 *    - ⭐ Harry Potter à l'école des sorciers (2001) • fantastique (highlighté)
 *    - Harry Potter et la Chambre des secrets (2002) • fantastique
 *    - ... (jusqu'à 5 suggestions)
 *
 * 5. UTILISATEUR CLIQUE SUR LA PREMIÈRE SUGGESTION :
 *
 *    - selectMovie(movie) est appelé
 *    - movie.isLocal = false (film TMDB)
 *    - filmIdHidden.value = "" (vide, on crée un nouveau film)
 *    - tmdbIdHidden.value = 671 (ID TMDB)
 *    - titleFRHidden.value = "Harry Potter à l'école des sorciers"
 *    - Champs visibles pré-remplis avec le titre corrigé
 *
 * 6. UTILISATEUR SOUMET LE FORMULAIRE :
 *
 *    - Validation frontend : tmdbId présent → OK
 *    - Backend : vérifie tmdb_id = 671
 *    - Si existe déjà → réutilise le film
 *    - Sinon → crée nouveau film avec tmdb_id = 671
 *    - Crée la recette liée
 */
```

---

## Architecture Complète

### Schéma de Flux de Données

```
UTILISATEUR
    │
    │ Tape dans "Nom du film"
    ↓
FRONTEND (tmdb-validator.js)
    │
    │ Debounce 400ms
    ↓
    ├─→ Recherche Locale (BDD)
    │   GET /movies/api/search
    │   → Films avec status: true
    │
    └─→ Recherche TMDB
        GET /api/tmdb/search
        → Backend (tmdb.controllers.js)
        → Extraction mots-clés
        → Variantes de recherche
        → Mapping genres
        → Suggestions (max 5)

COMBINAISON
    │
    ├─→ Films locaux (isLocal: true) EN PREMIER
    └─→ Films TMDB (isLocal: false) ensuite
    │
    ↓
DROPDOWN AFFICHÉ
    │
    ├─→ Miniatures (60x90px)
    ├─→ Badge "Ciné Délices" (films locaux)
    └─→ Highlight (première suggestion)
    │
    ↓
UTILISATEUR CLIQUE
    │
    ├─→ Film local → filmId rempli
    └─→ Film TMDB → tmdbId rempli
    │
    ↓
VALIDATION FRONTEND
    │
    ├─→ Film local : pas besoin tmdbId
    └─→ Film TMDB : vérifie tmdbId présent
    │
    ↓
SOUMISSION
    │
    ↓
BACKEND (add-recipes-movies.controllers.js)
    │
    ├─→ Transaction Sequelize démarrée
    ├─→ Si filmId : utilise film existant
    └─→ Sinon :
        ├─→ Vérifie tmdb_id existe déjà
        ├─→ Si oui : réutilise le film
        └─→ Sinon : crée avec tmdb_id
    │
    ├─→ Crée la recette (status: false)
    └─→ Commit transaction
    │
    ↓
ADMIN
    │
    └─→ Valide le film + recette
```

---

## Configuration Requise

### Variables d'Environnement

```env
# Clé API TMDB (obligatoire)
TMDB_API_KEY=votre_cle_api_tmdb

# URL de l'API TMDB (optionnel, valeur par défaut)
TMDB_API_URL=https://api.themoviedb.org/3
```

### Migration Base de Données

```sql
-- Ajouter le champ tmdb_id à la table movies
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER UNIQUE;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
```

---

## Points Importants

### Sécurité

- ✅ Route `/api/tmdb/search` protégée par authentification (`isLogged`)
- ✅ Validation côté serveur de tous les champs
- ✅ Protection XSS avec `escapeHtml()` sur le frontend
- ✅ Transaction Sequelize pour atomicité (rollback en cas d'erreur)

### Performance

- ✅ Debounce 400ms pour éviter trop d'appels API
- ✅ Chargement différé des images (`loading="lazy"`)
- ✅ Limite de 5 suggestions maximum
- ✅ Index sur `tmdb_id` pour recherches rapides

### UX

- ✅ Pas de blocage pendant la saisie
- ✅ Miniatures pour identification visuelle
- ✅ Badge "Ciné Délices" pour films locaux
- ✅ Messages clairs (succès/erreur)
- ✅ Blocage uniquement à la soumission si nécessaire

---

**Date** : Décembre 2025  
**Version** : 1.0  
**Auteur** : SEB le Fourbe

