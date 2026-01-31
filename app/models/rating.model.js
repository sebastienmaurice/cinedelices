/**
 * Modèle Sequelize pour les notes (polymorphique)
 *
 * Permet aux utilisateurs de noter :
 * - Films (entity_type = 'movie')
 * - Recettes (entity_type = 'recipe')
 *
 * Structure polymorphique :
 * - entity_type : type d'entité ('movie' ou 'recipe')
 * - entity_id : ID de l'entité dans sa table respective
 * - score : note de 1 à 5 étoiles
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class Rating extends Model {
  /**
   * Vérifie si un entity_type est valide
   * @param {string} type - Le type à vérifier
   * @returns {boolean}
   */
  static isValidEntityType(type) {
    return ["movie", "recipe"].includes(type);
  }

  /**
   * Vérifie si un score est valide (1-5)
   * @param {number} score - Le score à vérifier
   * @returns {boolean}
   */
  static isValidScore(score) {
    return Number.isInteger(score) && score >= 1 && score <= 5;
  }
}

Rating.init(
  {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    entity_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "movie",
      validate: {
        isIn: {
          args: [["movie", "recipe"]],
          msg: "entity_type doit être 'movie' ou 'recipe'",
        },
      },
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "Le score doit être au minimum 1",
        },
        max: {
          args: [5],
          msg: "Le score doit être au maximum 5",
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "ratings",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["id_user", "entity_type", "entity_id"] },
    ],
  }
);

export default Rating;
