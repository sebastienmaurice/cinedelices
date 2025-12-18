import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Nettoie le nom de fichier pour éviter les caractères problématiques
 * @param {string} filename - Nom de fichier original
 * @returns {string} - Nom de fichier nettoyé
 */
function sanitizeFilename(filename) {
  // Remplacer les espaces par des tirets
  // Supprimer les caractères spéciaux sauf tirets, underscores, points et extensions
  return filename
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

// Configuration du stockage pour les films (admin)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Les images seront stockées dans app/public/images/movies/originals
    const uploadPath = path.join(
      __dirname,
      "../public/images/movies/originals"
    );
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Utiliser le nom original du fichier (l'admin prépare les images avec le nom final)
    // Nettoyer le nom pour éviter les caractères problématiques
    const sanitized = sanitizeFilename(file.originalname);
    cb(null, sanitized);
  },
});

// Refactoring : utilisation du fileFilter centralisé depuis upload-config.js
// Remplace le code dupliqué (lignes 41-59) par un appel à createFileFilter()

// Configuration de Multer pour les films (admin)
const uploadMovie = multer({
  storage: storage,
  fileFilter: createFileFilter(), // Refactoring : fileFilter centralisé
  limits: {
    fileSize: MAX_FILE_SIZE, // Refactoring : limite centralisée
  },
});

export default uploadMovie;
