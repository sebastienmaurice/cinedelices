/**
 * Controller pour l'intégration TMDB
 * Recherche de films via l'API The Movie Database
 */

import "dotenv/config";
import tmdbGenreMap from "../utils/tmdb-genre-map.js";
import { fetchTmdbMovieDetails } from "../utils/tmdb-movie-details.js";

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

    // Appeler films ET séries en parallèle
    const baseParams = `api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(query.trim())}`;
    const [movieRes, tvRes] = await Promise.all([
      fetch(`${TMDB_API_URL}/search/movie?${baseParams}`),
      fetch(`${TMDB_API_URL}/search/tv?${baseParams}`),
    ]);

    if (!movieRes.ok && !tvRes.ok) {
      return res.status(movieRes.status).json({
        success: false,
        error: "Erreur lors de la recherche sur TMDB",
      });
    }

    const [movieData, tvData] = await Promise.all([
      movieRes.ok ? movieRes.json() : { results: [] },
      tvRes.ok   ? tvRes.json()   : { results: [] },
    ]);

    // Normaliser les résultats TV (name → title, first_air_date → release_date)
    const tvResults = (tvData.results || []).map(r => ({
      ...r,
      title:        r.name || r.original_name,
      original_title: r.original_name,
      release_date: r.first_air_date || null,
      media_type:   "tv",
    }));
    const movieResults = (movieData.results || []).map(r => ({ ...r, media_type: "movie" }));

    // Fusionner et trier par popularité
    let combined = [...movieResults, ...tvResults].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // Si aucun résultat, retry avec mots-clés extraits
    if (combined.length === 0 && searchTerms.length > 0) {
      const keywordsQuery = searchTerms.join(" ");
      if (keywordsQuery.toLowerCase() !== query.trim().toLowerCase()) {
        const kbParams = `api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(keywordsQuery)}`;
        const [kmRes, ktvRes] = await Promise.all([
          fetch(`${TMDB_API_URL}/search/movie?${kbParams}`),
          fetch(`${TMDB_API_URL}/search/tv?${kbParams}`),
        ]);
        const [kmData, ktvData] = await Promise.all([
          kmRes.ok  ? kmRes.json()  : { results: [] },
          ktvRes.ok ? ktvRes.json() : { results: [] },
        ]);
        const kTvNorm = (ktvData.results || []).map(r => ({ ...r, title: r.name || r.original_name, original_title: r.original_name, release_date: r.first_air_date || null, media_type: "tv" }));
        combined = [...(kmData.results || []).map(r => ({ ...r, media_type: "movie" })), ...kTvNorm].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      }
    }

    // Si aucun résultat
    if (combined.length === 0) {
      return res.json({
        success: true,
        hasResults: false,
        movies: [],
        suggestions: [],
        message: "Aucun film ou série correspondant trouvé",
      });
    }

    // Formater tous les résultats (jusqu'à 5) pour les suggestions
    const maxResults = Math.min(combined.length, 5);
    const formattedMovies = [];

    for (let i = 0; i < maxResults; i++) {
      const result = combined[i];

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
        media_type: result.media_type,
        // Déjà inclus par l'endpoint de recherche TMDB — pas d'appel
        // supplémentaire nécessaire pour le score.
        vote_average: typeof result.vote_average === "number" ? result.vote_average : null,
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

/**
 * Récupérer les détails complémentaires d'un film/série TMDB : réalisateur,
 * compositeur, casting principal et bande-annonce YouTube.
 * GET /api/tmdb/details?tmdb_id=123&media_type=movie|tv
 *
 * Deux appels supplémentaires à l'API TMDB (credits + videos), déclenchés
 * uniquement quand un contributeur sélectionne un film précis dans le
 * formulaire d'ajout — pas à chaque frappe de recherche.
 */
async function getMovieDetails(req, res) {
  try {
    const { tmdb_id, media_type } = req.query;

    if (!TMDB_API_KEY) {
      console.error("❌ TMDB_API_KEY non configurée dans .env");
      return res.status(500).json({ success: false, error: "Configuration API manquante" });
    }
    if (!tmdb_id || !/^\d+$/.test(String(tmdb_id))) {
      return res.status(400).json({ success: false, error: "Le paramètre 'tmdb_id' est requis" });
    }

    const extras = await fetchTmdbMovieDetails(Number(tmdb_id), media_type);

    return res.json({
      success: true,
      tmdb_id: Number(tmdb_id),
      ...extras,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des détails TMDB:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des détails",
      message: error.message,
    });
  }
}

const tmdbController = {
  searchMovie,
  getMovieDetails,
};

export default tmdbController;

