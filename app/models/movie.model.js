import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class Movie extends Model {}

Movie.init(
  {
    title: { type: DataTypes.TEXT, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    genre: { type: DataTypes.STRING(100), allowNull: false },
    picture: { type: DataTypes.STRING(255) },
    synopsis: { type: DataTypes.TEXT, allowNull: true },
    // ENUM string : pending | approved | rejected (supérieur au BOOLEAN — cf. migration-status-enum.sql)
    status: { type: DataTypes.STRING(20), defaultValue: "pending" },
    validated_at: { type: DataTypes.DATE, allowNull: true },
    edit_status: { type: DataTypes.STRING(20), defaultValue: "none" },
    pending_title: { type: DataTypes.TEXT, allowNull: true },
    pending_year: { type: DataTypes.INTEGER, allowNull: true },
    pending_genre: { type: DataTypes.STRING(100), allowNull: true },
    edit_requested_at: { type: DataTypes.DATE, allowNull: true },
    delete_request_status: {
      type: DataTypes.STRING(20),
      defaultValue: "none",
    },
    delete_request_by: { type: DataTypes.INTEGER, allowNull: true },
    delete_request_at: { type: DataTypes.DATE, allowNull: true },
    tmdb_id: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    id_user: { type: DataTypes.INTEGER, allowNull: true },
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
