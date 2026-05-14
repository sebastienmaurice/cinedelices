import { Router } from "express";
import rateLimit from "express-rate-limit";
import authController from "../controllers/auth.controller.js";
import gamificationController from "../controllers/gamification.controller.js";
import { injectId, isLogged } from "../middlewares/is-authed.middleware.js";
import { validateUserRegister, validateUserUpdate, validateUserLogin } from "../validators/user.validator.js";
import uploadAvatar from "../middlewares/upload-avatar.middleware.js";
import uploadBanner from "../middlewares/upload-banner.middleware.js";
import uploadRecipe, { uploadRecipePhotos } from "../middlewares/upload.middleware.js";

// Rate limiting — protège les endpoints d'authentification contre le brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 minutes
  max: 20,                   // 20 tentatives max par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Trop de tentatives. Réessayez dans 15 minutes." },
});

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
// Wrapper pour capturer les erreurs multer (LIMIT_FILE_SIZE, etc.) et retourner du JSON
function handleAvatarUpload(req, res, next) {
  uploadAvatar.single("avatar")(req, res, (err) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "Le fichier est trop volumineux (max 5 Mo)." });
    }
    if (err) return next(err);
    next();
  });
}

authRouter.post(
  "/profil/:id/photo",
  isLogged,
  injectId,
  handleAvatarUpload,
  authController.uploadProfilePhoto
);
authRouter.get("/profil/:id/banner/status", isLogged, injectId, authController.getBannerStatus);
authRouter.get("/profil/:id/pseudo/status", isLogged, injectId, authController.getPseudoStatus);
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
  uploadRecipePhotos,
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

// Gamification
authRouter.post("/equip-frame", isLogged, injectId, gamificationController.equipFrame);

// Nettoyage (xss), validation (Joi), puis logique métier
authRouter.get("/register", (req, res) => res.redirect("/"));
authRouter.get("/login", (req, res) => res.render("login-standalone"));
authRouter.post("/register", validateUserRegister, authController.register);
authRouter.post("/login", authLimiter, validateUserLogin, authController.login);
authRouter.get("/logout", authController.logout);
authRouter.post("/logout", isLogged, authController.logout);

// Google OAuth
authRouter.post("/google", authController.googleAuth);           // One Tap credential
authRouter.post("/google/code", authController.googleCode);      // Popup code flow (legacy)
authRouter.get("/google/callback", authController.googleCallback); // Redirect flow
authRouter.post("/google/complete", authController.googleComplete);

// Réinitialisation de mot de passe (flow complet email OR identifiant)
authRouter.get("/forgot-password",  authController.forgotPasswordForm);
authRouter.post("/forgot-password", authLimiter, authController.forgotPasswordSubmit);
authRouter.get("/reset-password",   authController.resetPasswordForm);
authRouter.post("/reset-password",  authController.resetPasswordSubmit);

export default authRouter;
