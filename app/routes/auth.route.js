import { Router } from "express";
import authController from "../controllers/auth.controller.js";

const authRouter = Router();
//route pour savoir qui est connecté
authRouter.get("/auth/me", authController.me);

//! a passer en post
authRouter.get("/auth/register", authController.register);
authRouter.get("/auth/login", authController.login);
authRouter.get("/auth/profil", authController.profil);
authRouter.get("/auth/logout", authController.logout);

export default authRouter;
