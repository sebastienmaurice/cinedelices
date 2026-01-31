/**
 * Routes API pour la gestion des notes (polymorphique)
 *
 * Supporte les notes pour :
 * - Films (entity_type = 'movie')
 * - Recettes (entity_type = 'recipe')
 *
 * IMPORTANT : On utilise isLoggedApi (pas isLogged) pour les routes API
 * → Retourne du JSON en cas d'erreur, pas du HTML
 */

import { Router } from "express";
import ratingsController from "../controllers/ratings.controllers.js";
import { isLoggedApi, verifyToken } from "../middlewares/is-authed.middleware.js";

const ratingsRouter = Router();

/**
 * Créer ou mettre à jour une note
 * POST /api/ratings
 * Body: { entityId: number, entityType: 'movie'|'recipe', score: 1-5 }
 */
ratingsRouter.post("/", isLoggedApi, ratingsController.setRating);

/**
 * Récupérer les notes de l'utilisateur
 * GET /api/ratings?entityType=movie|recipe|all
 */
ratingsRouter.get("/", verifyToken, ratingsController.getUserRatings);

/**
 * Vérifier la note d'une entité (note utilisateur + moyenne)
 * GET /api/ratings/check/:entityType/:entityId
 */
ratingsRouter.get("/check/:entityType/:entityId", verifyToken, ratingsController.checkRating);

/**
 * Récupérer la moyenne des notes d'une entité
 * GET /api/ratings/average/:entityType/:entityId
 */
ratingsRouter.get("/average/:entityType/:entityId", ratingsController.getAverageRating);

export default ratingsRouter;
