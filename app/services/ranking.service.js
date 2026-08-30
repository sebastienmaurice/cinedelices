/**
 * ranking.service.js
 * ─────────────────────────────────────────────────────────────────────
 * Classement public "Top Contributeurs" — Phase 13.
 *
 * Extrait TEL QUEL de app/middlewares/inject-locals.middleware.js (aucun
 * changement de comportement) pour être réutilisé à la fois par :
 *   - le widget public du footer (via inject-locals.middleware.js)
 *   - trophy.service.js (signal de Premier Rôle)
 * Une seule requête, un seul cache, jamais deux définitions du classement.
 *
 * Métrique : nombre de recettes approuvées par utilisateur
 * (`recipes.status = 'approved'`, propriétaire `recipes.id_user`).
 * Rôles admin/superadmin/super_admin exclus. Top 3, `ORDER BY` simple,
 * AUCUN tie-break (ni RANK(), ni tri secondaire) — comportement identique
 * au classement public déjà existant, volontairement conservé tel quel.
 * Cache mémoire 5 minutes (même TTL que le reste de inject-locals).
 */

import { QueryTypes } from "sequelize";
import sequelize from "../database/sequelize-client.js";
import { FRAME_UNLOCKS } from "../utils/gamification.utils.js";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _contribCache     = null;
let _contribCacheTime = 0;

/** Résout l'URL png d'un cadre équipé — utilisé pour l'avatar du widget public. */
export function frameUrl(code) {
  const f = FRAME_UNLOCKS.find((f) => f.code === (code || "cine"));
  return f ? f.pngUrl : FRAME_UNLOCKS[0].pngUrl;
}

/**
 * Top 3 des contributeurs par recettes approuvées — identique en tout
 * point à la requête historique du widget public.
 * @returns {Promise<Array<{id:number, username:string, picture:string, count:number, active_frame_code:string, frameUrl:string}>>}
 */
export async function getTopContributors() {
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
  const enriched = rows.map((r) => ({ ...r, frameUrl: frameUrl(r.active_frame_code) }));
  _contribCache     = enriched;
  _contribCacheTime = Date.now();
  return _contribCache;
}
