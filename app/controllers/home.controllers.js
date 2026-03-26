import { Sequelize } from "sequelize";
import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { enrichMoviesWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const homeController = {
  //page d'accueil
  async home(req, res) {
    // les 3 recettes les mieux notées
    try {
      const recipes = await Recipe.findAll({
        where: { status: "approved" },
        include: [
          {
            model: Movie,
            attributes: ["title"], // on récupère uniquement le nom du film
            where: { status: "approved" },
          },
          {
            model: User,
            as: "contributor",
            attributes: ["pseudo", "picture", "role"],
          },
        ],
        order: [["quote", "DESC"]], // tri par note décroissante
        limit: 3, // limite à 3 résultats pour avoir les 3 meilleures recettes
      });

      if (!recipes) {
        return renderNotFound(res, "Recettes");
      }

      // recette du jour en aléatoire
      const topRecipe = await Recipe.findOne({
        where: { status: "approved" },
        include: [
          { model: Movie, where: { status: "approved" } },
          { model: User, as: "contributor", attributes: ["id", "pseudo", "picture"] },
        ],
        order: [Sequelize.literal("RANDOM()")], // PostgreSQL utilise RANDOM()
      });

      // Duo du Jour : enrichir le film lié à topRecipe (garantit film ↔ recette cohérents)
      let duoFilm = null;
      if (topRecipe && topRecipe.Movie) {
        const [enriched] = enrichMoviesWithImagePaths([topRecipe.Movie]);
        const duoRecipeCount = await Recipe.count({
          where: { status: "approved", id_movie: topRecipe.Movie.id },
        });
        duoFilm = { ...enriched, recipeCount: duoRecipeCount };
      }

      // afficher 4 films aléatoirement sur la page d'accueil
      const topMovies = await Movie.findAll({
        where: { status: "approved" },
        order: [Sequelize.literal("RANDOM()")],
        limit: 4,
      });
      if (!topMovies || topMovies.length === 0) {
        return renderNotFound(res, "Films");
      }

      // Lister les images du dossier recipes
      let recipeImages = []; // création d'un tableau vide
      try {
        const imagesDir = path.join(__dirname, "../public/images/event"); // Chemin vers le dossier des images
        const files = await fs.readdir(imagesDir);

        // Filtrer uniquement les fichiers images
        recipeImages = files
          .filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
          })
          .map((file) => `/images/event/${file}`); // Créer le chemin relatif pour l'affichage dans la vue. map rempli le tableau recipeImages.
      } catch (error) {
        console.error("Erreur lors de la lecture du dossier recipes:", error);
        // Si le dossier n'existe pas ou erreur, on continue avec un tableau vide
      }

      // Compter les recettes approuvées par film (pour les film-cards)
      const movieIds = topMovies.map(m => m.id);
      const recipeCounts = await Recipe.findAll({
        where: { status: "approved", id_movie: movieIds },
        attributes: ["id_movie", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
        group: ["id_movie"],
        raw: true,
      });
      const countMap = {};
      recipeCounts.forEach(r => { countMap[r.id_movie] = parseInt(r.count, 10); });

      // Enrichir les topMovies avec les chemins d'images + le compteur de recettes
      const enrichedTopMovies = enrichMoviesWithImagePaths(topMovies).map(m => ({
        ...m,
        recipeCount: countMap[m.id] || 0,
      }));

      // Statistiques par genre (pour la category-strip)
      const genreStats = await Movie.findAll({
        where: { status: "approved" },
        attributes: ["genre", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
        group: ["genre"],
        order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"]],
        raw: true,
      });

      // Statistiques communauté (COUNT)
      const [totalUsers, totalRecipes, totalMovies] = await Promise.all([
        User.count(),
        Recipe.count({ where: { status: "approved" } }),
        Movie.count({ where: { status: "approved" } }),
      ]);

      // Top 3 contributeurs (classés par nombre de recettes approuvées, admins exclus)
      const topContributors = await User.findAll({
        attributes: [
          "id",
          "pseudo",
          "picture",
          [Sequelize.fn("COUNT", Sequelize.col("recipes.id")), "recipe_count"],
        ],
        where: { role: "user" },
        include: [{
          model: Recipe,
          as: "recipes",
          where: { status: "approved" },
          attributes: [],
          required: true,
        }],
        group: ["User.id"],
        order: [[Sequelize.fn("COUNT", Sequelize.col("recipes.id")), "DESC"]],
        limit: 3,
        subQuery: false,
      });

      // Rendre la vue avec les recettes
      res.render("home", {
        recipes,
        topRecipe,
        duoFilm,
        topMovies: enrichedTopMovies,
        recipeImages,
        genreStats,
        totalUsers,
        totalRecipes,
        totalMovies,
        topContributors: topContributors.map((u) => u.toJSON()),
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error);
    }
  },
};

export default homeController;
