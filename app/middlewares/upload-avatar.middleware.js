/**
 * upload-avatar.middleware.js — Stockage avatars via Cloudinary
 *
 * En production (Render), le filesystem est éphémère.
 * CloudinaryStorage remplace diskStorage : les avatars sont stockés
 * directement sur Cloudinary et l'URL publique est disponible dans req.file.path.
 */

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary-config.js";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "cinedelices/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // Transformation automatique : carré 400×400
    transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
  },
});

const uploadAvatar = multer({
  storage,
  fileFilter: createFileFilter(),
  limits: { fileSize: MAX_FILE_SIZE },
});

export default uploadAvatar;
