import { Router } from "express";
import addRecipesMoviesController from "../controllers/add-recipes-movies.controllers.js";
//! ajout import upload middleware
import upload from "../middlewares/upload.middleware.js";

const addRecipesMoviesRouter = Router();

// Route pour la page d'ajout de film et recette
addRecipesMoviesRouter.get("/", addRecipesMoviesController.addRecipesMovies);

// Route pour l'ajout d'un film
addRecipesMoviesRouter.post("/movie", addRecipesMoviesController.addMovie);

//! Route pour l'ajout d'une recette avec upload d'image
addRecipesMoviesRouter.post(
  "/recipe",
  upload.single("recipeImage"),
  addRecipesMoviesController.addRecipe
);

export default addRecipesMoviesRouter;
