/**
 * contribution-badge.js
 * Logique centralisée des badges de contribution Ciné Délices.
 *
 * Niveaux (recettes validées) :
 *   ≥ 20 → niv5 Legend Superstar    (4 étoiles)
 *   ≥ 15 → niv4 Projecteur d'Or     (3 étoiles)
 *   ≥ 10 → niv3 Clap d'Argent       (2 étoiles)
 *   ≥  5 → niv2 Studio Bronze        (1 étoile)
 *   ≥  1 → niv1 Burger Rookie        (0 étoile)
 *   <  1 → null (pas de badge)
 */

const BADGE_LEVELS = [
  {
    min: 20,
    level: 5,
    stars: 4,
    label: "Legend Superstar",
    image: "/images/badges-contribution/badge-niv5-superstar-legend.png",
    frame: "/images/cadres-contribution/frame-niv5-legend-superstar.png",
    cssClass: "contributor--legend",
  },
  {
    min: 15,
    level: 4,
    stars: 3,
    label: "Projecteur d'Or",
    image: "/images/badges-contribution/badge-niv4-projecteur-or.png",
    frame: "/images/cadres-contribution/frame-niv4-projecteur-or.png",
    cssClass: "contributor--lvl4",
  },
  {
    min: 10,
    level: 3,
    stars: 2,
    label: "Clap d'Argent",
    image: "/images/badges-contribution/badge-niv2-clap-argent.png",
    frame: "/images/cadres-contribution/frame-niv3-clap-argent.png",
    cssClass: "contributor--lvl3",
  },
  {
    min: 5,
    level: 2,
    stars: 1,
    label: "Studio Bronze",
    image: "/images/badges-contribution/badge-niv2-studio-bronze.png",
    frame: "/images/cadres-contribution/frame-niv2-studio-bronze.png",
    cssClass: "contributor--lvl2",
  },
  {
    min: 1,
    level: 1,
    stars: 0,
    label: "Burger Rookie",
    image: "/images/badges-contribution/badge-niv1-popcorn-rookie.png",
    frame: "/images/cadres-contribution/frame-niv1-burger-rookie.png",
    cssClass: "contributor--lvl1",
  },
];

/**
 * Retourne les infos du badge pour un nombre de recettes validées.
 * @param {number} recipeCount - Nombre de recettes validées
 * @returns {{ level, label, image, cssClass } | null}
 */
export function getContributionBadge(recipeCount) {
  return BADGE_LEVELS.find((l) => recipeCount >= l.min) ?? null;
}

/**
 * Construit une map { userId → badge } depuis un tableau de recettes enrichies.
 * Utile pour éviter une requête DB supplémentaire : on compte les recettes déjà
 * chargées (toutes status:true) par contributor.
 *
 * @param {Array} recipes - Recettes enrichies avec recipe.contributor.id
 * @returns {Object} Map userId (number) → badge | null
 */
export function buildContributorBadgesMap(recipes) {
  const counts = {};
  for (const r of recipes) {
    const id = r.contributor?.id;
    if (id) counts[id] = (counts[id] || 0) + 1;
  }
  const map = {};
  for (const [id, count] of Object.entries(counts)) {
    const badge = getContributionBadge(count);
    if (badge) map[Number(id)] = badge;
  }
  return map;
}
