import { Router } from "express";
import recipesController from "../controllers/recipes-movie.controllers.js";

const recipesRouter = Router();

//les recettes du film
recipesRouter.get("/:id", recipesController.movieRecipes);

//Filtrage recettes par categories (tous, entrée, plat, dessert)
recipesRouter.get("/filtredRecipes", recipesController.filtredRecipes);

//le detail recette
recipesRouter.get("/details", recipesController.detailRecipes);

export default recipesRouter;