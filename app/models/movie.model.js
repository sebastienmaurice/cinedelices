// importation des modules nécessaires

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

// définition du modèle Movie

class Movie extends Model {}

Movie.init({
  title: { type: DataTypes.TEXT, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  genre: { type: DataTypes.STRING(100), allowNull: false },
  picture: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
  sequelize, // instance sequelize pour lui donner le nom de la table où aller chercher les données
  tableName: "movies",
  });


export default Movie;

