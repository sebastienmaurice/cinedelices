/**
 * Migration : remplace les chemins locaux d'affiches de films
 * par les URLs directes TMDB CDN (image.tmdb.org).
 *
 * Usage : node scripts/migrate-pictures-to-tmdb.js
 */

import "dotenv/config";
import sequelize from "../app/database/sequelize-client.js";
import Movie from "../app/models/movie.model.js";
import { Op } from "sequelize";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

if (!TMDB_API_KEY) {
  console.error("❌ TMDB_API_KEY manquante dans .env");
  process.exit(1);
}

async function fetchPosterPath(tmdbId, type) {
  const endpoint = type === "serie" ? "tv" : "movie";
  const url = `${TMDB_API_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&language=fr-FR`;
  const res = await fetch(url);
  if (!res.ok) {
    // Essayer l'autre type si le premier échoue
    const other = endpoint === "movie" ? "tv" : "movie";
    const res2 = await fetch(`${TMDB_API_URL}/${other}/${tmdbId}?api_key=${TMDB_API_KEY}&language=fr-FR`);
    if (!res2.ok) return null;
    const data2 = await res2.json();
    return data2.poster_path || null;
  }
  const data = await res.json();
  return data.poster_path || null;
}

async function run() {
  // Tous les films avec un tmdb_id, quelle que soit leur picture actuelle
  const movies = await Movie.findAll({
    where: { tmdb_id: { [Op.not]: null } },
    attributes: ["id", "title", "tmdb_id", "type", "picture"],
  });

  console.log(`🎬 ${movies.length} film(s) avec tmdb_id trouvé(s)\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const movie of movies) {
    const { id, title, tmdb_id, type, picture } = movie;

    // Déjà une URL TMDB → passer
    if (picture && picture.startsWith("https://image.tmdb.org")) {
      console.log(`  ⏭  [${id}] ${title} — déjà une URL TMDB`);
      skipped++;
      continue;
    }

    try {
      const posterPath = await fetchPosterPath(tmdb_id, type);
      if (!posterPath) {
        console.warn(`  ⚠️  [${id}] ${title} — pas de poster_path TMDB (tmdb_id=${tmdb_id})`);
        failed++;
        continue;
      }

      const newUrl = `${TMDB_IMG_BASE}${posterPath}`;
      await movie.update({ picture: newUrl });
      console.log(`  ✅ [${id}] ${title} → ${newUrl}`);
      updated++;
    } catch (err) {
      console.error(`  ❌ [${id}] ${title} — erreur : ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Résultat : ${updated} mis à jour, ${skipped} déjà OK, ${failed} échec(s)`);
  await sequelize.close();
}

run().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
