/**
 * upload-banner.middleware.js — Middleware Multer pour les bannières auteur
 *
 * RÔLE DE MULTER :
 * ─────────────────
 * Multer est un middleware Express qui gère les uploads de fichiers (multipart/form-data).
 * Ici, il réceptionne le fichier envoyé par le frontend et le stocke temporairement
 * sur le disque. Le fichier sera ensuite traité par Sharp dans le contrôleur
 * (redimensionnement + conversion WebP), puis le fichier temporaire sera supprimé.
 *
 * POURQUOI UN UPLOAD TEMPORAIRE ?
 * ────────────────────────────────
 * On ne stocke pas directement le fichier dans son dossier final parce que :
 * 1. Sharp a besoin de lire le fichier pour le traiter
 * 2. Le fichier original peut être volumineux (JPEG/PNG non optimisé)
 * 3. On ne veut garder que la version optimisée (WebP 1408×350)
 *
 * Limite de taille : 3 MB (le frontend envoie déjà une image recadrée en JPEG)
 * Formats acceptés : JPEG, PNG, WEBP uniquement (vérification MIME)
 */

import multer from "multer";
import os from "os";
import { createFileFilter } from "../utils/upload-config.js";

// Stockage temporaire dans le dossier temp de l'OS (/tmp sur Linux)
// Le fichier sera supprimé après traitement par Sharp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    // Nom unique pour éviter les collisions en cas d'uploads simultanés
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `banner-tmp-${uniqueSuffix}`);
  },
});

// Limite spécifique aux bannières : 3 MB max
// (plus petit que la limite globale de 5 MB car le frontend envoie du JPEG recadré)
const BANNER_MAX_SIZE = 3 * 1024 * 1024;

const uploadBanner = multer({
  storage,
  // createFileFilter() vérifie que le MIME est jpeg, png ou webp
  fileFilter: createFileFilter(),
  limits: {
    fileSize: BANNER_MAX_SIZE,
  },
});

export default uploadBanner;
