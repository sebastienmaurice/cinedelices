import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { enrichMovieWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";

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

      // Refactoring : utilisation du helper centralisé renderNotFound()
      if (!newMovie) {
        return renderNotFound(res, "Film", req.userRole);
      }

      // Enrichir le movie avec les chemins d'images (card pour la prévisualisation)
      const enrichedMovie = enrichMovieWithImagePaths(newMovie);

      // Rendu de la vue pour le pre-remplissage du film
      res.render("add-recipes-movies", {
        newMovie: enrichedMovie,
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

      // Enrichir le movie avec les chemins d'images (même sans image pour le moment)
      const enrichedMovie = enrichMovieWithImagePaths(newMovie);

      // Rendu de la page avec le rôle de l'utilisateur
      res
        .status(201)
        .render("add-recipes-movies", {
          newMovie: enrichedMovie,
          role: req.userRole,
        });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      // Code commenté supprimé (loginPopup: false)
      return renderServerError(res, error, req.userRole);
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
        imagePath = `/images/recipes/${req.file.filename}`;
        //console.log("Image uploadée :", imagePath);
      }

      // Ajout de la recette à la base de données (simulation)

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

      // Rendu de la page avec le rôle de l'utilisateur
      res
        .status(201)
        .render("add-recipes-movies", { newRecipe, role: req.userRole });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
    }
  },
};
export default addRecipesMoviesController;
