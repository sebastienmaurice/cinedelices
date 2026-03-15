import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class SignatureBadge extends Model {}

SignatureBadge.init(
  {
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    film: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    theme: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    movie_slug_pattern: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "signature_badges",
    timestamps: false,
  }
);

export default SignatureBadge;
