import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { injectId, isLogged } from "../middlewares/is-authed.middleware.js";
import { validateUserRegister, validateUserUpdate, validateUserLogin } from "../validators/user.validator.js";

const authRouter = Router();
//route pour savoir qui est connecté
authRouter.get("/profil/:id", isLogged, injectId, authController.profil); // vérification du token et injection de l'id

//! a passer en post
// Nettoyage (xss), validation (Joi), puis logique métier
authRouter.post("/register", validateUserRegister, authController.register);
authRouter.post("/login", validateUserLogin , authController.login);
authRouter.get("/avis", isLogged, authController.quote);
authRouter.get("/logout", isLogged, authController.logout);

export default authRouter;
