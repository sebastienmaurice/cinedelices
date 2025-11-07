import { Movie, Recipe } from "../models/index.js";

const recipesController = {
  // Afficher le film et ses recettes
  async movieRecipes(req, res) {
    try {
      const movie = await Movie.findByPk(req.params.id);

      if (!movie) {
        return res.status(404).render("pages/error", { message: "Film introuvable." });
      }

      // Toutes les recettes du film
      const recipes = await Recipe.findAll({ where: { id_movie: movie.id } });

      res.render("recipes-movie", { movie, recipes });
    } catch (error) {
      console.error(error);
      res.status(500).render("pages/error", { message: "Erreur serveur." });
    }
  },

  // Filtrage des recettes du film par catégorie
  async filtredRecipes(req, res) {
    try {
      console.log(req.params);
      const { id, category } = req.params;
      
      const movie = await Movie.findByPk(id);
      if (!movie) {
        return res.status(404).render("pages/error", { message: "Film introuvable." });
      }
      
      let recipes;
      if (!category || category === "tous") {
        recipes = await Recipe.findAll({ where: { id_movie: movie.id } });
      } else {
        recipes = await Recipe.findAll({
          where: {
            id_movie: movie.id,
            category,
          },
        });
      }
      
      // Rendu de la vue avec les recettes filtrées
      res.render("recipes-movie", { movie, recipes });
      
    } catch (error) {
      console.error(error);
      res.status(500).send("pages/error", { message: "Erreur serveur." });
    }
  },

  // Afficher le détail d'une recette spécifique
async detailRecipes(req, res) {
  try {
    const recipe = await Recipe.findByPk(req.params.id);

    if (!recipe) {
      return res
        .status(404)
        .render("pages/error", { message: "Recette introuvable." });
    }

    // Rendu de la page détail avec la recette
    res.render("recipe-detail", { recipe });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .render("pages/error", { message: "Erreur serveur lors du chargement de la recette." });
  }
},
};


export default recipesController;