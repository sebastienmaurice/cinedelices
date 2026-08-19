import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize-client.js';

const RecipePicture = sequelize.define('RecipePicture', {
  recipe_id:   { type: DataTypes.INTEGER, allowNull: false },
  file_path:   { type: DataTypes.STRING(255), allowNull: false },
  position:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  // NULL = photo de galerie (comportement historique) — 1-6 = photo de préparation,
  // associée à l'étape N du texte de préparation (numéro choisi par le contributeur,
  // pas forcément la position d'upload).
  step_number: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  status:      { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'approved' },
  approved_at: { type: DataTypes.DATE, defaultValue: null },
  created_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'recipe_pictures',
  timestamps: false,
});

export default RecipePicture;
