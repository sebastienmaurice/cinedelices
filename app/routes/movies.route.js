import { Router } from "express";
import moviesController from "../controllers/movies.controllers.js";

const moviesRouter = Router();

// route principale
moviesRouter.get("/", moviesController.moviesList);

//!changer les methodes selon les besoins
//Filtrage des films par genre (tous, action, comedie, drame...)
moviesRouter.get("/filtredMovies", moviesController.filtredMovies);

//les recettes du film
moviesRouter.get("/recipes", moviesController.movieRecipes);

//Filtrage recettes par categories (tous, entrée, plat, dessert)
moviesRouter.get("/filtredRecipes", moviesController.filtredRecipes);

//le detail recette
moviesRouter.get("/details", moviesController.detailRecipes);

export default moviesRouter;
