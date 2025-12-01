/**
 * Module de nettoyage automatique des images
 * Ciné Délices - PHASE 6
 *
 * ⚠️ IMPORTANT : Cette fonctionnalité est PRÉPARÉE mais NON ACTIVÉE.
 * Elle permettra de nettoyer automatiquement les fichiers orphelins ou obsolètes.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Op } from "sequelize";
import { log, LOG_LEVELS } from "./logger.js";
import { Movie, Recipe } from "../models/index.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const IMAGES_BASE_PATH = path.join(__dirname, "../public/images");
const CLEANUP_ENABLED = false; // ⚠️ NON ACTIVÉ PAR DÉFAUT

/**
 * Récupère tous les chemins d'images depuis la BDD
 *
 * @returns {Promise<Set<string>>} - Set des chemins d'images référencés en BDD
 */
async function getReferencedImages() {
  const referencedPaths = new Set();

  try {
    // Récupérer tous les films avec images
    const movies = await Movie.findAll({
      where: {
        picture: { [Op.not]: null },
      },
      attributes: ["picture"],
    });

    movies.forEach((movie) => {
      if (movie.picture) {
        // Convertir le chemin relatif en chemin absolu
        const absolutePath = path.join(
          IMAGES_BASE_PATH,
          movie.picture.replace(/^\//, "")
        );
        referencedPaths.add(absolutePath);
      }
    });

    // Récupérer toutes les recettes avec images
    const recipes = await Recipe.findAll({
      where: {
        picture: { [Op.not]: null },
      },
      attributes: ["picture"],
    });

    recipes.forEach((recipe) => {
      if (recipe.picture) {
        const absolutePath = path.join(
          IMAGES_BASE_PATH,
          recipe.picture.replace(/^\//, "")
        );
        referencedPaths.add(absolutePath);
      }
    });
  } catch (error) {
    await log(
      LOG_LEVELS.ERROR,
      `Erreur lors de la récupération des images référencées: ${error.message}`
    );
  }

  return referencedPaths;
}

/**
 * Trouve tous les fichiers dans un dossier récursivement
 *
 * @param {string} dirPath - Chemin du dossier
 * @returns {Promise<Array<string>>} - Liste des chemins de fichiers
 */
async function getAllFilesInDirectory(dirPath) {
  const files = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await getAllFilesInDirectory(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    await log(
      LOG_LEVELS.WARN,
      `Impossible de lire le dossier ${dirPath}: ${error.message}`
    );
  }

  return files;
}

/**
 * Vérifie si un fichier est orphelin (non référencé en BDD)
 *
 * @param {string} filePath - Chemin du fichier
 * @param {Set<string>} referencedPaths - Set des chemins référencés
 * @returns {boolean} - true si le fichier est orphelin
 */
function isOrphanFile(filePath, referencedPaths) {
  // Normaliser les chemins pour la comparaison
  const normalizedPath = path.normalize(filePath);
  return !referencedPaths.has(normalizedPath);
}

/**
 * Nettoie les fichiers orphelins dans les dossiers d'images
 *
 * ⚠️ Cette fonction est PRÉPARÉE mais NON ACTIVÉE par défaut.
 * Pour l'activer, mettre CLEANUP_ENABLED à true.
 *
 * @param {Object} options - Options de nettoyage
 * @param {Array<string>} options.folders - Dossiers à nettoyer (optionnel, tous par défaut)
 * @param {boolean} options.dryRun - Mode simulation (ne supprime pas réellement)
 * @returns {Promise<Object>} - Résultat du nettoyage
 */
export async function cleanupOrphanImages(options = {}) {
  if (!CLEANUP_ENABLED) {
    await log(
      LOG_LEVELS.WARN,
      "Nettoyage automatique demandé mais désactivé. Pour activer, mettre CLEANUP_ENABLED à true."
    );
    return {
      enabled: false,
      message: "Nettoyage désactivé",
    };
  }

  const { folders = null, dryRun = true } = options;

  try {
    await log(LOG_LEVELS.INFO, `Démarrage du nettoyage (dryRun: ${dryRun})`);

    // Dossiers à nettoyer
    const foldersToClean = folders || [
      path.join(IMAGES_BASE_PATH, "movies", "cards"),
      path.join(IMAGES_BASE_PATH, "movies", "banners"),
      path.join(IMAGES_BASE_PATH, "recipes", "cards"),
    ];

    // Récupérer les images référencées en BDD
    const referencedPaths = await getReferencedImages();
    await log(
      LOG_LEVELS.INFO,
      `${referencedPaths.size} images référencées en BDD trouvées`
    );

    let totalFilesDeleted = 0;
    const allDeletedFiles = [];

    // Parcourir chaque dossier
    for (const folder of foldersToClean) {
      try {
        const files = await getAllFilesInDirectory(folder);
        const orphanFiles = files.filter((file) =>
          isOrphanFile(file, referencedPaths)
        );

        for (const file of orphanFiles) {
          if (!dryRun) {
            await fs.unlink(file);
          }
          allDeletedFiles.push(file);
          totalFilesDeleted++;
        }

        if (orphanFiles.length > 0) {
          await log(
            LOG_LEVELS.INFO,
            `Dossier ${folder}: ${orphanFiles.length} fichier(s) orphelin(s) trouvé(s)`
          );
        }
      } catch (error) {
        await log(
          LOG_LEVELS.ERROR,
          `Erreur lors du nettoyage du dossier ${folder}: ${error.message}`
        );
      }
    }

    const result = {
      enabled: true,
      dryRun,
      totalFilesDeleted,
      deletedFiles: allDeletedFiles,
      folders: foldersToClean,
    };

    await log(LOG_LEVELS.SUCCESS, `Nettoyage terminé`, {
      filesDeleted: totalFilesDeleted,
      dryRun,
    });

    return result;
  } catch (error) {
    await log(LOG_LEVELS.ERROR, `Erreur lors du nettoyage: ${error.message}`, {
      error: error.stack,
    });
    throw error;
  }
}

/**
 * Nettoie les fichiers temporaires (ex: uploads échoués)
 *
 * ⚠️ NON ACTIVÉ par défaut
 *
 * @param {number} maxAgeHours - Âge maximum en heures (fichiers plus vieux seront supprimés)
 * @param {boolean} dryRun - Mode simulation
 */
export async function cleanupTempFiles(maxAgeHours = 24, dryRun = true) {
  if (!CLEANUP_ENABLED) {
    return {
      enabled: false,
      message: "Nettoyage désactivé",
    };
  }

  // TODO: Implémenter le nettoyage des fichiers temporaires
  // Cette fonction pourra être utilisée pour nettoyer les fichiers
  // uploadés mais non associés à une entité (ex: uploads interrompus)

  await log(
    LOG_LEVELS.INFO,
    `Nettoyage des fichiers temporaires (non implémenté pour l'instant)`
  );
}
