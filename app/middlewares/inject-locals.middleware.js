/**
 * inject-locals.middleware.js
 * ===========================
 * Injecte dans res.locals les données accessibles dans tous les templates EJS.
 *
 * Données synchrones (toujours disponibles) :
 *   role, userId
 *
 * Données asynchrones enrichies (silencieuses si indisponibles) :
 *   footerStats      — { members, recipes, films } — cache 5 min
 *   topContributors  — top 3 par recettes approuvées — cache 5 min
 */

import { QueryTypes } from "sequelize";
import sequelize from "../database/sequelize-client.js";
import { User, Recipe, Movie } from "../models/index.model.js";
import { FRAME_UNLOCKS } from "../utils/gamification.utils.js";

/* ──────────────────────────────────────────────────────────────
   Cache en mémoire — évite de refaire les COUNT à chaque requête
────────────────────────────────────────────────────────────── */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _statsCache      = null;
let _statsCacheTime  = 0;
let _contribCache    = null;
let _contribCacheTime = 0;

// Cache nav frame par userId (TTL court — 2 min)
const _navCache    = new Map();
const NAV_TTL      = 2 * 60 * 1000;

function _frameUrl(code) {
  const f = FRAME_UNLOCKS.find(f => f.code === (code || "cine"));
  return f ? f.pngUrl : FRAME_UNLOCKS[0].pngUrl;
}

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
            COUNT(r.id)::int AS count,
            COALESCE(up.active_frame_code, 'cine') AS active_frame_code
     FROM   users u
     JOIN   recipes r ON r.id_user = u.id AND r.status = 'approved'
     LEFT JOIN user_points up ON up.id_user = u.id
     WHERE  u.role NOT IN ('admin', 'superadmin', 'super_admin')
     GROUP  BY u.id, u.pseudo, u.picture, up.active_frame_code
     ORDER  BY COUNT(r.id) DESC
     LIMIT  3`,
    { type: QueryTypes.SELECT }
  );
  const enriched = rows.map(r => ({ ...r, frameUrl: _frameUrl(r.active_frame_code) }));
  _contribCache     = enriched;
  _contribCacheTime = Date.now();
  return _contribCache;
}

async function getNavData(userId) {
  const cached = _navCache.get(userId);
  if (cached && Date.now() - cached.t < NAV_TTL) return cached;

  const [[row], [{ count }]] = await Promise.all([
    sequelize.query(
      `SELECT u.picture, u.pseudo, COALESCE(up.active_frame_code, 'cine') AS active_frame_code
       FROM users u
       LEFT JOIN user_points up ON up.id_user = u.id
       WHERE u.id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COUNT(*)::int AS count FROM recipes WHERE id_user = :userId AND status = 'approved'`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    ),
  ]);
  const data = {
    navAvatar:      row?.picture || '/images/image-default-profile.jpg',
    navPseudo:      row?.pseudo  || '',
    navFrameUrl:    _frameUrl(row?.active_frame_code),
    hasAuthorPage:  count > 0,
    t: Date.now(),
  };
  _navCache.set(userId, data);
  return data;
}

/* ──────────────────────────────────────────────────────────────
   Middleware
────────────────────────────────────────────────────────────── */
async function injectLocals(req, res, next) {
  // Données synchrones — toujours définies en premier
  res.locals.role           = req.userRole || undefined;
  res.locals.userId         = req.userId   || null;
  res.locals.siteUrl        = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.locals.googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  res.locals.path           = req.path;

  // Données asynchrones — silencieuses en cas d'erreur
  try {
    const userId = req.userId || null;
    const tasks  = [getGlobalStats(), getTopContributors()];
    if (userId) tasks.push(getNavData(userId));

    const [stats, contributors, navData] = await Promise.all(tasks);
    res.locals.footerStats     = stats;
    res.locals.topContributors = contributors;
    if (navData) {
      res.locals.navAvatar      = navData.navAvatar;
      res.locals.navPseudo      = navData.navPseudo;
      res.locals.navFrameUrl    = navData.navFrameUrl;
      res.locals.hasAuthorPage  = navData.hasAuthorPage;
    }
  } catch {
    /* Stats indisponibles — le footer utilisera les valeurs par défaut EJS */
  }

  next();
}

function clearNavCache(userId) {
  if (userId) _navCache.delete(userId);
}

export { injectLocals, clearNavCache };
