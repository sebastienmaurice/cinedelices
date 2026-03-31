import { DataTypes } from "sequelize";
import sequelize from "../database/sequelize-client.js";

const UserSignatureBadge = sequelize.define(
  "UserSignatureBadge",
  {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_badge: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unlocked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_signature_badges",
    timestamps: false,
  }
);

export default UserSignatureBadge;
