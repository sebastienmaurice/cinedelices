// importation des modules nécessaires

import { DataTypes, Model } from 'sequelize';
import sequelize from "../database/sequelize-client.js";


// définition du modèle Recipe

class User extends Model {}

User.init({
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name: { type: DataTypes.STRING(100), allowNull: false },
  pseudo: { type: DataTypes.TEXT, allowNull: false, unique: true },
  pending_pseudo: { type: DataTypes.STRING(100), allowNull: true },
  pseudo_status: { type: DataTypes.STRING(20), defaultValue: "approved" },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: true },
  google_id: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  avatar_url: { type: DataTypes.STRING(255), allowNull: true },
  picture: { type: DataTypes.STRING(255) },
  pending_picture: { type: DataTypes.STRING(255), allowNull: true },
  picture_status: { type: DataTypes.STRING(20), defaultValue: "approved" },
  banner_image: { type: DataTypes.STRING(255) },
  pending_banner_image: { type: DataTypes.STRING(255), allowNull: true },
  banner_status: { type: DataTypes.STRING(20), defaultValue: "approved" },
  /* Bio auteur personnalisable — même convention pending/approved/rejected que
     pseudo/bannière, modérée par un admin avant publication sur /auteur/:id. */
  bio: { type: DataTypes.TEXT, allowNull: true },
  pending_bio: { type: DataTypes.TEXT, allowNull: true },
  bio_status: { type: DataTypes.STRING(20), defaultValue: "approved" },
  /* Position verticale personnalisée du hero banner (page auteur) — % objet
     object-position (0=haut, 100=bas), NULL = défaut CSS "center bottom". */
  hero_banner_pos_y: { type: DataTypes.INTEGER, allowNull: true },
  notify_recipes: { type: DataTypes.BOOLEAN, defaultValue: true },
  notify_cinema: { type: DataTypes.BOOLEAN, defaultValue: true },
  role: { type: DataTypes.STRING(50), defaultValue: 'user' },
  suspended: { type: DataTypes.BOOLEAN, defaultValue: false },
  suspended_until: { type: DataTypes.DATE, allowNull: true },
  suspension_reason: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
  sequelize, // instance sequelize pour lui donner le nom de la table où aller chercher les données
  tableName: "users",
  });

export default User;
