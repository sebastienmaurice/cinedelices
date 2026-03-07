/**
 * tmdb-image-downloader.js
 *
 * Utilitaire serveur : télécharge l'affiche officielle d'un film/série
 * depuis l'API TMDB et la stocke dans /images/movies/originals/.
 *
 * Usage :
 *   import { downloadTmdbPoster } from "../utils/tmdb-image-downloader.js";
 *   const path = await downloadTmdbPoster(tmdb_id, "film", "Ratatouille");
 *   // → "/images/movies/originals/ratatouille.jpg"  ou null si échec
 */

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TMDB_API_KEY  = process.env.TMDB_API_KEY;
const TMDB_API_URL  = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";
/* w780 = 780px de large — qualité affiche suffisante sans surcharger le stockage */
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w780";
/* Dossier de destination des affiches */
const DEST_DIR = path.join(__dirname, "../public/images/movies/originals");

/**
 * Convertit un titre en slug de fichier sûr.
 * Ex : "L'Armée des 12 Singes" → "l-armee-des-12-singes"
 */
function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // supprime les accents
    .replace(/[^a-z0-9]+/g, "-")       // remplace tout sauf alphanum par tiret
    .replace(/^-+|-+$/g, "");          // supprime tirets en début/fin
}

/**
 * Télécharge un fichier depuis une URL HTTPS et l'écrit sur le disque.
 * Supprime le fichier partiel en cas d'erreur.
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`Téléchargement échoué — HTTP ${res.statusCode} pour ${url}`));
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(destPath);
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

/**
 * Télécharge l'affiche TMDB d'un film ou d'une série.
 *
 * @param {number|string} tmdbId  - Identifiant TMDB (entier)
 * @param {string}        type    - "film" (défaut) | "serie"
 * @param {string}        title   - Titre utilisé pour nommer le fichier
 * @returns {Promise<string|null>} - Chemin relatif "/images/movies/originals/{slug}.jpg"
 *                                   ou null si TMDB_API_KEY absente, ID invalide, ou erreur réseau
 */
export async function downloadTmdbPoster(tmdbId, type, title) {
  /* Préconditions */
  if (!TMDB_API_KEY) {
    console.warn("⚠️  downloadTmdbPoster: TMDB_API_KEY absente dans .env");
    return null;
  }
  if (!tmdbId || isNaN(parseInt(tmdbId))) {
    console.warn("⚠️  downloadTmdbPoster: tmdbId invalide →", tmdbId);
    return null;
  }

  try {
    /* 1. Appel TMDB pour récupérer poster_path */
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

    /* 2. Construction du chemin de destination */
    const slug     = slugify(title || `movie-${tmdbId}`);
    const filename = `${slug}.jpg`;

    /* Crée le dossier s'il n'existe pas encore */
    fs.mkdirSync(DEST_DIR, { recursive: true });

    const destPath    = path.join(DEST_DIR, filename);
    const imageUrl    = `${TMDB_IMG_BASE}${posterPath}`;

    /* 3. Téléchargement */
    await downloadFile(imageUrl, destPath);
    console.log(`✅ Affiche TMDB sauvegardée : /images/movies/originals/${filename}`);

    return `/images/movies/originals/${filename}`;
  } catch (err) {
    console.error("❌ downloadTmdbPoster:", err.message);
    return null;
  }
}
