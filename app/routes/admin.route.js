import { Router } from "express";
import adminController from "../controllers/admin.controllers.js";
import { isAdmin } from "../middlewares/is-admin.middleware.js";

// 🔹 Middleware temporaire pour mock admin (à retirer quand authentification réelle en place)
import { mockAdmin } from "../middlewares/mock-admin.middleware.js";

const adminRouter = Router();

// Applique le mock à toutes les routes admin pour tester
adminRouter.use(mockAdmin);

/* ===============================================
   PAGE PRINCIPALE ADMIN
   =============================================== */
// Cette route servira "admin-dashboard.ejs"
//!route fonctionnelle
adminRouter.get("/", adminController.admin);

/* ===============================================
   AUTRES ROUTES ADMIN
   =============================================== */
// Route principale "racine" du router (peut rester, mais appelle aussi adminController.admin)
//adminRouter.get("/", isAdmin, adminController.admin);

// Recettes / films
adminRouter.get("/deleteR", adminController.deleteRecipe);
adminRouter.get("/updateR", adminController.updateRecipe);
adminRouter.get("/validateR", adminController.validateRecipe);

// Utilisateurs
adminRouter.get("/deleteU", adminController.deleteUser);

// Ajouter une recette inspirée d’un film
adminRouter.get(
  "/admin/add-movie-recipe",
  isAdmin,
  adminController.addMovieRecipe
);
adminRouter.post(
  "/admin/add-movie-recipe",
  isAdmin,
  adminController.saveMovieRecipe
);

// Liste des recettes
adminRouter.get("/admin/recipes", isAdmin, adminController.listRecipes);

// Édition d’une recette
adminRouter.get("/admin/recipes/:id/edit", isAdmin, adminController.editRecipe);
adminRouter.post(
  "/admin/recipes/:id/edit",
  isAdmin,
  adminController.updateRecipe
);

// Suppression d’une recette
adminRouter.post(
  "/admin/recipes/:id/delete",
  isAdmin,
  adminController.deleteRecipe
);

export default adminRouter;
