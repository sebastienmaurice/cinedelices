import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { injectId, verifyToken} from "../middlewares/is-authed.middleware.js";




const authRouter = Router();
//route pour savoir qui est connecté
authRouter.get("/profil/:id", verifyToken, injectId, authController.profil); // vérification du token et injection de l'id

//! a passer en post
// Nettoyage (xss), validation (Joi), puis logique métier
authRouter.post('/register', authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/avis", authController.quote);
authRouter.get("/logout", authController.logout);

export default authRouter;

