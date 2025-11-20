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
  difficulty: { type: DataTypes.STRING(50), allowNull: false },
  status: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
  sequelize, // instance sequelize pour lui donner le nom de la table où aller chercher les données
  tableName: "recipes",
  });

export default Recipe;
