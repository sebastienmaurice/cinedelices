import { Router } from "express";
import contactAboutController from "../controllers/contact-about.controllers.js";

const router = Router();

router.get("/contact", contactAboutController.contactAbout);

export default router;

