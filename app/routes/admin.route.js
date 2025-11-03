import { Router } from "express";
import adminController from "../controllers/admin.controllers.js";
import { isAdmin } from "../middlewares/is-admin.middleware.js";

// 🔹 Middleware temporaire pour mock admin (à retirer quand authentification réelle en place)
import { mockAdmin } from "../middlewares/mock-admin.middleware.js";

const adminRouter = Router();

// Applique le mock à toutes les routes admin pour tester
adminRouter.use(mockAdmin);

// 🔹 Page principale admin
adminRouter.get("/admin", isAdmin, adminController.admin);

// 🔹 Page pour ajouter une recette inspirée d'un film (GET)
adminRouter.get(
  "/admin/add-movie-recipe",
  isAdmin,
  adminController.addMovieRecipe
);

// 🔹 Soumission du formulaire d'ajout de recette (POST)
adminRouter.post(
  "/admin/add-movie-recipe",
  isAdmin,
  adminController.saveMovieRecipe
);

// 🔹 Liste des recettes pour admin
adminRouter.get("/admin/recipes", isAdmin, adminController.listRecipes);

// 🔹 Édition d'une recette
adminRouter.get("/admin/recipes/:id/edit", isAdmin, adminController.editRecipe);
adminRouter.post(
  "/admin/recipes/:id/edit",
  isAdmin,
  adminController.updateRecipe
);

// 🔹 Suppression d'une recette
adminRouter.post(
  "/admin/recipes/:id/delete",
  isAdmin,
  adminController.deleteRecipe
);

export default adminRouter;
