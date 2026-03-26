//  récupération des différents modèles pour faire les liaisons sans avoir à les faire dans chaque fichier

import User from './user.model.js';
import Recipe from './recipe.model.js';
import Movie from './movie.model.js';
import Notice from './notice.model.js';
import UsersRecipes from './users_recipes.model.js';
import Favorite from './favorite.model.js';
import Rating from './rating.model.js';
import UserPoints from './UserPoints.model.js';
import RecipePicture from './RecipePicture.model.js';


// Définition des relations entre les modèles

// Une recette appartient à un film
Recipe.belongsTo(Movie, { foreignKey: 'id_movie' });

// Un film peut avoir plusieurs recettes
Movie.hasMany(Recipe, { foreignKey: 'id_movie' });

// Un utilisateur peut publier plusieurs avis (notices)
User.hasMany(Notice, { foreignKey: 'id_user' });

// Un utilisateur peut créer plusieurs recettes et films
User.hasMany(Recipe, { foreignKey: "id_user", as: "recipes" });
User.hasMany(Movie, { foreignKey: "id_user" });

// Une recette peut recevoir plusieurs avis
Recipe.hasMany(Notice, { foreignKey: 'id_recipe' });

// Un avis appartient à un utilisateur
Notice.belongsTo(User, { foreignKey: 'id_user' });

// Une recette appartient à un utilisateur (auteur/contributeur)
// Alias "contributor" pour désambiguïser avec la relation N↔N (belongsToMany)
Recipe.belongsTo(User, { foreignKey: "id_user", as: "contributor" });
Movie.belongsTo(User, { foreignKey: "id_user" });

// Un avis appartient à une recette
Notice.belongsTo(Recipe, { foreignKey: 'id_recipe' });

// Définition de la table de jonction pour la relation N ↔ N entre User et Recipe
// l'utilisateur peut avoir plusieurs recettes
User.belongsToMany(Recipe, { through : UsersRecipes, timestamps: false,});
// une recette peut appartenir à plusieurs utilisateurs
Recipe.belongsToMany(User, { through : UsersRecipes, timestamps: false,});

// Relations pour les favoris (polymorphique)
// Un utilisateur peut avoir plusieurs favoris
User.hasMany(Favorite, { foreignKey: 'id_user' });
Favorite.belongsTo(User, { foreignKey: 'id_user' });
// Note : Pas d'association directe avec Movie/Recipe car structure polymorphique
// Les requêtes utilisent entity_type + entity_id pour le filtrage

// Relations pour les notes (polymorphique)
// Un utilisateur peut avoir plusieurs notes
User.hasMany(Rating, { foreignKey: 'id_user' });
Rating.belongsTo(User, { foreignKey: 'id_user' });
// Note : Pas d'association directe avec Movie/Recipe car structure polymorphique
// Les requêtes utilisent entity_type + entity_id pour le filtrage

// Relations gamification
UserPoints.belongsTo(User, { foreignKey: 'id_user' });
User.hasOne(UserPoints, { foreignKey: 'id_user' });

// Relations photos de recettes (multi-photos)
Recipe.hasMany(RecipePicture, { foreignKey: 'recipe_id', as: 'RecipePictures' });
RecipePicture.belongsTo(Recipe, { foreignKey: 'recipe_id' });

// Exportation des modèles pour utilisation dans d'autres parties de l'application
export { User, Recipe, Movie, Notice, UsersRecipes, Favorite, Rating, UserPoints, RecipePicture };



