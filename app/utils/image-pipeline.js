/**
 * Pipeline de traitement d'images - Ciné Délices - PHASE 3
 *
 * Module central pour le traitement des images uploadées.
 * Architecture préparée pour intégration future de Sharp et face-api.js.
 *
 * ⚠️ IMPORTANT : Les traitements réels (crop, resize, optimize) ne sont PAS activés.
 * Ce module prépare uniquement la structure et le flux de données.
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import {
  slugifier,
  generateRandom,
  determineImageFolder,
  IMAGE_TYPES,
} from "./image-utils.js";
import { Movie, Recipe } from "../models/index.model.js";
import { logImageProcess, logUploadError, LOG_LEVELS } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration par défaut pour chaque type d'image
 */
const IMAGE_CONFIG = {
  [IMAGE_TYPES.MOVIE_CARD]: {
    maxWidth: 640,
    maxHeight: 960,
    quality: 85,
    format: "jpg", // Format de sortie
    enableFaceDetection: false, // À activer plus tard avec face-api.js
  },
  [IMAGE_TYPES.MOVIE_BANNER]: {
    maxWidth: 1920,
    maxHeight: 600,
    quality: 90,
    format: "jpg",
    enableFaceDetection: false,
  },
  [IMAGE_TYPES.RECIPE_CARD]: {
    maxWidth: 640,
    maxHeight: 360,
    quality: 85,
    format: "webp", // WebP pour meilleure compression
    enableFaceDetection: false,
  },
};

/**
 * Options pour le pipeline
 * @typedef {Object} PipelineOptions
 * @property {string} imagePath - Chemin absolu de l'image uploadée
 * @property {string} imageType - Type d'image (movie-card, movie-banner, recipe-card)
 * @property {number} entityId - ID du film ou de la recette
 * @property {string} entityType - "movie" ou "recipe"
 * @property {boolean} enableCrop - Activer le crop intelligent (désactivé par défaut)
 * @property {boolean} enableResize - Activer le redimensionnement (désactivé par défaut)
 * @property {boolean} enableOptimize - Activer l'optimisation (désactivé par défaut)
 */

/**
 * Point d'entrée principal du pipeline de traitement d'images
 *
 * @param {PipelineOptions} options - Options du pipeline
 * @returns {Promise<Object>} - Résultat du traitement avec le chemin final
 *
 * @example
 * const result = await processImage({
 *   imagePath: "/path/to/uploaded/image.jpg",
 *   imageType: IMAGE_TYPES.MOVIE_CARD,
 *   entityId: 1,
 *   entityType: "movie",
 * });
 */
export async function processImage(options) {
  const {
    imagePath,
    imageType,
    entityId,
    entityType,
    enableCrop = false,
    enableResize = false,
    enableOptimize = false,
  } = options;

  // Validation des paramètres
  validateOptions(options);

  try {
    // 1. Récupérer le nom de l'entité depuis la BDD
    const entityName = await getEntityName(entityType, entityId);
    if (!entityName) {
      throw new Error(
        `${entityType} avec l'ID ${entityId} introuvable dans la base de données`
      );
    }

    // 2. Générer le slug et le random
    const slug = slugifier(entityName);
    const random = generateRandom();

    // 3. Déterminer le dossier de destination
    const destinationFolder = determineImageFolder(imageType);
    await ensureDirectoryExists(destinationFolder);

    // 4. Générer le nouveau nom de fichier
    const originalExt = path.extname(imagePath);
    const config = IMAGE_CONFIG[imageType];
    const finalExt =
      enableOptimize && config.format ? `.${config.format}` : originalExt;
    const newFilename = generateFilename(imageType, slug, random, finalExt);

    const finalPath = path.join(destinationFolder, newFilename);

    // 5. Pipeline de traitement (étapes préparées mais non activées)
    let processedImagePath = imagePath;

    // Étape 1 : Crop intelligent (si activé)
    if (enableCrop) {
      await logImageProcess({
        step: "crop",
        imagePath: processedImagePath,
        result: "démarrage",
      });
      processedImagePath = await cropImage(
        processedImagePath,
        imageType,
        finalPath
      );
      await logImageProcess({
        step: "crop",
        imagePath: processedImagePath,
        result: "terminé",
      });
    }

    // Étape 2 : Redimensionnement (si activé)
    if (enableResize) {
      await logImageProcess({
        step: "resize",
        imagePath: processedImagePath,
        result: "démarrage",
      });
      processedImagePath = await resizeImage(
        processedImagePath,
        imageType,
        config,
        finalPath
      );
      await logImageProcess({
        step: "resize",
        imagePath: processedImagePath,
        result: "terminé",
      });
    }

    // Étape 3 : Optimisation (si activée)
    if (enableOptimize) {
      await logImageProcess({
        step: "optimize",
        imagePath: processedImagePath,
        result: "démarrage",
      });
      processedImagePath = await optimizeImage(
        processedImagePath,
        imageType,
        config,
        finalPath
      );
      await logImageProcess({
        step: "optimize",
        imagePath: processedImagePath,
        result: "terminé",
      });
    }

    // 6. Si aucune étape n'est activée, copier le fichier avec le nouveau nom
    if (!enableCrop && !enableResize && !enableOptimize) {
      processedImagePath = await copyFile(imagePath, finalPath);
      await logImageProcess({
        step: "copy",
        imagePath: processedImagePath,
        result: "fichier copié avec nouveau nom",
      });
    }

    // 7. Générer le chemin relatif pour la BDD
    const relativePath = getRelativePath(finalPath);

    return {
      success: true,
      originalPath: imagePath,
      finalPath: processedImagePath,
      relativePath: relativePath,
      filename: newFilename,
      slug: slug,
      random: random,
    };
  } catch (error) {
    await logUploadError(error, {
      context: "image-pipeline",
      imageType,
      entityId,
      entityType,
    });
    console.error("Erreur dans le pipeline de traitement d'images:", error);
    throw error;
  }
}

/**
 * Valide les options du pipeline
 * @private
 */
function validateOptions(options) {
  const { imagePath, imageType, entityId, entityType } = options;

  if (!imagePath || typeof imagePath !== "string") {
    throw new Error(
      "imagePath est requis et doit être une chaîne de caractères"
    );
  }

  if (!Object.values(IMAGE_TYPES).includes(imageType)) {
    throw new Error(
      `imageType invalide: "${imageType}". Types acceptés: ${Object.values(
        IMAGE_TYPES
      ).join(", ")}`
    );
  }

  if (!entityId || typeof entityId !== "number") {
    throw new Error("entityId est requis et doit être un nombre");
  }

  if (!["movie", "recipe"].includes(entityType)) {
    throw new Error('entityType doit être "movie" ou "recipe"');
  }
}

/**
 * Récupère le nom d'une entité (film ou recette) depuis la BDD
 * @private
 */
async function getEntityName(entityType, entityId) {
  try {
    let entity;
    if (entityType === "movie") {
      entity = await Movie.findByPk(entityId);
      return entity ? entity.title : null;
    } else if (entityType === "recipe") {
      entity = await Recipe.findByPk(entityId);
      return entity ? entity.name : null;
    }
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du ${entityType}:`, error);
    throw error;
  }
}

/**
 * Génère le nom de fichier selon le type d'image
 * @private
 */
function generateFilename(imageType, slug, random, extension) {
  const prefix = imageType.replace("-", "-");
  return `${prefix}-${slug}-${random}${extension}`;
}

/**
 * Vérifie et crée le dossier s'il n'existe pas
 * @private
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Dossier créé: ${dirPath}`);
  }
}

/**
 * Copie un fichier vers une nouvelle destination
 * @private
 */
async function copyFile(sourcePath, destPath) {
  try {
    await fs.copyFile(sourcePath, destPath);
    console.log(`📋 Fichier copié: ${sourcePath} → ${destPath}`);
    return destPath;
  } catch (error) {
    console.error("Erreur lors de la copie du fichier:", error);
    throw error;
  }
}

/**
 * Convertit un chemin absolu en chemin relatif pour la BDD
 * @private
 */
function getRelativePath(absolutePath) {
  const imagesPath = path.join(__dirname, "../public/images");
  const relativePath = path.relative(imagesPath, absolutePath);
  return `/images/${relativePath.replace(/\\/g, "/")}`;
}

// ============================================
// ÉTAPES DU PIPELINE (PRÉPARÉES MAIS NON ACTIVÉES)
// ============================================

/**
 * Étape 1 : Crop intelligent avec détection de visage
 * ⚠️ NON ACTIVÉ - Nécessite face-api.js
 *
 * @private
 * @param {string} imagePath - Chemin de l'image source
 * @param {string} imageType - Type d'image
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise<string>} - Chemin de l'image traitée
 */
async function cropImage(imagePath, imageType, outputPath) {
  // TODO: Implémenter avec face-api.js
  // 1. Charger le modèle face-api.js
  // 2. Détecter les visages dans l'image
  // 3. Calculer la zone optimale pour le crop
  // 4. Cropper l'image avec Sharp
  console.log(
    `🚧 [SIMULATION] Crop intelligent demandé pour: ${imagePath} (type: ${imageType})`
  );
  console.log(
    `   → Face-api.js non encore intégré. Image copiée sans traitement.`
  );
  return await copyFile(imagePath, outputPath);
}

/**
 * Étape 2 : Redimensionnement automatique
 * ⚠️ NON ACTIVÉ - Nécessite Sharp
 *
 * @private
 * @param {string} imagePath - Chemin de l'image source
 * @param {string} imageType - Type d'image
 * @param {Object} config - Configuration de redimensionnement
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise<string>} - Chemin de l'image redimensionnée
 */
async function resizeImage(imagePath, imageType, config, outputPath) {
  // TODO: Implémenter avec Sharp
  // 1. Charger l'image avec Sharp
  // 2. Obtenir les dimensions actuelles
  // 3. Calculer les nouvelles dimensions en respectant le ratio
  // 4. Redimensionner l'image
  // 5. Sauvegarder
  console.log(`🚧 [SIMULATION] Redimensionnement demandé pour: ${imagePath}`);
  console.log(`   → Dimensions cibles: ${config.maxWidth}x${config.maxHeight}`);
  console.log(`   → Sharp non encore intégré. Image copiée sans traitement.`);
  return await copyFile(imagePath, outputPath);
}

/**
 * Étape 3 : Optimisation (compression, conversion format)
 * ⚠️ NON ACTIVÉ - Nécessite Sharp
 *
 * @private
 * @param {string} imagePath - Chemin de l'image source
 * @param {string} imageType - Type d'image
 * @param {Object} config - Configuration d'optimisation
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise<string>} - Chemin de l'image optimisée
 */
async function optimizeImage(imagePath, imageType, config, outputPath) {
  // TODO: Implémenter avec Sharp
  // 1. Charger l'image avec Sharp
  // 2. Convertir au format souhaité (WebP, JPG, etc.)
  // 3. Appliquer la compression avec la qualité configurée
  // 4. Optimiser les métadonnées
  // 5. Sauvegarder
  console.log(`🚧 [SIMULATION] Optimisation demandée pour: ${imagePath}`);
  console.log(
    `   → Format cible: ${config.format}, Qualité: ${config.quality}%`
  );
  console.log(`   → Sharp non encore intégré. Image copiée sans traitement.`);
  return await copyFile(imagePath, outputPath);
}

/**
 * Configuration du pipeline exportée pour usage externe
 */
export const PIPELINE_CONFIG = IMAGE_CONFIG;

/**
 * Ré-export des types d'images pour facilité d'utilisation
 */
export { IMAGE_TYPES } from "./image-utils.js";
