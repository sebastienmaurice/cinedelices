/**
 * Configuration centralisée pour les uploads d'images
 * Ciné Délices - PHASE 6
 *
 * Centralise toutes les configurations communes pour éviter les duplications
 */

/**
 * Types MIME autorisés pour les images
 */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Limite de taille de fichier (5 MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Filtre Multer pour accepter uniquement les images
 * Réutilisable dans tous les middlewares
 */
export function createImageFilter() {
  return (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Format de fichier non supporté. Utilisez JPG, JPEG, PNG ou WEBP."
        ),
        false
      );
    }
  };
}

/**
 * Configuration Multer commune
 * Réutilisable pour créer des middlewares d'upload
 */
export const MULTER_COMMON_CONFIG = {
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};

