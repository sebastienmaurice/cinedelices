import { Router } from "express";
import adminController from "../controllers/admin.controllers.js";
import uploadMovie from "../middlewares/upload-movie.middleware.js";
import uploadRecipe from "../middlewares/upload.middleware.js";
import { isSuperAdmin } from "../middlewares/is-superadmin.middleware.js";

const adminRouter = Router();

// toutes les routes sont préfixées par /admin que l'on rerovue dans index.route.js

// route principale admin
adminRouter.get("/", adminController.admin);
adminRouter.get("/api/pending-count", adminController.getPendingCount);

/* ===============================================
   coté gauche
   =============================================== */

// pour lister les recettes
//adminRouter.get("/admin/recipes", isAdmin, adminController.listRecipes);

// pour lister les utisateurs (action directe suppression)
adminRouter.post("/deleteUser/:id",  isSuperAdmin, adminController.deleteUser);
adminRouter.post("/users/create",    isSuperAdmin, adminController.createUser);
adminRouter.post("/users/:id/edit",               adminController.editUser);
adminRouter.post("/users/:id/role",  isSuperAdmin, adminController.changeUserRole);
adminRouter.post("/validateNotice/:id", adminController.validateNotice);
adminRouter.post("/rejectNotice/:id", adminController.rejectNotice);
adminRouter.post("/users/:id/photo/approve", adminController.validateUserPhoto);
adminRouter.post("/users/:id/photo/reject", adminController.rejectUserPhoto);
adminRouter.post("/users/:id/banner/approve", adminController.validateUserBanner);
adminRouter.post("/users/:id/banner/reject", adminController.rejectUserBanner);
adminRouter.post("/users/:id/pseudo/approve", adminController.validateUserPseudo);
adminRouter.post("/users/:id/pseudo/reject", adminController.rejectUserPseudo);
adminRouter.post("/users/:id/bio/approve", adminController.validateUserBio);
adminRouter.post("/users/:id/bio/reject", adminController.rejectUserBio);

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

// Refuser / supprimer une photo complémentaire spécifique (position 2 ou 3)
adminRouter.post("/recipe-pictures/:pictureId/delete", adminController.deleteRecipePicture);

/* ===============================================
   action films
   =============================================== */

// ajouter un film à valdier
adminRouter.get("/movie/:id", adminController.editMovie);

// Valider un film — l'affiche est importée depuis TMDB à la création (plus d'upload admin)
adminRouter.post("/validateMovie/:id", adminController.validateMovie);

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

// Suppressions recettes (demande utilisateur)
adminRouter.post("/recipes/:id/delete/approve", adminController.approveRecipeDelete);
adminRouter.post("/recipes/:id/delete/reject", adminController.rejectRecipeDelete);

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

// Migration unique : remplace les anciennes images films par les affiches TMDB
// Usage : POST /admin/migrate-movie-images (appel manuel une seule fois)
adminRouter.post("/migrate-movie-images", adminController.migrateMovieImages);

/* ===============================================
   Masquage films
   =============================================== */
adminRouter.post("/movies/:id/hide", adminController.hideMovie);
adminRouter.post("/movies/:id/unhide", adminController.unhideMovie);

/* ===============================================
   Photos de recettes
   =============================================== */
adminRouter.post("/recipe-pictures/:id/approve", adminController.approveRecipePicture);

// Photo panel (AJAX/JSON — utilisé par le modal d'édition recette)
adminRouter.get("/recipes/:id/pictures", adminController.getRecipePictures);
adminRouter.post("/recipes/:id/pictures/add", uploadRecipe.single("picture"), adminController.addRecipePicture);
adminRouter.post("/recipe-pictures/:id/delete-json", adminController.deleteRecipePictureJson);
adminRouter.post("/recipe-pictures/:id/approve-json", adminController.approveRecipePictureJson);
adminRouter.post("/recipe-pictures/:id/replace", uploadRecipe.single("picture"), adminController.replaceRecipePicture);

/* ===============================================
   Suspension utilisateurs
   =============================================== */
adminRouter.post("/users/:id/suspend", adminController.suspendUser);
adminRouter.post("/users/:id/unsuspend", adminController.unsuspendUser);

/* ===============================================
   Logs admin
   =============================================== */
adminRouter.get("/logs", isSuperAdmin, adminController.getAdminLogs);
adminRouter.get("/gamification/stats", adminController.getGamificationStats);

export default adminRouter;
