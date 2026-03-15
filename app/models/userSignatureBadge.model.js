import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class UserSignatureBadge extends Model {}

UserSignatureBadge.init(
  {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    id_badge: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "signature_badges", key: "id" },
    },
    unlocked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "user_signature_badges",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["id_user", "id_badge"] },
    ],
  }
);

export default UserSignatureBadge;
