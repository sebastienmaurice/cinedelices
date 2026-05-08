/**
 * asset-manager.js
 * Remplace unlinkIfExists() pour gérer la suppression d'assets
 * compatibles local (dev) ET Cloudinary (production).
 *
 * Détection automatique :
 *   - URL http(s) → suppression via Cloudinary API
 *   - Chemin relatif /images/... → suppression du fichier local (rétro-compat dev)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "./cloudinary-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "../public");

/**
 * Extrait le public_id Cloudinary depuis une URL sécurisée.
 * Ex: https://res.cloudinary.com/mycloud/image/upload/v123/cinedelices/profiles/abc.webp
 *     → "cinedelices/profiles/abc"
 */
function extractPublicId(url) {
  // Retire la version optionnelle (/v123/) et l'extension
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
}

/**
 * Supprime un asset : Cloudinary si URL http, fichier local sinon.
 * Silencieux en cas d'erreur (l'asset peut déjà être absent).
 *
 * @param {string|null} urlOrPath - URL Cloudinary ou chemin relatif /images/...
 */
export async function deleteAsset(urlOrPath) {
  if (!urlOrPath) return;

  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    // Asset Cloudinary
    const publicId = extractPublicId(urlOrPath);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error(`[asset-manager] Cloudinary destroy failed (${publicId}):`, err.message);
      }
    }
  } else {
    // Fichier local (dev ou assets statiques committés)
    try {
      const abs = path.join(PUBLIC_DIR, urlOrPath);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (err) {
      console.error(`[asset-manager] Local unlink failed (${urlOrPath}):`, err.message);
    }
  }
}

/**
 * Upload un fichier temporaire (chemin local) vers Cloudinary.
 * Supprime le fichier temporaire après upload (succès ou échec).
 *
 * @param {string} filePath - Chemin absolu du fichier temporaire
 * @param {string} folder   - Dossier Cloudinary cible (ex: "cinedelices/recipes")
 * @returns {Promise<string>} - URL sécurisée Cloudinary (secure_url)
 */
export async function uploadToCloudinary(filePath, folder) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
    });
    return result.secure_url;
  } finally {
    // Nettoyage du fichier temporaire dans tous les cas
    fs.unlink(filePath, () => {});
  }
}

/**
 * Upload un Buffer vers Cloudinary via upload_stream.
 * Utilisé après traitement Sharp (résultat en mémoire).
 *
 * @param {Buffer} buffer   - Buffer de l'image traitée
 * @param {Object} options  - Options Cloudinary (folder, public_id, overwrite...)
 * @returns {Promise<Object>} - Résultat Cloudinary complet (secure_url, public_id...)
 */
export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", ...options },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}
