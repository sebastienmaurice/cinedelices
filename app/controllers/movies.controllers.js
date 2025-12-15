import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { Op } from "sequelize";
import {
  calculateRelevanceScore,
  sortByRelevance,
  exactMatch,
  normalizeText,
  similarityScore,
  extractKeywords,
} from "../utils/search-utils.js";
import searchCache from "../utils/search-cache.js";
import "dotenv/config";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";

const moviesController = {
  // Recherche avancée de films (API)
  async searchMovies(req, res) {
    try {
      const { query } = req.query;

      // Si pas de query ou query vide, retourner tous les films
      if (!query || query.trim() === "") {
        const allMovies = await Movie.findAll({
          where: { status: true }, // Uniquement les films validés
          limit: 20, // Limiter les résultats
          order: [["title", "ASC"]],
        });

        return res.json({
          success: true,
          movies: allMovies,
          hasResults: allMovies.length > 0,
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
          status: true, // Uniquement les films validés
          [Op.or]: searchConditions,
        },
        limit: 20, // Limiter les résultats
        order: [["title", "ASC"]], // Ordre alphabétique simple
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
  },

  //Filtrage des films par genre (tous, action, comedie, drame...)
  async filtredMovies(req, res) {
    try {
      const { genre } = req.params;

      let movies;
      if (!genre || genre === "all" || genre === "tous") {
        movies = await Movie.findAll();
      } else {
        movies = await Movie.findAll({
          where: { genre: genre },
        });
      }

      // Rendu de la vue avec les genres filtrés

      res.render("movies", {
        movies,
        selectedGenre: genre || "tous",
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
        where: { status: true },
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

          // Mapper les genres TMDB (commun pour films et séries)
          const genreMap = {
            28: "action",
            12: "aventure",
            16: "animation",
            35: "comédie",
            80: "crime",
            99: "documentaire",
            18: "drame",
            10751: "familial",
            14: "fantastique",
            36: "histoire",
            27: "horreur",
            10402: "musique",
            9648: "mystère",
            10749: "romance",
            878: "science-fiction",
            10770: "téléfilm",
            53: "thriller",
            10752: "guerre",
            37: "western",
          };

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
                genreId && genreMap[genreId] ? genreMap[genreId] : "autre";

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
                genreId && genreMap[genreId] ? genreMap[genreId] : "autre";

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

        // Si c'est un film/série local
        return {
          id: movie.id,
          title_fr: movie.title,
          title_en: movie.title,
          year: movie.year,
          genre: movie.genre,
          note: null,
          overview: null,
          poster: movie.picture || null,
          score: movie.score,
          tmdb_enriched: false,
          isLocal: true,
          tmdb_id: movie.tmdb_id || null,
          type: movie.type || "film", // Type : "film" ou "serie"
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

      // Mapper les genres TMDB
      const genreMap = {
        28: "action",
        12: "aventure",
        16: "animation",
        35: "comédie",
        80: "crime",
        99: "documentaire",
        18: "drame",
        10751: "familial",
        14: "fantastique",
        36: "histoire",
        27: "horreur",
        10402: "musique",
        9648: "mystère",
        10749: "romance",
        878: "science-fiction",
        10770: "téléfilm",
        53: "thriller",
        10752: "guerre",
        37: "western",
      };

      // Extraire le premier genre (ou "autre" si aucun)
      const genreId =
        tmdbData.genres && tmdbData.genres.length > 0
          ? tmdbData.genres[0].id
          : null;
      const genre = genreId && genreMap[genreId] ? genreMap[genreId] : "autre";

      // Extraire tous les genres (array)
      const genresArray =
        tmdbData.genres && tmdbData.genres.length > 0
          ? tmdbData.genres.map((g) => genreMap[g.id] || g.name.toLowerCase())
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
      const movies = await Movie.findAll();
      const selectedGenre = req.query.genre || "tous";

      // Si un genre est passé en query, filtrer les films
      let filteredMovies = movies;
      if (selectedGenre && selectedGenre !== "tous") {
        filteredMovies = movies.filter(
          (movie) => movie.genre === selectedGenre
        );
      }

      res.render("movies", {
        movies: filteredMovies,
        selectedGenre,
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

      return res.json({
        success: true,
        movie: {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          genre: movie.genre,
          picture: movie.picture,
          type: movie.type || "film",
          tmdb_id: movie.tmdb_id,
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
