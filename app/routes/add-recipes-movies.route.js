import { Router } from "express";
import fs from "fs";
import addRecipesMoviesController from "../controllers/add-recipes-movies.controllers.js";
import {
  validateRecipeCreate,
  validateMovieAndRecipeCreate,
} from "../validators/recipe.validator.js";
import { validateMovieCreate } from "../validators/movie.validator.js";
import { uploadRecipePhotos } from "../middlewares/upload.middleware.js";

const addRecipesMoviesRouter = Router();

function handleAddRecipePhotos(req, res, next) {
  uploadRecipePhotos(req, res, (err) => {
    if (!err) return next();

    if (req.files) {
      for (const file of req.files) {
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const acceptsJson =
      req.xhr || req.headers.accept?.includes("application/json");
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Chaque image ne doit pas dépasser 2 Mo."
        : err.message || "Erreur lors de l'upload des photos.";

    if (acceptsJson) {
      return res.status(400).json({ status: "fail", message });
    }

    return res.status(400).render("add-recipes-movies", {
      error: true,
      errorMessage: message,
    });
  });
}

// Route pour la page d'ajout de film et recette
addRecipesMoviesRouter.get("/", addRecipesMoviesController.addRecipesMovies);

// Route pour la page d'ajout d'une recette dans un film existant
addRecipesMoviesRouter.get(
  "/:id",
  addRecipesMoviesController.addRecipeToMovies,
);

// Route pour l'ajout d'un film

addRecipesMoviesRouter.post(
  "/movie",
  validateMovieCreate,
  addRecipesMoviesController.addMovie,
);

// Route pour l'ajout d'une recette avec upload multi-photos (max 3)
addRecipesMoviesRouter.post(
  "/recipe",
  handleAddRecipePhotos,
  validateRecipeCreate,
  addRecipesMoviesController.addRecipe,
);

// Route unifiée film + recette
addRecipesMoviesRouter.post(
  "/movie-and-recipe",
  handleAddRecipePhotos,
  validateMovieAndRecipeCreate,
  addRecipesMoviesController.addMovieAndRecipe,
);

export default addRecipesMoviesRouter;
