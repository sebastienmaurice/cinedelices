import { Recipe, Movie, RecipePicture } from "../models/index.model.js";
import { enrichMovieWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { downloadTmdbPoster } from "../utils/tmdb-image-downloader.js";
import {
  processRecipeImages,
  processStepImages,
  cleanupFiles,
} from "../utils/recipe-image-processor.js";
import fs from "fs";
import slugify from "slugify";

function acceptsJson(req) {
  return req.xhr || req.headers.accept?.includes("application/json");
}

/**
 * Extrait les photos de préparation envoyées (jusqu'à 6, chacune dans son
 * propre champ stepPicture1…stepPicture6 — voir upload.middleware.js) et
 * leur numéro d'étape associé (stepNumber1…stepNumber6, saisi librement par
 * le contributeur — ne correspond pas forcément à la position de l'emplacement).
 * @returns {{file: Express.Multer.File, stepNumber: number}[]}
 */
function extractStepFiles(req) {
  const entries = [];
  for (let i = 1; i <= 6; i++) {
    const file = req.files?.[`stepPicture${i}`]?.[0];
    if (!file) continue;
    const raw = parseInt(req.body?.[`stepNumber${i}`], 10);
    const stepNumber = Number.isInteger(raw) && raw > 0 ? raw : i;
    entries.push({ file, stepNumber });
  }
  return entries;
}

function buildRetainFilm(body) {
  const { filmId, tmdbId, title, year, genre, synopsis } = body || {};
  // Si film existant (filmId) → pas besoin de retainFilm, filmId suffit
  if (filmId) return null;
  if (!title && !tmdbId) return null;
  return {
    tmdbId: tmdbId || "",
    title: title || "",
    year: year || "",
    genre: genre || "",
    synopsis: synopsis || "",
  };
}

function renderClientError(req, res, message, status = 400, extra = {}) {
  if (acceptsJson(req)) {
    return res.status(status).json({ status: "fail", message });
  }
  return res.status(status).render("add-recipes-movies", {
    error: true,
    errorMessage: message,
    retainFilm: buildRetainFilm(req.body),
    ...extra,
  });
}

function renderClientSuccess(req, res, payload = {}) {
  if (acceptsJson(req)) {
    return res.status(201).json({ status: "ok", ...payload });
  }
  return res.status(201).render("add-recipes-movies", {
    success: true,
    successMessage:
      payload.successMessage || "Film et recette envoyés pour validation.",
    ...payload,
  });
}

function getRatioErrorMessage(err) {
  const fileLabel = err.filename ? `"${err.filename}"` : "cette image";
  if (err.type === "portrait") {
    return `L'image ${fileLabel} est trop verticale ou carrée (${err.w}×${err.h} px). Envoyez une photo proche du ratio 3:2 (ex: 1200×800).`;
  }
  if (err.type === "panoramic") {
    return `L'image ${fileLabel} est trop panoramique (${err.w}×${err.h} px). Envoyez une photo proche du ratio 3:2 (ex: 1200×800).`;
  }
  return `Le format de l'image ${fileLabel} n'est pas pris en charge.`;
}

function collectImageWarning(processed) {
  const warnings = processed
    .filter((item) => item.warning)
    .map((item) => {
      const { warning } = item;
      if (warning.type === "ratio") {
        return `L'image "${item.filename || "sélectionnée"}" n'est pas au ratio 3:2 exact (${warning.w}×${warning.h} px). Elle a été recadrée automatiquement en 1200×800.`;
      }
      return `L'image "${item.filename || "sélectionnée"}" a été recadrée automatiquement en 1200×800.`;
    });
  return warnings.length ? warnings.join(" ") : null;
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
    const files = req.files?.pictures || [];
    const stepFileEntries = extractStepFiles(req);
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

      const parsedTime = time ? parseInt(time, 10) : NaN;
      const parsedServings = servings ? parseInt(servings, 10) : null;

      if (!files.length) {
        cleanupFiles(stepFileEntries.map((s) => s.file));
        return renderClientError(
          req,
          res,
          "Merci d'ajouter au moins une photo de la recette.",
        );
      }

      if (
        !name ||
        !description ||
        !category ||
        !ingredients ||
        !preparation ||
        !difficulty
      ) {
        cleanupFiles(files);
        cleanupFiles(stepFileEntries.map((s) => s.file));
        return renderClientError(
          req,
          res,
          "Merci de compléter tous les champs de la recette.",
        );
      }

      if (Number.isNaN(parsedTime) || parsedTime < 1) {
        cleanupFiles(files);
        cleanupFiles(stepFileEntries.map((s) => s.file));
        return renderClientError(
          req,
          res,
          "Le temps de préparation doit être un nombre entier supérieur à 0.",
        );
      }

      let processed = [];
      if (files.length > 0) {
        try {
          processed = await processRecipeImages(files);
        } catch (err) {
          cleanupFiles(files);
          cleanupFiles(stepFileEntries.map((s) => s.file));
          if (err.message === "invalid_image") {
            return renderClientError(
              req,
              res,
              `Le fichier "${err.filename}" n'est pas une image valide. Utilisez JPG, PNG ou WEBP.`,
            );
          }
          if (err.message === "invalid_image_ratio") {
            return renderClientError(req, res, getRatioErrorMessage(err));
          }
          if (err.message === "image_processing") {
            return renderClientError(
              req,
              res,
              `Impossible de traiter l'image "${err.filename}". Vérifiez le format et réessayez.`,
            );
          }
          throw err;
        }
      }

      // Photos de préparation (optionnelles, jusqu'à 6, une par étape)
      let processedSteps = [];
      if (stepFileEntries.length > 0) {
        try {
          const rawProcessed = await processStepImages(
            stepFileEntries.map((s) => s.file),
          );
          processedSteps = rawProcessed.map((p, idx) => ({
            ...p,
            stepNumber: stepFileEntries[idx].stepNumber,
          }));
        } catch (err) {
          if (err.message === "invalid_image") {
            return renderClientError(
              req,
              res,
              `La photo de préparation "${err.filename}" n'est pas une image valide. Utilisez JPG, PNG ou WEBP.`,
            );
          }
          return renderClientError(
            req,
            res,
            `Impossible de traiter la photo de préparation "${err.filename}". Vérifiez le format et réessayez.`,
          );
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
          })),
        );
      }
      // Photos de préparation — position décalée (100+N) pour ne jamais
      // collisionner avec les positions 1-3 de la galerie.
      if (processedSteps.length > 0) {
        await RecipePicture.bulkCreate(
          processedSteps.map(({ relPath, stepNumber }) => ({
            recipe_id: newRecipe.id,
            file_path: relPath,
            position: 100 + stepNumber,
            step_number: stepNumber,
          })),
        );
      }

      const warningMessage = collectImageWarning(processed);
      return renderClientSuccess(req, res, {
        newRecipe,
        warningMessage,
      });
    } catch (error) {
      cleanupFiles(files.filter((f) => fs.existsSync(f.path)));
      cleanupFiles(stepFileEntries.map((s) => s.file).filter((f) => fs.existsSync(f.path)));
      return renderServerError(res, error);
    }
  },

  /**
   * POST /add-recipes-movies/movie-and-recipe
   * Formulaire unifié film + recette.
   */
  async addMovieAndRecipe(req, res) {
    const files = req.files?.pictures || [];
    const stepFileEntries = extractStepFiles(req);
    try {
      const {
        filmId,
        title,
        year,
        genre,
        synopsis,
        tmdbId,
        name,
        description,
        category,
        ingredients,
        preparation,
        time,
        servings,
        difficulty,
      } = req.body;

      const parsedFilmId = filmId ? parseInt(filmId, 10) : null;
      const parsedTmdbId = tmdbId ? parseInt(tmdbId, 10) : null;
      const parsedTime = time ? parseInt(time, 10) : null;
      const parsedServings = servings ? parseInt(servings, 10) : null;

      if (
        !name ||
        !description ||
        !category ||
        !ingredients ||
        !preparation ||
        !parsedTime ||
        !difficulty
      ) {
        cleanupFiles(files);
        cleanupFiles(stepFileEntries.map((s) => s.file));
        return renderClientError(
          req,
          res,
          "Merci de compléter tous les champs de la recette.",
        );
      }

      if (parsedTime < 1 || Number.isNaN(parsedTime)) {
        cleanupFiles(files);
        cleanupFiles(stepFileEntries.map((s) => s.file));
        return renderClientError(
          req,
          res,
          "Le temps de préparation doit être un nombre entier supérieur à 0.",
        );
      }

      if (files.length === 0) {
        cleanupFiles(stepFileEntries.map((s) => s.file));
        return renderClientError(
          req,
          res,
          "Merci d'ajouter au moins une photo de la recette.",
        );
      }

      // Film : existant (par DB id, tmdb_id ou slug) ou nouveau
      let movie = null;
      if (parsedFilmId) {
        movie = await Movie.findByPk(parsedFilmId);
        if (!movie) {
          return renderClientError(
            req,
            res,
            "Le film sélectionné est introuvable.",
          );
        }
      }
      if (!movie && parsedTmdbId)
        movie = await Movie.findOne({ where: { tmdb_id: parsedTmdbId } });
      if (!movie && title)
        movie = await Movie.findOne({
          where: { slug: slugify(title, { lower: true, strict: true }) },
        });

      if (!movie) {
        if (!title || !year || !genre) {
          cleanupFiles(files);
          cleanupFiles(stepFileEntries.map((s) => s.file));
          return renderClientError(
            req,
            res,
            "Merci de compléter les informations du film.",
          );
        }
        // Télécharger l'affiche TMDB avant de créer le film
        let picturePath = null;
        if (parsedTmdbId) {
          picturePath = await downloadTmdbPoster(
            parsedTmdbId,
            req.body.type,
            title,
          );
        }

        // Les films TMDB sont auto-approuvés (source fiable) — pas de validation admin requise
        movie = await Movie.create({
          title,
          year: parseInt(year, 10),
          genre,
          synopsis: synopsis || null,
          id_user: req.userId,
          tmdb_id: parsedTmdbId || null,
          picture: picturePath, // 🎯 Ajouter l'affiche téléchargée
          ...(parsedTmdbId
            ? { status: "approved", validated_at: new Date() }
            : {}),
        });
      }

      // Traitement des photos uploadées
      let processed = [];
      if (files.length > 0) {
        try {
          processed = await processRecipeImages(files);
        } catch (err) {
          cleanupFiles(files);
          cleanupFiles(stepFileEntries.map((s) => s.file));
          if (err.message === "invalid_image") {
            return renderClientError(
              req,
              res,
              `Le fichier "${err.filename}" n'est pas une image valide. Utilisez JPG, PNG ou WEBP.`,
            );
          }
          if (err.message === "invalid_image_ratio") {
            return renderClientError(req, res, getRatioErrorMessage(err));
          }
          if (err.message === "image_processing") {
            return renderClientError(
              req,
              res,
              `Impossible de traiter l'image "${err.filename}". Vérifiez le format et réessayez.`,
            );
          }
          throw err;
        }
      }

      // Photos de préparation (optionnelles, jusqu'à 6, une par étape)
      let processedSteps = [];
      if (stepFileEntries.length > 0) {
        try {
          const rawProcessed = await processStepImages(
            stepFileEntries.map((s) => s.file),
          );
          processedSteps = rawProcessed.map((p, idx) => ({
            ...p,
            stepNumber: stepFileEntries[idx].stepNumber,
          }));
        } catch (err) {
          if (err.message === "invalid_image") {
            return renderClientError(
              req,
              res,
              `La photo de préparation "${err.filename}" n'est pas une image valide. Utilisez JPG, PNG ou WEBP.`,
            );
          }
          return renderClientError(
            req,
            res,
            `Impossible de traiter la photo de préparation "${err.filename}". Vérifiez le format et réessayez.`,
          );
        }
      }

      const mainPicture = processed.length > 0 ? processed[0].relPath : null;

      const newRecipe = await Recipe.create({
        name,
        description,
        category,
        ingredients,
        preparation,
        time: parsedTime,
        servings: parsedServings || null,
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
          })),
        );
      }
      // Photos de préparation — position décalée (100+N) pour ne jamais
      // collisionner avec les positions 1-3 de la galerie.
      if (processedSteps.length > 0) {
        await RecipePicture.bulkCreate(
          processedSteps.map(({ relPath, stepNumber }) => ({
            recipe_id: newRecipe.id,
            file_path: relPath,
            position: 100 + stepNumber,
            step_number: stepNumber,
          })),
        );
      }

      const enrichedMovie = enrichMovieWithImagePaths(movie);
      const warningMessage = collectImageWarning(processed);
      return renderClientSuccess(req, res, {
        newMovie: enrichedMovie,
        newRecipe,
        warningMessage,
      });
    } catch (error) {
      cleanupFiles(files.filter((f) => fs.existsSync(f.path)));
      cleanupFiles(stepFileEntries.map((s) => s.file).filter((f) => fs.existsSync(f.path)));
      return renderServerError(res, error);
    }
  },
};

export default addRecipesMoviesController;
