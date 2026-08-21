/**
 * Routes API pour les interactions sur un avis (Notice) : like/unlike.
 * isLoggedApi (pas isLogged) → réponse JSON en cas d'erreur, cohérent avec
 * le fetch() côté client (recipe-detail.js).
 */
import { Router } from "express";
import noticesController from "../controllers/notices.controllers.js";
import { isLoggedApi } from "../middlewares/is-authed.middleware.js";

const noticesRouter = Router();

/**
 * Basculer le like de l'utilisateur connecté sur un avis.
 * POST /api/notices/:id/like
 */
noticesRouter.post("/:id/like", isLoggedApi, noticesController.toggleLike);

export default noticesRouter;
