/**
 * Modèle Sequelize pour les favoris (polymorphique)
 *
 * Permet aux utilisateurs de sauvegarder leurs favoris :
 * - Films (entity_type = 'movie')
 * - Recettes (entity_type = 'recipe') - à venir
 *
 * Structure polymorphique :
 * - entity_type : type d'entité ('movie' ou 'recipe')
 * - entity_id : ID de l'entité dans sa table respective
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class Favorite extends Model {
  /**
   * Vérifie si un entity_type est valide
   * @param {string} type - Le type à vérifier
   * @returns {boolean}
   */
  static isValidEntityType(type) {
    return ["movie", "recipe"].includes(type);
  }
}

Favorite.init(
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
      // Pas de foreign key car polymorphique (peut pointer vers movies OU recipes)
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "favorites",
    timestamps: false,
    // Index unique : un utilisateur ne peut avoir qu'un favori par entité
    indexes: [{ unique: true, fields: ["id_user", "entity_type", "entity_id"] }],
  }
);

export default Favorite;
