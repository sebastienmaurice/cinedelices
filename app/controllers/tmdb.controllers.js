/**
 * Controller pour l'intégration TMDB
 * Recherche de films via l'API The Movie Database
 */

import "dotenv/config";
import tmdbGenreMap from "../utils/tmdb-genre-map.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";

/**
 * Extraire les mots-clés d'une recherche pour améliorer la tolérance aux fautes
 * Retire les mots communs et les articles
 */
function extractKeywords(query) {
  // Mots à ignorer (articles, prépositions, etc.)
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

  // Séparer en mots, nettoyer et filtrer
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^\w\u00C0-\u017F]/g, "")) // Garder seulement lettres et accents
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  return words;
}

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

    // Vérifier que la query est fournie
    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Le paramètre 'query' est requis",
      });
    }

    // Extraire les mots-clés pour améliorer la recherche (tolérance aux fautes)
    const searchTerms = extractKeywords(query.trim());

    // Appeler l'API TMDB avec la query originale (TMDB gère bien les fautes)
    // Si aucun résultat, on peut essayer avec les mots-clés extraits
    let searchUrl = `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(
      query.trim()
    )}`;

    let response = await fetch(searchUrl);

    if (!response.ok) {
      console.error(
        "❌ Erreur API TMDB:",
        response.status,
        response.statusText
      );
      return res.status(response.status).json({
        success: false,
        error: "Erreur lors de la recherche sur TMDB",
      });
    }

    let data = await response.json();

    // Si aucun résultat avec la query originale et qu'on a extrait des mots-clés,
    // essayer plusieurs variantes de recherche pour améliorer la tolérance aux fautes
    if (!data.results || data.results.length === 0) {
      // Essayer avec les mots-clés seulement (sans fautes évidentes)
      if (searchTerms.length > 0) {
        const keywordsQuery = searchTerms.join(" ");
        if (keywordsQuery.toLowerCase() !== query.trim().toLowerCase()) {
          console.log(
            `🔍 Aucun résultat avec "${query.trim()}", essai avec mots-clés: "${keywordsQuery}"`
          );
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

      // Si toujours aucun résultat, essayer avec le premier mot-clé seulement
      // (pour des cas comme "harry Poster" → cherche "harry")
      if (
        (!data.results || data.results.length === 0) &&
        searchTerms.length > 0
      ) {
        const firstKeyword = searchTerms[0];
        if (firstKeyword.length >= 3) {
          console.log(
            `🔍 Aucun résultat, essai avec premier mot-clé: "${firstKeyword}"`
          );
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
    }

    // Si aucun résultat
    if (!data.results || data.results.length === 0) {
      return res.json({
        success: true,
        hasResults: false,
        movies: [],
        suggestions: [],
        message: "Aucun film correspondant trouvé",
      });
    }

    // Formater tous les résultats (jusqu'à 5) pour les suggestions
    const maxResults = Math.min(data.results.length, 5);
    const formattedMovies = [];

    for (let i = 0; i < maxResults; i++) {
      const result = data.results[i];

      const genreId =
        result.genre_ids && result.genre_ids.length > 0
          ? result.genre_ids[0]
          : null;

      const genre = genreId && tmdbGenreMap[genreId] ? tmdbGenreMap[genreId] : "autre";

      formattedMovies.push({
        tmdb_id: result.id,
        title: result.title,
        original_title: result.original_title,
        year: result.release_date
          ? new Date(result.release_date).getFullYear()
          : null,
        genre: genre,
        overview: result.overview || "",
        poster_path: result.poster_path
          ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
          : null,
        release_date: result.release_date || null,
      });
    }

    // Retourner le premier résultat comme suggestion principale et tous les autres comme alternatives
    return res.json({
      success: true,
      hasResults: true,
      movie: formattedMovies[0], // Premier résultat (le plus pertinent)
      suggestions: formattedMovies, // Tous les résultats pour les suggestions
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

const tmdbController = {
  searchMovie,
};

export default tmdbController;

