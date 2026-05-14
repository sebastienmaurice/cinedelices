import { Router } from "express";
import rateLimit from "express-rate-limit";
import contactAboutController from "../controllers/contact-about.controllers.js";

const router = Router();

// Rate limiting : 5 messages max par IP par heure
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Trop de messages envoyés. Réessayez dans une heure." },
});

router.get("/", contactAboutController.contactAbout);
router.post("/contact", contactLimiter, contactAboutController.sendContact);

export default router;
