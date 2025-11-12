import { Router } from "express";
import addRecipesMoviesController from "../controllers/add-recipes-movies.controllers.js";

const addRecipesMoviesRouter = Router();

// Route pour la page d'ajout de film et recette
addRecipesMoviesRouter.get("/", addRecipesMoviesController.addRecipesMovies);

export default addRecipesMoviesRouter;

