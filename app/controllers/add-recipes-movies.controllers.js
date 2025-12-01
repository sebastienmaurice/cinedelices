import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { logUpload, logUploadError } from "../utils/logger.js";
import { IMAGE_TYPES } from "../utils/image-utils.js";

const addRecipesMoviesController = {
  // Page d'ajout de film et recette
  addRecipesMovies(req, res) {
    try {
      // ajout gestion du role
      res.render("add-recipes-movies", { role: req.userRole });
    } catch (error) {
      console.error(error);

      // ← ici, on rend la page d'erreur avec loginPopup: false
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
        loginPopup: false,
      });
    }
  },

  // Page d'ajout d'une recette dans un film existant
  async addRecipeToMovies(req, res) {
    try {
      const id = req.params.id;

      const newMovie = await Movie.findByPk(id);

      // Rendu de la vue pour le pre-remplissage du film

      res.render("add-recipes-movies", {
        newMovie,
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

  // POST - Ajout du film
  async addMovie(req, res) {
    try {
      const { title, year, genre } = req.body;

      // Ajout du film à la base de données
      // Création du film
      const newMovie = await Movie.create({
        title: title,
        year: year,
        genre: genre,
      });

      // Rendu de la page avec le rôle de l'utilisateur
      res
        .status(201)
        .render("add-recipes-movies", { newMovie, role: req.userRole });
    } catch (error) {
      console.error(error);

      // ← ici, on rend la page d'erreur avec loginPopup: false
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
        //loginPopup: false,
      });
    }
  },

  // POST - Ajout de la recette
  async addRecipe(req, res) {
    try {
      // Récupération des données du formulaire
      const {
        name,
        description,
        category,
        ingredients,
        preparation,
        time,
        difficulty,
        id_movie,
      } = req.body;

      //! Récupération du chemin de l'image uploadée (si présente)
      let imagePath = null;
      if (req.file) {
        // Chemin relatif pour l'affichage dans le HTML
        imagePath = `/images/recipes/cards/${req.file.filename}`;
      }

      // Ajout de la recette à la base de données

      const newRecipe = await Recipe.create({
        name: name,
        description: description,
        category: category,
        ingredients: ingredients,
        preparation: preparation,
        time: time,
        difficulty: difficulty,
        id_movie: id_movie,
        picture: imagePath, // !Ajout du chemin de l'image (colonne 'picture')
      });

      // Journaliser l'upload d'image après création de la recette (pour avoir l'ID)
      if (req.file && newRecipe.id) {
        try {
          await logUpload({
            type: IMAGE_TYPES.RECIPE_CARD,
            filename: req.file.filename,
            originalName: req.file.originalname,
            destination: req.file.destination,
            size: req.file.size,
            mimetype: req.file.mimetype,
            entityId: newRecipe.id,
          });
        } catch (logError) {
          // Ne pas bloquer si la journalisation échoue
          console.error("Erreur lors de la journalisation:", logError);
        }
      }

      // Rendu de la page avec le rôle de l'utilisateur
      res
        .status(201)
        .render("add-recipes-movies", { newRecipe, role: req.userRole });
    } catch (error) {
      // Journaliser l'erreur
      await logUploadError(error, {
        type: IMAGE_TYPES.RECIPE_CARD,
        action: "addRecipe",
        id_movie: req.body.id_movie || null,
      });

      console.error(error);

      // ← ici, on rend la page d'erreur avec loginPopup: false
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },
};
export default addRecipesMoviesController;
