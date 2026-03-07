/**
 * Script de migration : assigne les tmdb_id aux films existants et télécharge leurs affiches
 * Usage : node scripts/migrate-tmdb-posters.js
 *
 * Pour chaque film sans tmdb_id :
 *   1. Recherche sur TMDB par titre
 *   2. Assigne l'ID et le type trouvés
 *   3. Télécharge l'affiche localement
 *   4. Met à jour picture en BDD
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Movie } from "../app/models/index.model.js";
import { downloadTmdbPoster } from "../app/utils/tmdb-image-downloader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";

function unlinkIfExists(filePath) {
  if (!filePath) return;
  // Les chemins sont relatifs à /public
  const absPath = filePath.startsWith("/")
    ? path.join(__dirname, "../app/public", filePath)
    : path.join(__dirname, "../app/public/", filePath);
  try {
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  } catch (e) {
    // silencieux
  }
}

/**
 * Recherche un film ou série sur TMDB par titre.
 * Retourne { tmdb_id, type } ou null.
 */
async function searchTmdb(title) {
  // Cherche d'abord dans "movie", puis "tv" si rien trouvé
  for (const endpoint of ["movie", "tv"]) {
    const url = `${TMDB_API_URL}/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=fr-FR`;
    const resp = await fetch(url);
    if (!resp.ok) continue;
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      const top = data.results[0];
      return {
        tmdb_id: top.id,
        type: endpoint === "tv" ? "serie" : "film",
        found_title: top.title || top.name,
      };
    }
  }
  return null;
}

async function run() {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY manquante dans .env");
    process.exit(1);
  }

  console.log("=== Migration affiches TMDB (recherche par titre) ===\n");

  const movies = await Movie.findAll({
    attributes: ["id", "title", "tmdb_id", "type", "picture"],
    order: [["id", "ASC"]],
  });

  console.log(`${movies.length} film(s) total en BDD\n`);

  const results = { updated: [], failed: [], alreadyDone: [] };

  for (const movie of movies) {
    process.stdout.write(`[${movie.id}] "${movie.title}"... `);

    let tmdbId = movie.tmdb_id;
    let type = movie.type || "film";

    // Si pas de tmdb_id : recherche par titre
    if (!tmdbId) {
      const found = await searchTmdb(movie.title);
      if (!found) {
        console.log("ECHEC (non trouvé sur TMDB)");
        results.failed.push({ id: movie.id, title: movie.title, reason: "Non trouvé sur TMDB" });
        continue;
      }
      tmdbId = found.tmdb_id;
      type = found.type;
      console.log(`\n    -> TMDB trouvé: "${found.found_title}" (id=${tmdbId}, type=${type})`);
      process.stdout.write(`    -> Téléchargement affiche... `);
    }

    // Télécharger l'affiche
    const newPath = await downloadTmdbPoster(tmdbId, type, movie.title);

    if (!newPath) {
      console.log("ECHEC (téléchargement poster)");
      results.failed.push({ id: movie.id, title: movie.title, reason: "Echec téléchargement" });
      continue;
    }

    // Supprimer l'ancienne image si différente
    if (movie.picture && movie.picture !== newPath) {
      unlinkIfExists(movie.picture);
    }

    // Mettre à jour en BDD
    await movie.update({ tmdb_id: tmdbId, type, picture: newPath });
    console.log(`OK → ${newPath}`);
    results.updated.push({ id: movie.id, title: movie.title, path: newPath });

    // Pause anti-rate-limit TMDB (40 req/10s max)
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n=== Résultat ===");
  console.log(`Mis à jour : ${results.updated.length}`);
  console.log(`Echoués   : ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log("\nFilms en échec :");
    results.failed.forEach((f) => console.log(`  - [${f.id}] ${f.title} — ${f.reason}`));
  }
  console.log("\nMigration terminée.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
