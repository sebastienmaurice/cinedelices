import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class UserPoints extends Model {}

UserPoints.init(
  {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    level_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "figurant",
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_weekly_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "user_points",
    timestamps: false,
  }
);

export default UserPoints;
