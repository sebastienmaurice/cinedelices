// creator-post.model.js — un post (TikTok, Instagram, YouTube) mis en avant
// dans la bande carrousel de la page auteur d'un créateur partenaire.
// Géré par un super admin depuis l'admin (voir creator-posts.controller.js).
// La couverture est une image hébergée sur Cloudinary (un lien TikTok signé
// expire : on ne le référence jamais directement).

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class CreatorPost extends Model {}

CreatorPost.init(
  {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    title: { type: DataTypes.STRING(120), allowNull: true },
    url: { type: DataTypes.STRING(300), allowNull: false },
    platform: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "tiktok" },
    cover_url: { type: DataTypes.STRING(500), allowNull: true },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "creator_posts",
    timestamps: false,
  }
);

export default CreatorPost;
