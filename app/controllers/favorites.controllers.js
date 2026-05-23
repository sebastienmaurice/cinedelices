/**
 * Contrôleur pour la gestion des favoris (polymorphique)
 *
 * Permet aux utilisateurs de gérer leurs favoris :
 * - Films (entity_type = 'movie')
 * - Recettes (entity_type = 'recipe') - à venir
 *
 * Toutes les routes acceptent un paramètre entity_type optionnel
 * (défaut : 'movie' pour rétrocompatibilité)
 */

import { Favorite, Movie, Recipe } from "../models/index.model.js";
import { awardActionXP } from "../services/gamification.service.js";

/**
 * Vérifie qu'une entité existe dans sa table
 * @param {string} entityType - 'movie' ou 'recipe'
 * @param {number} entityId - ID de l'entité
 * @returns {Promise<Model|null>} - L'entité ou null
 */
async function findEntity(entityType, entityId) {
  switch (entityType) {
    case "movie":
      return Movie.findByPk(entityId);
    case "recipe":
      return Recipe.findByPk(entityId);
    default:
      return null;
  }
}

const favoritesController = {
  /**
   * Toggle favori (ajouter/retirer)
   * POST /api/favorites/toggle
   * Body: { entityId: number, entityType?: 'movie'|'recipe' }
   *
   * Rétrocompatibilité : accepte aussi movieId (alias pour entityId + entityType='movie')
   */
  async toggleFavorite(req, res) {
    try {
      const userId = req.userId;
      // Rétrocompatibilité : movieId → entityId avec entityType='movie'
      const entityId = req.body.entityId || req.body.movieId;
      const entityType = req.body.entityType || "movie";

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Vous devez être connecté",
        });
      }

      if (!entityId) {
        return res.status(400).json({
          success: false,
          message: "ID de l'entité requis",
        });
      }

      // Valider le type d'entité
      if (!Favorite.isValidEntityType(entityType)) {
        return res.status(400).json({
          success: false,
          message: "Type d'entité invalide (movie ou recipe attendu)",
        });
      }

      // Vérifier que l'entité existe
      const entity = await findEntity(entityType, entityId);
      if (!entity) {
        const entityLabel = entityType === "movie" ? "Film" : "Recette";
        return res.status(404).json({
          success: false,
          message: `${entityLabel} non trouvé(e)`,
        });
      }

      // Chercher si le favori existe déjà
      const existingFavorite = await Favorite.findOne({
        where: { id_user: userId, entity_type: entityType, entity_id: entityId },
      });

      const entityLabel = entityType === "movie" ? "Film" : "Recette";

      if (existingFavorite) {
        // Retirer des favoris
        await existingFavorite.destroy();
        return res.json({
          success: true,
          isFavorite: false,
          message: `${entityLabel} retiré(e) des favoris`,
        });
      } else {
        // Ajouter aux favoris
        await Favorite.create({
          id_user: userId,
          entity_type: entityType,
          entity_id: entityId,
        });

        // XP pour celui qui ajoute en favori
        const xpResult = await awardActionXP(userId, req.userRole, "favorite_added").catch(() => null);

        // XP pour l'auteur du contenu (like_received) — sauf s'il se met en favori lui-même
        const authorId = entity.id_user ?? entity.dataValues?.id_user;
        if (authorId && authorId !== userId) {
          awardActionXP(authorId, "user", "like_received").catch(() => {});
        }

        return res.json({
          success: true,
          isFavorite: true,
          message: `${entityLabel} ajouté(e) aux favoris`,
          xpGained:  xpResult?.xpGained  ?? 0,
          newXP:     xpResult?.newXP      ?? 0,
          newLevel:  xpResult?.newLevel   ?? 0,
          leveledUp: xpResult?.leveledUp  ?? false,
          rank:      xpResult?.rank       ?? "",
        });
      }
    } catch (error) {
      console.error("Erreur toggle favorite:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  },

  /**
   * Obtenir les IDs des favoris de l'utilisateur connecté
   * GET /api/favorites?entityType=movie
   *
   * @query entityType - 'movie' (défaut) ou 'recipe'
   * @returns { success: true, favoriteIds: number[] }
   */
  async getUserFavorites(req, res) {
    try {
      const userId = req.userId;
      const entityType = req.query.entityType || "movie";

      if (!userId) {
        return res.json({ success: true, favoriteIds: [] });
      }

      // Valider le type d'entité
      if (!Favorite.isValidEntityType(entityType)) {
        return res.status(400).json({
          success: false,
          message: "Type d'entité invalide (movie ou recipe attendu)",
        });
      }

      const favorites = await Favorite.findAll({
        where: { id_user: userId, entity_type: entityType },
        attributes: ["entity_id"],
      });

      const favoriteIds = favorites.map((f) => f.entity_id);

      return res.json({ success: true, favoriteIds });
    } catch (error) {
      console.error("Erreur get favorites:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  },

  /**
   * Vérifier si une entité est en favori
   * GET /api/favorites/check/:entityType/:entityId
   *
   * Rétrocompatibilité : GET /api/favorites/check/:movieId (entityType='movie')
   */
  async checkFavorite(req, res) {
    try {
      const userId = req.userId;
      // Rétrocompatibilité : si un seul paramètre, c'est movieId
      const entityType = req.params.entityType || "movie";
      const entityId = req.params.entityId || req.params.movieId;

      if (!userId) {
        return res.json({ success: true, isFavorite: false });
      }

      // Valider le type d'entité
      if (!Favorite.isValidEntityType(entityType)) {
        return res.status(400).json({
          success: false,
          message: "Type d'entité invalide (movie ou recipe attendu)",
        });
      }

      const favorite = await Favorite.findOne({
        where: { id_user: userId, entity_type: entityType, entity_id: entityId },
      });

      return res.json({
        success: true,
        isFavorite: !!favorite,
      });
    } catch (error) {
      console.error("Erreur check favorite:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  },
};

export default favoritesController;
