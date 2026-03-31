import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize-client.js';

const RecipePicture = sequelize.define('RecipePicture', {
  recipe_id:   { type: DataTypes.INTEGER, allowNull: false },
  file_path:   { type: DataTypes.STRING(255), allowNull: false },
  position:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  status:      { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'approved' },
  approved_at: { type: DataTypes.DATE, defaultValue: null },
  created_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'recipe_pictures',
  timestamps: false,
});

export default RecipePicture;
