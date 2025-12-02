import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { logUpload, logUploadError } from "../utils/logger.js";
import { IMAGE_TYPES } from "../utils/image-utils.js";
import { processImage } from "../utils/image-pipeline.js";
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

      //! Créer la recette d'abord (sans image pour avoir l'ID)
      let imagePath = null;

      const newRecipe = await Recipe.create({
        name: name,
        description: description,
        category: category,
        ingredients: ingredients,
        preparation: preparation,
        time: time,
        difficulty: difficulty,
        id_movie: id_movie,
        picture: null, // Sera mis à jour après traitement de l'image
      });

      //! Traitement de l'image avec le pipeline (après création pour avoir l'ID)
      if (req.file && newRecipe.id) {
        try {
          // Utiliser le pipeline pour traiter l'image (crop, resize, optimize)
          const imageResult = await processImage({
            imagePath: req.file.path, // Chemin absolu de l'image uploadée
            imageType: IMAGE_TYPES.RECIPE_CARD,
            entityId: newRecipe.id,
            entityType: "recipe",
            enableCrop: true,
            enableResize: true,
            enableOptimize: true,
          });

          // Mettre à jour la recette avec le chemin de l'image traitée
          imagePath = imageResult.relativePath;
          await newRecipe.update({ picture: imagePath });

          // Journaliser l'upload d'image
          await logUpload({
            type: IMAGE_TYPES.RECIPE_CARD,
            filename: imageResult.filename,
            originalName: req.file.originalname,
            destination: req.file.destination,
            size: req.file.size,
            mimetype: req.file.mimetype,
            entityId: newRecipe.id,
          });
        } catch (imageError) {
          // En cas d'erreur de traitement, utiliser l'image originale
          console.error("Erreur lors du traitement de l'image:", imageError);
          imagePath = `/images/recipes/cards/${req.file.filename}`;
          await newRecipe.update({ picture: imagePath });

          await logUploadError(imageError, {
            type: IMAGE_TYPES.RECIPE_CARD,
            entityId: newRecipe.id,
            action: "addRecipe-image-processing",
          });
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
        tmdbId, // ID TMDB pour validation intelligente
        titleFR, // Titre français depuis TMDB
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

        // VALIDATION TMDB : Bloquer la création si aucun tmdbId (empêcher films fictifs)
        if (!tmdbId || tmdbId.trim() === "") {
          await transaction.rollback();
          return res.status(400).render("add-recipes-movies", {
            role: req.userRole,
            error: true,
            errorMessage:
              "Aucun film correspondant trouvé. Veuillez vérifier le titre du film.",
          });
        }

        // Vérifier si un film avec ce tmdb_id existe déjà
        const existingMovieByTmdbId = await Movie.findOne({
          where: {
            tmdb_id: parseInt(tmdbId),
          },
          transaction,
        });

        if (existingMovieByTmdbId) {
          // Film avec ce tmdb_id existe déjà : utiliser celui-ci (évite doublons)
          movie = existingMovieByTmdbId;
          movieId = existingMovieByTmdbId.id;
        } else {
          // Vérifier si un film similaire existe déjà (détection doublons par titre/année)
          const existingMovie = await Movie.findOne({
            where: {
              title: {
                [Op.iLike]: (titleFR || title).trim(),
              },
              year: parseInt(year),
              status: false, // Seulement les films non validés
            },
            transaction,
          });

          if (existingMovie) {
            // Film similaire non validé trouvé : mettre à jour avec tmdb_id
            existingMovie.tmdb_id = parseInt(tmdbId);
            await existingMovie.save({ transaction });
            movie = existingMovie;
            movieId = existingMovie.id;
          } else {
            // Créer le nouveau film avec tmdb_id
            movie = await Movie.create(
              {
                title: (titleFR || title).trim(), // Utiliser le titre FR de TMDB si disponible
                year: parseInt(year),
                genre: genre.trim(),
                tmdb_id: parseInt(tmdbId),
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

      // 4. Créer la recette d'abord (sans image pour avoir l'ID)
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
          picture: null, // Sera mis à jour après traitement de l'image
          status: false, // En attente de validation admin
        },
        { transaction }
      );

      // 5. Gérer l'image de la recette avec le pipeline (après création pour avoir l'ID)
      let imagePath = null;
      if (req.file && newRecipe.id) {
        try {
          // Utiliser le pipeline pour traiter l'image (crop, resize, optimize)
          const imageResult = await processImage({
            imagePath: req.file.path, // Chemin absolu de l'image uploadée
            imageType: IMAGE_TYPES.RECIPE_CARD,
            entityId: newRecipe.id,
            entityType: "recipe",
            enableCrop: true,
            enableResize: true,
            enableOptimize: true,
          });

          // Mettre à jour la recette avec le chemin de l'image traitée (dans la transaction)
          imagePath = imageResult.relativePath;
          await newRecipe.update({ picture: imagePath }, { transaction });

          // Journaliser l'upload d'image
          await logUpload({
            type: IMAGE_TYPES.RECIPE_CARD,
            filename: imageResult.filename,
            originalName: req.file.originalname,
            destination: req.file.destination,
            size: req.file.size,
            mimetype: req.file.mimetype,
            entityId: newRecipe.id,
          });
        } catch (imageError) {
          // En cas d'erreur de traitement, utiliser l'image originale
          console.error("Erreur lors du traitement de l'image:", imageError);
          imagePath = `/images/recipes/cards/${req.file.filename}`;
          await newRecipe.update({ picture: imagePath }, { transaction });

          await logUploadError(imageError, {
            type: IMAGE_TYPES.RECIPE_CARD,
            entityId: newRecipe.id,
            action: "addMovieAndRecipe-image-processing",
          });
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
