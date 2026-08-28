/**
 * frame-banners.js
 * ─────────────────────────────────────────────────────────────────────
 * Association cadre de collection → image(s) de bannière officielle.
 * Fichier isolé, volontairement séparé de gamification.utils.js : aucune
 * règle de déblocage ici, juste des chemins d'images à afficher une fois
 * le cadre déjà débloqué/équipé. Ne JAMAIS mélanger avec les règles XP/
 * niveau/cadre réelles.
 *
 * Chaque cadre a une LISTE (même si un seul fond pour l'instant), pour
 * pouvoir proposer plusieurs variantes plus tard sans changer la structure.
 * La priorité d'affichage (perso > variante choisie > 1ʳᵉ variante du
 * cadre équipé > défaut Ciné Délices) est calculée par resolveHeroBanner
 * ci-dessous, réutilisée telle quelle sur /cinepass/ et /auteur/#id.
 */

export const FRAME_BANNERS = {
  cine:     ["/images/cadres-banners/banner-cine-1.webp"],
  sherlock: ["/images/cadres-banners/banner-sherlock-1.webp"],
  matrix:   ["/images/cadres-banners/banner-matrix-1.webp"],
  indiana:  [
    "/images/cadres-banners/banner-indiana-1.webp",
    "/images/cadres-banners/banner-indiana-2.webp",
  ],
  harry: [
    "/images/cadres-banners/banner-harry-1.webp",
    "/images/cadres-banners/banner-harry-2.webp",
    "/images/cadres-banners/banner-harry-3.webp",
    "/images/cadres-banners/banner-harry-4.webp",
    "/images/cadres-banners/banner-harry-5.webp",
  ],
  strange: [
    "/images/cadres-banners/banner-strange-1.webp",
    "/images/cadres-banners/banner-strange-2.webp",
  ],
  // "none" (Sans cadre) n'a volontairement pas de fond dédié — retombe
  // directement sur le défaut Ciné Délices.
};

/** Première variante officielle du cadre, ou null si le cadre n'en a pas. */
export function getFrameBanner(frameCode) {
  const list = FRAME_BANNERS[frameCode];
  return (list && list[0]) || null;
}

/**
 * Variante choisie (1-based) du fond officiel du cadre, ou la 1ʳᵉ par défaut
 * si aucun choix explicite ou si l'index ne correspond plus au cadre équipé
 * (ex : l'utilisateur avait choisi la variante 4 d'un autre cadre).
 */
export function getFrameBannerVariant(frameCode, variant) {
  const list = FRAME_BANNERS[frameCode];
  if (!list || !list.length) return null;
  const idx = Number.isInteger(variant) && variant >= 1 && variant <= list.length ? variant - 1 : 0;
  return list[idx];
}

/**
 * Résout l'URL de bannière à afficher, même priorité partout
 * (Option A verrouillée avec l'utilisateur) :
 *   1. Bannière perso uploadée et approuvée
 *   2. Variante officielle choisie du cadre équipé (ou la 1ʳᵉ par défaut)
 *   3. Fond par défaut Ciné Délices
 *
 * @param {{ banner_status?: string, banner_image?: string|null, banner?: string|null }} user
 * @param {string} activeFrameCode
 * @param {string} defaultBanner - chemin de l'image de secours Ciné Délices
 * @param {number|null} [activeBannerVariant] - variante choisie (1-based), voir UserPoints.active_banner_variant
 */
export function resolveHeroBanner(user, activeFrameCode, defaultBanner, activeBannerVariant) {
  const personalBanner = user?.banner || user?.banner_image;
  if (user?.banner_status === "approved" && personalBanner) {
    return personalBanner;
  }
  return getFrameBannerVariant(activeFrameCode, activeBannerVariant) || defaultBanner;
}
