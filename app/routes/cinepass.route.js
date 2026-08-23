import { Router } from "express";
import cinepassController from "../controllers/cinepass.controller.js";

const cinepassRouter = Router();

// GET /cinepass/ — nouvel espace UX de la gamification (protégé, voir index.route.js)
cinepassRouter.get("/", cinepassController.cinepassPage);

export default cinepassRouter;
