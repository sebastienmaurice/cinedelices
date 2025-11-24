import { Sequelize } from "sequelize";
import { Recipe, Movie, Notice, User } from "../models/index.model.js";
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
        include: [
          {
            model: Movie,
            attributes: ["title"], // on récupère uniquement le nom du film
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

      // recete du jour en aléatoire
      const topRecipe = await Recipe.findOne({
        include: [{ model: Movie }],
        order: [Sequelize.literal("RANDOM()")], // PostgreSQL utilise RANDOM()
      });

      if (!topRecipe) {
        return res.status(404).render("error", {
          error: "404",
          message: "Top recette non générée.",
          role: req.userRole,
        });
      }

      // afficher 4 films aléatoirement sur la page d'accueil
      const topMovies = await Movie.findAll({
        order: [Sequelize.literal("RANDOM()")],
        limit: 4,
      });
      if (!topMovies) {
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

      // Rendre la vue avec les recettes
      res.render("home", {
        recipes,
        topRecipe,
        topMovies,
        recipeImages,
        role: req.userRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },
};

export default homeController;
