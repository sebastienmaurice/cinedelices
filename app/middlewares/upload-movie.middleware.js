/**
 * upload-movie.middleware.js
 * Stockage en mémoire → upload manuel vers Cloudinary dans le contrôleur.
 */

import multer from "multer";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

const uploadMovie = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(),
  limits: { fileSize: MAX_FILE_SIZE },
});

export default uploadMovie;
