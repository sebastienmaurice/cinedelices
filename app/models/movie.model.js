import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class Movie extends Model {}

Movie.init(
  {
    title: { type: DataTypes.TEXT, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    genre: { type: DataTypes.STRING(100), allowNull: false },
    picture: { type: DataTypes.STRING(255) },
    status: { type: DataTypes.BOOLEAN, defaultValue: false },
    tmdb_id: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    type: {
      // <== Décommenté et activé
      type: DataTypes.STRING(10),
      defaultValue: "film",
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "movies",
  }
);

export default Movie;
