/**
 * upload-movie.middleware.js — Stockage affiches films via Cloudinary (admin)
 *
 * En production (Render), le filesystem est éphémère.
 * CloudinaryStorage remplace diskStorage : les affiches sont stockées
 * directement sur Cloudinary et l'URL publique est disponible dans req.file.path.
 */

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary-config.js";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "cinedelices/movies",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // Utilise le nom original nettoyé comme public_id pour garder un nom lisible
    public_id: file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase()
      .replace(/\.[^.]+$/, ""), // retire l'extension (Cloudinary la gère)
  }),
});

const uploadMovie = multer({
  storage,
  fileFilter: createFileFilter(),
  limits: { fileSize: MAX_FILE_SIZE },
});

export default uploadMovie;
