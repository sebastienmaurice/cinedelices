import { Recipe, Movie, Notice, User, Favorite, Rating } from "../models/index.model.js";
import { Op, fn, col } from "sequelize";
import {
  calculateRelevanceScore,
  sortByRelevance,
  exactMatch,
  normalizeText,
  similarityScore,
  extractKeywords,
} from "../utils/search-utils.js";
import searchCache from "../utils/search-cache.js";
import {
  enrichMoviesWithImagePaths,
  enrichMovieWithImagePaths,
} from "../utils/movie-image-helper.js";
import { renderServerError } from "../utils/error-handler.js";
import tmdbGenreMap from "../utils/tmdb-genre-map.js";
import "dotenv/config";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";

const getRecipeCountsByMovieIds = async (movieIds) => {
  if (!movieIds || movieIds.length === 0) return {};

  const recipeCounts = await Recipe.findAll({
    attributes: [
      "id_movie",
      [Recipe.sequelize.fn("COUNT", Recipe.sequelize.col("id")), "count"],
    ],
    where: {
      id_movie: {
        [Op.in]: movieIds,
      },
      status: "approved",
    },
    group: ["id_movie"],
  });

  return recipeCounts.reduce((acc, row) => {
    const movieId = row.get("id_movie");
    const count = parseInt(row.get("count"), 10) || 0;
    acc[movieId] = count;
    return acc;
  }, {});
};

const moviesController = {
  // Recherche avancée de films (API)
  async searchMovies(req, res) {
    try {
      const { query } = req.query;

      // Si pas de query ou query vide, retourner tous les films
      if (!query || query.trim() === "") {
        const allMovies = await Movie.findAll({
          where: { status: "approved" }, // Uniquement les films validés
          limit: 20, // Limiter les résultats
          order: [["title", "ASC"]],
        });

        // Enrichir les movies avec les chemins d'images
        const enrichedMovies = enrichMoviesWithImagePaths(allMovies);

        return res.json({
          success: true,
          movies: enrichedMovies,
          hasResults: enrichedMovies.length > 0,
        });
      }

      const searchTerm = query.trim();

      // Construire les conditions de recherche
      const searchConditions = [
        // Recherche dans le titre (insensible à la casse, partielle)
        {
          title: {
            [Op.iLike]: `%${searchTerm}%`,
          },
        },
        // Recherche par genre (insensible à la casse)
        {
          genre: {
            [Op.iLike]: `%${searchTerm}%`,
          },
        },
      ];

      // Ajouter la recherche par année si la query est un nombre
      if (!isNaN(parseInt(searchTerm))) {
        searchConditions.push({
          year: parseInt(searchTerm),
        });
      }

      // Recherche avancée : titre, année, genre
      const movies = await Movie.findAll({
        where: {
          status: "approved", // Uniquement les films validés
          [Op.or]: searchConditions,
        },
        limit: 20, // Limiter les résultats
        order: [["title", "ASC"]], // Ordre alphabétique simple
      });

      // Enrichir les movies avec les chemins d'images
      const enrichedMovies = enrichMoviesWithImagePaths(movies);

      return res.json({
        success: true,
        movies: enrichedMovies,
        hasResults: enrichedMovies.length > 0,
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
  },

  /**
   * Filtre les films par genre et affiche la page movies
   * GET /movies/:genre
   *
   * Processus :
   * 1. Récupère le genre depuis l'URL (ou "tous" si non spécifié)
   * 2. Charge tous les films ou filtre par genre
   * 3. Enrichit les films avec les chemins d'images (banner/card)
   * 4. Rend la vue avec les films filtrés
   */
  async filtredMovies(req, res) {
    try {
      const { genre } = req.params;

      // Charger tous les films ou filtrer par genre
      // Si genre est "all", "tous" ou non défini → charger tous les films
      const movies =
        !genre || genre === "all" || genre === "tous"
          ? await Movie.findAll({ where: { status: "approved" } })
          : await Movie.findAll({ where: { genre: genre, status: "approved" } });

      const recipeCountsByMovieId = await getRecipeCountsByMovieIds(
        movies.map((movie) => movie.id)
      );
      const moviesWithCounts = movies.map((movie) => {
        const plainMovie = movie.toJSON ? movie.toJSON() : movie;
        return {
          ...plainMovie,
          recipeCount: recipeCountsByMovieId[plainMovie.id] || 0,
        };
      });

      // Enrichir les films avec les chemins d'images (banner/card)
      const enrichedMovies = enrichMoviesWithImagePaths(moviesWithCounts);

      // Rendre la vue avec les films filtrés
      res.render("movies", {
        movies: enrichedMovies,
        selectedGenre: genre || "tous",
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
      });
    }
  },

  /**
   * Recherche avancée de films avec fuzzy search et enrichissement TMDB
   * GET /movies/search-advanced?query=...&genre=...&year=...
   */
  async searchMoviesAdvanced(req, res) {
    try {
      const { query, genre, year } = req.query;
      const filters = { genre, year };

      // Vérifier la longueur minimale
      if (!query || query.trim().length < 2) {
        return res.json({
          success: true,
          results: [],
          hasResults: false,
          message: "La requête doit contenir au moins 2 caractères",
        });
      }

      const searchTerm = query.trim();

      // Vérifier le cache
      const cacheKey = searchCache.generateKey(searchTerm, filters);
      const cachedResult = searchCache.get(cacheKey);

      if (cachedResult) {
        console.log(`📦 Résultat récupéré du cache pour: "${searchTerm}"`);
        return res.json({
          ...cachedResult,
          cached: true,
        });
      }

      // Récupérer tous les films validés
      const allMovies = await Movie.findAll({
        where: { status: "approved" },
      });

      // Filtrer par genre si fourni
      let filteredMovies = allMovies;
      if (genre && genre.trim() !== "") {
        filteredMovies = filteredMovies.filter(
          (movie) => normalizeText(movie.genre) === normalizeText(genre)
        );
      }

      // Filtrer par année si fournie
      if (year && !isNaN(parseInt(year))) {
        const yearNum = parseInt(year);
        filteredMovies = filteredMovies.filter(
          (movie) => movie.year === yearNum
        );
      }

      // Calculer le score de pertinence pour chaque film
      const scoredMovies = filteredMovies.map((movie) => ({
        ...movie.toJSON(),
        score: calculateRelevanceScore(movie, searchTerm),
      }));

      // Filtrer avec un seuil minimum plus élevé (35) pour éviter les résultats non pertinents
      // Seuil de 35 = correspondance significative dans le titre (évite les faux positifs)
      const MIN_SCORE_THRESHOLD = 35;

      const relevantLocalMovies = scoredMovies
        .filter((movie) => movie.score >= MIN_SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score);

      // Normaliser un titre pour comparaison (éviter doublons avec TMDB)
      const normalizeTitle = (title) => {
        if (!title) return "";
        return normalizeText(title);
      };

      // Fonction pour comparer deux films
      const isSameMovie = (movie1, movie2) => {
        const title1 = normalizeTitle(movie1.title || movie1.title_fr || "");
        const title2 = normalizeTitle(movie2.title || movie2.title_fr || "");
        if (title1 === title2) return true;
        if (title1.length > 5 && title2.length > 5) {
          if (title1.includes(title2) || title2.includes(title1)) {
            if (movie1.year && movie2.year && movie1.year === movie2.year) {
              return true;
            }
          }
        }
        return false;
      };

      // Rechercher aussi sur TMDB pour films ET séries
      let tmdbResults = [];

      // TOUJOURS chercher sur TMDB pour enrichir les résultats
      // Cela permet de trouver des films comme "Retour vers le futur" qui n'existent pas encore dans la BDD
      try {
        if (TMDB_API_KEY) {
          // Recherche intelligente TMDB avec variantes (comme dans tmdb.controllers.js)
          const searchTerms = extractKeywords(searchTerm);

          // Fonction helper pour rechercher sur TMDB
          const searchTmdb = async (type, query) => {
            const endpoint = type === "serie" ? "tv" : "movie";
            let searchUrl = `${TMDB_API_URL}/search/${endpoint}?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(
              query
            )}`;
            let response = await fetch(searchUrl);

            if (response.ok) {
              const data = await response.json();
              return data && data.results && data.results.length > 0
                ? data
                : null;
            }
            return null;
          };

          // Recherche parallèle : films ET séries
          let tmdbMoviesData = null;
          let tmdbSeriesData = null;

          // 1. Rechercher films avec la query originale
          tmdbMoviesData = await searchTmdb("film", searchTerm);

          // 2. Rechercher séries avec la query originale
          tmdbSeriesData = await searchTmdb("serie", searchTerm);

          // 3. Si aucun résultat pour les films, essayer avec les mots-clés
          if (!tmdbMoviesData || tmdbMoviesData.results.length === 0) {
            if (searchTerms.length > 0) {
              const keywordsQuery = searchTerms.join(" ");
              if (keywordsQuery.toLowerCase() !== searchTerm.toLowerCase()) {
                tmdbMoviesData = await searchTmdb("film", keywordsQuery);
              }
            }
          }

          // 4. Si aucun résultat pour les séries, essayer avec les mots-clés
          if (!tmdbSeriesData || tmdbSeriesData.results.length === 0) {
            if (searchTerms.length > 0) {
              const keywordsQuery = searchTerms.join(" ");
              if (keywordsQuery.toLowerCase() !== searchTerm.toLowerCase()) {
                tmdbSeriesData = await searchTmdb("serie", keywordsQuery);
              }
            }
          }

          // 5. Si toujours aucun résultat, essayer avec le premier mot-clé
          if (
            (!tmdbMoviesData || tmdbMoviesData.results.length === 0) &&
            (!tmdbSeriesData || tmdbSeriesData.results.length === 0)
          ) {
            if (searchTerms.length > 0) {
              const firstKeyword = searchTerms[0];
              if (firstKeyword.length >= 3) {
                if (!tmdbMoviesData || tmdbMoviesData.results.length === 0) {
                  tmdbMoviesData = await searchTmdb("film", firstKeyword);
                }
                if (!tmdbSeriesData || tmdbSeriesData.results.length === 0) {
                  tmdbSeriesData = await searchTmdb("serie", firstKeyword);
                }
              }
            }
          }

          // Formater les résultats FILMS TMDB
          if (
            tmdbMoviesData &&
            tmdbMoviesData.results &&
            tmdbMoviesData.results.length > 0
          ) {
            const maxTmdbResults = Math.min(tmdbMoviesData.results.length, 5);
            for (let i = 0; i < maxTmdbResults; i++) {
              const result = tmdbMoviesData.results[i];
              const genreId =
                result.genre_ids && result.genre_ids.length > 0
                  ? result.genre_ids[0]
                  : null;
              const genre =
                genreId && tmdbGenreMap[genreId] ? tmdbGenreMap[genreId] : "autre";

              const tmdbMovie = {
                tmdb_id: result.id,
                title_fr: result.title || result.name,
                title_en: result.original_title || result.original_name,
                year: result.release_date
                  ? new Date(result.release_date).getFullYear()
                  : result.first_air_date
                  ? new Date(result.first_air_date).getFullYear()
                  : null,
                genre: genre,
                overview: result.overview || "",
                poster: result.poster_path
                  ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
                  : null,
                score: calculateRelevanceScore(
                  {
                    title: result.title || result.name,
                    year: result.release_date
                      ? new Date(result.release_date).getFullYear()
                      : result.first_air_date
                      ? new Date(result.first_air_date).getFullYear()
                      : null,
                  },
                  searchTerm
                ),
                tmdb_enriched: true,
                isLocal: false,
                type: "film",
              };

              // Ne pas ajouter si déjà présent dans les résultats locaux
              const existsLocally = relevantLocalMovies.some((localMovie) =>
                isSameMovie(localMovie, tmdbMovie)
              );

              if (!existsLocally) {
                tmdbResults.push(tmdbMovie);
              }
            }
          }

          // Formater les résultats SÉRIES TMDB
          if (
            tmdbSeriesData &&
            tmdbSeriesData.results &&
            tmdbSeriesData.results.length > 0
          ) {
            const maxTmdbResults = Math.min(tmdbSeriesData.results.length, 5);
            for (let i = 0; i < maxTmdbResults; i++) {
              const result = tmdbSeriesData.results[i];
              const genreId =
                result.genre_ids && result.genre_ids.length > 0
                  ? result.genre_ids[0]
                  : null;
              const genre =
                genreId && tmdbGenreMap[genreId] ? tmdbGenreMap[genreId] : "autre";

              const tmdbSerie = {
                tmdb_id: result.id,
                title_fr: result.name || result.title,
                title_en: result.original_name || result.original_title,
                year: result.first_air_date
                  ? new Date(result.first_air_date).getFullYear()
                  : null,
                genre: genre,
                overview: result.overview || "",
                poster: result.poster_path
                  ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
                  : null,
                score: calculateRelevanceScore(
                  {
                    title: result.name || result.title,
                    year: result.first_air_date
                      ? new Date(result.first_air_date).getFullYear()
                      : null,
                  },
                  searchTerm
                ),
                tmdb_enriched: true,
                isLocal: false,
                type: "serie",
              };

              // Ne pas ajouter si déjà présent dans les résultats locaux
              const existsLocally = relevantLocalMovies.some((localMovie) =>
                isSameMovie(localMovie, tmdbSerie)
              );

              if (!existsLocally) {
                tmdbResults.push(tmdbSerie);
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ Erreur lors de la recherche TMDB:", error);
        // Continue sans TMDB en cas d'erreur
      }

      // Combiner les résultats et trier par score de pertinence
      const combinedResults = [];

      // Ajouter les films locaux pertinents
      relevantLocalMovies.forEach((movie) => {
        combinedResults.push({
          ...movie,
          isLocal: true,
          tmdb_enriched: false,
          type: movie.type || "film", // Utiliser le type de la BDD ou "film" par défaut
        });
      });

      // Ajouter les résultats TMDB
      tmdbResults.forEach((movie) => {
        combinedResults.push(movie);
      });

      // Trier TOUS les résultats : films locaux TOUJOURS en premier, puis par score
      // Les films existants dans Ciné Délices doivent apparaître avant les nouveaux films TMDB
      combinedResults.sort((a, b) => {
        // PRIORITÉ 1 : Films locaux (existants) TOUJOURS en premier
        if (a.isLocal && !b.isLocal) return -1;
        if (!a.isLocal && b.isLocal) return 1;

        // PRIORITÉ 2 : Si les deux sont locaux ou les deux sont TMDB, trier par score
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        // PRIORITÉ 3 : En cas d'égalité de score, tri alphabétique
        return (a.title_fr || a.title || "").localeCompare(
          b.title_fr || b.title || ""
        );
      });

      const relevantMovies = combinedResults.slice(0, 5); // Top 5 au total

      // Formater les résultats pour la réponse
      const enrichedResults = relevantMovies.map((movie) => {
        // Si c'est un film/série TMDB (déjà formaté)
        if (movie.tmdb_enriched) {
          return {
            id: movie.tmdb_id, // Utiliser tmdb_id comme id temporaire
            title_fr: movie.title_fr || movie.title,
            title_en: movie.title_en || movie.title,
            year: movie.year,
            genre: movie.genre,
            note: null, // Peut être enrichi plus tard
            overview: movie.overview || null,
            poster: movie.poster || null,
            score: movie.score,
            tmdb_enriched: true,
            isLocal: false,
            tmdb_id: movie.tmdb_id,
            type: movie.type || "film", // Type : "film" ou "serie"
          };
        }

        // Enrichir le movie avec les chemins d'images
        const enrichedMovie = enrichMovieWithImagePaths(movie);

        // Si c'est un film/série local
        return {
          id: enrichedMovie.id,
          title_fr: enrichedMovie.title,
          title_en: enrichedMovie.title,
          year: enrichedMovie.year,
          genre: enrichedMovie.genre,
          synopsis: enrichedMovie.synopsis || null,
          note: null,
          overview: enrichedMovie.synopsis || null,
          poster: enrichedMovie.cardPath || null, // Utiliser cardPath pour les miniatures
          score: movie.score,
          tmdb_enriched: false,
          isLocal: true,
          tmdb_id: enrichedMovie.tmdb_id || null,
          type: enrichedMovie.type || "film", // Type : "film" ou "serie"
        };
      });

      const result = {
        success: true,
        results: enrichedResults,
        hasResults: enrichedResults.length > 0,
        query: searchTerm,
        filters,
      };

      // Mettre en cache
      searchCache.set(cacheKey, result);

      return res.json({
        ...result,
        cached: false,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la recherche avancée:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche avancée",
        error: error.message,
      });
    }
  },

  /**
   * Récupérer les informations complètes d'un film ou d'une série depuis TMDB
   * GET /movies/get-tmdb-info/:tmdb_id?type=film|serie
   */
  async getTmdbInfo(req, res) {
    try {
      const { tmdb_id } = req.params;
      const { type } = req.query; // Paramètre optionnel : 'film' ou 'serie'

      if (!tmdb_id || isNaN(parseInt(tmdb_id))) {
        return res.status(400).json({
          success: false,
          error: "L'ID TMDB est requis et doit être un nombre",
        });
      }

      if (!TMDB_API_KEY) {
        console.error("❌ TMDB_API_KEY non configurée dans .env");
        return res.status(500).json({
          success: false,
          error: "Configuration API manquante",
        });
      }

      // Déterminer le type et l'endpoint TMDB à utiliser
      let contentType = type ? type.toLowerCase() : null; // 'film' ou 'serie'
      let endpoint = "movie"; // Par défaut : film
      let tmdbData = null;
      let response = null;

      // Si le type est spécifié, utiliser directement le bon endpoint
      if (contentType === "serie") {
        endpoint = "tv";
      }

      // Essayer d'abord avec l'endpoint déterminé
      let tmdbUrl = `${TMDB_API_URL}/${endpoint}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=fr-FR`;
      response = await fetch(tmdbUrl);

      // Si 404 et que le type n'était pas spécifié, essayer l'autre endpoint (fallback)
      if (!response.ok && response.status === 404 && !contentType) {
        // Essayer avec l'autre type
        const otherEndpoint = endpoint === "movie" ? "tv" : "movie";
        const otherType = endpoint === "movie" ? "serie" : "film";
        tmdbUrl = `${TMDB_API_URL}/${otherEndpoint}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=fr-FR`;
        response = await fetch(tmdbUrl);

        if (response.ok) {
          endpoint = otherEndpoint;
          contentType = otherType;
          console.log(
            `ℹ️ Type détecté automatiquement pour ${tmdb_id}: ${contentType}`
          );
        }
      }

      if (!response.ok) {
        console.error(
          `❌ Erreur API TMDB pour ${contentType || "contenu"} ${tmdb_id}: ${
            response.status
          } ${response.statusText}`
        );
        // Ne pas retourner d'erreur, juste logger et retourner un résultat vide
        return res.json({
          success: false,
          error: `${
            contentType === "serie" ? "Série" : "Film"
          } non trouvé sur TMDB`,
          message: `Erreur ${response.status}: ${response.statusText}`,
          tmdb_id: parseInt(tmdb_id),
        });
      }

      tmdbData = await response.json();
      contentType = contentType || (endpoint === "tv" ? "serie" : "film");

      // Extraire le premier genre (ou "autre" si aucun)
      const genreId =
        tmdbData.genres && tmdbData.genres.length > 0
          ? tmdbData.genres[0].id
          : null;
      const genre = genreId && tmdbGenreMap[genreId] ? tmdbGenreMap[genreId] : "autre";

      // Extraire tous les genres (array)
      const genresArray =
        tmdbData.genres && tmdbData.genres.length > 0
          ? tmdbData.genres.map((g) => tmdbGenreMap[g.id] || g.name.toLowerCase())
          : ["autre"];

      // Formater la réponse selon le type (film ou série)
      const isSerie = endpoint === "tv";
      const movieInfo = {
        tmdb_id: tmdbData.id,
        title_fr: isSerie
          ? tmdbData.name || tmdbData.original_name
          : tmdbData.title || tmdbData.original_title,
        title_en: isSerie
          ? tmdbData.original_name || tmdbData.name
          : tmdbData.original_title || tmdbData.title,
        year: isSerie
          ? tmdbData.first_air_date
            ? new Date(tmdbData.first_air_date).getFullYear()
            : null
          : tmdbData.release_date
          ? new Date(tmdbData.release_date).getFullYear()
          : null,
        genre: genre, // Genre principal (string)
        genres: genresArray, // Tous les genres (array)
        note: tmdbData.vote_average ? tmdbData.vote_average.toFixed(1) : null,
        overview: tmdbData.overview || "",
        poster: tmdbData.poster_path
          ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
          : null,
        backdrop: tmdbData.backdrop_path
          ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
          : null,
        release_date: isSerie
          ? tmdbData.first_air_date || null
          : tmdbData.release_date || null,
        runtime: tmdbData.runtime || tmdbData.episode_run_time?.[0] || null,
        type: contentType, // Ajouter le type dans la réponse
      };

      return res.json({
        success: true,
        movie: movieInfo,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des infos TMDB:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur serveur lors de la récupération des informations",
        message: error.message,
      });
    }
  },

  // Affichage de la liste des films sur la page des films
  async moviesList(req, res) {
    try {
      const movies = await Movie.findAll({ where: { status: "approved" } });
      const selectedGenre = req.query.genre || "tous";

      // Récupérer les genres uniques depuis les films (pour les chips de filtrage)
      const uniqueGenres = [...new Set(movies.map((m) => m.genre).filter(Boolean))].sort();

      // Si un genre est passé en query, filtrer les films
      let filteredMovies = movies;
      if (selectedGenre && selectedGenre !== "tous") {
        filteredMovies = movies.filter(
          (movie) => movie.genre === selectedGenre
        );
      }

      // Récupérer les favoris films de l'utilisateur connecté
      let favoriteIds = [];
      let userRatingsMap = {};
      if (req.userId) {
        const userFavorites = await Favorite.findAll({
          where: { id_user: req.userId, entity_type: "movie" },
          attributes: ["entity_id"],
        });
        favoriteIds = userFavorites.map((f) => f.entity_id);

        // Récupérer les notes de l'utilisateur pour les films
        const userRatings = await Rating.findAll({
          where: { id_user: req.userId, entity_type: "movie" },
          attributes: ["entity_id", "score"],
        });
        userRatingsMap = userRatings.reduce((acc, r) => {
          acc[r.entity_id] = r.score;
          return acc;
        }, {});
      }

      // Récupérer les moyennes des notes pour tous les films
      const movieIds = filteredMovies.map((m) => m.id);
      const avgRatings = await Rating.findAll({
        where: { entity_type: "movie", entity_id: { [Op.in]: movieIds } },
        attributes: [
          "entity_id",
          [fn("AVG", col("score")), "average"],
          [fn("COUNT", col("id")), "count"],
        ],
        group: ["entity_id"],
        raw: true,
      });
      const avgRatingsMap = avgRatings.reduce((acc, r) => {
        acc[r.entity_id] = {
          average: parseFloat(r.average).toFixed(1),
          count: parseInt(r.count),
        };
        return acc;
      }, {});

      const recipeCountsByMovieId = await getRecipeCountsByMovieIds(
        filteredMovies.map((movie) => movie.id)
      );

      // Date de référence pour calculer "Nouveau" (films ajoutés < 15 jours, NEW ne doit pas être stocké)
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

      const moviesWithCounts = filteredMovies.map((movie) => {
        const plainMovie = movie.toJSON ? movie.toJSON() : movie;
        const recipeCount = recipeCountsByMovieId[plainMovie.id] || 0;

        // Calcul isNew : état dérivé (status approved + créé < 15 jours) — jamais stocké en base
        const createdAt = plainMovie.createdAt ? new Date(plainMovie.createdAt) : null;
        const isNew = createdAt ? createdAt >= fifteenDaysAgo : false;

        // Calcul isPopular : plus de 3 recettes associées
        const isPopular = recipeCount > 3;

        // Note moyenne des utilisateurs (priorité) ou TMDB rating ou valeur par défaut
        const userAvgData = avgRatingsMap[plainMovie.id];
        const avgRating = userAvgData ? userAvgData.average : null;
        const ratingCount = userAvgData ? userAvgData.count : 0;
        const rating = avgRating || plainMovie.tmdb_rating || (3.5 + ((plainMovie.id * 7) % 15) / 10).toFixed(1);

        // Note de l'utilisateur connecté (si existante)
        const userRating = userRatingsMap[plainMovie.id] || null;

        return {
          ...plainMovie,
          recipeCount,
          isNew,
          isPopular,
          isFavorite: favoriteIds.includes(plainMovie.id),
          rating,
          userRating,
          ratingCount,
        };
      });

      // Enrichir les movies avec les chemins d'images (banner/card)
      const enrichedMovies = enrichMoviesWithImagePaths(moviesWithCounts);

      const [totalMovies, totalRecipes] = await Promise.all([
        Movie.count({ where: { status: "approved" } }),
        Recipe.count({ where: { status: "approved" } }),
      ]);

      res.render("movies", {
        movies: enrichedMovies,
        selectedGenre,
        genres: uniqueGenres,
        totalMovies,
        totalRecipes,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error);
    }
  },

  /**
   * Récupérer un film par son ID (API JSON)
   * GET /movies/api/get/:id
   */
  async getMovieById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "ID de film invalide",
        });
      }

      const movie = await Movie.findByPk(parseInt(id));

      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Film non trouvé",
        });
      }

      // Enrichir le movie avec les chemins d'images
      const enrichedMovie = enrichMovieWithImagePaths(movie);

      return res.json({
        success: true,
        movie: {
          id: enrichedMovie.id,
          title: enrichedMovie.title,
          year: enrichedMovie.year,
          genre: enrichedMovie.genre,
          synopsis: enrichedMovie.synopsis || null,
          picture: enrichedMovie.cardPath, // Utiliser cardPath pour la prévisualisation
          originalPath: enrichedMovie.originalPath,
          bannerPath: enrichedMovie.bannerPath,
          cardPath: enrichedMovie.cardPath,
          type: enrichedMovie.type || "film",
          tmdb_id: enrichedMovie.tmdb_id,
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du film:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du film",
        error: error.message,
      });
    }
  },
};

export default moviesController;
