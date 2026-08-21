// importation des modules nécessaires

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";


// définition du modèle Notice
class Notice extends Model {}

Notice.init({
  quote: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  // ENUM string : pending | approved | rejected (supérieur au BOOLEAN — cf. migration-status-enum.sql)
  status: { type: DataTypes.STRING(20), defaultValue: "pending" },
  validated_at: { type: DataTypes.DATE, allowNull: true },
  edit_status: { type: DataTypes.STRING(20), defaultValue: "none" },
  pending_content: { type: DataTypes.TEXT, allowNull: true },
  pending_quote: { type: DataTypes.INTEGER, allowNull: true },
  edit_requested_at: { type: DataTypes.DATE, allowNull: true },
  delete_request_status: { type: DataTypes.STRING(20), defaultValue: "none" },
  delete_request_at: { type: DataTypes.DATE, allowNull: true },
  // Réponse à un avis (1 niveau) — NULL pour un avis "racine".
  parent_id: { type: DataTypes.INTEGER, allowNull: true },
  // Avis publié sans afficher le pseudo réel de l'auteur.
  is_anonymous: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  // Badge éditorial posé en modération : 'coup_de_coeur' | 'astuce_utile' | null.
  highlight: { type: DataTypes.STRING(20), allowNull: true },
  // Compteur dénormalisé, mis à jour via NoticeLike.create/destroy.
  likes_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
  sequelize, // instance sequelize pour lui donner le nom de la table où aller chercher les données
  tableName: "notices",
  });

export default Notice;
