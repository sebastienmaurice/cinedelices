import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class PasswordReset extends Model {}

PasswordReset.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    token_hash: {
      type: DataTypes.CHAR(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "password_resets",
    timestamps: false,
  }
);

export default PasswordReset;
