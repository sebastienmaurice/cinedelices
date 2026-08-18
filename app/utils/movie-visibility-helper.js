/**
 * movie-visibility-helper.js
 *
 * Helper unifié pour gérer la visibilité des films.
 * Garantit une cohérence de la logique partout dans l'app.
 *
 * Règle d'Or : Un film n'est visible au public QUE SI :
 * 1. Status du film = 'approved' (TMDB auto-approuvé OU validé admin)
 * 2. AU MOINS 1 recette associée avec status = 'approved'
 */

import { Recipe } from "../models/index.model.js";
import { Op } from "sequelize";

// Cache mémoire — même pattern que inject-locals.middleware.js.
// getPublicMovieIds() était appelée sans cache sur quasi toutes les routes
// films (accueil, listing, recherche — y compris à chaque frappe débouncée),
// recalculant à chaque fois un GROUP BY sur toute la table recipes alors que
// le résultat ne change qu'à la validation/rejet d'une recette par un admin.
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
let _cache = null;
let _cacheTime = 0;

/**
 * Récupérer tous les IDs de films qui ont ≥1 recette approuvée
 * Utile pour filtrer les films visibles
 *
 * @returns {Promise<number[]>} Array d'IDs de films visibles
 */
export async function getPublicMovieIds() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
    return _cache;
  }

  const moviesWithApprovedRecipes = await Recipe.findAll({
    where: { status: "approved" },
    attributes: ["id_movie"],
    group: ["id_movie"],
    raw: true,
  });

  _cache = moviesWithApprovedRecipes
    .map((r) => r.id_movie)
    .filter(Boolean); // Filtre les null/undefined
  _cacheTime = Date.now();
  return _cache;
}

/** Invalide le cache — à appeler après validation/rejet d'une recette par un admin. */
export function invalidatePublicMovieIdsCache() {
  _cache = null;
  _cacheTime = 0;
}

/**
 * Vérifier si UN FILM est visible au public
 *
 * @param {number} movieId - ID du film
 * @param {number|null} cachedMovieIds - Cache optionnel d'IDs de films visibles (pour perf)
 * @returns {Promise<boolean>}
 */
export async function isMoviePublic(movieId, cachedMovieIds = null) {
  const publicIds = cachedMovieIds || (await getPublicMovieIds());
  return publicIds.includes(movieId);
}

/**
 * Filtrer un array de films pour garder SEULEMENT les films visibles
 * Perf optimisée : une seule requête getPublicMovieIds()
 *
 * @param {Array<Movie>} movies - Array de films à filtrer
 * @returns {Promise<Array<Movie>>} Films filtrés
 */
export async function filterPublicMovies(movies) {
  if (!movies || movies.length === 0) return [];

  const publicIds = await getPublicMovieIds();
  return movies.filter((m) => publicIds.includes(m.id));
}

/**
 * Construire la condition WHERE Sequelize pour films publics
 * Utile pour les requêtes directes à la BDD
 *
 * @returns {Promise<{status: string, id: {[Op.in]: number[]}}>} Condition WHERE
 */
export async function getPublicMoviesCondition() {
  const publicIds = await getPublicMovieIds();

  return {
    status: "approved",
    id: { [Op.in]: publicIds },
  };
}

/**
 * Récupérer le nombre de recettes approuvées pour UN FILM
 *
 * @param {number} movieId - ID du film
 * @returns {Promise<number>} Nombre de recettes approuvées
 */
export async function getApprovedRecipeCountForMovie(movieId) {
  const count = await Recipe.count({
    where: { id_movie: movieId, status: "approved" },
  });
  return count;
}

/**
 * Récupérer le nombre de recettes approuvées pour PLUSIEURS FILMS
 * Optimisé avec une seule requête
 *
 * @param {number[]} movieIds - Array d'IDs de films
 * @returns {Promise<{movieId: number}>} Map {movieId: count}
 */
export async function getApprovedRecipeCounts(movieIds) {
  if (!movieIds || movieIds.length === 0) return {};

  const results = await Recipe.findAll({
    where: {
      id_movie: { [Op.in]: movieIds },
      status: "approved",
    },
    attributes: [
      "id_movie",
      [Recipe.sequelize.fn("COUNT", Recipe.sequelize.col("id")), "count"],
    ],
    group: ["id_movie"],
    raw: true,
  });

  return results.reduce((acc, row) => {
    acc[row.id_movie] = parseInt(row.count, 10) || 0;
    return acc;
  }, {});
}

export default {
  getPublicMovieIds,
  invalidatePublicMovieIdsCache,
  isMoviePublic,
  filterPublicMovies,
  getPublicMoviesCondition,
  getApprovedRecipeCountForMovie,
  getApprovedRecipeCounts,
};
