// notice-picture.model.js — photo jointe à un avis (jusqu'à 3, cf.
// NOTICE_MAX_PICTURES dans recipes-movie.controllers.js). Même logique de
// traitement (Sharp + Cloudinary) que RecipePicture, via processStepImages().

import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class NoticePicture extends Model {}

NoticePicture.init(
  {
    id_notice: { type: DataTypes.INTEGER, allowNull: false },
    file_path: { type: DataTypes.STRING(255), allowNull: false },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "notice_pictures",
    timestamps: false,
  }
);

export default NoticePicture;
