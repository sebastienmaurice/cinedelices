/**
 * tmdb-image-downloader.js
 *
 * Télécharge l'affiche officielle d'un film/série depuis l'API TMDB
 * et l'envoie directement sur Cloudinary (plus de stockage disque local).
 *
 * En production sur Render, le filesystem est éphémère.
 * Les affiches sont stockées dans Cloudinary sous cinedelices/movies/.
 *
 * Retourne l'URL Cloudinary sécurisée ou null si échec.
 */

import https from "https";
import "dotenv/config";
import cloudinary from "./cloudinary-config.js";

const TMDB_API_KEY  = process.env.TMDB_API_KEY;
const TMDB_API_URL  = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w780";

/**
 * Convertit un titre en slug de fichier sûr.
 * Ex : "L'Armée des 12 Singes" → "l-armee-des-12-singes"
 */
function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Télécharge une image depuis une URL HTTPS et retourne un Buffer.
 */
function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} pour ${url}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * Télécharge l'affiche TMDB et l'upload sur Cloudinary.
 *
 * @param {number|string} tmdbId  - Identifiant TMDB
 * @param {string}        type    - "film" (défaut) | "serie"
 * @param {string}        title   - Titre utilisé pour nommer le public_id Cloudinary
 * @returns {Promise<string|null>} - URL Cloudinary sécurisée ou null si erreur
 */
export async function downloadTmdbPoster(tmdbId, type, title) {
  if (!TMDB_API_KEY) {
    console.warn("⚠️  downloadTmdbPoster: TMDB_API_KEY absente dans .env");
    return null;
  }
  if (!tmdbId || isNaN(parseInt(tmdbId))) {
    console.warn("⚠️  downloadTmdbPoster: tmdbId invalide →", tmdbId);
    return null;
  }

  try {
    // 1. Récupération du poster_path depuis l'API TMDB
    const endpoint = type === "serie" ? "tv" : "movie";
    const apiUrl   = `${TMDB_API_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&language=fr-FR`;
    const resp     = await fetch(apiUrl);

    if (!resp.ok) {
      console.error(`❌ TMDB API ${resp.status} pour ${endpoint}/${tmdbId}`);
      return null;
    }

    const data       = await resp.json();
    const posterPath = data.poster_path;

    if (!posterPath) {
      console.warn(`⚠️  Aucun poster_path TMDB pour ${endpoint}/${tmdbId}`);
      return null;
    }

    // 2. Téléchargement de l'image en mémoire (Buffer)
    const imageUrl = `${TMDB_IMG_BASE}${posterPath}`;
    const buffer   = await fetchImageBuffer(imageUrl);

    // 3. Upload du Buffer sur Cloudinary
    const slug = slugify(title || `movie-${tmdbId}`);
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:         "cinedelices/movies",
          public_id:      slug,
          overwrite:      true,   // ré-upload si le film est mis à jour
          resource_type:  "image",
        },
        (error, res) => (error ? reject(error) : resolve(res))
      );
      stream.end(buffer);
    });

    console.log(`✅ Affiche TMDB uploadée sur Cloudinary : ${result.secure_url}`);
    return result.secure_url;

  } catch (err) {
    console.error("❌ downloadTmdbPoster:", err.message);
    return null;
  }
}
