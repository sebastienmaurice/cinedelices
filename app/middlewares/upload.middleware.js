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

// Upload multi-photos pour la création de recette :
//   - "pictures"      : jusqu'à 3 photos principales (galerie), format paysage strict
//   - "stepPicture1"…"stepPicture8" : photos de préparation (optionnelles, 1 champ par
//     emplacement plutôt qu'un tableau — permet d'associer chaque fichier à son numéro
//     d'étape (stepNumber1…stepNumber8) sans ambiguïté même si des emplacements sont
//     laissés vides (un tableau partagé aurait décalé l'ordre).
export const uploadRecipePhotos = upload.fields([
  { name: "pictures", maxCount: 3 },
  { name: "stepPicture1", maxCount: 1 },
  { name: "stepPicture2", maxCount: 1 },
  { name: "stepPicture3", maxCount: 1 },
  { name: "stepPicture4", maxCount: 1 },
  { name: "stepPicture5", maxCount: 1 },
  { name: "stepPicture6", maxCount: 1 },
  { name: "stepPicture7", maxCount: 1 },
  { name: "stepPicture8", maxCount: 1 },
]);

// Upload photos jointes à un avis — jusqu'à 3, cf. NOTICE_MAX_PICTURES dans
// recipes-movie.controllers.js (submitNotice).
export const uploadNoticePhotos = upload.fields([
  { name: "noticePictures", maxCount: 3 },
]);

export default upload;
