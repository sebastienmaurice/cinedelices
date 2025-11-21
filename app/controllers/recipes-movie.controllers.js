import { Recipe, Movie, Notice, User } from "../models/index.model.js";

const recipesController = {
  // Afficher le film et ses recettes
  async movieRecipes(req, res) {
    try {
      const movie = await Movie.findByPk(req.params.id);

      if (!movie) {
        return res.status(404).render("error", {
          error: "404",
          message: "Film introuvable.",
          role: req.userRole,
        });
      }

      // Toutes les recettes du film
      const recipes = await Recipe.findAll({ where: { id_movie: movie.id } });

      res.render("recipes-movie", { movie, recipes, role: req.userRole });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },
  /*
    movieRecipes :
    - Récupère un film par son id avec Movie.findByPk
    - Si aucun film trouvé => 404
    - Charge toutes les recettes associées (Recipe.findAll avec id_movie)
    - Rend la vue "recipes-movie" avec le film, les recettes et le rôle utilisateur
  */

  // Filtrage des recettes du film par catégorie
  async filtredRecipes(req, res) {
    try {
      console.log(req.params);
      const { id, category } = req.params;

      const movie = await Movie.findByPk(id);
      if (!movie) {
        return res.status(404).render("error", {
          error: "404",
          message: "Film introuvable pour cette categorie.",
          role: req.userRole,
        });
      }

      let recipes;
      if (!category || category === "all") {
        recipes = await Recipe.findAll({ where: { id_movie: movie.id } });
      } else {
        recipes = await Recipe.findAll({
          where: {
            id_movie: movie.id,
            category: category,
          },
        });
      }

      // Rendu de la vue avec les recettes filtrées
      console.log(recipes);
      res.render("recipes-movie", { movie, recipes, role: req.userRole });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },
  /*
    filtredRecipes :
    - Récupère les paramètres id du film et la catégorie
    - Vérifie que le film existe sinon 404
    - Charge les recettes du film :
        * toutes si category absent ou "all"
        * sinon filtre sur la colonne category
    - Rend la vue "recipes-movie" avec la liste filtrée
  */

  // Afficher le détail d'une recette spécifique ajouté par SEB le 14 Nov à 18h30
  async detailRecipes(req, res) {
    try {
      const recipe = await Recipe.findByPk(req.params.id);

      if (!recipe) {
        return res.status(404).render("error", {
          error: "404",
          message: "recette indisponible.",
          role: req.userRole,
        });
      }

      const plainRecipe = recipe.get({ plain: true });

      const descriptionBlocks = (plainRecipe.description || "")
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      const ingredientsBlocks = (plainRecipe.ingredients || "")
        .replace(/\r\n/g, "\n")
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean);

      const preparationBlocks = (plainRecipe.preparation || "")
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .flatMap((chunk) => chunk.split(/\n/))
        .map((step) => step.trim())
        .filter(Boolean);

      // Récupérer les avis associés à la recette avec les infos utilisateur SEB le 21 Nov à 14h07
      const notices = await Notice.findAll({
        where: { id_recipe: req.params.id },
        include: [
          {
            model: User,
            attributes: ["id", "first_name", "last_name"],
          },
        ],
        order: [["id", "DESC"]], // Plus récents en premier
      });

      const plainNotices = notices.map((notice) => notice.get({ plain: true }));

      res.render("recipe-detail", {
        role: req.userRole,
        recipe: plainRecipe,
        descriptionBlocks,
        ingredientsBlocks,
        preparationBlocks,
        notices: plainNotices,
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
  /*
    detailRecipes :
    - Trouve une recette par son id
    - Si introuvable => 404
    - Convertit la recette en objet simple (plain)
    - Formate description, ingrédients, préparation en tableaux prêts à afficher
    - Rend la vue "recipe-detail" avec la recette et les blocs formatés
  */
};

export default recipesController;
