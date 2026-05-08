/**
 * upload.middleware.js — Upload photos recettes
 *
 * Multer écrit dans le dossier temp de l'OS (/tmp sur Linux/Render).
 * Le contrôleur appelle ensuite recipe-image-processor.js qui :
 *   1. Valide le ratio de l'image avec Sharp
 *   2. Redimensionne et convertit en WebP
 *   3. Upload le résultat sur Cloudinary
 *   4. Supprime le fichier temporaire
 *
 * On ne stocke PLUS dans app/public/images/recipes/ (filesystem éphémère sur Render).
 */

import multer from "multer";
import os from "os";
import path from "path";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

// Stockage temporaire dans le dossier temp de l'OS
// Ce fichier est supprimé par recipe-image-processor.js après traitement
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "recipe-tmp-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: createFileFilter(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// Upload multi-photos pour la création de recette (max 3 fichiers, champ "pictures")
export const uploadRecipePhotos = upload.array("pictures", 3);

export default upload;
