import { Router } from "express";
import adminController from "../controllers/admin.controllers.js";
import uploadMovie from "../middlewares/upload-movie.middleware.js";
import uploadRecipe from "../middlewares/upload.middleware.js";

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
adminRouter.post("/validateNotice/:id", adminController.validateNotice);
adminRouter.post("/rejectNotice/:id", adminController.rejectNotice);
adminRouter.post("/users/:id/photo/approve", adminController.validateUserPhoto);
adminRouter.post("/users/:id/photo/reject", adminController.rejectUserPhoto);

/* ===============================================
   action recettes
   =============================================== */

//Ajouter une recette inspirée d’un film à valider
adminRouter.get("/recipe/:id", adminController.editRecipe);

// Valider un film
adminRouter.post("/validateRecipe/:id", adminController.validateRecipe);

// Refuser un film
adminRouter.post("/rejectRecipe/:id", adminController.rejectRecipe);

// Mettre à jour une recette avant validation
adminRouter.post("/recipes/:id/update", adminController.updateRecipeAdmin);

/* ===============================================
   action films
   =============================================== */

// ajouter un film à valdier
adminRouter.get("/movie/:id", adminController.editMovie);

//! Valider un film (avec upload d'image optionnel)
adminRouter.post(
  "/validateMovie/:id",
  uploadMovie.single("filmImage"),
  adminController.validateMovie,
);

// Refuser un film
adminRouter.post("/rejectMovie/:id", adminController.rejectMovie);

// Demandes de suppression de films
adminRouter.post(
  "/movies/:id/delete/approve",
  adminController.approveMovieDeletion,
);
adminRouter.post(
  "/movies/:id/delete/reject",
  adminController.rejectMovieDeletion,
);

// Modifications films
adminRouter.post("/movies/:id/edit/approve", adminController.approveMovieEdit);
adminRouter.post("/movies/:id/edit/reject", adminController.rejectMovieEdit);

// Modifications recettes
adminRouter.post(
  "/recipes/:id/edit/approve",
  adminController.approveRecipeEdit,
);
adminRouter.post("/recipes/:id/edit/reject", adminController.rejectRecipeEdit);

// Modifications avis
adminRouter.post(
  "/notices/:id/edit/approve",
  adminController.approveNoticeEdit,
);
adminRouter.post("/notices/:id/edit/reject", adminController.rejectNoticeEdit);

// Suppression avis
adminRouter.post(
  "/notices/:id/delete/approve",
  adminController.approveNoticeDeletion,
);
adminRouter.post(
  "/notices/:id/delete/reject",
  adminController.rejectNoticeDeletion,
);

// Suppression directe admin (contenus validés ou non)
adminRouter.post(
  "/movies/:id/delete/direct",
  adminController.deleteMovieDirect,
);
adminRouter.post(
  "/recipes/:id/delete/direct",
  adminController.deleteRecipeDirect,
);
adminRouter.post(
  "/notices/:id/delete/direct",
  adminController.deleteNoticeDirect,
);

// Édition directe admin (contenus validés ou non, avec upload photo optionnel)
adminRouter.post("/movies/:id/edit/direct", uploadMovie.single("filmImage"), adminController.updateMovieDirect);
adminRouter.post(
  "/recipes/:id/edit/direct",
  uploadRecipe.single("recipeImage"),
  adminController.updateRecipeDirect,
);
adminRouter.post(
  "/notices/:id/edit/direct",
  adminController.updateNoticeDirect,
);

export default adminRouter;
