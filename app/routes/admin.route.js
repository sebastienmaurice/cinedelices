import { Router } from "express";
import adminController from "../controllers/admin.controllers.js";

// 🔹 Middleware temporaire pour mock admin (à retirer quand authentification réelle en place)
import { mockAdmin } from "../middlewares/mock-admin.middleware.js";

const adminRouter = Router();

// toutes les routes sont préfixées par /admin que l'on rerovue dans index.route.js

// route principale admin
adminRouter.get("/", adminController.admin);


// Applique le mock à toutes les routes ????????
adminRouter.use(mockAdmin); 

/* ===============================================
   coté gauche
   =============================================== */

// pour lister les recettes
//adminRouter.get("/admin/recipes", isAdmin, adminController.listRecipes);

// pour lister les utisateurs (action directe suppression)
adminRouter.post("/deleteUser/:id", adminController.deleteUser);

/* ===============================================
   action recettes
   =============================================== */

//Ajouter une recette inspirée d’un film à valider
adminRouter.get("/recipe/:id", adminController.editRecipe);

// Soumission de la validation d’une recette
adminRouter.post("/add-movie-recipe", adminController.saveMovieRecipe);

// Suppression d’une recette
adminRouter.post("/recipes/:id/delete", adminController.deleteRecipe);

/* ===============================================
   action films
   =============================================== */

// ajouter un film à valdier
adminRouter.get("/movie/:id", adminController.editMovie);

// Valider un film
adminRouter.post('/validateMovie/:id', adminController.validateMovie);

// Refuser un film
adminRouter.post('/rejectMovie/:id', adminController.rejectMovie);











export default adminRouter;
