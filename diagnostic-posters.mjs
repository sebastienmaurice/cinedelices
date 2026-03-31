/**
 * diagnostic-posters.mjs
 * Vérifie l'intégrité des affiches de films et recettes
 *
 * Usage : node diagnostic-posters.mjs
 */

import { Movie, Recipe, RecipePicture } from "./app/models/index.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "./app/public");

class PosterDiagnostic {
  constructor() {
    this.results = {
      moviesTotal: 0,
      moviesApproved: 0,
      moviesWithPicture: 0,
      recipesTotal: 0,
      recipesApproved: 0,
      recipesWithPicture: 0,
      recipePicturesTotal: 0,
      missingMoviePosters: [],
      brokenMoviePaths: [],
      missingRecipePosters: [],
      brokenRecipePaths: [],
      missingRecipePictureFiles: [],
      orphanedPosters: [],
    };
  }

  fileExists(relativePath) {
    if (!relativePath) return false;
    const fullPath = path.join(PUBLIC_DIR, relativePath);
    return fs.existsSync(fullPath);
  }

  async checkMovies() {
    console.log("\n📹 DIAGNOSTIC DES FILMS\n");

    const allMovies = await Movie.findAll({
      attributes: ["id", "title", "tmdb_id", "picture", "status", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    this.results.moviesTotal = allMovies.length;

    const approvedMovies = allMovies.filter((m) => m.status === "approved");
    this.results.moviesApproved = approvedMovies.length;

    console.log(
      `Total films: ${this.results.moviesTotal}, Approuvés: ${this.results.moviesApproved}`,
    );

    // Vérifier chaque film
    for (const movie of approvedMovies) {
      const hasDbPath = !!movie.picture;
      if (hasDbPath) this.results.moviesWithPicture++;

      if (!hasDbPath && movie.tmdb_id) {
        // Film TMDB sans affiche en BDD
        this.results.missingMoviePosters.push({
          id: movie.id,
          title: movie.title,
          tmdbId: movie.tmdb_id,
          reason: "Film TMDB sans affiche téléchargée",
        });
      }

      if (hasDbPath && !this.fileExists(movie.picture)) {
        // Chemin en BDD mais fichier manquant sur disque
        this.results.brokenMoviePaths.push({
          id: movie.id,
          title: movie.title,
          dbPath: movie.picture,
          reason: "Fichier manquant sur disque",
        });
      }
    }

    console.log(`Films avec affiche en BDD: ${this.results.moviesWithPicture}`);
    console.log(
      `Films TMDB sans affiche: ${this.results.missingMoviePosters.length}`,
    );
    console.log(`Chemins cassés: ${this.results.brokenMoviePaths.length}`);
  }

  async checkRecipes() {
    console.log("\n🍽️  DIAGNOSTIC DES RECETTES\n");

    const allRecipes = await Recipe.findAll({
      attributes: ["id", "name", "picture", "status", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    this.results.recipesTotal = allRecipes.length;

    const approvedRecipes = allRecipes.filter((r) => r.status === "approved");
    this.results.recipesApproved = approvedRecipes.length;

    console.log(
      `Total recettes: ${this.results.recipesTotal}, Approuvées: ${this.results.recipesApproved}`,
    );

    for (const recipe of approvedRecipes) {
      const hasDbPath = !!recipe.picture;
      if (hasDbPath) this.results.recipesWithPicture++;

      if (hasDbPath && !this.fileExists(recipe.picture)) {
        this.results.missingRecipePosters.push({
          id: recipe.id,
          name: recipe.name,
          dbPath: recipe.picture,
          reason: "Fichier manquant sur disque",
        });
      }
    }

    console.log(
      `Recettes avec affiche en BDD: ${this.results.recipesWithPicture}`,
    );
    console.log(
      `Recettes sans affiche (principale): ${
        this.results.recipesApproved - this.results.recipesWithPicture
      }`,
    );
    console.log(`Chemins cassés: ${this.results.missingRecipePosters.length}`);
  }

  async checkRecipePictures() {
    console.log("\n📸 DIAGNOSTIC DES PHOTOS DE RECETTES\n");

    const allPictures = await RecipePicture.findAll({
      attributes: ["id", "recipe_id", "file_path", "position"],
      include: [
        {
          model: Recipe,
          attributes: ["id", "status"],
        },
      ],
      order: [["recipe_id", "ASC"]],
    });

    this.results.recipePicturesTotal = allPictures.length;

    console.log(`Total photos recettes: ${this.results.recipePicturesTotal}`);

    for (const pic of allPictures) {
      if (!this.fileExists(pic.file_path)) {
        const recipeStatus = pic.Recipe?.status || "unknown";
        this.results.missingRecipePictureFiles.push({
          id: pic.id,
          recipeId: pic.recipe_id,
          filePath: pic.file_path,
          recipeStatus,
          reason: "Fichier manquant sur disque",
        });
      }
    }

    console.log(
      `Photos manquantes: ${this.results.missingRecipePictureFiles.length}`,
    );
  }

  async checkDisks() {
    console.log("\n💾 DIAGNOSTIC DES FICHIERS SUR DISQUE\n");

    const movieDir = path.join(PUBLIC_DIR, "images/movies");
    const recipeDir = path.join(PUBLIC_DIR, "images/recipes");

    // Vérifier les affiches TMDB
    const originalsDir = path.join(movieDir, "originals");
    if (fs.existsSync(originalsDir)) {
      const files = fs.readdirSync(originalsDir);
      console.log(
        `Affiches TMDB (originals): ${files.length} fichiers dans ${originalsDir}`,
      );

      // Afficher les premiers fichiers
      files.slice(0, 5).forEach((f) => console.log(`  ├─ ${f}`));
      if (files.length > 5)
        console.log(`  └─ ... et ${files.length - 5} autres`);
    } else {
      console.log(`⚠️ Dossier originals inexistant: ${originalsDir}`);
    }

    // Vérifier les photos recettes
    if (fs.existsSync(recipeDir)) {
      const files = fs.readdirSync(recipeDir);
      console.log(
        `Photos recettes uploadées: ${files.length} fichiers dans ${recipeDir}`,
      );

      // Afficher les premiers fichiers
      files.slice(0, 5).forEach((f) => console.log(`  ├─ ${f}`));
      if (files.length > 5)
        console.log(`  └─ ... et ${files.length - 5} autres`);
    } else {
      console.log(`⚠️ Dossier recipes inexistant: ${recipeDir}`);
    }
  }

  printReport() {
    console.log(
      "\n\n═════════════════════════════════════════════════════════════",
    );
    console.log("📊 RAPPORT DE DIAGNOSTIC - AFFICHES ET PHOTOS");
    console.log(
      "═════════════════════════════════════════════════════════════\n",
    );

    console.log("📈 STATISTIQUES GLOBALES\n");
    console.log(
      `  Films  : ${this.results.moviesApproved}/${this.results.moviesTotal} approuvés (${this.results.moviesWithPicture} avec affiche)`,
    );
    console.log(
      `  Recettes : ${this.results.recipesApproved}/${this.results.recipesTotal} approuvées (${this.results.recipesWithPicture} avec affiche)`,
    );
    console.log(
      `  Photos   : ${this.results.recipePicturesTotal} photos recettes\n`,
    );

    // Problèmes détectés
    const totalProblems =
      this.results.missingMoviePosters.length +
      this.results.brokenMoviePaths.length +
      this.results.missingRecipePosters.length +
      this.results.missingRecipePictureFiles.length;

    if (totalProblems === 0) {
      console.log("✅ AUCUN PROBLÈME DÉTECTÉ - Tout est OK!");
      return;
    }

    console.log("🔴 PROBLÈMES DÉTECTÉS\n");

    if (this.results.missingMoviePosters.length > 0) {
      console.log(
        `❌ ${this.results.missingMoviePosters.length} films TMDB sans affiche:\n`,
      );
      this.results.missingMoviePosters.slice(0, 5).forEach((m) => {
        console.log(
          `   • ID ${m.id}: "${m.title}" (TMDB #${m.tmdbId}) - ${m.reason}`,
        );
      });
      if (this.results.missingMoviePosters.length > 5) {
        console.log(
          `   ... et ${this.results.missingMoviePosters.length - 5} autres\n`,
        );
      } else {
        console.log();
      }
    }

    if (this.results.brokenMoviePaths.length > 0) {
      console.log(
        `❌ ${this.results.brokenMoviePaths.length} films avec chemins cassés:\n`,
      );
      this.results.brokenMoviePaths.slice(0, 5).forEach((m) => {
        console.log(`   • ID ${m.id}: "${m.title}"`);
        console.log(`     Chemin BDD: ${m.dbPath}`);
        console.log(`     Statut: ${m.reason}\n`);
      });
      if (this.results.brokenMoviePaths.length > 5) {
        console.log(
          `   ... et ${this.results.brokenMoviePaths.length - 5} autres\n`,
        );
      }
    }

    if (this.results.missingRecipePosters.length > 0) {
      console.log(
        `❌ ${this.results.missingRecipePosters.length} recettes avec affiches manquantes:\n`,
      );
      this.results.missingRecipePosters.slice(0, 5).forEach((r) => {
        console.log(`   • ID ${r.id}: "${r.name}"`);
      });
      if (this.results.missingRecipePosters.length > 5) {
        console.log(
          `   ... et ${this.results.missingRecipePosters.length - 5} autres\n`,
        );
      }
    }

    if (this.results.missingRecipePictureFiles.length > 0) {
      console.log(
        `❌ ${this.results.missingRecipePictureFiles.length} photos manquantes:\n`,
      );
      this.results.missingRecipePictureFiles.slice(0, 5).forEach((p) => {
        console.log(
          `   • Photo #${p.id} (Recette #${p.recipeId}): ${p.filePath}`,
        );
      });
      if (this.results.missingRecipePictureFiles.length > 5) {
        console.log(
          `   ... et ${this.results.missingRecipePictureFiles.length - 5} autres\n`,
        );
      }
    }

    console.log("\n🛠️ ACTIONS CORRECTIVES\n");

    if (this.results.missingMoviePosters.length > 0) {
      console.log(
        "1. Films TMDB sans affiche → Utiliser la route POST /admin/migrate-movie-images",
      );
      console.log("   Cette route re-télécharger toutes les affiches TMDB\n");
    }

    if (this.results.brokenMoviePaths.length > 0) {
      console.log(
        "2. Films avec chemins cassés → Vérifier la BDD et re-télécharger\n",
      );
    }

    console.log(
      "═════════════════════════════════════════════════════════════\n",
    );
  }

  async run() {
    try {
      await this.checkMovies();
      await this.checkRecipes();
      await this.checkRecipePictures();
      await this.checkDisks();
      this.printReport();
    } catch (error) {
      console.error("❌ Erreur lors du diagnostic:", error);
      process.exit(1);
    }
  }
}

// Lancer le diagnostic
const diagnostic = new PosterDiagnostic();
await diagnostic.run();
