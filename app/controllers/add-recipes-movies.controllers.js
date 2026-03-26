import { Recipe, Movie, RecipePicture } from "../models/index.model.js";
import { enrichMovieWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { downloadTmdbPoster } from "../utils/tmdb-image-downloader.js";
import { processRecipeImages, cleanupFiles } from "../utils/recipe-image-processor.js";
import fs from "fs";
import slugify from "slugify";

/** Retourne le slug du film, ou le calcule depuis le titre si absent en base */
function _movieSlug(movie) {
  if (!movie) return "";
  return movie.slug || slugify(movie.title || "", { lower: true, strict: true });
}

const addRecipesMoviesController = {
  // Page d'ajout de film et recette
  addRecipesMovies(req, res) {
    try {
      res.render("add-recipes-movies");
    } catch (error) {
      return renderServerError(res, error);
    }
  },

  // Page d'ajout d'une recette dans un film existant
  async addRecipeToMovies(req, res) {
    try {
      const id = req.params.id;
      const newMovie = await Movie.findByPk(id);
      if (!newMovie) return renderNotFound(res, "Film");
      const enrichedMovie = enrichMovieWithImagePaths(newMovie);
      res.render("add-recipes-movies", { newMovie: enrichedMovie });
    } catch (error) {
      return renderServerError(res, error);
    }
  },

  /**
   * POST /add-recipes-movies/movie
   * Ajout d'un nouveau film en base.
   */
  async addMovie(req, res) {
    try {
      const { title, year, genre, synopsis, tmdb_id, type } = req.body;

      let picturePath = null;
      if (tmdb_id) {
        picturePath = await downloadTmdbPoster(parseInt(tmdb_id), type, title);
      }

      const newMovie = await Movie.create({
        title,
        year,
        genre,
        synopsis: synopsis || null,
        id_user: req.userId,
        tmdb_id: tmdb_id ? parseInt(tmdb_id) : null,
        picture: picturePath,
      });

      const enrichedMovie = enrichMovieWithImagePaths(newMovie);
      res.status(201).render("add-recipes-movies", { newMovie: enrichedMovie });
    } catch (error) {
      return renderServerError(res, error);
    }
  },

  /**
   * POST /add-recipes-movies/recipe
   * Ajout d'une recette avec upload de 1 à 3 photos.
   * - req.files : tableau de fichiers (champ "pictures", max 3)
   * - Validation ratio 3:2 pour chaque photo
   * - Compression / conversion WebP selon NODE_ENV
   * - recipe.picture = première photo (rétro-compat)
   * - RecipePictures : toutes les photos ordonnées par position
   */
  async addRecipe(req, res) {
    const files = req.files || [];
    try {
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

      // Traitement des photos uploadées
      let processed = [];
      if (files.length > 0) {
        try {
          processed = await processRecipeImages(files);
        } catch (err) {
          // Nettoyer les fichiers restants si un ratio est invalide
          cleanupFiles(files.filter((f) => fs.existsSync(f.path)));
          if (err.message === "ratio") {
            return res.status(400).render("add-recipes-movies", {
              error: true,
              errorMessage: `L'image "${err.filename}" doit avoir un ratio paysage 3:2 (ex : 1200×800 px). Votre image fait ${err.w}×${err.h} px.`,
            });
          }
          throw err;
        }
      }

      const mainPicture = processed.length > 0 ? processed[0].relPath : null;

      const newRecipe = await Recipe.create({
        name,
        description,
        category,
        ingredients,
        preparation,
        time,
        servings: servings || null,
        difficulty,
        id_movie,
        id_user: req.userId,
        picture: mainPicture,
      });

      // Enregistrer toutes les photos dans recipe_pictures
      if (processed.length > 0) {
        await RecipePicture.bulkCreate(
          processed.map(({ relPath, position }) => ({
            recipe_id: newRecipe.id,
            file_path: relPath,
            position,
          }))
        );
      }

      res.status(201).render("add-recipes-movies", { newRecipe });
    } catch (error) {
      cleanupFiles(files.filter((f) => fs.existsSync(f.path)));
      return renderServerError(res, error);
    }
  },

  /**
   * POST /add-recipes-movies/movie-and-recipe
   * Formulaire unifié film + recette.
   */
  async addMovieAndRecipe(req, res) {
    const files = req.files || [];
    try {
      const {
        filmId,
        title,
        year,
        genre,
        synopsis,
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
        cleanupFiles(files);
        return res.status(400).render("add-recipes-movies", {
          error: true,
          errorMessage: "Merci de compléter tous les champs de la recette.",
        });
      }

      // Film : existant ou nouveau
      let movie = null;
      if (filmId) movie = await Movie.findByPk(filmId);

      if (!movie) {
        if (!title || !year || !genre) {
          cleanupFiles(files);
          return res.status(400).render("add-recipes-movies", {
            error: true,
            errorMessage: "Merci de compléter les informations du film.",
          });
        }
        movie = await Movie.create({
          title,
          year,
          genre,
          synopsis: synopsis || null,
          id_user: req.userId,
        });
      }

      // Traitement des photos uploadées
      let processed = [];
      if (files.length > 0) {
        try {
          processed = await processRecipeImages(files);
        } catch (err) {
          cleanupFiles(files.filter((f) => fs.existsSync(f.path)));
          if (err.message === "ratio") {
            return res.status(400).render("add-recipes-movies", {
              error: true,
              errorMessage: `L'image "${err.filename}" doit avoir un ratio paysage 3:2 (ex : 1200×800 px). Votre image fait ${err.w}×${err.h} px.`,
            });
          }
          throw err;
        }
      }

      const mainPicture = processed.length > 0 ? processed[0].relPath : null;

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
        picture: mainPicture,
      });

      // Enregistrer toutes les photos dans recipe_pictures
      if (processed.length > 0) {
        await RecipePicture.bulkCreate(
          processed.map(({ relPath, position }) => ({
            recipe_id: newRecipe.id,
            file_path: relPath,
            position,
          }))
        );
      }

      const enrichedMovie = enrichMovieWithImagePaths(movie);
      return res.status(201).render("add-recipes-movies", {
        success: true,
        successMessage: "Film et recette envoyés pour validation.",
        newMovie: enrichedMovie,
        newRecipe,
      });
    } catch (error) {
      cleanupFiles(files.filter((f) => fs.existsSync(f.path)));
      return renderServerError(res, error);
    }
  },
};

export default addRecipesMoviesController;
