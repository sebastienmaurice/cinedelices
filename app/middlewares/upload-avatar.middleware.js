/**
 * upload-avatar.middleware.js
 * Stockage en mémoire → upload manuel vers Cloudinary dans le contrôleur.
 * multer-storage-cloudinary@4 n'est pas compatible avec multer@2.x.
 */

import multer from "multer";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(),
  limits: { fileSize: MAX_FILE_SIZE },
});

export default uploadAvatar;
