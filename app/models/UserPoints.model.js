import { DataTypes } from "sequelize";
import sequelize from "../database/sequelize-client.js";

const UserPoints = sequelize.define(
  "UserPoints",
  {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    level_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "1",
    },
    active_frame_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "cine",
    },
    last_weekly_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    login_streak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_daily_login_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    last_monthly_recipe_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: "user_points",
    timestamps: false,
  }
);

export default UserPoints;
