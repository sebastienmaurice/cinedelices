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

import { Recipe, Movie, Notice, UserPoints, UserUniversEquipement } from "../models/index.model.js";
import { buildUnivers, summarize, UNIVERS_DEFINITIONS } from "../utils/collection-mock.js";

const UNIVERS_CODES = UNIVERS_DEFINITIONS.map((u) => u.code);

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
 * Charge l'équipement (Fond/Cadre) réel d'un utilisateur pour tous ses
 * Univers, au format attendu par buildUnivers() : { [code]: {fond, cadre} }.
 * Une seule requête, aucune ligne = aucun équipement pour cet Univers
 * (équivalent à { fond: null, cadre: null }, buildUnivers gère déjà l'absence
 * de clé — cf. `equipements[def.code] || {}`).
 */
async function getUserEquipements(userId) {
  const rows = await UserUniversEquipement.findAll({
    where: { id_user: userId },
    attributes: ["code_univers", "fond_equipe", "cadre_equipe"],
  });
  const equipements = {};
  rows.forEach((row) => {
    equipements[row.code_univers] = { fond: row.fond_equipe || null, cadre: row.cadre_equipe || null };
  });
  return equipements;
}

/**
 * Progression Univers réelle d'un utilisateur — même contrat de sortie
 * que getMockCollectionData(preset) (collection-mock.js), pour que
 * /collection/ n'ait aucune distinction à faire entre réel et mock côté
 * vue.
 *
 * Phase 15 — `universActifCode`/`equipements` sont désormais réellement
 * persistés (user_points.active_univers_code + table
 * user_univers_equipements, Option B validée) — plus de null/{} en dur.
 * Système strictement indépendant de `UserPoints.active_frame_code` (cadre
 * de profil), qu'on ne touche jamais ici.
 *
 * @param {number} userId
 * @returns {Promise<{universList: object[], summary: object}>}
 */
export async function getUserUniverseProgress(userId) {
  const [contributionsByGenre, userPoints, equipements] = await Promise.all([
    getUserContributionsByGenre(userId),
    UserPoints.findOne({ where: { id_user: userId }, attributes: ["active_univers_code"] }),
    getUserEquipements(userId),
  ]);

  const universList = buildUnivers(contributionsByGenre, {
    universActifCode: userPoints?.active_univers_code || null,
    equipements,
  });

  return { universList, summary: summarize(universList) };
}

/**
 * Définit l'Univers actif d'un utilisateur — validation Phase 15 : un
 * Univers "exploré" (>=1 contribution) suffit, pas besoin d'attendre un
 * palier Fond/Cadre. `null` retire l'Univers actif (aucune identité
 * affichée). Ne touche jamais `active_frame_code`.
 *
 * @returns {Promise<{success:boolean, error?:string}>}
 */
export async function setActiveUnivers(userId, code) {
  if (code !== null && !UNIVERS_CODES.includes(code)) {
    return { success: false, error: "univers_inconnu" };
  }
  if (code !== null) {
    const contributionsByGenre = await getUserContributionsByGenre(userId);
    if (!(contributionsByGenre[code] > 0)) {
      return { success: false, error: "univers_non_explore" };
    }
  }
  await UserPoints.update({ active_univers_code: code }, { where: { id_user: userId } });
  return { success: true };
}

/**
 * Équipe un Fond ou un Cadre pour un Univers donné, après revalidation
 * complète du déblocage réel (jamais de confiance dans l'index envoyé par
 * le client) — recalcule l'état de l'Univers à partir des contributions
 * réelles, exactement comme /collection/ le fait pour l'affichage.
 *
 * @param {number} userId
 * @param {"fond"|"cadre"} kind
 * @param {string} code code_univers
 * @param {number} index 1-5 (fond) ou 1-2 (cadre)
 * @returns {Promise<{success:boolean, error?:string}>}
 */
export async function equipUniversReward(userId, kind, code, index) {
  if (!UNIVERS_CODES.includes(code)) return { success: false, error: "univers_inconnu" };
  if (kind !== "fond" && kind !== "cadre") return { success: false, error: "type_invalide" };

  const contributionsByGenre = await getUserContributionsByGenre(userId);
  const [univers] = buildUnivers(contributionsByGenre).filter((u) => u.code === code);
  const list = kind === "fond" ? univers.fonds : univers.cadres;
  const item = list.find((it) => it.index === index);
  if (!item || !item.unlocked) return { success: false, error: "non_debloque" };

  const field = kind === "fond" ? "fond_equipe" : "cadre_equipe";
  const [row] = await UserUniversEquipement.findOrCreate({
    where: { id_user: userId, code_univers: code },
    defaults: { id_user: userId, code_univers: code, [field]: index },
  });
  await row.update({ [field]: index, updated_at: new Date() });
  return { success: true };
}
