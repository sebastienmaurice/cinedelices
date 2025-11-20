import { Router } from "express";
import contactAboutController from "../controllers/contact-about.controllers.js";

const router = Router();

// Route pour la page de contact et à propos
router.get("/", contactAboutController.contactAbout);

export default router;
