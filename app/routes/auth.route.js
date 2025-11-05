import { Router } from "express";
import authController from "../controllers/auth.controller.js";

const authRouter = Router();
//route pour savoir qui est connecté
authRouter.get("/auth/me", authController.me);

//! a passer en post
authRouter.get("/register", authController.register);
authRouter.get("/login", authController.login);
authRouter.get("/profil", authController.profil);
authRouter.get("/avis", authController.quote);
authRouter.get("/logout", authController.logout);

export default authRouter;
