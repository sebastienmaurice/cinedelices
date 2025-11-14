//  récupération des différents modèles pour faire les liaisons sans avoir à les faire dans chaque fichier

import User from './user.model.js';
import Recipe from './recipe.model.js';
import Movie from './movie.model.js';
import Notice from './notice.model.js';
import UsersRecipes from './users_recipes.model.js';



// Définition des relations entre les modèles

// Une recette appartient à un film
Recipe.belongsTo(Movie, { foreignKey: 'id_movie' });

// Un film peut avoir plusieurs recettes
Movie.hasMany(Recipe, { foreignKey: 'id_movie' });

// Un utilisateur peut publier plusieurs avis (notices)
User.hasMany(Notice, { foreignKey: 'id_user' });

// Une recette peut recevoir plusieurs avis
Recipe.hasMany(Notice, { foreignKey: 'id_recipe' });

// Un avis appartient à un utilisateur
Notice.belongsTo(User, { foreignKey: 'id_user' });

// Un avis appartient à une recette
Notice.belongsTo(Recipe, { foreignKey: 'id_recipe' });

// Définition de la table de jonction pour la relation N ↔ N entre User et Recipe
// l'utilisateur peut avoir plusieurs recettes
User.belongsToMany(Recipe, { through : UsersRecipes, timestamps: false,});
// une recette peut appartenir à plusieurs utilisateurs
Recipe.belongsToMany(User, { through : UsersRecipes, timestamps: false,});

// Exportation des modèles pour utilisation dans d'autres parties de l'application
export { User, Recipe, Movie, Notice, UsersRecipes};



