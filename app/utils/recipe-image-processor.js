/**
 * Traitement des images uploadées pour les recettes
 * - Validation du ratio 3:2 (tolérance ±15%)
 * - Redimensionnement à 1600px max (sans agrandir)
 * - En production : conversion WebP qualité 75
 * - En développement : compression en mémoire, format conservé
 *
 * Partagé par add-recipes-movies.controllers.js et auth.controller.js
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";

/**
 * Traite un tableau de fichiers Multer.
 * @param {Express.Multer.File[]} files
 * @returns {Promise<{relPath: string, position: number}[]>}
 */
export async function processRecipeImages(files) {
  const isProduction = process.env.NODE_ENV === "production";
  const processed = [];

  for (const [idx, file] of files.entries()) {
    let meta;
    try {
      meta = await sharp(file.path).metadata();
    } catch (error) {
      console.error("Recipe image invalid image metadata:", {
        filename: file.originalname,
        path: file.path,
        size: file.size,
        error: error.stack || error,
      });
      cleanupFiles([file]);
      const err = new Error("invalid_image");
      err.filename = file.originalname;
      err.originalError = error;
      throw err;
    }

    if (!meta?.width || !meta?.height) {
      console.error("Recipe image invalid metadata dimensions:", {
        filename: file.originalname,
        path: file.path,
        size: file.size,
        metadata: meta,
      });
      cleanupFiles([file]);
      const err = new Error("invalid_image");
      err.filename = file.originalname;
      throw err;
    }

    const ratio = meta.width / meta.height;

    if (ratio < 1.3 || ratio > 2.0) {
      console.warn("Recipe image ratio invalid:", {
        filename: file.originalname,
        path: file.path,
        size: file.size,
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
        ? {
            type: "ratio",
            w: meta.width,
            h: meta.height,
            ratio,
          }
        : null;

    if (warning) {
      console.warn("Recipe image ratio warning:", {
        filename: file.originalname,
        path: file.path,
        size: file.size,
        ratio,
        warning,
      });
    }

    let relPath;
    let outputPath;
    const dir = path.dirname(file.path);
    const baseName = path.basename(file.filename, path.extname(file.filename));

    try {
      if (isProduction) {
        const webpName = baseName + ".webp";
        outputPath = path.join(dir, webpName);
        await sharp(file.path)
          .resize(1200, 800, { fit: "cover" })
          .webp({ quality: 75 })
          .toFile(outputPath);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        relPath = `/images/recipes/${webpName}`;
      } else {
        const outputName = `${baseName}-processed${path.extname(file.filename)}`;
        outputPath = path.join(dir, outputName);
        await sharp(file.path)
          .resize(1200, 800, { fit: "cover" })
          .toFile(outputPath);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        relPath = `/images/recipes/${outputName}`;
      }
    } catch (error) {
      console.error("Recipe image processing failed:", {
        filename: file.originalname,
        path: file.path,
        size: file.size,
        error: error.stack || error,
      });
      if (outputPath && fs.existsSync(outputPath) && outputPath !== file.path) {
        fs.unlinkSync(outputPath);
      }
      cleanupFiles([file]);
      const err = new Error("image_processing");
      err.filename = file.originalname;
      err.originalError = error;
      throw err;
    }

    processed.push({
      relPath,
      position: idx + 1,
      warning,
      filename: file.originalname,
      originalPath: file.path,
      outputPath,
    });
  }

  return processed;
}

/** Supprime les fichiers Multer encore sur disque (nettoyage en cas d'erreur) */
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
