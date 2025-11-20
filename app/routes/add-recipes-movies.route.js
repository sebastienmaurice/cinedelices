import { Router } from "express";
import addRecipesMoviesController from "../controllers/add-recipes-movies.controllers.js";
import { validateRecipeCreate} from "../validators/recipe.validator.js";
import { validateMovieCreate } from "../validators/movie.validator.js";

const addRecipesMoviesRouter = Router();

// Route pour la page d'ajout de film et recette
addRecipesMoviesRouter.get("/", addRecipesMoviesController.addRecipesMovies);

// Route pour l'ajout d'un film
addRecipesMoviesRouter.post("/movie", validateMovieCreate, addRecipesMoviesController.addMovie);
addRecipesMoviesRouter.post("/recipe", validateRecipeCreate, addRecipesMoviesController.addRecipe);

export default addRecipesMoviesRouter;
