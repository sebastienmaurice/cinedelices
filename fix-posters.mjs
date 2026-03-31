/**
 * Fix-Posters.mjs
 * Exécute directement la migration des affiches sans passer par HTTP
 */

import { Movie } from "./app/models/index.model.js";
import { downloadTmdbPoster } from "./app/utils/tmdb-image-downloader.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrateMoviePostersDirect() {
  console.log("\n🎬 MIGRATION DIRECTE DES AFFICHES TMDB\n");
  console.log("═".repeat(60));

  try {
    // Récupérer tous les films avec tmdb_id
    const movies = await Movie.findAll({
      where: { tmdb_id: { [Op.not]: null } },
      attributes: ["id", "title", "tmdb_id", "type", "picture"],
    });

    console.log(`\n📽️  Traitement de ${movies.length} films avec tmdb_id...\n`);

    const results = { updated: [], failed: [], skipped: [] };

    for (const movie of movies) {
      console.log(`\n[${movie.id}] ${movie.title}`);
      console.log(`    TMDB ID: ${movie.tmdb_id}`);
      console.log(`    Chemin actuel: ${movie.picture || "null"}`);

      // Si l'affiche est déjà un chemin local, skip
      if (movie.picture && movie.picture.startsWith("/images/movies/originals/")) {
        console.log(`    ✅ Déjà correct (chemin local)`);
        results.skipped.push({ id: movie.id, title: movie.title, reason: "Déjà local" });
        continue;
      }

      // Télécharger l'affiche TMDB
      console.log(`    ⏳ Téléchargement depuis TMDB...`);
      const newPath = await downloadTmdbPoster(movie.tmdb_id, movie.type, movie.title);

      if (!newPath) {
        console.log(`    ❌ Téléchargement échoué`);
        results.failed.push({ id: movie.id, title: movie.title });
        continue;
      }

      console.log(`    ✅ Téléchargé: ${newPath}`);

      // Supprimer l'ancienne affiche (si elle est différente)
      if (movie.picture && movie.picture !== newPath) {
        const oldPath = path.join(__dirname, "app/public", movie.picture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log(`    🗑️  Ancienne affiche supprimée`);
        }
      }

      // Mettre à jour la BDD
      await movie.update({ picture: newPath });
      console.log(`    💾 BDD mise à jour`);

      results.updated.push({ id: movie.id, title: movie.title, path: newPath });
    }

    // Rapport final
    console.log("\n" + "═".repeat(60));
    console.log("\n📊 RAPPORT FINAL\n");
    console.log(`✅ Mis à jour: ${results.updated.length}`);
    results.updated.forEach((m) => {
      console.log(`   • [${m.id}] ${m.title}`);
      console.log(`      → ${m.path}`);
    });

    if (results.failed.length > 0) {
      console.log(`\n❌ Échoués: ${results.failed.length}`);
      results.failed.forEach((m) => {
        console.log(`   • [${m.id}] ${m.title}`);
      });
    }

    if (results.skipped.length > 0) {
      console.log(`\n⏭️  Ignorés: ${results.skipped.length}`);
      results.skipped.forEach((m) => {
        console.log(`   • [${m.id}] ${m.title} - ${m.reason}`);
      });
    }

    console.log("\n" + "═".repeat(60));
    console.log("\n✅ Migration terminée!\n");

    return {
      success: true,
      total: movies.length,
      ...results,
    };
  } catch (error) {
    console.error("\n❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

// Exécuter la migration
await migrateMoviePostersDirect();
