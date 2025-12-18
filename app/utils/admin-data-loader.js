/**
 * Helper pour charger les données admin de manière centralisée
 * Ciné Délices - Refactoring Étape 2
 *
 * Ce module centralise les requêtes BDD répétitives dans admin.controllers.js
 * qui étaient dupliquées dans admin(), editRecipe() et editMovie().
 *
 * Avantages :
 * - Réduction de 3 blocs de code identiques
 * - Cohérence des données chargées
 * - Facilité de modification (un seul endroit)
 * - Code plus lisible dans le controller admin
 */

import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { enrichMoviesWithImagePaths } from "./movie-image-helper.js";

/**
 * Charge toutes les données nécessaires pour le dashboard admin
 * Retourne : recipes (status: false), movies (status: false, enrichis), avis, users
 *
 * @returns {Promise<Object>} - Objet contenant { recipes, movies, avis, users }
 *                              avec movies déjà enrichis avec les chemins d'images
 *
 * @example
 * const { recipes, movies, avis, users } = await loadAdminData();
 * res.render("admin-dashboard", { recipes, movies, avis, users, ... });
 */
export async function loadAdminData() {
  // Récupérer les recettes en attente de validation (status: false)
  const recipes = await Recipe.findAll({
    where: { status: false },
  });

  // Récupérer les films en attente de validation (status: false)
  const movies = await Movie.findAll({
    where: { status: false },
  });

  // Récupérer tous les avis (notices)
  const avis = await Notice.findAll();

  // Récupérer tous les utilisateurs
  const users = await User.findAll();

  // Enrichir les movies avec les chemins d'images (bannerPath, cardPath, originalPath)
  // Refactoring : l'enrichissement est fait ici pour éviter de le répéter dans chaque fonction
  const enrichedMovies = enrichMoviesWithImagePaths(movies);

  return {
    recipes,
    movies: enrichedMovies,
    avis,
    users,
  };
}
