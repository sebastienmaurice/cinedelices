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
    // Phase 15 — Univers cinématographique actif (Ma Collection), même
    // pattern que active_frame_code mais système indépendant (cadre de
    // profil vs Univers de contribution). NULL = aucun Univers actif.
    active_univers_code: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },
    active_banner_variant: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
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
