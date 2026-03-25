import { UserPoints } from "../models/index.model.js";
import { computeLevel, FRAME_UNLOCKS, RANK_TITLES, XP_ACTIONS } from "../utils/xp.js";

function _statusLabel(status) {
  switch (status) {
    case "approved": return "Approuvé";
    case "pending":  return "En attente";
    case "rejected": return "Refusé";
    default:         return status ?? "";
  }
}

function _timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "À l'instant";
  if (m < 60)  return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `Il y a ${d} j`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `Il y a ${mo} mois`;
  return `Il y a ${Math.floor(mo / 12)} an(s)`;
}

/**
 * Calcule dynamiquement les XP d'un utilisateur depuis ses données existantes
 * et met à jour (upsert) la ligne user_points.
 *
 * XP attribués :
 *   - Recette approuvée : XP_ACTIONS.recipe_published (50)
 *   - Film approuvé     : XP_ACTIONS.movie_accepted   (25)
 *   - Avis approuvé     : XP_ACTIONS.review_approved  (10)
 */
export async function syncUserXP(userId, { recipes = [], movies = [], notices = [] }) {
  const xp =
    recipes.filter((r) => r.status === "approved").length * XP_ACTIONS.recipe_published +
    movies.filter((m) => m.status === "approved").length * XP_ACTIONS.movie_accepted +
    notices.filter((n) => n.status === "approved").length * XP_ACTIONS.review_approved;

  const level = computeLevel(xp);

  const [row] = await UserPoints.findOrCreate({
    where: { id_user: userId },
    defaults: { points: xp, level_code: level.toString(), active_frame_code: "cine" },
  });

  // Mise à jour si différent
  if (row.points !== xp || row.level_code !== level.toString()) {
    await row.update({ points: xp, level_code: level.toString() });
  }

  return { xp, level, row };
}

/**
 * Retourne toutes les données nécessaires à l'onglet #contributions.
 *
 * @returns {{
 *   xp: number,
 *   level: number,
 *   rank: string,
 *   frames: Array,          // tous les cadres avec unlocked:bool
 *   activeFrameCode: string,
 *   activeFrameUrl: string|null,
 *   activity: Array,
 * }}
 */
export async function getUserGamificationData(userId, { recipes = [], movies = [], notices = [], isSuperAdmin = false }) {
  const { xp, level, row } = await syncUserXP(userId, { recipes, movies, notices });

  const rank            = RANK_TITLES[level] ?? RANK_TITLES[1];
  const activeFrameCode = row.active_frame_code ?? "cine";

  // Cadres enrichis avec état débloqué (super_admin débloque tout)
  const frames = FRAME_UNLOCKS.map((f) => ({
    ...f,
    unlocked: isSuperAdmin || level >= f.minLvl,
    isActive: f.code === activeFrameCode,
  }));

  const activeFrame = frames.find((f) => f.code === activeFrameCode) ?? frames[0];

  // Feed d'activité : fusion recipes + movies + notices, triés par date desc
  const activity = [
    ...recipes.map((r) => ({
      type:  "recipe",
      title: r.name,
      sub:   _statusLabel(r.status),
      date:  r.validated_at,
      xp:    XP_ACTIONS.recipe_published,
    })),
    ...movies.map((m) => ({
      type:  "movie",
      title: m.title,
      sub:   _statusLabel(m.status),
      date:  m.validated_at,
      xp:    XP_ACTIONS.movie_accepted,
    })),
    ...notices.map((n) => ({
      type:  "notice",
      title: typeof n.content === "string" ? n.content.slice(0, 60) : "Avis",
      sub:   _statusLabel(n.status),
      date:  n.validated_at,
      xp:    XP_ACTIONS.review_approved,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
    .map((a) => ({ ...a, time: _timeAgo(a.date) }));

  return {
    xp,
    level,
    rank,
    frames,
    activeFrameCode,
    activeFrameUrl: activeFrame?.pngUrl ?? null,
    activity,
  };
}
