import { DataTypes } from "sequelize";
import sequelize from "../database/sequelize-client.js";

const SignatureBadge = sequelize.define(
  "SignatureBadge",
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
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "signature_badges",
    timestamps: false,
  }
);

export default SignatureBadge;
