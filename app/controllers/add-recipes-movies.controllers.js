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
      // Refactoring : utilisation du helper centralisé renderServerError()
      // Note : loginPopup: false retiré car non utilisé dans la vue error
      return renderServerError(res, error, req.userRole);
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
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
    }
  },

  /**
   * POST - Ajout d'un nouveau film dans la base de données
   * POST /add-recipes-movies/movie
   *
   * Processus :
   * 1. Récupère les données du formulaire (title, year, genre)
   * 2. Crée le film en BDD
   * 3. Enrichit le film avec les chemins d'images (pour affichage)
   * 4. Rend la page avec le film créé pour permettre l'ajout de la recette
   */
  async addMovie(req, res) {
    try {
      const { title, year, genre } = req.body;

      // Création du film en base de données
      const newMovie = await Movie.create({
        title: title,
        year: year,
        genre: genre,
        id_user: req.userId,
      });

      // Enrichir le film avec les chemins d'images (banner/card)
      // Même sans image uploadée, les chemins sont préparés pour un futur upload
      const enrichedMovie = enrichMovieWithImagePaths(newMovie);

      // Rendre la page avec le film créé pour permettre l'ajout de la recette
      res.status(201).render("add-recipes-movies", {
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
        servings,
        difficulty,
        id_movie,
      } = req.body;

      // Récupération du chemin de l'image uploadée (si présente)
      let imagePath = null;
      if (req.file) {
        // Chemin relatif pour l'affichage dans le HTML
        imagePath = `/images/recipes/${req.file.filename}`;
      }

      // Ajout de la recette à la base de données (simulation)

      const newRecipe = await Recipe.create({
        name: name,
        description: description,
        category: category,
        ingredients: ingredients,
        preparation: preparation,
        time: time,
        servings: servings || null,
        difficulty: difficulty,
        id_movie: id_movie,
        id_user: req.userId,
        picture: imagePath, // Chemin de l'image (null si aucune image)
      });

      // Rendre la page avec la recette créée
      res.status(201).render("add-recipes-movies", {
        newRecipe,
        role: req.userRole,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
    }
  },

  // POST - Ajout film + recette via formulaire unifié
  async addMovieAndRecipe(req, res) {
    try {
      const {
        filmId,
        title,
        year,
        genre,
        name,
        description,
        category,
        ingredients,
        preparation,
        time,
        servings,
        difficulty,
      } = req.body;

      if (!name || !description || !category || !ingredients || !preparation || !time || !difficulty) {
        return res.status(400).render("add-recipes-movies", {
          error: true,
          errorMessage: "Merci de compléter tous les champs de la recette.",
          role: req.userRole,
        });
      }

      let movie = null;
      if (filmId) {
        movie = await Movie.findByPk(filmId);
      }

      if (!movie) {
        if (!title || !year || !genre) {
          return res.status(400).render("add-recipes-movies", {
            error: true,
            errorMessage: "Merci de compléter les informations du film.",
            role: req.userRole,
          });
        }

        movie = await Movie.create({
          title,
          year,
          genre,
          id_user: req.userId,
        });
      }

      let imagePath = null;
      if (req.file) {
        imagePath = `/images/recipes/${req.file.filename}`;
      }

      const newRecipe = await Recipe.create({
        name,
        description,
        category,
        ingredients,
        preparation,
        time,
        servings: servings || null,
        difficulty,
        id_movie: movie.id,
        id_user: req.userId,
        picture: imagePath,
      });

      const enrichedMovie = enrichMovieWithImagePaths(movie);

      return res.status(201).render("add-recipes-movies", {
        success: true,
        successMessage: "Film et recette envoyés pour validation.",
        newMovie: enrichedMovie,
        newRecipe,
        role: req.userRole,
      });
    } catch (error) {
      return renderServerError(res, error, req.userRole);
    }
  },
};
export default addRecipesMoviesController;
