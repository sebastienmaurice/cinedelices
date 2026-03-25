import { DataTypes, Model } from 'sequelize';
import sequelize from "../database/sequelize-client.js";
import slugify from "slugify";

class Recipe extends Model {}

Recipe.init({
  name: { type: DataTypes.TEXT, allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  picture: { type: DataTypes.STRING(255) },
  category: { type: DataTypes.STRING(100), allowNull: false },
  quote: { type: DataTypes.INTEGER, defaultValue: 0 },
  ingredients: { type: DataTypes.TEXT, allowNull: false },
  preparation: { type: DataTypes.TEXT, allowNull: false },
  time: { type: DataTypes.INTEGER, allowNull: false },
  servings: { type: DataTypes.INTEGER, allowNull: true },
  difficulty: { type: DataTypes.STRING(50), allowNull: false },
  // ENUM string : pending | approved | rejected (supérieur au BOOLEAN — cf. migration-status-enum.sql)
  status: { type: DataTypes.STRING(20), defaultValue: "pending" },
  validated_at: { type: DataTypes.DATE, allowNull: true },
  edit_status: { type: DataTypes.STRING(20), defaultValue: "none" },
  pending_name: { type: DataTypes.TEXT, allowNull: true },
  pending_description: { type: DataTypes.TEXT, allowNull: true },
  pending_picture: { type: DataTypes.STRING(255), allowNull: true },
  pending_category: { type: DataTypes.STRING(100), allowNull: true },
  pending_ingredients: { type: DataTypes.TEXT, allowNull: true },
  pending_preparation: { type: DataTypes.TEXT, allowNull: true },
  pending_time: { type: DataTypes.INTEGER, allowNull: true },
  pending_difficulty: { type: DataTypes.STRING(50), allowNull: true },
  edit_requested_at: { type: DataTypes.DATE, allowNull: true },
  delete_request_status: { type: DataTypes.STRING(20), defaultValue: 'none' },
  delete_request_at: { type: DataTypes.DATE, allowNull: true },
  // Auteur obligatoire : chaque recette est créée par un utilisateur connecté
  id_user: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
  sequelize,
  tableName: "recipes",
  hooks: {
    beforeCreate: (recipe) => {
      if (!recipe.slug && recipe.name) {
        recipe.slug = slugify(recipe.name, { lower: true, strict: true });
      }
    },
    beforeUpdate: (recipe) => {
      if (recipe.changed("name") && recipe.name) {
        recipe.slug = slugify(recipe.name, { lower: true, strict: true });
      }
    },
  },
  });

export default Recipe;
