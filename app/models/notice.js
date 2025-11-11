// importation des modules nécessaires

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";


// définition du modèle Notice
class Notice extends Model {}

Notice.init({
  quote: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
    },
    {
  sequelize, // instance sequelize pour lui donner le nom de la table où aller chercher les données
  tableName: "notices",
  });

export default Notice;
