import { UserPoints } from "../models/index.model.js";
import { computeLevel, FRAME_UNLOCKS, RANK_TITLES, XP_ACTIONS, isStaffRole, isSuperAdminRole } from "../utils/gamification.utils.js";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
  const contentXP =
    recipes.filter((r) => r.status === "approved").length * XP_ACTIONS.recipe_published +
    movies.filter((m) => m.status === "approved").length * XP_ACTIONS.movie_accepted +
    notices.filter((n) => n.status === "approved").length * XP_ACTIONS.review_approved;

  const [row] = await UserPoints.findOrCreate({
    where: { id_user: userId },
    defaults: { points: contentXP, level_code: computeLevel(contentXP).toString(), active_frame_code: "cine" },
  });

  // Ne jamais réduire les points (les bonus d'actions/login s'accumulent)
  const newPoints = Math.max(row.points, contentXP);
  const level = computeLevel(newPoints);

  if (row.points !== newPoints || row.level_code !== level.toString()) {
    await row.update({ points: newPoints, level_code: level.toString() });
  }

  return { xp: newPoints, level, row };
}

/**
 * Accorde des XP pour une action utilisateur (favoris, avis, etc.).
 * Sans effet pour les comptes admin / superadmin.
 *
 * @param {number} userId
 * @param {string} userRole  - rôle issu du JWT (req.userRole)
 * @param {string} actionCode - clé de XP_ACTIONS
 * @returns {{ xpGained:number, newXP:number, newLevel:number, leveledUp:boolean, rank:string }}
 */
export async function awardActionXP(userId, userRole, actionCode) {
  if (isStaffRole(userRole)) return { xpGained: 0, newXP: 0, newLevel: 0, leveledUp: false, rank: "" };

  const xpGained = XP_ACTIONS[actionCode] ?? 0;
  if (xpGained <= 0) return { xpGained: 0, newXP: 0, newLevel: 0, leveledUp: false, rank: "" };

  const [row] = await UserPoints.findOrCreate({
    where: { id_user: userId },
    defaults: { points: 0, level_code: "1", active_frame_code: "cine" },
  });

  const prevLevel  = computeLevel(row.points);
  const newPoints  = row.points + xpGained;
  const newLevel   = computeLevel(newPoints);
  const leveledUp  = newLevel > prevLevel;

  await row.update({ points: newPoints, level_code: newLevel.toString() });

  return {
    xpGained,
    newXP:    newPoints,
    newLevel,
    leveledUp,
    rank:     RANK_TITLES[newLevel] ?? RANK_TITLES[1],
  };
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
export async function getUserGamificationData(userId, { recipes = [], movies = [], notices = [], isSuperAdmin = false, userRole = "" }) {
  const { xp, level, row } = await syncUserXP(userId, { recipes, movies, notices });

  const rank            = RANK_TITLES[level] ?? RANK_TITLES[1];
  const activeFrameCode = row.active_frame_code ?? "cine";

  // Cadres enrichis — super_admin/superadmin débloque tout, admin reste à son niveau réel
  const allUnlocked = isSuperAdmin || isSuperAdminRole(userRole);
  const frames = FRAME_UNLOCKS.map((f) => ({
    ...f,
    unlocked: allUnlocked || level >= f.minLvl,
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

/**
 * Accorde 3 XP de connexion hebdomadaire si la dernière attribution
 * remonte à plus de 7 jours (ou n'a jamais eu lieu).
 * Idempotent et fire-and-forget friendly.
 * @returns {boolean} true si les XP ont été accordés
 */
export async function awardWeeklyLoginXP(userId) {
  const [row] = await UserPoints.findOrCreate({
    where: { id_user: userId },
    defaults: { points: 0, level_code: "1", active_frame_code: "cine", last_weekly_login_at: null },
  });

  const lastLogin = row.last_weekly_login_at;
  if (lastLogin && Date.now() - new Date(lastLogin).getTime() < ONE_WEEK_MS) {
    return false;
  }

  const newPoints = row.points + XP_ACTIONS.weekly_login;
  const newLevel  = computeLevel(newPoints);
  await row.update({
    points:               newPoints,
    level_code:           newLevel.toString(),
    last_weekly_login_at: new Date(),
  });
  return true;
}

/**
 * Suivi du streak de connexion quotidien.
 * - Connexion quotidienne : incrémente login_streak
 * - Streak atteint 7 : +10 XP et remise à zéro
 * - Interruption (> 1 jour) : reset à 1
 * Idempotent : sans effet si déjà appelé aujourd'hui.
 */
export async function awardDailyLoginXP(userId) {
  const [row] = await UserPoints.findOrCreate({
    where:    { id_user: userId },
    defaults: { points: 0, level_code: "1", active_frame_code: "cine", login_streak: 0 },
  });

  const todayStr     = new Date().toISOString().slice(0, 10);
  const lastStr      = row.last_daily_login_at
    ? new Date(row.last_daily_login_at).toISOString().slice(0, 10)
    : null;

  if (lastStr === todayStr) return { streakDay: row.login_streak, xpGained: 0 };

  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak    = lastStr === yesterdayStr ? row.login_streak + 1 : 1;

  let xpGained   = 0;
  let resetStreak = newStreak;

  if (newStreak >= 7) {
    xpGained   = XP_ACTIONS.streak_7_days;
    resetStreak = 0;
  }

  const newPoints = row.points + xpGained;
  const newLevel  = computeLevel(newPoints);
  await row.update({
    points:              newPoints,
    level_code:          newLevel.toString(),
    login_streak:        resetStreak,
    last_daily_login_at: todayStr,
  });

  return { streakDay: newStreak, xpGained };
}

/**
 * Bonus "première recette du mois" (+20 XP).
 * Appelé quand l'admin approuve une recette.
 * Idempotent : une seule fois par mois civil.
 */
export async function checkFirstRecipeMonth(userId) {
  const [row] = await UserPoints.findOrCreate({
    where:    { id_user: userId },
    defaults: { points: 0, level_code: "1", active_frame_code: "cine" },
  });

  const now      = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = row.last_monthly_recipe_at
    ? new Date(row.last_monthly_recipe_at).toISOString().slice(0, 7)
    : null;

  if (lastMonth === thisMonth) return { xpGained: 0 };

  const xpGained  = XP_ACTIONS.first_recipe_month;
  const newPoints = row.points + xpGained;
  const newLevel  = computeLevel(newPoints);
  await row.update({
    points:                 newPoints,
    level_code:             newLevel.toString(),
    last_monthly_recipe_at: now,
  });

  return { xpGained };
}
