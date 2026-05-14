/**
 * recipe-image-processor.js
 * Traitement des images uploadées pour les recettes.
 *
 * Workflow :
 *   1. Multer écrit le fichier dans /tmp (os.tmpdir())
 *   2. Sharp lit le fichier, valide le ratio (1.3 – 2.0)
 *   3. Sharp redimensionne en 1200×800 et convertit en WebP
 *   4. Le buffer WebP est uploadé sur Cloudinary
 *   5. Le fichier temporaire est supprimé
 *
 * Retourne une URL Cloudinary sécurisée (https://res.cloudinary.com/...)
 * au lieu d'un chemin local /images/recipes/... (incompatible avec Render).
 */

import sharp from "sharp";
import fs from "fs";
import { uploadBufferToCloudinary } from "./asset-manager.js";

/**
 * Traite un tableau de fichiers Multer — validation ratio + upload Cloudinary.
 * @param {Express.Multer.File[]} files
 * @returns {Promise<{relPath: string, position: number, warning: object|null}[]>}
 */
export async function processRecipeImages(files) {
  const processed = [];

  for (const [idx, file] of files.entries()) {
    // --- Lecture des métadonnées ---
    let meta;
    try {
      meta = await sharp(file.path).metadata();
    } catch (error) {
      console.error("Recipe image invalid metadata:", {
        filename: file.originalname,
        path: file.path,
        error: error.stack || error,
      });
      cleanupFiles([file]);
      const err = new Error("invalid_image");
      err.filename = file.originalname;
      err.originalError = error;
      throw err;
    }

    if (!meta?.width || !meta?.height) {
      console.error("Recipe image invalid dimensions:", {
        filename: file.originalname,
        metadata: meta,
      });
      cleanupFiles([file]);
      const err = new Error("invalid_image");
      err.filename = file.originalname;
      throw err;
    }

    // --- Validation du ratio (1.3 à 2.0) ---
    const ratio = meta.width / meta.height;

    if (ratio < 1.0 || ratio > 3.0) {
      console.warn("Recipe image ratio invalid:", {
        filename: file.originalname,
        ratio,
      });
      cleanupFiles([file]);
      const err = new Error("invalid_image_ratio");
      err.filename = file.originalname;
      err.type = ratio < 1.3 ? "portrait" : "panoramic";
      err.w = meta.width;
      err.h = meta.height;
      err.ratio = ratio;
      throw err;
    }

    const warning =
      Math.abs(ratio - 1.5) > 0.0001
        ? { type: "ratio", w: meta.width, h: meta.height, ratio }
        : null;

    if (warning) {
      console.warn("Recipe image ratio warning:", {
        filename: file.originalname,
        ratio,
      });
    }

    // --- Traitement Sharp → Buffer WebP ---
    let buffer;
    try {
      buffer = await sharp(file.path)
        .resize(1200, 800, { fit: "cover" })
        .webp({ quality: 75 })
        .toBuffer();

      // Supprime le fichier temporaire Multer dès que le buffer est en mémoire
      fs.unlink(file.path, () => {});
    } catch (error) {
      console.error("Recipe image processing failed:", {
        filename: file.originalname,
        error: error.stack || error,
      });
      cleanupFiles([file]);
      const err = new Error("image_processing");
      err.filename = file.originalname;
      err.originalError = error;
      throw err;
    }

    // --- Upload du buffer sur Cloudinary ---
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadBufferToCloudinary(buffer, {
        folder: "cinedelices/recipes",
        // Pas de public_id fixe : Cloudinary génère un ID unique
      });
    } catch (error) {
      console.error("Recipe image Cloudinary upload failed:", {
        filename: file.originalname,
        error: error.stack || error,
      });
      const err = new Error("image_processing");
      err.filename = file.originalname;
      err.originalError = error;
      throw err;
    }

    // cloudinaryResult est l'objet Cloudinary complet (secure_url, public_id, etc.)
    const relPath = cloudinaryResult.secure_url;

    processed.push({
      relPath,
      position: idx + 1,
      warning,
      filename: file.originalname,
    });
  }

  return processed;
}

/** Supprime les fichiers temporaires Multer encore sur disque (nettoyage d'urgence) */
export function cleanupFiles(files) {
  if (!files || files.length === 0) return;
  for (const file of files) {
    const pathToDelete =
      typeof file === "string" ? file : file.outputPath || file.path || null;
    if (pathToDelete && fs.existsSync(pathToDelete)) {
      fs.unlinkSync(pathToDelete);
    }
  }
}
