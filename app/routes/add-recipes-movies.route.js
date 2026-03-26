import { Router } from "express";
import addRecipesMoviesController from "../controllers/add-recipes-movies.controllers.js";
import { validateRecipeCreate } from "../validators/recipe.validator.js";
import { validateMovieCreate } from "../validators/movie.validator.js";
import upload, { uploadRecipePhotos } from "../middlewares/upload.middleware.js";

const addRecipesMoviesRouter = Router();

// Route pour la page d'ajout de film et recette
addRecipesMoviesRouter.get("/", addRecipesMoviesController.addRecipesMovies);

// Route pour la page d'ajout d'une recette dans un film existant
addRecipesMoviesRouter.get(
  "/:id",
  addRecipesMoviesController.addRecipeToMovies
);

// Route pour l'ajout d'un film

addRecipesMoviesRouter.post(
  "/movie",
  validateMovieCreate,
  addRecipesMoviesController.addMovie
);

// Route pour l'ajout d'une recette avec upload multi-photos (max 3)
addRecipesMoviesRouter.post(
  "/recipe",
  uploadRecipePhotos,
  validateRecipeCreate,
  addRecipesMoviesController.addRecipe
);

// Route unifiée film + recette
addRecipesMoviesRouter.post(
  "/movie-and-recipe",
  uploadRecipePhotos,
  addRecipesMoviesController.addMovieAndRecipe
);

export default addRecipesMoviesRouter;
