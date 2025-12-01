/**
 * Module de journalisation centralisé - Ciné Délices - PHASE 6
 *
 * Journalise toutes les opérations d'upload et de traitement d'images
 * dans la console ET dans un fichier de log.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOG_DIR = path.join(__dirname, "../../logs");
const LOG_FILE = path.join(LOG_DIR, "image-uploads.log");
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_LOG_FILES = 5; // Nombre maximum de fichiers de log à garder

// Niveaux de log
const LOG_LEVELS = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
};

/**
 * Initialise le système de journalisation
 * Crée le dossier logs s'il n'existe pas
 */
async function initLogger() {
  try {
    await fs.access(LOG_DIR);
  } catch {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await log(LOG_LEVELS.INFO, "Système de journalisation initialisé", {
      logDir: LOG_DIR,
    });
  }
}

/**
 * Formate un message de log avec timestamp
 */
function formatLogMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : "";
  return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
}

/**
 * Écrit dans le fichier de log
 */
async function writeToFile(message) {
  try {
    await fs.appendFile(LOG_FILE, message, "utf8");

    // Vérifier la taille du fichier et faire une rotation si nécessaire
    const stats = await fs.stat(LOG_FILE);
    if (stats.size > MAX_LOG_SIZE) {
      await rotateLogFile();
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'écriture dans le fichier de log:",
      error
    );
  }
}

/**
 * Rotation du fichier de log (garde les N derniers fichiers)
 */
async function rotateLogFile() {
  try {
    // Créer un nouveau nom avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const rotatedFile = path.join(LOG_DIR, `image-uploads-${timestamp}.log`);

    // Renommer le fichier actuel
    await fs.rename(LOG_FILE, rotatedFile);

    // Supprimer les anciens fichiers si on dépasse MAX_LOG_FILES
    const files = await fs.readdir(LOG_DIR);
    const logFiles = files
      .filter(
        (file) => file.startsWith("image-uploads-") && file.endsWith(".log")
      )
      .sort()
      .reverse();

    if (logFiles.length > MAX_LOG_FILES) {
      const filesToDelete = logFiles.slice(MAX_LOG_FILES);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(LOG_DIR, file));
      }
    }

    await log(
      LOG_LEVELS.INFO,
      `Rotation du fichier de log effectuée. Ancien fichier: ${rotatedFile}`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la rotation du fichier de log:", error);
  }
}

/**
 * Journalise une opération (console + fichier)
 *
 * @param {string} level - Niveau de log (INFO, WARN, ERROR, SUCCESS)
 * @param {string} message - Message à journaliser
 * @param {Object} data - Données supplémentaires (optionnel)
 */
export async function log(level, message, data = null) {
  const formattedMessage = formatLogMessage(level, message, data);

  // Affichage console avec emoji selon le niveau
  const emoji =
    {
      [LOG_LEVELS.INFO]: "📝",
      [LOG_LEVELS.WARN]: "⚠️",
      [LOG_LEVELS.ERROR]: "❌",
      [LOG_LEVELS.SUCCESS]: "✅",
    }[level] || "📝";

  console.log(`${emoji} ${formattedMessage.trim()}`);

  // Écriture dans le fichier
  await writeToFile(formattedMessage);
}

/**
 * Journalise une opération d'upload d'image
 *
 * @param {Object} uploadData - Données de l'upload
 * @param {string} uploadData.type - Type d'image (movie-card, recipe-card, etc.)
 * @param {string} uploadData.filename - Nom du fichier uploadé
 * @param {string} uploadData.originalName - Nom original du fichier
 * @param {string} uploadData.destination - Dossier de destination
 * @param {number} uploadData.size - Taille du fichier en bytes
 * @param {string} uploadData.mimetype - Type MIME
 * @param {number} uploadData.entityId - ID du film/recette (optionnel)
 */
export async function logUpload(uploadData) {
  const {
    type,
    filename,
    originalName,
    destination,
    size,
    mimetype,
    entityId,
  } = uploadData;

  const sizeKB = (size / 1024).toFixed(2);

  await log(LOG_LEVELS.SUCCESS, `Upload d'image réussi`, {
    type,
    filename,
    originalName,
    destination,
    size: `${sizeKB} KB`,
    mimetype,
    entityId: entityId || null,
  });
}

/**
 * Journalise une erreur d'upload
 *
 * @param {Error} error - L'erreur survenue
 * @param {Object} context - Contexte de l'erreur
 */
export async function logUploadError(error, context = {}) {
  await log(
    LOG_LEVELS.ERROR,
    `Erreur lors de l'upload d'image: ${error.message}`,
    {
      error: error.toString(),
      stack: error.stack,
      ...context,
    }
  );
}

/**
 * Journalise une opération de traitement d'image (pipeline)
 *
 * @param {Object} processData - Données du traitement
 * @param {string} processData.step - Étape du traitement
 * @param {string} processData.imagePath - Chemin de l'image
 * @param {Object} processData.result - Résultat du traitement
 */
export async function logImageProcess(processData) {
  const { step, imagePath, result } = processData;

  await log(LOG_LEVELS.INFO, `Traitement d'image: ${step}`, {
    imagePath,
    result: result || "en cours",
  });
}

/**
 * Journalise une opération de nettoyage
 *
 * @param {Object} cleanupData - Données du nettoyage
 * @param {number} cleanupData.filesDeleted - Nombre de fichiers supprimés
 * @param {Array} cleanupData.deletedFiles - Liste des fichiers supprimés
 * @param {string} cleanupData.folder - Dossier nettoyé
 */
export async function logCleanup(cleanupData) {
  const { filesDeleted, deletedFiles, folder } = cleanupData;

  await log(LOG_LEVELS.INFO, `Nettoyage effectué`, {
    folder,
    filesDeleted,
    deletedFiles: deletedFiles?.slice(0, 10) || [], // Limiter à 10 pour éviter des logs trop longs
  });
}

// Initialisation au chargement du module
initLogger().catch((error) => {
  console.error("❌ Erreur lors de l'initialisation du logger:", error);
});

// Export des niveaux pour utilisation externe
export { LOG_LEVELS };
