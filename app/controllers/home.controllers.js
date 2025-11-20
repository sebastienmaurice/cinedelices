import { Sequelize } from "sequelize";
import { Recipe, Movie, Notice, User } from "../models/index.model.js";

const homeController = {
  //page d'accueil
  async home(req, res) {
    // recuperation du role de l'user pour dynamiser page suivant ses authorisations => { role: req.userRole }req.userRole

    // Afficher les 3 recettes

    try {
      const recipes = await Recipe.findAll({
        include: [
          {
            model: Movie,
            attributes: ["title"], // on récupère uniquement le nom du film
          },
        ],
        order: [["quote", "DESC"]], // tri par quote décroissant
        limit: 3, // limite à 3 résultats
      });

      if (!recipes) {
        return res.status(404).render("error", {
          error: "404",
          message: "Recettes introuvable.",
          role: req.userRole,
        });
      }

      // Top recette
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

      // Rendre la vue avec les recettes
      //console.log(recipes);
      //console.log(topRecipe);

      res.render("home", { recipes, topRecipe, role: req.userRole });
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
