import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du stockage pour les recettes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Les images seront stockées dans app/public/images/recipes
    const uploadPath = path.join(__dirname, "../public/images/recipes");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Génération d'un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, "recipe-" + nameWithoutExt + "-" + uniqueSuffix + ext);
  },
});

// Refactoring : utilisation du fileFilter centralisé depuis upload-config.js
// Remplace le code dupliqué (lignes 25-43) par un appel à createFileFilter()

// Configuration de Multer pour les recettes
const upload = multer({
  storage: storage,
  fileFilter: createFileFilter(), // Refactoring : fileFilter centralisé
  limits: {
    fileSize: MAX_FILE_SIZE, // Refactoring : limite centralisée
  },
});

export default upload;
