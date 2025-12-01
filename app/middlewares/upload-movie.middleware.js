/**
 * Middleware d'upload pour les images de films
 * Ciné Délices - PHASE 7
 * Utilise les modules centralisés pour éviter les duplications
 */

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  determineImageFolder,
  IMAGE_TYPES,
  generateRandom,
} from "../utils/image-utils.js";
import {
  createImageFilter,
  MULTER_COMMON_CONFIG,
} from "../utils/upload-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du stockage pour les films
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Utiliser la fonction centralisée pour déterminer le dossier
    const uploadPath = determineImageFolder(IMAGE_TYPES.MOVIE_CARD);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Utiliser la fonction centralisée pour générer un nombre aléatoire
    const random = generateRandom();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    // Note: Le renommage intelligent (slug) sera intégré dans le pipeline
    // Pour l'instant, on garde un nom basé sur le nom original
    cb(null, "movie-" + nameWithoutExt + "-" + random + ext);
  },
});

// Configuration de Multer pour les films
// Utilise les fonctions centralisées pour éviter les duplications
const uploadMovie = multer({
  storage: storage,
  fileFilter: createImageFilter(), // ✅ Fonction centralisée
  ...MULTER_COMMON_CONFIG, // ✅ Configuration centralisée (limites)
});

export default uploadMovie;
