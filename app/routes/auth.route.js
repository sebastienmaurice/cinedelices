import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { injectId, isLogged } from "../middlewares/is-authed.middleware.js";
import { validateUserRegister, validateUserUpdate, validateUserLogin } from "../validators/user.validator.js";
import uploadAvatar from "../middlewares/upload-avatar.middleware.js";
import uploadBanner from "../middlewares/upload-banner.middleware.js";
import uploadRecipe from "../middlewares/upload.middleware.js";

const authRouter = Router();
//route pour savoir qui est connecté
authRouter.get("/profil/:id", isLogged, injectId, authController.profil); // vérification du token et injection de l'id
authRouter.post(
  "/profil/:id/update",
  isLogged,
  injectId,
  uploadAvatar.single("avatar"),
  validateUserUpdate,
  authController.updateProfile
);
authRouter.post(
  "/profil/:id/photo",
  isLogged,
  injectId,
  uploadAvatar.single("avatar"),
  authController.uploadProfilePhoto
);
authRouter.post(
  "/profil/:id/banner",
  isLogged,
  injectId,
  uploadBanner.single("banner"),
  authController.uploadBanner
);
authRouter.post(
  "/profil/:id/banner/delete",
  isLogged,
  injectId,
  authController.deleteBanner
);
authRouter.post(
  "/profil/:id/delete",
  isLogged,
  injectId,
  authController.deleteAccount
);
authRouter.post(
  "/profil/:id/recipes/:recipeId/update",
  isLogged,
  injectId,
  uploadRecipe.single("recipeImage"),
  authController.updateUserRecipe
);
authRouter.post(
  "/profil/:id/recipes/:recipeId/delete",
  isLogged,
  injectId,
  authController.deleteUserRecipe
);
authRouter.post(
  "/profil/:id/movies/:movieId/update",
  isLogged,
  injectId,
  authController.updateUserMovie
);
authRouter.post(
  "/profil/:id/movies/:movieId/delete",
  isLogged,
  injectId,
  authController.deleteUserMovie
);
authRouter.post(
  "/profil/:id/notices/:noticeId/update",
  isLogged,
  injectId,
  authController.updateUserNotice
);
authRouter.post(
  "/profil/:id/notices/:noticeId/delete",
  isLogged,
  injectId,
  authController.deleteUserNotice
);

// Nettoyage (xss), validation (Joi), puis logique métier
authRouter.post("/register", validateUserRegister, authController.register);
authRouter.post("/login", validateUserLogin , authController.login);
authRouter.post("/logout", isLogged, authController.logout);

export default authRouter;
