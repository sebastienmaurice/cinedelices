import { Router } from "express";
import recipesController from "../controllers/recipes-movie.controllers.js";

const recipesRouter = Router();

// liste des recettes (filtre optionnel par auteur)
recipesRouter.get("/", recipesController.allRecipes);

//le detail d'une recette d'un film spécifique
recipesRouter.get("/details/:id", recipesController.detailRecipes);

//Filtrage recettes par categories (tous, entrée, plat, dessert)
recipesRouter.get("/category/:id/:category", recipesController.filtredRecipes);

//les recettes du film selectionnné par id
recipesRouter.get("/:id", recipesController.movieRecipes);









export default recipesRouter;