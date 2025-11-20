import { Router } from "express";
import adminController from "../controllers/admin.controllers.js";


const adminRouter = Router();

// toutes les routes sont préfixées par /admin que l'on rerovue dans index.route.js

// route principale admin
adminRouter.get("/", adminController.admin);



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

// Valider un film
adminRouter.post('/validateRecipe/:id', adminController.validateRecipe);

// Refuser un film
adminRouter.post('/rejectRecipe/:id', adminController.rejectRecipe);

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
