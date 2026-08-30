/**
 * inject-locals.middleware.js
 * ===========================
 * Injecte dans res.locals les données accessibles dans tous les templates EJS.
 *
 * Données synchrones (toujours disponibles) :
 *   role, userId
 *
 * Données asynchrones enrichies (silencieuses si indisponibles) :
 *   footerStats      — { members, recipes, films, avis } — cache 5 min
 *   topContributors  — top 3 par recettes approuvées — cache 5 min
 */

import { QueryTypes } from "sequelize";
import sequelize from "../database/sequelize-client.js";
import { User, Recipe, Movie, Notice } from "../models/index.model.js";
import { cldCard, cldAvatar, cldFull } from "../utils/cloudinary-url.js";
// Phase 13 : le calcul du Top Contributeurs (et le petit helper frameUrl
// qu'il partage avec getNavData) vivent désormais dans ranking.service.js
// — réutilisé tel quel ici ET par trophy.service.js (Premier Rôle), une
// seule définition du classement, un seul cache.
import { getTopContributors, frameUrl as _frameUrl } from "../services/ranking.service.js";

/* ──────────────────────────────────────────────────────────────
   Cache en mémoire — évite de refaire les COUNT à chaque requête
────────────────────────────────────────────────────────────── */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _statsCache      = null;
let _statsCacheTime  = 0;

// Cache nav frame par userId (TTL court — 2 min)
const _navCache    = new Map();
const NAV_TTL      = 2 * 60 * 1000;

async function getGlobalStats() {
  if (_statsCache && Date.now() - _statsCacheTime < CACHE_TTL) {
    return _statsCache;
  }
  const [members, recipes, films, avis] = await Promise.all([
    User.count(),
    Recipe.count({ where: { status: "approved" } }),
    Movie.count({ where: { status: "approved" } }),
    Notice.count({ where: { status: "approved", parent_id: null } }),
  ]);
  _statsCache     = { members, recipes, films, avis };
  _statsCacheTime = Date.now();
  return _statsCache;
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
  // Helpers Cloudinary — variantes redimensionnées à la volée (voir cloudinary-url.js)
  res.locals.cldCard        = cldCard;
  res.locals.cldAvatar      = cldAvatar;
  res.locals.cldFull        = cldFull;

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
