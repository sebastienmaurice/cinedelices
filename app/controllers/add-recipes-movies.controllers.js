import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { logUpload, logUploadError } from "../utils/logger.js";
import { IMAGE_TYPES } from "../utils/image-utils.js";
import { Op } from "sequelize";
import sequelize from "../database/sequelize-client.js";

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

      // Vérifier si un film similaire existe déjà (détection doublons)
      const existingMovie = await Movie.findOne({
        where: {
          title: {
            [Op.iLike]: title.trim(),
          },
          year: parseInt(year),
        },
      });

      if (existingMovie) {
        // Film existant trouvé : utiliser celui-ci au lieu d'en créer un nouveau
        return res.status(200).render("add-recipes-movies", {
          newMovie: existingMovie,
          role: req.userRole,
          duplicateWarning: true,
        });
      }

      // Ajout du film à la base de données
      // Création du film
      const newMovie = await Movie.create({
        title: title.trim(),
        year: parseInt(year),
        genre: genre.trim(),
        status: false, // En attente de validation admin
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

      // Message de confirmation
      const successMessage =
        "✅ Ta recette est envoyée à Ciné Délices et sera contrôlée en admin sous 24h.";

      // Rendu de la page avec le rôle de l'utilisateur et message de succès
      res.status(201).render("add-recipes-movies", {
        newRecipe,
        role: req.userRole,
        successMessage,
        success: true,
      });
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

  // POST - Ajout unifié film + recette (workflow unifié avec transaction)
  async addMovieAndRecipe(req, res) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Récupération des données du formulaire
      const {
        filmId, // ID du film existant (si sélectionné via autocomplétion)
        title, // Titre du film (si nouveau film)
        year, // Année du film
        genre, // Genre du film
        // Données de la recette
        name,
        description,
        category,
        ingredients,
        preparation,
        time,
        difficulty,
      } = req.body;

      let movieId;
      let movie;

      // 2. Gérer le film (existant ou nouveau)
      if (filmId) {
        // Film existant : vérifier qu'il existe
        movie = await Movie.findByPk(parseInt(filmId), { transaction });
        if (!movie) {
          await transaction.rollback();
          return res.status(400).render("add-recipes-movies", {
            role: req.userRole,
            error: true,
            errorMessage: "Le film sélectionné n'existe pas.",
          });
        }
        movieId = movie.id;
      } else {
        // Nouveau film : validation des champs obligatoires
        if (!title || !year || !genre) {
          await transaction.rollback();
          return res.status(400).render("add-recipes-movies", {
            role: req.userRole,
            error: true,
            errorMessage:
              "Les informations du film sont obligatoires (titre, année, genre).",
          });
        }

        // Vérifier si un film similaire existe déjà (détection doublons)
        // On cherche seulement les films non validés pour éviter les doublons
        const existingMovie = await Movie.findOne({
          where: {
            title: {
              [Op.iLike]: title.trim(),
            },
            year: parseInt(year),
            status: false, // Seulement les films non validés
          },
          transaction,
        });

        if (existingMovie) {
          // Film similaire non validé trouvé : utiliser celui-ci
          movie = existingMovie;
          movieId = existingMovie.id;
        } else {
          // Vérifier si un film validé existe déjà
          const validatedMovie = await Movie.findOne({
            where: {
              title: {
                [Op.iLike]: title.trim(),
              },
              year: parseInt(year),
              status: true, // Film déjà validé
            },
            transaction,
          });

          if (validatedMovie) {
            // Film déjà validé : utiliser celui-ci (pas de doublon)
            movie = validatedMovie;
            movieId = validatedMovie.id;
          } else {
            // Créer le nouveau film
            movie = await Movie.create(
              {
                title: title.trim(),
                year: parseInt(year),
                genre: genre.trim(),
                status: false, // En attente de validation admin
              },
              { transaction }
            );
            movieId = movie.id;
          }
        }
      }

      // 3. Validation des données de la recette
      if (
        !name ||
        !description ||
        !category ||
        !ingredients ||
        !preparation ||
        !time ||
        !difficulty
      ) {
        await transaction.rollback();
        return res.status(400).render("add-recipes-movies", {
          role: req.userRole,
          error: true,
          errorMessage: "Tous les champs de la recette sont obligatoires.",
        });
      }

      // 4. Gérer l'image de la recette (si présente)
      let imagePath = null;
      if (req.file) {
        imagePath = `/images/recipes/cards/${req.file.filename}`;
      }

      // 5. Créer la recette
      const newRecipe = await Recipe.create(
        {
          name: name.trim(),
          description: description.trim(),
          category: category.trim(),
          ingredients: ingredients.trim(),
          preparation: preparation.trim(),
          time: parseInt(time),
          difficulty: difficulty.trim(),
          id_movie: movieId,
          picture: imagePath,
          status: false, // En attente de validation admin
        },
        { transaction }
      );

      // 6. Journaliser l'upload d'image après création de la recette
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
          console.error("Erreur lors de la journalisation:", logError);
          // Ne pas bloquer si la journalisation échoue
        }
      }

      // 7. Valider la transaction
      await transaction.commit();

      // 8. Message de succès
      const successMessage =
        "✅ Ta recette est envoyée à Ciné Délices et sera contrôlée en admin sous 24h.";

      // 9. Rendu de la page avec message de succès
      return res.status(201).render("add-recipes-movies", {
        role: req.userRole,
        success: true,
        successMessage,
        newMovie: movie,
        newRecipe,
      });
    } catch (error) {
      // Rollback en cas d'erreur
      await transaction.rollback();

      // Journaliser l'erreur
      await logUploadError(error, {
        type: IMAGE_TYPES.RECIPE_CARD,
        action: "addMovieAndRecipe",
        filmId: req.body.filmId || null,
      });

      console.error("Erreur lors de l'ajout du film et de la recette:", error);

      // Message d'erreur générique
      return res.status(500).render("add-recipes-movies", {
        role: req.userRole,
        error: true,
        errorMessage:
          "Erreur lors de la soumission. Veuillez réessayer ou contacter le support si le problème persiste.",
      });
    }
  },
};
export default addRecipesMoviesController;
