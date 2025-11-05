// app/models/users_recipes.js
import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";

class UsersRecipes extends Model {}

UsersRecipes.init({}, { // colonnes vides, juste pour la table de liaison
  sequelize,
  tableName: "users_recipes",
  timestamps: false,
});

export default UsersRecipes;
