// importation des modules nécessaires

import { DataTypes, Model } from 'sequelize';
import sequelize from "../database/sequelize-client.js";


// définition du modèle Recipe

class User extends Model {}

User.init({
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name: { type: DataTypes.STRING(100), allowNull: false },
  pseudo: { type: DataTypes.TEXT, allowNull: false, unique: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  picture: { type: DataTypes.STRING(255) },
  role: { type: DataTypes.STRING(50), defaultValue: 'user' },
  },
  {
  sequelize, // instance sequelize pour lui donner le nom de la table où aller chercher les données
  tableName: "recipes",
  });

export default User;
