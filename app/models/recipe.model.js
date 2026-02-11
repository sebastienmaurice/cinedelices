// importation des modules nécessaires

import { DataTypes, Model } from 'sequelize';
import sequelize from "../database/sequelize-client.js";


// définition du modèle Recipe

class Recipe extends Model {}

Recipe.init({
  name: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  picture: { type: DataTypes.STRING(255) },
  category: { type: DataTypes.STRING(100), allowNull: false },
  quote: { type: DataTypes.INTEGER, defaultValue: 0 },
  ingredients: { type: DataTypes.TEXT, allowNull: false },
  preparation: { type: DataTypes.TEXT, allowNull: false },
  time: { type: DataTypes.INTEGER, allowNull: false },
  servings: { type: DataTypes.INTEGER, allowNull: true },
  difficulty: { type: DataTypes.STRING(50), allowNull: false },
  status: { type: DataTypes.BOOLEAN, defaultValue: false },
  edit_status: { type: DataTypes.STRING(20), defaultValue: "none" },
  pending_name: { type: DataTypes.TEXT, allowNull: true },
  pending_description: { type: DataTypes.TEXT, allowNull: true },
  pending_picture: { type: DataTypes.STRING(255), allowNull: true },
  pending_category: { type: DataTypes.STRING(100), allowNull: true },
  pending_ingredients: { type: DataTypes.TEXT, allowNull: true },
  pending_preparation: { type: DataTypes.TEXT, allowNull: true },
  pending_time: { type: DataTypes.INTEGER, allowNull: true },
  pending_difficulty: { type: DataTypes.STRING(50), allowNull: true },
  edit_requested_at: { type: DataTypes.DATE, allowNull: true },
  // Auteur obligatoire : chaque recette est créée par un utilisateur connecté
  id_user: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
  sequelize, // instance sequelize pour lui donner le nom de la table où aller chercher les données
  tableName: "recipes",
  });

export default Recipe;
