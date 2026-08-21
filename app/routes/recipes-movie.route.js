import { Router } from "express";
import recipesController from "../controllers/recipes-movie.controllers.js";
import { isLogged } from "../middlewares/is-authed.middleware.js";
import { uploadNoticePhotos } from "../middlewares/upload.middleware.js";

const recipesRouter = Router();

// toutes les recettes du site
recipesRouter.get("/", recipesController.allRecipes);

//le detail d'une recette d'un film spécifique
recipesRouter.get("/details/:id", recipesController.detailRecipes);

// Soumission d'un avis (ou d'une réponse à un avis, via body.parentId) sur une
// recette (utilisateur connecté) — jusqu'à 3 photos jointes (noticePictures).
recipesRouter.post(
  "/details/:id/avis",
  isLogged,
  uploadNoticePhotos,
  recipesController.submitNotice
);

//Filtrage recettes par categories (tous, entrée, plat, dessert)
recipesRouter.get("/category/:id/:category", recipesController.filtredRecipes);

//les recettes du film selectionnné par id
recipesRouter.get("/:id", recipesController.movieRecipes);









export default recipesRouter;