// notice-like.model.js — un like d'un utilisateur sur un avis (Notice).
// Contrainte unique (id_notice, id_user) posée en migration : un seul like
// par utilisateur et par avis, cf. 20260828-add-notice-social-features.sql.

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class NoticeLike extends Model {}

NoticeLike.init(
  {
    id_notice: { type: DataTypes.INTEGER, allowNull: false },
    id_user: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "notice_likes",
    timestamps: false,
  }
);

export default NoticeLike;
