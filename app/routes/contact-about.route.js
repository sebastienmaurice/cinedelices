import { Router } from "express";
import contactAboutController from "../controllers/contact-about.controllers.js";

const router = Router();

// Route pour la page de contact et à propos
router.get("/", contactAboutController.contactAbout);

// Route pour la soumission du formulaire de contact
router.post("/contact", contactAboutController.sendContact);

export default router;
