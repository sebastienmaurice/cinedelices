import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

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

// Filtre pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
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

// Configuration de Multer pour les films
const uploadMovie = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5 MB
  },
});

export default uploadMovie;
