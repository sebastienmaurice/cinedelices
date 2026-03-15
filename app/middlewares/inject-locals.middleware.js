/**
 * inject-locals.middleware.js
 * ===========================
 * Injecte dans res.locals les données accessibles dans tous les templates EJS.
 *
 * Données synchrones (toujours disponibles) :
 *   role, user, userId, userPseudo
 *
 * Données asynchrones enrichies (silencieuses si indisponibles) :
 *   footerStats      — { members, recipes, films } — cache 5 min
 *   topContributors  — top 3 par recettes approuvées — cache 5 min
 */

import { QueryTypes } from "sequelize";
import sequelize from "../database/sequelize-client.js";
import { User, Recipe, Movie } from "../models/index.model.js";

/* ──────────────────────────────────────────────────────────────
   Cache en mémoire — évite de refaire les COUNT à chaque requête
────────────────────────────────────────────────────────────── */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _statsCache      = null;
let _statsCacheTime  = 0;
let _contribCache    = null;
let _contribCacheTime = 0;

async function getGlobalStats() {
  if (_statsCache && Date.now() - _statsCacheTime < CACHE_TTL) {
    return _statsCache;
  }
  const [members, recipes, films] = await Promise.all([
    User.count(),
    Recipe.count({ where: { status: "approved" } }),
    Movie.count({ where: { status: "approved" } }),
  ]);
  _statsCache     = { members, recipes, films };
  _statsCacheTime = Date.now();
  return _statsCache;
}

async function getTopContributors() {
  if (_contribCache && Date.now() - _contribCacheTime < CACHE_TTL) {
    return _contribCache;
  }
  const rows = await sequelize.query(
    `SELECT u.id, u.pseudo AS username, u.picture,
            COUNT(r.id)::int AS count
     FROM   users u
     JOIN   recipes r ON r.id_user = u.id AND r.status = 'approved'
     GROUP  BY u.id, u.pseudo, u.picture
     ORDER  BY COUNT(r.id) DESC
     LIMIT  3`,
    { type: QueryTypes.SELECT }
  );
  _contribCache     = rows;
  _contribCacheTime = Date.now();
  return _contribCache;
}

/* ──────────────────────────────────────────────────────────────
   Middleware
────────────────────────────────────────────────────────────── */
async function injectLocals(req, res, next) {
  // Données synchrones — toujours définies en premier
  res.locals.role       = req.userRole  || undefined;
  res.locals.user       = req.user      || null;
  res.locals.userId     = req.userId    || null;
  res.locals.userPseudo = req.userPseudo || null;

  // Données asynchrones — silencieuses en cas d'erreur
  try {
    const [stats, contributors] = await Promise.all([
      getGlobalStats(),
      getTopContributors(),
    ]);
    res.locals.footerStats     = stats;
    res.locals.topContributors = contributors;
  } catch {
    /* Stats indisponibles — le footer utilisera les valeurs par défaut EJS */
  }

  next();
}

export { injectLocals };
