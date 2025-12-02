/**
 * Module utilitaire centralisé pour la gestion des images
 * Ciné Délices - PHASE 2
 *
 * Ce module fournit toutes les fonctions nécessaires pour :
 * - Générer des slugs à partir de noms
 * - Générer des identifiants aléatoires uniques
 * - Déterminer les dossiers de destination selon le type d'image
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Transforme un nom (film ou recette) en slug compatible URL
 * @param {string} name - Le nom à transformer en slug
 * @returns {string} - Le slug généré
 *
 * @example
 * slugifier("Harry Potter") // "harry-potter"
 * slugifier("La tarte à la Mélasse") // "la-tarte-a-la-melasse"
 * slugifier("Indiana Jones et les Aventuriers de l'Arche perdue") // "indiana-jones-et-les-aventuriers-de-larche-perdue"
 */
export function slugifier(name) {
  if (!name || typeof name !== "string") {
    return "";
  }

  return (
    name
      .toLowerCase()
      // Normaliser les caractères accentués
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remplacer les caractères spéciaux par des tirets
      .replace(/[^a-z0-9]+/g, "-")
      // Supprimer les tirets en début et fin
      .replace(/^-+|-+$/g, "")
      // Limiter à 100 caractères pour éviter des slugs trop longs
      .substring(0, 100)
  );
}

/**
 * Génère un entier aléatoire long (10+ chiffres) pour garantir l'unicité
 * @returns {number} - Un entier aléatoire de 10+ chiffres
 *
 * @example
 * generateRandom() // 1764516701928
 * generateRandom() // 9832328845671
 */
export function generateRandom() {
  // Utilise Date.now() pour avoir un timestamp (13 chiffres)
  // + un nombre aléatoire entre 1000 et 9999 pour garantir l'unicité
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 9000) + 1000; // 4 chiffres aléatoires

  // Combine pour avoir un nombre long et unique
  return parseInt(`${timestamp}${randomPart}`);
}

/**
 * Détermine le dossier de destination selon le type d'image
 * @param {string} type - Le type d'image : "movie-card", "movie-banner", ou "recipe-card"
 * @returns {string} - Le chemin absolu du dossier de destination
 *
 * @example
 * determineImageFolder("movie-card") // "/path/to/app/public/images/movies/cards"
 * determineImageFolder("movie-banner") // "/path/to/app/public/images/movies/banners"
 * determineImageFolder("recipe-card") // "/path/to/app/public/images/recipes/cards"
 */
export function determineImageFolder(type) {
  const basePath = path.join(__dirname, "../public/images");

  switch (type) {
    case "movie-card":
      return path.join(basePath, "movies", "cards");

    case "movie-banner":
      return path.join(basePath, "movies", "banners");

    case "recipe-card":
      return path.join(basePath, "recipes", "cards");

    default:
      throw new Error(
        `Type d'image non reconnu: "${type}". Types acceptés: "movie-card", "movie-banner", "recipe-card"`
      );
  }
}

/**
 * Constantes pour les types d'images (évite les erreurs de frappe)
 */
export const IMAGE_TYPES = {
  MOVIE_CARD: "movie-card",
  MOVIE_BANNER: "movie-banner",
  RECIPE_CARD: "recipe-card",
};

