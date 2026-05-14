/**
 * Configuration centralisée pour Multer (upload de fichiers)
 * Ciné Délices - Refactoring Étape 2
 *
 * Ce module centralise la configuration Multer qui était dupliquée dans
 * upload.middleware.js et upload-movie.middleware.js.
 *
 * Avantages :
 * - Réduction de duplication du fileFilter et des limites
 * - Cohérence des formats acceptés et limites de taille
 * - Facilité de maintenance (modification en un seul endroit)
 */

/**
 * Types MIME autorisés pour les images
 * Utilisé dans le fileFilter pour valider les fichiers uploadés
 */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Taille maximale d'un fichier uploadé (en bytes)
 * Actuellement : 5 MB
 */
export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB par fichier

/**
 * Message d'erreur pour format de fichier non supporté
 */
export const FILE_TYPE_ERROR_MESSAGE =
  "Format de fichier non supporté. Utilisez JPG, JPEG, PNG ou WEBP.";

/**
 * Crée un fileFilter Multer réutilisable
 * Vérifie que le fichier uploadé est un type d'image autorisé
 *
 * @returns {Function} - Fonction fileFilter compatible avec Multer
 *
 * @example
 * const upload = multer({
 *   storage: storage,
 *   fileFilter: createFileFilter(),
 *   limits: { fileSize: MAX_FILE_SIZE }
 * });
 */
export function createFileFilter() {
  return (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(FILE_TYPE_ERROR_MESSAGE), false);
    }
  };
}
