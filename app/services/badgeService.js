/**
 * badgeService.js — Système de badges signature Ciné Délices
 *
 * Gère l'attribution des badges signature :
 *  - BIENVENUE  : accordé à l'inscription
 *  - Thématiques: accordés quand une recette approuvée est liée à un film
 *                 dont le slug contient le movie_slug_pattern du badge
 */

import { SignatureBadge, UserSignatureBadge } from "../models/index.model.js";

/**
 * Retourne tous les badges signature disponibles.
 */
export async function getAllSignatureBadges() {
  return SignatureBadge.findAll({ order: [["sort_order", "ASC"]] });
}

/**
 * Retourne les badges débloqués par un utilisateur.
 * @returns {Array<{ badge: SignatureBadge, unlocked_at: Date }>}
 */
export async function getUserUnlockedBadges(userId) {
  return UserSignatureBadge.findAll({
    where: { id_user: userId },
    include: [{ model: SignatureBadge, as: "badge" }],
    order: [["unlocked_at", "DESC"]],
  });
}

/**
 * Accorde un badge à un utilisateur (idempotent — ignore si déjà accordé).
 * @returns {boolean} true si nouveau badge accordé, false si déjà possédé
 */
export async function awardBadge(userId, badgeCode) {
  const badge = await SignatureBadge.findOne({ where: { code: badgeCode } });
  if (!badge) return false;

  const [, created] = await UserSignatureBadge.findOrCreate({
    where: { id_user: userId, id_badge: badge.id },
    defaults: { unlocked_at: new Date() },
  });
  return created;
}

/**
 * Accorde le badge BIENVENUE à l'inscription.
 * Appelé dans auth.controller après création du compte.
 */
export async function awardWelcomeBadge(userId) {
  return awardBadge(userId, "BIENVENUE");
}

/**
 * Vérifie si un film (via son slug) déclenche des badges signature,
 * et les accorde à l'utilisateur si c'est le cas.
 *
 * @param {number} userId
 * @param {string|null} movieSlug — slug du film lié à la recette approuvée
 * @returns {Array<string>} codes des nouveaux badges accordés
 */
export async function checkAndAwardSignatureBadges(userId, movieSlug) {
  if (!movieSlug) return [];

  const badges = await SignatureBadge.findAll();
  const newCodes = [];

  for (const badge of badges) {
    const pattern = badge.movie_slug_pattern;
    // BIENVENUE et patterns spéciaux sont ignorés ici (gérés ailleurs)
    if (pattern.startsWith("__")) continue;
    // Le slug du film doit contenir le pattern (ex: "harry-potter" dans "harry-potter")
    if (movieSlug.includes(pattern)) {
      const granted = await awardBadge(userId, badge.code);
      if (granted) newCodes.push(badge.code);
    }
  }

  return newCodes;
}

/**
 * Construit le tableau complet de badges pour l'affichage profil :
 * tous les badges connus, avec unlocked:bool et unlocked_at.
 *
 * @returns {Array<{
 *   id: number, code: string, label: string, film: string, theme: string,
 *   sort_order: number, unlocked: boolean, unlocked_at: Date|null
 * }>}
 */
export async function getBadgesForProfile(userId) {
  const [all, userBadges] = await Promise.all([
    getAllSignatureBadges(),
    getUserUnlockedBadges(userId),
  ]);

  const unlockedMap = new Map(
    userBadges.map((ub) => [ub.id_badge, ub.unlocked_at])
  );

  return all.map((b) => ({
    id:                  b.id,
    code:                b.code,
    label:               b.label,
    film:                b.film,
    theme:               b.theme,
    sort_order:          b.sort_order,
    movie_slug_pattern:  b.movie_slug_pattern,
    unlocked:            unlockedMap.has(b.id),
    unlocked_at:         unlockedMap.get(b.id) ?? null,
  }));
}
