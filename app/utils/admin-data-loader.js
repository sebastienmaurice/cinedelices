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
    include: [{ model: Movie, attributes: ["title", "picture", "year", "genre"] }],
  });

  // Récupérer les films en attente de validation (status: false)
  const movies = await Movie.findAll({
    where: { status: false },
  });

  const pendingMovieDeleteRequests = await Movie.findAll({
    where: { delete_request_status: "pending" },
    include: [{ model: User, attributes: ["id", "pseudo", "email"] }],
    order: [["delete_request_at", "DESC"]],
  });

  const pendingMovieEdits = await Movie.findAll({
    where: { edit_status: "pending" },
    include: [{ model: User, attributes: ["id", "pseudo", "email"] }],
    order: [["edit_requested_at", "DESC"]],
  });

  const pendingRecipeEdits = await Recipe.findAll({
    where: { edit_status: "pending" },
    include: [
      { model: Movie, attributes: ["title", "year", "genre"] },
      { model: User, attributes: ["id", "pseudo", "email"] },
    ],
    order: [["edit_requested_at", "DESC"]],
  });

  const pendingNoticeEdits = await Notice.findAll({
    where: { edit_status: "pending" },
    include: [
      {
        model: Recipe,
        attributes: ["id", "name"],
        include: [{ model: Movie, attributes: ["id", "title"] }],
      },
      { model: User, attributes: ["id", "pseudo", "email"] },
    ],
    order: [["edit_requested_at", "DESC"]],
  });

  const pendingNoticeDeleteRequests = await Notice.findAll({
    where: { delete_request_status: "pending" },
    include: [
      {
        model: Recipe,
        attributes: ["id", "name"],
        include: [{ model: Movie, attributes: ["id", "title"] }],
      },
      { model: User, attributes: ["id", "pseudo", "email"] },
    ],
    order: [["delete_request_at", "DESC"]],
  });

  const validatedMovies = await Movie.findAll({
    where: { status: true },
    order: [["id", "DESC"]],
  });

  const validatedRecipes = await Recipe.findAll({
    where: { status: true },
    include: [{ model: Movie, attributes: ["id", "title"] }],
    order: [["id", "DESC"]],
  });

  const validatedNotices = await Notice.findAll({
    where: { status: true },
    include: [
      {
        model: Recipe,
        attributes: ["id", "name"],
        include: [{ model: Movie, attributes: ["id", "title"] }],
      },
    ],
    order: [["id", "DESC"]],
  });

  // Récupérer tous les avis (notices)
  const avis = await Notice.findAll({
    order: [
      ["status", "ASC"],
      ["id", "DESC"],
    ],
  });

  // Récupérer tous les utilisateurs
  const users = await User.findAll();

  // Enrichir les movies avec les chemins d'images (bannerPath, cardPath, originalPath)
  // Refactoring : l'enrichissement est fait ici pour éviter de le répéter dans chaque fonction
  const enrichedMovies = enrichMoviesWithImagePaths(movies);
  const enrichedDeleteRequests = enrichMoviesWithImagePaths(
    pendingMovieDeleteRequests
  );
  const enrichedPendingMovieEdits = enrichMoviesWithImagePaths(pendingMovieEdits);

  return {
    recipes,
    movies: enrichedMovies,
    avis,
    users,
    pendingMovieDeleteRequests: enrichedDeleteRequests,
    pendingMovieEdits: enrichedPendingMovieEdits,
    pendingRecipeEdits,
    pendingNoticeEdits,
    pendingNoticeDeleteRequests,
    validatedMovies: enrichMoviesWithImagePaths(validatedMovies),
    validatedRecipes,
    validatedNotices,
  };
}
