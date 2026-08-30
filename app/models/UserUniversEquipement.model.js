// UserUniversEquipement.model.js — Fond + Cadre équipés par un utilisateur,
// PAR Univers (Phase 15, Ma Collection). Persiste UNIQUEMENT la préférence
// d'équipement ("cet utilisateur a équipé le Fond III et le Cadre I sur son
// Univers Horreur") — jamais les métadonnées descriptives (noms, seuils,
// accent couleur...), qui restent dans app/utils/collection-mock.js
// (FOND_SEUILS/FOND_NOMS/CADRE_SEUILS/CADRE_NOMS/UNIVERS_DEFINITIONS), le
// référentiel statique des 15 Univers. Contrainte unique (id_user,
// code_univers) posée en migration : un seul enregistrement d'équipement
// par Univers et par utilisateur (voir
// app/database/migrations/20260830-add-user-univers-equipements.sql).
//
// `fond_equipe`/`cadre_equipe` sont des index (1-5 / 1-2), pas des booléens
// de déblocage — le déblocage lui-même reste calculé à la volée par
// computeUniversState() à partir des contributions réelles, jamais dupliqué
// ici. L'endpoint d'équipement doit donc toujours revalider que l'index
// équipé est bien débloqué avant d'écrire (cf. trophy.service.js pour le
// même principe : jamais de confiance aveugle dans une valeur cliente).

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class UserUniversEquipement extends Model {}

UserUniversEquipement.init(
  {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    code_univers: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    fond_equipe: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cadre_equipe: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "user_univers_equipements",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["id_user", "code_univers"] },
    ],
  }
);

export default UserUniversEquipement;
