/**
 * universe.service.js
 * ─────────────────────────────────────────────────────────────────────
 * Phase 10 — calcul RÉEL de la progression par Univers (Ma Collection).
 *
 * Ne réimplémente RIEN de la logique de jeu : `computeUniversState`,
 * `buildUnivers`, `summarize`, les seuils Fonds/Cadres et les noms
 * restent exclusivement dans app/utils/collection-mock.js (exportés pour
 * l'occasion, logique inchangée). Ce service ne fournit qu'une seule
 * chose de nouveau : le nombre RÉEL de contributions par genre, à la
 * place des préréglages fictifs des presets `?mock=`.
 *
 * Définition d'une contribution Univers (verrouillée par le Game Design,
 * Phase 10) : chaque recette approuvée, film approuvé et avis approuvé
 * vaut exactement +1 dans le genre du film associé — aucune pondération
 * différente, aucun genre secondaire (movies.genre est un scalaire
 * unique, cf. audit Phase 10 §5 : le cas multi-genre ne peut pas se
 * produire avec le schéma actuel).
 *
 * 3 requêtes au total (jamais de N+1, un utilisateur = un calcul) :
 *   A. Recipe  → Movie  → genre   (recettes approuvées)
 *   B. Movie   → genre            (films approuvés)
 *   C. Notice  → Recipe → Movie   (avis approuvés)
 * Le regroupement par genre est fait côté application (JS) plutôt qu'en
 * SQL group-by-sur-jointure — plus simple et plus sûr avec les alias
 * d'association Sequelize par défaut du projet, pour un volume de
 * données par utilisateur qui reste de toute façon minime (quelques
 * dizaines de lignes maximum). Aucune ligne orpheline ne peut fausser le
 * compte : `required: true` sur chaque include exclut les lignes dont la
 * référence (id_movie/id_recipe) est NULL ou invalide.
 */

import { Recipe, Movie, Notice } from "../models/index.model.js";
import { buildUnivers, summarize } from "../utils/collection-mock.js";

/**
 * Contributions réelles d'un utilisateur, par genre — uniquement les
 * genres qui portent effectivement un Univers (les 15 de
 * UNIVERS_DEFINITIONS). Une contribution dans un genre hors Univers
 * (documentaire/familial/mystère/téléfilm) est ignorée ici, exactement
 * comme documenté dans collection-mock.js : elle existe, mais n'alimente
 * aucun Univers de Ma Collection.
 *
 * @param {number} userId
 * @returns {Promise<Record<string, number>>} ex. { horreur: 7, action: 3 }
 */
export async function getUserContributionsByGenre(userId) {
  const counts = {};
  const add = (genre) => {
    if (!genre) return;
    counts[genre] = (counts[genre] || 0) + 1;
  };

  const [recipes, movies, notices] = await Promise.all([
    // A. Recettes approuvées de l'utilisateur → genre du film associé
    Recipe.findAll({
      where: { id_user: userId, status: "approved" },
      include: [{ model: Movie, attributes: ["genre"], required: true }],
      attributes: ["id"],
    }),
    // B. Films approuvés de l'utilisateur → son propre genre
    Movie.findAll({
      where: { id_user: userId, status: "approved" },
      attributes: ["genre"],
      raw: true,
    }),
    // C. Avis approuvés de l'utilisateur → genre du film via la recette liée
    // ⚠️ `attributes: ["id"]` sur l'include Recipe est nécessaire, pas
    // cosmétique : un `attributes: []` intermédiaire empêche Sequelize de
    // hydrater correctement l'objet imbriqué (n.Recipe revient `undefined`
    // même quand la ligne existe réellement) — vérifié en isolant le bug.
    Notice.findAll({
      where: { id_user: userId, status: "approved" },
      include: [
        {
          model: Recipe,
          attributes: ["id"],
          required: true,
          include: [{ model: Movie, attributes: ["genre"], required: true }],
        },
      ],
      attributes: ["id"],
    }),
  ]);

  recipes.forEach((r) => add(r.Movie?.genre));
  movies.forEach((m) => add(m.genre));
  notices.forEach((n) => add(n.Recipe?.Movie?.genre));

  return counts;
}

/**
 * Progression Univers réelle d'un utilisateur — même contrat de sortie
 * que getMockCollectionData(preset) (collection-mock.js), pour que
 * /collection/ n'ait aucune distinction à faire entre réel et mock côté
 * vue. `universActifCode`/`equipements` restent null/{} pour un vrai
 * utilisateur (Game Design Phase 10 §2) : aucune préférence d'Univers
 * actif ni d'équipement Fond/Cadre n'est encore persistée nulle part —
 * ce n'est PAS le même système que `UserPoints.active_frame_code` (cadre
 * de profil réel), qu'on ne touche pas ici.
 *
 * @param {number} userId
 * @returns {Promise<{universList: object[], summary: object}>}
 */
export async function getUserUniverseProgress(userId) {
  const contributionsByGenre = await getUserContributionsByGenre(userId);

  const universList = buildUnivers(contributionsByGenre, {
    universActifCode: null,
    equipements: {},
  });

  return { universList, summary: summarize(universList) };
}
