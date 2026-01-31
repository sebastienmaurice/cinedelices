/**
 * Routes API pour la gestion des favoris (polymorphique)
 *
 * Supporte les favoris pour :
 * - Films (entity_type = 'movie')
 * - Recettes (entity_type = 'recipe')
 *
 * IMPORTANT : On utilise isLoggedApi (pas isLogged) pour les routes API
 * → Retourne du JSON en cas d'erreur, pas du HTML
 */

import { Router } from "express";
import favoritesController from "../controllers/favorites.controllers.js";
import { isLoggedApi, verifyToken } from "../middlewares/is-authed.middleware.js";

const favoritesRouter = Router();

/**
 * Toggle favori (ajouter/retirer)
 * POST /api/favorites/toggle
 * Body: { entityId: number, entityType?: 'movie'|'recipe' }
 *
 * Rétrocompatibilité : { movieId: number } fonctionne toujours
 */
favoritesRouter.post("/toggle", isLoggedApi, favoritesController.toggleFavorite);

/**
 * Obtenir les IDs des favoris de l'utilisateur
 * GET /api/favorites?entityType=movie
 * GET /api/favorites?entityType=recipe
 *
 * Par défaut : entityType='movie' (rétrocompatibilité)
 */
favoritesRouter.get("/", verifyToken, favoritesController.getUserFavorites);

/**
 * Vérifier si une entité est en favori
 * GET /api/favorites/check/:entityType/:entityId (nouveau format)
 * GET /api/favorites/check/:movieId (rétrocompatibilité)
 */
favoritesRouter.get("/check/:entityType/:entityId", verifyToken, favoritesController.checkFavorite);
favoritesRouter.get("/check/:movieId", verifyToken, favoritesController.checkFavorite);

export default favoritesRouter;
