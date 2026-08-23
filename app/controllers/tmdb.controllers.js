/**
 * Controller pour l'intégration TMDB
 * Recherche de films via l'API The Movie Database
 */

import "dotenv/config";
import tmdbGenreMap from "../utils/tmdb-genre-map.js";
import { fetchTmdbMovieDetails } from "../utils/tmdb-movie-details.js";
import { Movie } from "../models/index.model.js";

/**
 * Le champ Movie.type stocke "film" | "serie" (vocabulaire interne au site),
 * distinct du media_type TMDB ("movie" | "tv") utilisé par les proxies.
 */
function toDbMovieType(tmdbType) {
  return tmdbType === "tv" ? "serie" : "film";
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";

/**
 * Cache mémoire simple (24h) pour les 2 endpoints proxy dédiés à l'étape 01
 * du formulaire d'ajout ("Mon film ou ma série") — évite de re-solliciter
 * TMDB à chaque frappe/re-render pour une même recherche ou fiche.
 */
const PROXY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const proxyCache = new Map();
function cacheGet(key) {
  const entry = proxyCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    proxyCache.delete(key);
    return null;
  }
  return entry.data;
}
function cacheSet(key, data) {
  proxyCache.set(key, { data, expiresAt: Date.now() + PROXY_CACHE_TTL_MS });
}

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

/**
 * Recherche TMDB dédiée à l'étape 01 du formulaire d'ajout — un seul type
 * (movie OU tv) par appel, résultats projetés sur les seuls champs utiles
 * à l'UI, cache 24h. Le tri par pertinence/popularité TMDB est conservé.
 * GET /api/tmdb/search?q=<titre>&type=movie|tv
 */
async function proxySearch(req, res) {
  try {
    if (!TMDB_API_KEY) {
      console.error("❌ TMDB_API_KEY non configurée dans .env");
      return res.status(500).json({ success: false, error: "Configuration API manquante" });
    }

    const q = (req.query.q || req.query.query || "").trim();
    const type = req.query.type === "tv" ? "tv" : "movie";

    if (q.length < 2) {
      return res.json({ success: true, results: [], query: q });
    }

    const cacheKey = `search:${type}:${q.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const url = `${TMDB_API_URL}/search/${type}?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(q)}`;
    const tmdbRes = await fetch(url);
    if (!tmdbRes.ok) {
      return res.status(502).json({ success: false, error: "TMDB indisponible, réessayez." });
    }
    const data = await tmdbRes.json();

    const results = (data.results || []).map((r) => ({
      id: r.id,
      media_type: type,
      title: type === "movie" ? r.title : r.name,
      year: (type === "movie" ? r.release_date : r.first_air_date)
        ? (type === "movie" ? r.release_date : r.first_air_date).slice(0, 4)
        : null,
      genre_ids: r.genre_ids || [],
      poster_thumb: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : null,
      popularity: r.popularity || 0,
    }));

    // Signaler les fiches déjà présentes en base Ciné Délices (par tmdb_id)
    // pour proposer "Utiliser cette fiche existante" plutôt qu'un ré-import.
    if (results.length) {
      const existingMovies = await Movie.findAll({
        where: { tmdb_id: results.map((r) => r.id), type: toDbMovieType(type) },
        attributes: ["id", "tmdb_id", "slug"],
      });
      const byTmdbId = new Map(existingMovies.map((m) => [m.tmdb_id, m]));
      results.forEach((r) => {
        const m = byTmdbId.get(r.id);
        if (m) {
          r.existsInCineDelices = true;
          r.cineDelicesId = m.id;
          r.cineDelicesSlug = m.slug;
        }
      });
    }

    const payload = { success: true, results, query: q };
    cacheSet(cacheKey, payload);
    return res.json(payload);
  } catch (error) {
    console.error("❌ Erreur proxySearch TMDB:", error);
    return res.status(500).json({ success: false, error: "Erreur serveur lors de la recherche" });
  }
}

/**
 * Détail complet d'une fiche TMDB (movie ou tv), crédits inclus en un seul
 * appel — dédié à la fiche "importée" de l'étape 01. Cache 24h.
 * GET /api/tmdb/detail?id=<tmdb_id>&type=movie|tv
 */
async function proxyDetail(req, res) {
  try {
    if (!TMDB_API_KEY) {
      console.error("❌ TMDB_API_KEY non configurée dans .env");
      return res.status(500).json({ success: false, error: "Configuration API manquante" });
    }

    const id = req.query.id;
    const type = req.query.type === "tv" ? "tv" : "movie";
    if (!id || !/^\d+$/.test(String(id))) {
      return res.status(400).json({ success: false, error: "Le paramètre 'id' est requis" });
    }

    const cacheKey = `detail:${type}:${id}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const url = `${TMDB_API_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=credits`;
    const tmdbRes = await fetch(url);
    if (!tmdbRes.ok) {
      return res.status(tmdbRes.status === 404 ? 404 : 502).json({
        success: false,
        error: tmdbRes.status === 404 ? "Fiche introuvable sur TMDB." : "TMDB indisponible, réessayez.",
      });
    }
    const d = await tmdbRes.json();

    let director = null;
    if (type === "movie") {
      const dir = (d.credits?.crew || []).find((c) => c.job === "Director");
      director = dir ? dir.name : null;
    } else {
      director = (d.created_by || []).map((c) => c.name).join(", ") || null;
    }

    const runtime = type === "movie" ? d.runtime : (d.episode_run_time && d.episode_run_time[0]);
    const releaseDate = type === "movie" ? d.release_date : d.first_air_date;
    const genreIds = (d.genres || []).map((g) => g.id);
    // Genre canonique (1er genre reconnu) pour le <select> du formulaire ;
    // "genres" (noms complets TMDB) sert uniquement à l'affichage des pastilles.
    const canonicalGenre = genreIds.map((id) => tmdbGenreMap[id]).find(Boolean) || null;

    const payload = {
      success: true,
      detail: {
        id: d.id,
        media_type: type,
        title: type === "movie" ? d.title : d.name,
        year: releaseDate ? releaseDate.slice(0, 4) : null,
        genres: (d.genres || []).map((g) => g.name),
        genre: canonicalGenre,
        director,
        runtime: runtime || null,
        vote_average: typeof d.vote_average === "number" ? d.vote_average : null,
        overview: d.overview || "",
        poster_path: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
      },
    };

    // Fiche déjà présente en base Ciné Délices ? → on renvoie son id pour
    // que le formulaire réutilise directement ce film (pas de doublon créé).
    const existingMovie = await Movie.findOne({
      where: { tmdb_id: Number(id), type: toDbMovieType(type) },
      attributes: ["id", "slug"],
    });
    if (existingMovie) {
      payload.detail.existsInCineDelices = true;
      payload.detail.cineDelicesId = existingMovie.id;
      payload.detail.cineDelicesSlug = existingMovie.slug;
    }

    cacheSet(cacheKey, payload);
    return res.json(payload);
  } catch (error) {
    console.error("❌ Erreur proxyDetail TMDB:", error);
    return res.status(500).json({ success: false, error: "Erreur serveur lors de la récupération de la fiche" });
  }
}

const tmdbController = {
  searchMovie,
  getMovieDetails,
  proxySearch,
  proxyDetail,
};

export default tmdbController;

