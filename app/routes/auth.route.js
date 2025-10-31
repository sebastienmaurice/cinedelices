import { Router } from "express";
import authController from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.get("/auth/me", authController.me);

// a passer en post
authRouter.get("/auth/register", authController.register);
authRouter.get("/auth/login", authController.login);

export default authRouter;
