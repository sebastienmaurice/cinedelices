/**
 * Contrôleur pour la gestion des notes (polymorphique)
 *
 * Permet aux utilisateurs de noter :
 * - Films (entity_type = 'movie')
 * - Recettes (entity_type = 'recipe')
 *
 * API REST :
 * - POST /api/ratings : Créer ou mettre à jour une note
 * - GET /api/ratings : Récupérer les notes de l'utilisateur
 * - GET /api/ratings/check/:entityType/:entityId : Vérifier la note d'une entité
 * - GET /api/ratings/average/:entityType/:entityId : Moyenne des notes d'une entité
 */

import { Rating, Movie, Recipe } from "../models/index.model.js";
import sequelize from "../database/sequelize-client.js";

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

const ratingsController = {
  /**
   * Créer ou mettre à jour une note
   * POST /api/ratings
   * Body: { entityId: number, entityType: 'movie'|'recipe', score: 1-5 }
   */
  async setRating(req, res) {
    try {
      const userId = req.userId;
      const { entityId, entityType = "movie", score } = req.body;

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
      if (!Rating.isValidEntityType(entityType)) {
        return res.status(400).json({
          success: false,
          message: "Type d'entité invalide (movie ou recipe attendu)",
        });
      }

      // Valider le score
      const scoreInt = parseInt(score, 10);
      if (!Rating.isValidScore(scoreInt)) {
        return res.status(400).json({
          success: false,
          message: "Score invalide (1-5 attendu)",
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

      // Chercher si une note existe déjà
      const existingRating = await Rating.findOne({
        where: { id_user: userId, entity_type: entityType, entity_id: entityId },
      });

      const entityLabel = entityType === "movie" ? "Film" : "Recette";

      if (existingRating) {
        // Mettre à jour la note existante
        existingRating.score = scoreInt;
        existingRating.updated_at = new Date();
        await existingRating.save();

        // Récupérer la nouvelle moyenne
        const avgResult = await Rating.findOne({
          where: { entity_type: entityType, entity_id: entityId },
          attributes: [
            [sequelize.fn("AVG", sequelize.col("score")), "average"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          raw: true,
        });

        return res.json({
          success: true,
          isNew: false,
          score: scoreInt,
          average: parseFloat(avgResult.average).toFixed(1),
          count: parseInt(avgResult.count),
          message: `Note mise à jour pour ce ${entityLabel.toLowerCase()}`,
        });
      } else {
        // Créer une nouvelle note
        await Rating.create({
          id_user: userId,
          entity_type: entityType,
          entity_id: entityId,
          score: scoreInt,
        });

        // Récupérer la nouvelle moyenne
        const avgResult = await Rating.findOne({
          where: { entity_type: entityType, entity_id: entityId },
          attributes: [
            [sequelize.fn("AVG", sequelize.col("score")), "average"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          raw: true,
        });

        return res.json({
          success: true,
          isNew: true,
          score: scoreInt,
          average: parseFloat(avgResult.average).toFixed(1),
          count: parseInt(avgResult.count),
          message: `${entityLabel} noté(e) avec succès`,
        });
      }
    } catch (error) {
      console.error("Erreur set rating:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  },

  /**
   * Récupérer les notes de l'utilisateur connecté
   * GET /api/ratings?entityType=movie
   *
   * @query entityType - 'movie' (défaut), 'recipe', ou 'all'
   * @returns { success: true, ratings: Array<{entity_id, entity_type, score}> }
   */
  async getUserRatings(req, res) {
    try {
      const userId = req.userId;
      const entityType = req.query.entityType || "all";

      if (!userId) {
        return res.json({ success: true, ratings: [] });
      }

      const whereClause = { id_user: userId };

      // Filtrer par type si spécifié (pas 'all')
      if (entityType !== "all" && Rating.isValidEntityType(entityType)) {
        whereClause.entity_type = entityType;
      }

      const ratings = await Rating.findAll({
        where: whereClause,
        attributes: ["entity_id", "entity_type", "score"],
      });

      return res.json({
        success: true,
        ratings: ratings.map((r) => ({
          entityId: r.entity_id,
          entityType: r.entity_type,
          score: r.score,
        })),
      });
    } catch (error) {
      console.error("Erreur get ratings:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  },

  /**
   * Vérifier la note de l'utilisateur pour une entité
   * GET /api/ratings/check/:entityType/:entityId
   *
   * @returns { success: true, hasRated: boolean, score: number|null, average: string, count: number }
   */
  async checkRating(req, res) {
    try {
      const userId = req.userId;
      const { entityType, entityId } = req.params;

      // Valider le type d'entité
      if (!Rating.isValidEntityType(entityType)) {
        return res.status(400).json({
          success: false,
          message: "Type d'entité invalide (movie ou recipe attendu)",
        });
      }

      // Récupérer la note de l'utilisateur (si connecté)
      let userRating = null;
      if (userId) {
        userRating = await Rating.findOne({
          where: { id_user: userId, entity_type: entityType, entity_id: entityId },
        });
      }

      // Récupérer la moyenne et le nombre de notes
      const avgResult = await Rating.findOne({
        where: { entity_type: entityType, entity_id: entityId },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("score")), "average"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        raw: true,
      });

      const average = avgResult.average ? parseFloat(avgResult.average).toFixed(1) : "0.0";
      const count = parseInt(avgResult.count) || 0;

      return res.json({
        success: true,
        hasRated: !!userRating,
        score: userRating ? userRating.score : null,
        average,
        count,
      });
    } catch (error) {
      console.error("Erreur check rating:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  },

  /**
   * Récupérer la moyenne des notes pour une entité
   * GET /api/ratings/average/:entityType/:entityId
   *
   * @returns { success: true, average: string, count: number }
   */
  async getAverageRating(req, res) {
    try {
      const { entityType, entityId } = req.params;

      // Valider le type d'entité
      if (!Rating.isValidEntityType(entityType)) {
        return res.status(400).json({
          success: false,
          message: "Type d'entité invalide (movie ou recipe attendu)",
        });
      }

      const avgResult = await Rating.findOne({
        where: { entity_type: entityType, entity_id: entityId },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("score")), "average"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        raw: true,
      });

      const average = avgResult.average ? parseFloat(avgResult.average).toFixed(1) : "0.0";
      const count = parseInt(avgResult.count) || 0;

      return res.json({
        success: true,
        average,
        count,
      });
    } catch (error) {
      console.error("Erreur get average rating:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  },
};

export default ratingsController;
