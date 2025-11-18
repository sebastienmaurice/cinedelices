import { Router } from "express";
import addRecipesMoviesController from "../controllers/add-recipes-movies.controllers.js";

const addRecipesMoviesRouter = Router();

// Route pour la page d'ajout de film et recette
addRecipesMoviesRouter.get("/", addRecipesMoviesController.addRecipesMovies);

// Route pour l'ajout d'un film
addRecipesMoviesRouter.post("/movie", addRecipesMoviesController.addMovie);
addRecipesMoviesRouter.post("/recipe", addRecipesMoviesController.addRecipe);

export default addRecipesMoviesRouter;
