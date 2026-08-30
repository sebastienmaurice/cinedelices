// user-trophy.model.js — un trophée réellement obtenu par un utilisateur.
// Persiste UNIQUEMENT l'état d'obtention ("cet utilisateur a obtenu ce
// trophée à cette date") — jamais les métadonnées descriptives (label,
// image, category, condition, target, xpReward...), qui restent dans
// MOCK_BADGES (app/utils/cinepass-mock.js), le référentiel statique des
// 18 trophées. Contrainte unique (id_user, trophy_code) posée en
// migration : empêche toute double obtention, y compris en cas d'appels
// concurrents (cf. app/database/migrations/20260830-add-user-trophies.sql).
//
// Phase 9 — Ma Collection : seuls 9 des 18 codes (`trophy_code`) sont
// réellement vérifiés/insérés ici pour l'instant (voir trophy.service.js) ;
// les 9 autres restent purement mock (aucune ligne créée pour eux).

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class UserTrophy extends Model {}

UserTrophy.init(
  {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    trophy_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    unlocked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: "user_trophies",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["id_user", "trophy_code"] },
    ],
  }
);

export default UserTrophy;
