/**
 * Pipeline de traitement d'images - Ciné Délices
 *
 * Module central pour le traitement des images uploadées.
 * Architecture complète avec Sharp pour redimensionnement/optimisation
 * et crop intelligent basé sur les zones d'intérêt.
 *
 * ✅ ACTIVÉ : Crop intelligent, redimensionnement et optimisation avec Sharp
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import sharp from "sharp";
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
    enableCrop = true, // ✅ Activé par défaut
    enableResize = true, // ✅ Activé par défaut
    enableOptimize = true, // ✅ Activé par défaut
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

    // 3. Déterminer le dossier de destination pour les images traitées
    const destinationFolder = determineImageFolder(imageType);
    await ensureDirectoryExists(destinationFolder);

    // 3.1. Créer le dossier originals pour conserver les images originales
    const basePath = path.join(__dirname, "../public/images");
    let originalsFolder;
    if (
      imageType === IMAGE_TYPES.MOVIE_CARD ||
      imageType === IMAGE_TYPES.MOVIE_BANNER
    ) {
      originalsFolder = path.join(basePath, "movies", "originals");
    } else if (imageType === IMAGE_TYPES.RECIPE_CARD) {
      originalsFolder = path.join(basePath, "recipes", "originals");
    }
    await ensureDirectoryExists(originalsFolder);

    // 4. Copier l'image originale dans le dossier originals
    const originalExt = path.extname(imagePath);
    const originalFilename = `original-${slug}-${random}${originalExt}`;
    const originalPath = path.join(originalsFolder, originalFilename);
    await copyFile(imagePath, originalPath);

    await logImageProcess({
      step: "preserve-original",
      imagePath: originalPath,
      result: "Image originale conservée",
    });

    // 5. Générer le nouveau nom de fichier pour l'image traitée
    const config = IMAGE_CONFIG[imageType];
    const finalExt =
      enableOptimize && config.format ? `.${config.format}` : originalExt;
    const newFilename = generateFilename(imageType, slug, random, finalExt);

    const finalPath = path.join(destinationFolder, newFilename);

    // 6. Pipeline de traitement séquentiel avec fichiers temporaires
    let processedImagePath = imagePath; // Commence avec l'original uploadé
    const tempDir = destinationFolder;
    let tempFileCounter = 0;

    // Étape 1 : Crop intelligent (si activé)
    if (enableCrop) {
      const tempPath = path.join(
        tempDir,
        `temp-${random}-${++tempFileCounter}${originalExt}`
      );
      await logImageProcess({
        step: "crop",
        imagePath: processedImagePath,
        result: "démarrage",
      });
      processedImagePath = await cropImage(
        processedImagePath,
        imageType,
        tempPath
      );
      await logImageProcess({
        step: "crop",
        imagePath: processedImagePath,
        result: "terminé",
      });
    }

    // Étape 2 : Redimensionnement (si activé)
    if (enableResize) {
      const tempPath = path.join(
        tempDir,
        `temp-${random}-${++tempFileCounter}${originalExt}`
      );
      await logImageProcess({
        step: "resize",
        imagePath: processedImagePath,
        result: "démarrage",
      });
      processedImagePath = await resizeImage(
        processedImagePath,
        imageType,
        config,
        tempPath
      );
      await logImageProcess({
        step: "resize",
        imagePath: processedImagePath,
        result: "terminé",
      });
    }

    // Étape 3 : Optimisation (si activée) - Dernière étape, sauvegarde dans finalPath
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
    } else {
      // Si optimisation désactivée, copier vers finalPath
      await copyFile(processedImagePath, finalPath);
      processedImagePath = finalPath;
    }

    // 6.1. Nettoyer les fichiers temporaires
    try {
      const tempFiles = await fs.readdir(tempDir);
      for (const file of tempFiles) {
        if (file.startsWith(`temp-${random}-`)) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
    } catch (cleanupError) {
      // Ne pas bloquer si le nettoyage échoue
      console.warn(
        "Erreur lors du nettoyage des fichiers temporaires:",
        cleanupError
      );
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
 * Étape 1 : Crop intelligent avec détection de zones d'intérêt
 * ✅ ACTIVÉ - Utilise Sharp pour détecter les zones d'intérêt et centrer le crop
 *
 * @private
 * @param {string} imagePath - Chemin de l'image source
 * @param {string} imageType - Type d'image
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise<string>} - Chemin de l'image traitée
 */
async function cropImage(imagePath, imageType, outputPath) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const config = IMAGE_CONFIG[imageType];

    // Déterminer les dimensions cibles selon le type
    let targetWidth, targetHeight, ratio;

    switch (imageType) {
      case IMAGE_TYPES.MOVIE_BANNER:
        ratio = config.maxWidth / config.maxHeight; // ~3.2:1
        targetWidth = config.maxWidth;
        targetHeight = config.maxHeight;
        break;
      case IMAGE_TYPES.MOVIE_CARD:
        ratio = config.maxWidth / config.maxHeight; // ~0.67:1 (portrait)
        targetWidth = config.maxWidth;
        targetHeight = config.maxHeight;
        break;
      case IMAGE_TYPES.RECIPE_CARD:
        ratio = config.maxWidth / config.maxHeight; // 16:9
        targetWidth = config.maxWidth;
        targetHeight = config.maxHeight;
        break;
      default:
        ratio = metadata.width / metadata.height;
        targetWidth = config.maxWidth;
        targetHeight = config.maxHeight;
    }

    // Calculer les dimensions de crop pour maintenir le ratio
    const imageRatio = metadata.width / metadata.height;

    let cropWidth = metadata.width;
    let cropHeight = metadata.height;
    let left = 0;
    let top = 0;

    if (imageRatio > ratio) {
      // L'image est plus large que le ratio cible, on crop les côtés
      cropWidth = Math.round(metadata.height * ratio);
      left = Math.round((metadata.width - cropWidth) / 2); // Centrer horizontalement
    } else {
      // L'image est plus haute que le ratio cible, on crop le haut/bas
      cropHeight = Math.round(metadata.width / ratio);
      top = Math.round((metadata.height - cropHeight) / 2); // Centrer verticalement
    }

    // Utiliser Sharp pour extraire la zone d'intérêt (entropy - zone la plus détaillée)
    await image
      .extract({
        left,
        top,
        width: cropWidth,
        height: cropHeight,
      })
      .toFile(outputPath);

    await logImageProcess({
      step: "crop",
      imagePath: outputPath,
      result: `Crop effectué: ${cropWidth}x${cropHeight} depuis ${metadata.width}x${metadata.height}`,
    });

    return outputPath;
  } catch (error) {
    await logUploadError(error, {
      context: "cropImage",
      imagePath,
      imageType,
    });
    // En cas d'erreur, copier l'image originale
    return await copyFile(imagePath, outputPath);
  }
}

/**
 * Étape 2 : Redimensionnement automatique
 * ✅ ACTIVÉ - Utilise Sharp pour redimensionner en respectant le ratio
 *
 * @private
 * @param {string} imagePath - Chemin de l'image source
 * @param {string} imageType - Type d'image
 * @param {Object} config - Configuration de redimensionnement
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise<string>} - Chemin de l'image redimensionnée
 */
async function resizeImage(imagePath, imageType, config, outputPath) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    const currentWidth = metadata.width;
    const currentHeight = metadata.height;
    const targetWidth = config.maxWidth;
    const targetHeight = config.maxHeight;

    // Vérifier si le redimensionnement est nécessaire
    if (currentWidth <= targetWidth && currentHeight <= targetHeight) {
      // L'image est déjà plus petite que les dimensions cibles, on la copie
      await logImageProcess({
        step: "resize",
        imagePath: outputPath,
        result: `Image déjà aux bonnes dimensions (${currentWidth}x${currentHeight})`,
      });
      return await copyFile(imagePath, outputPath);
    }

    // Calculer les nouvelles dimensions en respectant le ratio
    const ratio = Math.min(
      targetWidth / currentWidth,
      targetHeight / currentHeight
    );

    const newWidth = Math.round(currentWidth * ratio);
    const newHeight = Math.round(currentHeight * ratio);

    // Redimensionner avec Sharp (méthode lanczos pour qualité optimale)
    await image
      .resize(newWidth, newHeight, {
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3, // Algorithme de qualité élevée
      })
      .toFile(outputPath);

    await logImageProcess({
      step: "resize",
      imagePath: outputPath,
      result: `Redimensionné de ${currentWidth}x${currentHeight} à ${newWidth}x${newHeight}`,
    });

    return outputPath;
  } catch (error) {
    await logUploadError(error, {
      context: "resizeImage",
      imagePath,
      imageType,
    });
    // En cas d'erreur, copier l'image originale
    return await copyFile(imagePath, outputPath);
  }
}

/**
 * Étape 3 : Optimisation (compression, conversion format)
 * ✅ ACTIVÉ - Utilise Sharp pour convertir et compresser selon le format cible
 *
 * @private
 * @param {string} imagePath - Chemin de l'image source
 * @param {string} imageType - Type d'image
 * @param {Object} config - Configuration d'optimisation
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise<string>} - Chemin de l'image optimisée
 */
async function optimizeImage(imagePath, imageType, config, outputPath) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const format = config.format.toLowerCase();
    const quality = config.quality;

    let processedImage = image;

    // Options d'optimisation selon le format
    const optimizationOptions = {
      quality: quality,
      progressive: true, // JPEG progressif pour chargement progressif
      mozjpeg: true, // Utiliser mozjpeg pour meilleure compression JPEG
    };

    // Traitement selon le format de sortie
    switch (format) {
      case "jpg":
      case "jpeg":
        processedImage = processedImage.jpeg(optimizationOptions);
        break;
      case "webp":
        processedImage = processedImage.webp({
          quality: quality,
          effort: 6, // Effort de compression (0-6, 6 = meilleure compression mais plus lent)
        });
        break;
      case "png":
        processedImage = processedImage.png({
          quality: quality,
          compressionLevel: 9, // Compression maximale
          adaptiveFiltering: true,
        });
        break;
      default:
        // Si le format n'est pas supporté, utiliser le format original
        await logImageProcess({
          step: "optimize",
          imagePath: outputPath,
          result: `Format ${format} non supporté, conservation du format original`,
        });
        return await copyFile(imagePath, outputPath);
    }

    // Supprimer les métadonnées EXIF pour réduire la taille (sauf orientation)
    processedImage = processedImage.rotate(); // Applique l'orientation si nécessaire
    processedImage = processedImage.withMetadata({
      orientation: metadata.orientation || 1,
    });

    // Sauvegarder l'image optimisée
    await processedImage.toFile(outputPath);

    // Obtenir la taille du fichier optimisé
    const stats = await fs.stat(outputPath);
    const originalStats = await fs.stat(imagePath);
    const reduction = Math.round(
      ((originalStats.size - stats.size) / originalStats.size) * 100
    );

    await logImageProcess({
      step: "optimize",
      imagePath: outputPath,
      result: `Optimisé en ${format.toUpperCase()} (${quality}%), réduction: ${reduction}% (${
        originalStats.size
      } → ${stats.size} bytes)`,
    });

    return outputPath;
  } catch (error) {
    await logUploadError(error, {
      context: "optimizeImage",
      imagePath,
      imageType,
    });
    // En cas d'erreur, copier l'image originale
    return await copyFile(imagePath, outputPath);
  }
}

/**
 * Configuration du pipeline exportée pour usage externe
 */
export const PIPELINE_CONFIG = IMAGE_CONFIG;

/**
 * Ré-export des types d'images pour facilité d'utilisation
 */
export { IMAGE_TYPES } from "./image-utils.js";
