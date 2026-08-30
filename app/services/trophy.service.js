/**
 * trophy.service.js
 * ─────────────────────────────────────────────────────────────────────
 * Moteur de vérification des trophées — Phase 9 (9 trophées de base) +
 * Phase 11 (4 trophées Univers) + Phase 12 (2 trophées sociaux) +
 * Phase 13 (Premier Rôle) + Phase 14 (Ticket d'Or), Ma Collection.
 *
 * Périmètre STRICT : seuls les 17 trophées listés dans REAL_TROPHY_CODES
 * sont calculés ici. Le seul autre (Empreinte Éternelle) reste 100%
 * piloté par `MOCK_BADGES.unlocked` — ni lu ni écrit par ce service (aucune
 * date de création de compte exploitable, cf. audit Phase 14 : reste
 * volontairement non implémenté, `users` non modifié).
 *
 * Architecture :
 *   MOCK_BADGES (référentiel : conditionType/target) → moteur générique
 *   ci-dessous → UserTrophy (état réel par utilisateur)
 * Piloté par le référentiel plutôt que 17 fonctions dupliquées : chaque
 * trophée ne définit qu'un "signal" (la donnée à comparer), `isConditionMet`
 * applique ensuite la règle générique du `conditionType` déjà déclaré
 * dans MOCK_BADGES (COUNT et THRESHOLD partagent la même comparaison
 * `valeur >= target` — aucune distinction fonctionnelle entre les deux
 * n'a été nécessaire pour les 16 trophées à signal). Studio Bronze
 * (COMBINATION) et Ticket d'Or (dépend des AUTRES trophées, pas d'un
 * signal) sortent de ce moteur générique — deux cas uniques, pas besoin
 * d'un système générique de combinaisons pour ça.
 *
 * Phase 11 — signaux Univers : réutilisent `getUserContributionsByGenre`
 * de universe.service.js (AUCUNE nouvelle requête Recipe/Movie/Notice
 * écrite ici) pour Clap d'Argent, Réalisateur du Goût, Palme du Palais et
 * Projecteur d'Or. Seuls les genres qui portent réellement un Univers
 * (UNIVERS_DEFINITIONS, 15 codes) comptent — un genre hors Univers
 * (documentaire/familial/mystère/téléfilm) contribue au compteur global
 * mais jamais à "nombre d'Univers différents".
 * "Atteindre la Spécialisation/Maîtrise" (Réalisateur du Goût/Palme du
 * Palais) est interprété comme un jalon permanent une fois franchi
 * (contributions >= 5 ou >= 10, à vie), pas comme "être ACTUELLEMENT
 * dans cet état" — cohérent avec la règle déjà verrouillée du projet
 * "une récompense acquise reste acquise" (un Univers qui dépasse ensuite
 * la Maîtrise reste éligible à Réalisateur du Goût, il ne "perd" pas la
 * Spécialisation qu'il a traversée). Formules explicitement données par
 * l'utilisateur (Phase 8 §15, redonnées identiques en Phase 10 §15) :
 * Clap d'Argent = count(univers.contributions>=1)>=5,
 * Projecteur d'Or = count(univers.contributions>=1)>=10,
 * Réalisateur du Goût = exists(univers.contributions>=5),
 * Palme du Palais = exists(univers.contributions>=10).
 *
 * Phase 12 — signaux sociaux : Recette Culte (favoris reçus sur UNE
 * recette précise) et Superstar du Palais (likes+favoris cumulés reçus
 * sur l'ensemble des contenus) réutilisent les tables déjà existantes
 * `Favorite` (polymorphique movie/recipe) et `NoticeLike` (avis), sur les
 * `recipes`/`movies`/`notices` déjà chargés dans computeSignals — aucune
 * nouvelle requête par contenu (pas de N+1), 3 requêtes groupées de plus.
 * Une auto-interaction (l'auteur qui like/favorite son propre contenu)
 * n'est jamais comptée comme reçue — aucune règle DB ne l'empêche
 * (vérifié : `favorites.controllers.js`/`notices.controllers.js` ne
 * bloquent pas la création, ils excluent seulement l'auteur du gain d'XP
 * `like_received` — même principe repris ici, filtré en application).
 *
 * Phase 13 — Premier Rôle : réutilise TEL QUEL le classement public
 * "Top Contributeurs" (`ranking.service.js:getTopContributors`, extrait
 * de `inject-locals.middleware.js` — même requête, même cache, même
 * comportement pour le widget public et pour ce service). Aucune
 * deuxième définition du classement. Jalon PERMANENT : une fois
 * `UserTrophy("premier-role")` créé, il n'est jamais supprimé même si
 * l'utilisateur ressort ensuite du Top 3 (mécanisme déjà garanti par
 * `checkUserTrophies`, qui ne revérifie jamais un code déjà débloqué).
 * Aucun tie-break ajouté — le classement du widget public n'en a pas
 * (simple `ORDER BY ... DESC LIMIT 3`), volontairement reproduit tel quel.
 *
 * Phase 14 — Ticket d'Or (Option B validée) : débloqué quand tous les
 * AUTRES trophées réels sont obtenus (16 actuellement : REAL_TROPHY_CODES
 * moins lui-même) — PAS "les 17 du référentiel MOCK_BADGES", pour ne pas
 * bloquer indéfiniment sur Empreinte Éternelle, qui reste mock (aucune
 * date de création de compte exploitable, cf. audit Phase 14). Le calcul
 * `REQUIRED_FOR_TICKET_D_OR = REAL_TROPHY_CODES sans lui-même` est
 * dynamique : si Empreinte Éternelle rejoint un jour REAL_TROPHY_CODES,
 * elle rejoint automatiquement l'ensemble requis sans toucher cette
 * logique. Contrairement aux 16 autres, Ticket d'Or ne dépend d'AUCUN
 * signal utilisateur (computeSignals) mais de l'état des autres trophées
 * — il est donc exclu de la boucle générique `isConditionMet` et évalué
 * séparément, en fin de `checkUserTrophies`, sur l'union mémoire de
 * `unlockedSet` (déjà chargé) et `newlyUnlocked` (juste calculé) : zéro
 * requête supplémentaire, zéro récursion, zéro second appel complet — et
 * le 16ᵉ trophée et Ticket d'Or peuvent être débloqués dans le MÊME appel.
 * Jalon PERMANENT comme les 16 autres (même mécanisme `findOrCreate` +
 * contrainte UNIQUE). Reste SECRET côté vue tant que non obtenu — aucune
 * donnée de MOCK_BADGES (label/condition/target/catégorie) n'a été
 * modifiée pour cette phase.
 *
 * xpReward est ignoré volontairement : les trophées ne donnent JAMAIS
 * d'XP (Game Design verrouillé), aucun appel à awardActionXP/syncUserXP
 * ici.
 */

import { Recipe, Movie, Notice, Rating, UserPoints, UserTrophy, Favorite, NoticeLike } from "../models/index.model.js";
import { MOCK_BADGES } from "../utils/cinepass-mock.js";
import { getUserContributionsByGenre } from "./universe.service.js";
import { getTopContributors } from "./ranking.service.js";
import { UNIVERS_DEFINITIONS } from "../utils/collection-mock.js";

/** Les 9 codes du Groupe A (Phase 9) — conservé pour traçabilité historique. */
export const GROUP_A_CODES = [
  "premier-clap",
  "avis-a-chaud",
  "toque-debutante",
  "burger-rookie",
  "cine-popcorn",
  "studio-bronze",
  "nez-fin",
  "etoile-du-cine-delices",
  "icone-du-cine-delices",
];

/** Les 4 codes Univers rendus réels en Phase 11 — liste fermée, ne pas étendre sans validation. */
export const UNIVERSE_TROPHY_CODES = [
  "clap-d-argent",
  "realisateur-du-gout",
  "palme-du-palais",
  "projecteur-d-or",
];

/** Les 2 codes sociaux rendus réels en Phase 12 — liste fermée. */
export const SOCIAL_TROPHY_CODES = [
  "recette-culte",
  "superstar-du-palais",
];

/** Le code classement rendu réel en Phase 13 — liste fermée. */
export const RANKING_TROPHY_CODES = [
  "premier-role",
];

/**
 * Le code Ticket d'Or, rendu réel en Phase 14 — cas unique, pas de
 * signal utilisateur (dépend des AUTRES trophées réels, cf. docstring
 * de fichier ci-dessus et REQUIRED_FOR_TICKET_D_OR plus bas).
 */
export const TICKET_D_OR_CODE = "ticket-d-or";

/** Les 17 codes réellement calculés par ce service, tous confondus. */
export const REAL_TROPHY_CODES = [...GROUP_A_CODES, ...UNIVERSE_TROPHY_CODES, ...SOCIAL_TROPHY_CODES, ...RANKING_TROPHY_CODES, TICKET_D_OR_CODE];

/**
 * Les codes requis pour débloquer Ticket d'Or — tous les trophées réels
 * SAUF lui-même. Dynamique par construction (dérivé de REAL_TROPHY_CODES,
 * jamais une liste ni un nombre écrits en dur) : si Empreinte Éternelle
 * devient réelle un jour et rejoint REAL_TROPHY_CODES, elle rejoint
 * automatiquement cet ensemble sans modifier cette ligne (Option B,
 * validée Phase 14).
 */
const REQUIRED_FOR_TICKET_D_OR = REAL_TROPHY_CODES.filter((code) => code !== TICKET_D_OR_CODE);

const UNIVERS_CODES = UNIVERS_DEFINITIONS.map((u) => u.code);

/** Quel signal (calculé plus bas) chaque trophée réel doit comparer à son `target`. */
const SIGNAL_BY_CODE = {
  "premier-clap": "totalApproved",
  "avis-a-chaud": "noticesApproved",
  "toque-debutante": "recipesApproved",
  "burger-rookie": "recipesApproved",
  "cine-popcorn": "moviesApproved",
  "nez-fin": "ratingsCount",
  "etoile-du-cine-delices": "level",
  "icone-du-cine-delices": "totalApproved",
  "clap-d-argent": "universesDiscovered",
  "projecteur-d-or": "universesDiscovered",
  "realisateur-du-gout": "hasSpecialisationUnivers",
  "palme-du-palais": "hasMaitriseUnivers",
  "recette-culte": "maxFavoritesOnOneRecipe",
  "superstar-du-palais": "totalSocialInteractions",
  "premier-role": "isInTopContributors",
};

/**
 * Calcule les signaux réels d'un utilisateur — une seule série de
 * requêtes, réutilisée pour les 16 conditions (pas une requête par
 * trophée). Mêmes règles de statut que le reste du projet : "validée" =
 * `status === "approved"` (cf. syncUserXP, contributions.controller.js).
 *
 * Les signaux Univers (Phase 11) viennent de
 * `universe.service.js:getUserContributionsByGenre` — aucune requête
 * Recipe/Movie/Notice groupée par genre n'est réécrite ici.
 */
async function computeSignals(userId) {
  const [recipes, movies, notices, ratingsCount, userPoints, contributionsByGenre, topContributors] = await Promise.all([
    Recipe.findAll({ where: { id_user: userId }, attributes: ["id", "status"] }),
    Movie.findAll({ where: { id_user: userId }, attributes: ["id", "status"] }),
    Notice.findAll({ where: { id_user: userId }, attributes: ["id", "status"] }),
    Rating.count({ where: { id_user: userId } }),
    UserPoints.findOne({ where: { id_user: userId } }),
    getUserContributionsByGenre(userId),
    getTopContributors(),
  ]);

  const recipesApproved = recipes.filter((r) => r.status === "approved").length;
  const moviesApproved  = movies.filter((m) => m.status === "approved").length;
  const noticesApproved = notices.filter((n) => n.status === "approved").length;

  // Seuls les genres qui portent réellement un Univers comptent pour les
  // signaux "nombre d'Univers" — un genre hors Univers (documentaire...)
  // n'est structurellement pas un Univers, même s'il a des contributions.
  const universContribCounts = Object.entries(contributionsByGenre)
    .filter(([genre]) => UNIVERS_CODES.includes(genre))
    .map(([, count]) => count);

  // Phase 12 — signaux sociaux. Uniquement sur du contenu VALIDÉ (les
  // favoris/likes possibles sur un contenu encore en attente ne comptent
  // pas, même si rien en base n'empêche techniquement leur création).
  const approvedRecipeIds = recipes.filter((r) => r.status === "approved").map((r) => r.id);
  const approvedMovieIds  = movies.filter((m) => m.status === "approved").map((m) => m.id);
  const approvedNoticeIds = notices.filter((n) => n.status === "approved").map((n) => n.id);

  const [recipeFavorites, movieFavorites, noticeLikes] = await Promise.all([
    approvedRecipeIds.length
      ? Favorite.findAll({ where: { entity_type: "recipe", entity_id: approvedRecipeIds }, attributes: ["id_user", "entity_id"] })
      : [],
    approvedMovieIds.length
      ? Favorite.findAll({ where: { entity_type: "movie", entity_id: approvedMovieIds }, attributes: ["id_user"] })
      : [],
    approvedNoticeIds.length
      ? NoticeLike.findAll({ where: { id_notice: approvedNoticeIds }, attributes: ["id_user"] })
      : [],
  ]);

  // Une auto-interaction (l'auteur qui like/favorite son propre contenu)
  // n'est jamais une interaction "reçue" — exclue ici, pas en SQL, pour
  // rester lisible (volume par utilisateur toujours minime).
  const recipeFavoritesReal = recipeFavorites.filter((f) => f.id_user !== userId);
  const movieFavoritesReal  = movieFavorites.filter((f) => f.id_user !== userId);
  const noticeLikesReal     = noticeLikes.filter((l) => l.id_user !== userId);

  // Recette Culte : le meilleur score sur UNE recette précise, pas un cumul.
  const favoritesByRecipe = {};
  recipeFavoritesReal.forEach((f) => {
    favoritesByRecipe[f.entity_id] = (favoritesByRecipe[f.entity_id] || 0) + 1;
  });
  const maxFavoritesOnOneRecipe = Object.values(favoritesByRecipe).reduce((max, c) => Math.max(max, c), 0);

  // Superstar du Palais : cumul likes (avis) + favoris (films + recettes),
  // toutes contenus confondus — formule donnée telle quelle en Phase 9 §5.
  const totalSocialInteractions = recipeFavoritesReal.length + movieFavoritesReal.length + noticeLikesReal.length;

  return {
    recipesApproved,
    moviesApproved,
    noticesApproved,
    totalApproved: recipesApproved + moviesApproved + noticesApproved,
    ratingsCount,
    // level_code est stocké en string (cf. UserPoints.model.js) ; niveau 1 par défaut si la ligne n'existe pas encore
    level: userPoints ? parseInt(userPoints.level_code, 10) || 1 : 1,
    // Toute clé présente dans contributionsByGenre a par construction
    // contributions >= 1 (voir universe.service.js) — donc le nombre de
    // clés (une fois filtré aux vrais Univers) = nombre d'Univers découverts.
    universesDiscovered: universContribCounts.length,
    hasSpecialisationUnivers: universContribCounts.some((c) => c >= 5) ? 1 : 0,
    hasMaitriseUnivers: universContribCounts.some((c) => c >= 10) ? 1 : 0,
    maxFavoritesOnOneRecipe,
    totalSocialInteractions,
    // Phase 13 — Premier Rôle : présence dans le Top 3 public au moment de
    // CET appel. Le jalon devient permanent une fois débloqué (voir
    // checkUserTrophies, qui ne revérifie jamais un code déjà obtenu) —
    // ressortir du Top 3 ensuite ne retire jamais le trophée déjà acquis.
    isInTopContributors: topContributors.some((c) => c.id === userId) ? 1 : 0,
  };
}

/**
 * Applique la règle du `conditionType` déclaré dans MOCK_BADGES pour un
 * trophée réel. Studio Bronze (COMBINATION) est le seul cas spécial —
 * condition ET stricte, les avis ne comptent pas pour lui.
 */
export function isConditionMet(badge, signals) {
  if (badge.code === "studio-bronze") {
    return signals.recipesApproved >= 3 && signals.moviesApproved >= 3;
  }

  const value = signals[SIGNAL_BY_CODE[badge.code]];

  if (badge.conditionType === "BINARY") return value >= 1;
  // THRESHOLD et COUNT partagent la même comparaison générique — les 13
  // trophées réels n'ont jamais eu besoin d'une règle différente pour COUNT.
  if (badge.conditionType === "THRESHOLD" || badge.conditionType === "COUNT") return value >= badge.target;

  // COMBINATION(générique)/SECRET : aucun trophée réel n'utilise ce
  // chemin (Studio Bronze est intercepté ci-dessus) — gardé explicite
  // plutôt que de deviner une règle non demandée.
  return false;
}

/**
 * Vérifie les 17 conditions réelles pour un utilisateur, débloque les
 * trophées nouvellement atteints, et retourne ceux-ci.
 *
 * Idempotent : rappeler la fonction plusieurs fois ne crée jamais de
 * doublon — protégé par la contrainte UNIQUE(id_user, trophy_code) en
 * base (voir migration), pas seulement par un `if (!exists)` applicatif.
 * `findOrCreate` s'appuie sur cette contrainte réelle pour rester correct
 * même en cas d'appels concurrents (cf. doc Sequelize : en cas de
 * violation de contrainte unique pendant l'insertion, `findOrCreate`
 * retente un `findOne` au lieu d'échouer).
 *
 * Phase 14 — Ticket d'Or est exclu de la boucle générique (aucun signal
 * ne le concerne) et évalué en dernier, sur l'union mémoire de
 * `unlockedSet` (état avant cet appel) et `newlyUnlocked` (ce qui vient
 * d'être débloqué DANS cet appel) — ce qui permet à Ticket d'Or d'être
 * débloqué au même appel que le dernier trophée requis, sans second
 * appel à checkUserTrophies ni récursion. `computeSignals` n'est même
 * pas appelé si Ticket d'Or est la seule chose encore en attente (aucune
 * requête inutile).
 *
 * @param {number} userId
 * @returns {Promise<string[]>} codes des trophées nouvellement débloqués
 */
export async function checkUserTrophies(userId) {
  const alreadyUnlocked = await UserTrophy.findAll({
    where: { id_user: userId, trophy_code: REAL_TROPHY_CODES },
    attributes: ["trophy_code"],
  });
  const unlockedSet = new Set(alreadyUnlocked.map((row) => row.trophy_code));

  const pendingCodes = REAL_TROPHY_CODES.filter((code) => !unlockedSet.has(code));
  if (pendingCodes.length === 0) return [];

  // Ticket d'Or ne dépend d'aucun signal — seuls les 16 autres codes
  // éventuellement en attente ont besoin de computeSignals.
  const otherPendingCodes = pendingCodes.filter((code) => code !== TICKET_D_OR_CODE);
  const signals = otherPendingCodes.length ? await computeSignals(userId) : null;
  const newlyUnlocked = [];

  for (const code of otherPendingCodes) {
    const badge = MOCK_BADGES.find((b) => b.code === code);
    if (!badge || !isConditionMet(badge, signals)) continue;

    const [, created] = await UserTrophy.findOrCreate({
      where: { id_user: userId, trophy_code: code },
      defaults: { id_user: userId, trophy_code: code, unlocked_at: new Date() },
    });
    if (created) newlyUnlocked.push(code);
  }

  // Ticket d'Or (Option B) : débloqué quand tous les autres trophées
  // réels sont obtenus — état avant cet appel (unlockedSet) UNION ce qui
  // vient d'être débloqué DANS cet appel (newlyUnlocked), jamais un
  // deuxième appel complet ni une récursion. Jalon permanent : si déjà
  // obtenu, `unlockedSet.has(...)` est vrai et ce bloc ne fait rien.
  if (!unlockedSet.has(TICKET_D_OR_CODE)) {
    const finalUnlockedSet = new Set([...unlockedSet, ...newlyUnlocked]);
    const allRequiredObtained = REQUIRED_FOR_TICKET_D_OR.every((code) => finalUnlockedSet.has(code));
    if (allRequiredObtained) {
      const [, created] = await UserTrophy.findOrCreate({
        where: { id_user: userId, trophy_code: TICKET_D_OR_CODE },
        defaults: { id_user: userId, trophy_code: TICKET_D_OR_CODE, unlocked_at: new Date() },
      });
      if (created) newlyUnlocked.push(TICKET_D_OR_CODE);
    }
  }

  return newlyUnlocked;
}

/**
 * Retourne l'ensemble des codes de trophées réellement obtenus par
 * l'utilisateur (tous codes confondus, pas seulement REAL_TROPHY_CODES —
 * la table ne contiendra de toute façon jamais que ces codes-là tant que
 * les autres phases n'existent pas). Utilisé par collection.controller.js
 * pour fusionner avec le référentiel MOCK_BADGES.
 *
 * @param {number} userId
 * @returns {Promise<Set<string>>}
 */
export async function getUserTrophyCodes(userId) {
  const rows = await UserTrophy.findAll({
    where: { id_user: userId },
    attributes: ["trophy_code"],
  });
  return new Set(rows.map((row) => row.trophy_code));
}
