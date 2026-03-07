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
        return res.status(404).render("error", {
          error: "404",
          message: "Recettes introuvable.",
          role: req.userRole,
        });
      }

      // recette du jour en aléatoire
      const topRecipe = await Recipe.findOne({
        where: { status: "approved" },
        include: [{ model: Movie, where: { status: "approved" } }],
        order: [Sequelize.literal("RANDOM()")], // PostgreSQL utilise RANDOM()
      });

      // afficher 4 films aléatoirement sur la page d'accueil
      const topMovies = await Movie.findAll({
        where: { status: "approved" },
        order: [Sequelize.literal("RANDOM()")],
        limit: 4,
      });
      if (!topMovies || topMovies.length === 0) {
        return res.status(404).render("error", {
          error: "404",
          message: "Films introuvables.",
          role: req.userRole,
        });
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

      // Rendre la vue avec les recettes
      res.render("home", {
        recipes,
        topRecipe,
        topMovies: enrichedTopMovies,
        recipeImages,
        genreStats,
        role: req.userRole,
        totalUsers,
        totalRecipes,
        totalMovies,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
    }
  },
};

export default homeController;
