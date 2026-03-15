/**
 * gamification.service.js
 * =======================
 * Logique métier du système de gamification (Système 1 + Système 2).
 * Toutes les fonctions sont silencieuses en cas d'erreur DB (tables absentes,
 * migration non jouée, etc.) pour ne jamais bloquer le flux principal.
 *
 * Système 1 — Niveau Profil (points)
 *   addPoints(userId, points)          — crédite des points et recalcule le niveau
 *   computeLevel(points)               — retourne le niveau à partir d'un total
 *
 * Système 2 — Badges Signature
 *   checkAndUnlockSignatureBadges(userId, movieSlug) — attribue les badges débloqués
 *
 * Utilitaire middleware
 *   getUserGamificationData(userId)    — snapshot complet pour les templates
 */

import { QueryTypes } from "sequelize";
import sequelize from "../database/sequelize-client.js";
import UserPoints from "../models/userPoints.model.js";

/* ──────────────────────────────────────────────────────────────
   BARÈME (source : gamification v3.0)
────────────────────────────────────────────────────────────── */
export const POINTS = {
  recipe_created:    10,
  film_contributed:   5,
  review_posted:      2,
  favorite_added:     1,
  weekly_login:       1,
};

/* ──────────────────────────────────────────────────────────────
   SEUILS DE NIVEAUX — ordre décroissant pour la recherche
────────────────────────────────────────────────────────────── */
const LEVELS = [
  { code: "legende",     label: "Légende",     min: 200, pct: 100 },
  { code: "realisateur", label: "Réalisateur", min: 100, pct: 75  },
  { code: "acteur",      label: "Acteur",      min: 50,  pct: 50  },
  { code: "second-role", label: "Second Rôle", min: 25,  pct: 25  },
  { code: "figurant",    label: "Figurant",    min: 10,  pct: 5   },
];

/**
 * Calcule le niveau correspondant à un total de points.
 * @param {number} points
 * @returns {{ code, label, min, pct } | null}  null si < 10 pts
 */
export function computeLevel(points) {
  for (const lvl of LEVELS) {
    if (points >= lvl.min) return lvl;
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────
   SYSTÈME 1 — POINTS
────────────────────────────────────────────────────────────── */

/**
 * Ajoute des points à un utilisateur et met à jour son niveau.
 * Crée la ligne user_points si elle n'existe pas encore (upsert).
 * Ne jette jamais d'exception — silencieux si la migration n'a pas été jouée.
 *
 * @param {number} userId
 * @param {number} points  — valeur de POINTS.recipe_created, etc.
 * @returns {Promise<{ points: number, level: object|null } | undefined>}
 */
export async function addPoints(userId, points) {
  if (!userId || !points) return;
  try {
    const [row] = await UserPoints.findOrCreate({
      where: { id_user: userId },
      defaults: { id_user: userId, points: 0, level_code: "figurant" },
    });

    const newTotal = (row.points || 0) + points;
    const level    = computeLevel(newTotal);

    row.points     = newTotal;
    row.level_code = level ? level.code : row.level_code;
    row.updated_at = new Date();
    await row.save();

    return { points: newTotal, level };
  } catch {
    /* Silencieux — ne jamais bloquer le flux principal */
  }
}

/**
 * Attribue +1 pt de connexion hebdomadaire si la dernière attribution
 * remonte à plus de 7 jours. Silencieux si la colonne n'existe pas encore.
 *
 * @param {number} userId
 * @returns {Promise<boolean>}  true si le bonus a été accordé
 */
export async function claimWeeklyLoginBonus(userId) {
  if (!userId) return false;
  try {
    const [row] = await UserPoints.findOrCreate({
      where: { id_user: userId },
      defaults: { id_user: userId, points: 0, level_code: "figurant" },
    });

    const last = row.last_weekly_login_at;
    const now  = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (last && now - new Date(last) < sevenDays) return false;

    const newTotal  = (row.points || 0) + POINTS.weekly_login;
    const level     = computeLevel(newTotal);
    row.points      = newTotal;
    row.level_code  = level ? level.code : row.level_code;
    row.updated_at  = now;
    row.last_weekly_login_at = now;
    await row.save();
    return true;
  } catch {
    return false;
  }
}

/* ──────────────────────────────────────────────────────────────
   SYSTÈME 2 — BADGES SIGNATURE
────────────────────────────────────────────────────────────── */

/**
 * Vérifie si la création d'une recette liée à un film débloque des badges
 * Signature, et les attribue si l'utilisateur ne les possède pas encore.
 *
 * Matching : le slug du film doit contenir le movie_slug_pattern du badge
 *   ex. slug "doctor-strange-2016"  matche pattern "doctor-strange"
 *       slug "harry-potter-et-l-ecole-des-sorciers"  matche "harry-potter"
 *
 * @param {number} userId
 * @param {string} movieSlug  — slug du film lié à la recette
 * @returns {Promise<Array<{ id, code, label }>>}  badges nouvellement débloqués
 */
export async function checkAndUnlockSignatureBadges(userId, movieSlug) {
  if (!userId || !movieSlug) return [];
  try {
    const newBadges = await sequelize.query(
      `SELECT sb.id, sb.code, sb.label
       FROM   signature_badges sb
       WHERE  $1 ILIKE '%' || sb.movie_slug_pattern || '%'
         AND  sb.id NOT IN (
               SELECT id_badge
               FROM   user_signature_badges
               WHERE  id_user = $2
             )`,
      { bind: [movieSlug, userId], type: QueryTypes.SELECT }
    );

    for (const badge of newBadges) {
      await sequelize.query(
        `INSERT INTO user_signature_badges (id_user, id_badge)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        { bind: [userId, badge.id], type: QueryTypes.INSERT }
      );
    }

    return newBadges;
  } catch (err) {
    console.error("[GAMIF] checkAndUnlockSignatureBadges error:", err?.message || err);
    return [];
  }
}

/* ──────────────────────────────────────────────────────────────
   BADGES SPÉCIAUX (déclenchement manuel, sans slug film)
────────────────────────────────────────────────────────────── */

/**
 * Débloque directement un badge par son code (sans matching de slug film).
 * Utilisé pour les badges spéciaux : BIENVENUE (inscription), etc.
 *
 * @param {number} userId
 * @param {string} badgeCode  — ex. 'BIENVENUE'
 * @returns {Promise<boolean>}  true si le badge a été attribué (ou existait déjà)
 */
export async function unlockBadgeByCode(userId, badgeCode) {
  if (!userId || !badgeCode) return false;
  try {
    const [badge] = await sequelize.query(
      `SELECT id FROM signature_badges WHERE code = $1`,
      { bind: [badgeCode], type: QueryTypes.SELECT }
    );
    if (!badge) return false;
    await sequelize.query(
      `INSERT INTO user_signature_badges (id_user, id_badge)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      { bind: [userId, badge.id], type: QueryTypes.INSERT }
    );
    return true;
  } catch {
    return false;
  }
}

/* ──────────────────────────────────────────────────────────────
   UTILITAIRE MIDDLEWARE
────────────────────────────────────────────────────────────── */

/**
 * Snapshot complet des données de gamification d'un utilisateur.
 * Utilisé par inject-locals pour alimenter les templates EJS.
 *
 * @param {number} userId
 * @returns {Promise<{ points, levelCode, levelData, badges: string[] }>}
 */
export async function getUserGamificationData(userId) {
  if (!userId) {
    return { points: 0, levelCode: null, levelData: null, badges: [] };
  }
  try {
    const row      = await UserPoints.findOne({ where: { id_user: userId } });
    const points   = row ? row.points : 0;
    const levelData = computeLevel(points);

    const unlockedBadges = await sequelize.query(
      `SELECT sb.code, sb.label, sb.film, usb.unlocked_at
       FROM   user_signature_badges usb
       JOIN   signature_badges sb ON sb.id = usb.id_badge
       WHERE  usb.id_user = $1
       ORDER  BY sb.sort_order`,
      { bind: [userId], type: QueryTypes.SELECT }
    );

    return {
      points,
      levelCode: levelData ? levelData.code : null,
      levelData,
      badges:     unlockedBadges.map((b) => b.code),
      badgesData: unlockedBadges, // [{ code, label, film, unlocked_at }]
    };
  } catch {
    return { points: 0, levelCode: null, levelData: null, badges: [] };
  }
}
