/**
 * cloudinary-url.js
 * Génère des variantes optimisées d'une URL Cloudinary existante, à la volée,
 * via les transformations d'URL Cloudinary — sans re-upload ni traitement Sharp.
 *
 * Contexte : les images de recettes sont uploadées une seule fois en 1200×800 WebP
 * (voir recipe-image-processor.js) et cette même URL "pleine taille" est ensuite
 * réutilisée telle quelle pour les vignettes de cartes (grilles, accueil, page auteur),
 * qui n'affichent l'image qu'à ~300-400px de large. Sur mobile, ça fait télécharger
 * inutilement l'image en pleine résolution pour un affichage minuscule.
 *
 * cldCard()/cldThumb() insèrent une transformation "w_<n>,q_auto,f_auto,c_fill"
 * dans l'URL — Cloudinary génère et met en cache la variante à la demande.
 * Les URLs locales (/images/...) ou non-Cloudinary sont retournées inchangées
 * (pas d'effet en dev, ou pour les images statiques).
 */

const UPLOAD_MARKER = "/upload/";

function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com") && url.includes(UPLOAD_MARKER);
}

/**
 * Insère une transformation dans une URL Cloudinary.
 * @param {string} url - URL Cloudinary (secure_url)
 * @param {number} [width] - Largeur cible en px ; omis = pas de redimensionnement
 * @returns {string} URL transformée (ou l'URL d'origine si non-Cloudinary)
 */
export function cldOptimize(url, width) {
  if (!isCloudinaryUrl(url)) return url;
  const transform = width
    ? `w_${width},q_auto,f_auto,c_fill`
    : "q_auto,f_auto";
  return url.replace(UPLOAD_MARKER, `${UPLOAD_MARKER}${transform}/`);
}

/** Vignette de carte (grilles de recettes, accueil, page auteur) — ~2x un affichage 300px. */
export function cldCard(url) {
  return cldOptimize(url, 600);
}

/** Petit avatar (contributeurs, commentaires). */
export function cldAvatar(url) {
  return cldOptimize(url, 120);
}

/** Image pleine taille (détail recette) — pas de redimensionnement, juste qualité/format auto. */
export function cldFull(url) {
  return cldOptimize(url);
}
