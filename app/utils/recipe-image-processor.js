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
    // Validation du ratio 3:2 (±15%)
    const meta = await sharp(file.path).metadata();
    const ratio = meta.width / meta.height;
    if (Math.abs(ratio - 3 / 2) > 0.15) {
      fs.unlinkSync(file.path);
      const err = new Error("ratio");
      err.filename = file.originalname;
      err.w = meta.width;
      err.h = meta.height;
      throw err;
    }

    let relPath;
    const dir = path.dirname(file.path);
    const baseName = path.basename(file.filename, path.extname(file.filename));

    if (isProduction) {
      const webpName = baseName + ".webp";
      const webpFullPath = path.join(dir, webpName);
      await sharp(file.path)
        .resize(1600, null, { withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(webpFullPath);
      fs.unlinkSync(file.path);
      relPath = `/images/recipes/${webpName}`;
    } else {
      const buf = await sharp(file.path)
        .resize(1600, null, { withoutEnlargement: true })
        .toBuffer();
      fs.writeFileSync(file.path, buf);
      relPath = `/images/recipes/${file.filename}`;
    }

    processed.push({ relPath, position: idx + 1 });
  }

  return processed;
}

/** Supprime les fichiers Multer encore sur disque (nettoyage en cas d'erreur) */
export function cleanupFiles(files) {
  if (!files || files.length === 0) return;
  for (const file of files) {
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }
}
