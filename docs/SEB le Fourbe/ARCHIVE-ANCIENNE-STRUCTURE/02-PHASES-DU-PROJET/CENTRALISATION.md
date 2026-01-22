# Guide de Centralisation - PHASE 6

## Architecture Modulaire et Conventions

---

## 📁 Structure Modulaire

Tous les modules utilitaires sont centralisés dans `app/utils/` :

```
app/utils/
├── image-utils.js      → Fonctions utilitaires (slug, random, folders)
├── image-pipeline.js   → Pipeline de traitement d'images
├── upload-config.js    → Configuration centralisée des uploads
├── logger.js           → Système de journalisation (console + fichier)
└── cleanup.js          → Nettoyage automatique (préparé, non activé)
```

---

## 🎯 Modules Centralisés

### 1. `image-utils.js`

**Fonctions disponibles :**

- `slugifier(name)` → Génère un slug depuis un nom
- `generateRandom()` → Génère un nombre aléatoire unique (17 chiffres)
- `determineImageFolder(type)` → Détermine le dossier selon le type
- `IMAGE_TYPES` → Constantes pour les types d'images

**Usage :**

```javascript
import {
  slugifier,
  generateRandom,
  determineImageFolder,
  IMAGE_TYPES,
} from "./utils/image-utils.js";
```

**Règle :** ✅ **TOUJOURS utiliser ces fonctions plutôt que de recréer la logique**

---

### 2. `upload-config.js`

**Éléments centralisés :**

- `ALLOWED_MIME_TYPES` → Types MIME autorisés
- `MAX_FILE_SIZE` → Limite de taille (5 MB)
- `createImageFilter()` → Filtre Multer réutilisable
- `MULTER_COMMON_CONFIG` → Configuration commune

**Usage :**

```javascript
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  createImageFilter,
  MULTER_COMMON_CONFIG,
} from "./utils/upload-config.js";

const upload = multer({
  storage: storage,
  fileFilter: createImageFilter(), // ✅ Utiliser la fonction centralisée
  ...MULTER_COMMON_CONFIG, // ✅ Utiliser la config commune
});
```

**Règle :** ✅ **NE PAS dupliquer les types MIME, limites, ou filtres**

---

### 3. `logger.js`

**Fonctions disponibles :**

- `log(level, message, data)` → Journalisation générique
- `logUpload(uploadData)` → Journalisation d'upload
- `logUploadError(error, context)` → Journalisation d'erreur
- `logImageProcess(processData)` → Journalisation de traitement
- `logCleanup(cleanupData)` → Journalisation de nettoyage

**Usage :**

```javascript
import { log, logUpload, LOG_LEVELS } from "./utils/logger.js";

// Journalisation simple
await log(LOG_LEVELS.SUCCESS, "Image uploadée avec succès");

// Journalisation d'upload
await logUpload({
  type: "movie-card",
  filename: "movie-harry-potter-123.jpg",
  originalName: "harry.jpg",
  destination: "/path/to/cards",
  size: 102400,
  mimetype: "image/jpeg",
  entityId: 1,
});
```

**Fichier de log :** `logs/image-uploads.log`

**Règle :** ✅ **TOUJOURS journaliser les opérations d'upload via ce module**

---

### 4. `image-pipeline.js`

**Fonction principale :**

- `processImage(options)` → Pipeline complet de traitement

**Usage :**

```javascript
import { processImage, IMAGE_TYPES } from "./utils/image-pipeline.js";

const result = await processImage({
  imagePath: req.file.path,
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: movieId,
  entityType: "movie",
});
```

**Règle :** ✅ **Utiliser le pipeline pour tout traitement d'image**

---

### 5. `cleanup.js`

**Fonctions disponibles :**

- `cleanupOrphanImages(options)` → Nettoie les fichiers orphelins
- `cleanupTempFiles(maxAgeHours, dryRun)` → Nettoie les fichiers temporaires

**⚠️ IMPORTANT :** Ces fonctions sont **PRÉPARÉES** mais **NON ACTIVÉES** par défaut.

**Règle :** ✅ **Ne pas activer sans validation**

---

## 🔄 Intégration dans les Middlewares

### Avant (avec duplications)

```javascript
// ❌ MAUVAIS : Duplication
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format non supporté"), false);
  }
};

const upload = multer({
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
```

### Après (centralisé)

```javascript
// ✅ BON : Utilisation du module centralisé
import {
  createImageFilter,
  MULTER_COMMON_CONFIG,
} from "../utils/upload-config.js";

const upload = multer({
  storage: storage,
  fileFilter: createImageFilter(), // ✅ Fonction centralisée
  ...MULTER_COMMON_CONFIG, // ✅ Config centralisée
});
```

---

## 📝 Journalisation des Opérations

### Dans les Middlewares

```javascript
import { logUpload, logUploadError } from "../utils/logger.js";

// Après un upload réussi
await logUpload({
  type: "movie-card",
  filename: req.file.filename,
  originalName: req.file.originalname,
  destination: req.file.destination,
  size: req.file.size,
  mimetype: req.file.mimetype,
  entityId: req.params.id,
});

// En cas d'erreur
try {
  // ... opération upload
} catch (error) {
  await logUploadError(error, {
    type: "movie-card",
    entityId: req.params.id,
  });
}
```

### Dans le Pipeline

```javascript
import { logImageProcess } from "../utils/logger.js";

// Pendant le traitement
await logImageProcess({
  step: "crop",
  imagePath: processedImagePath,
  result: "succès",
});
```

---

## 🚫 Conventions : ÉVITER les Duplications

### ❌ À ÉVITER

1. **Redéfinir les types MIME** → Utiliser `ALLOWED_MIME_TYPES`
2. **Redéfinir les limites de taille** → Utiliser `MAX_FILE_SIZE`
3. **Recréer des filtres Multer** → Utiliser `createImageFilter()`
4. **Utiliser `Date.now()` pour générer des nombres** → Utiliser `generateRandom()`
5. **Créer des slugs manuellement** → Utiliser `slugifier()`
6. **Déterminer les dossiers manuellement** → Utiliser `determineImageFolder()`
7. **Utiliser `console.log` pour les uploads** → Utiliser le module `logger.js`

### ✅ À FAIRE

1. **Toujours importer depuis les modules centralisés**
2. **Journaliser toutes les opérations d'upload**
3. **Réutiliser les fonctions existantes**
4. **Documenter les nouveaux modules**

---

## 📊 Checklist de Modularité

Avant d'ajouter du code, vérifier :

- [ ] Est-ce qu'une fonction similaire existe déjà dans `utils/` ?
- [ ] Est-ce que je duplique une configuration existante ?
- [ ] Est-ce que je dois journaliser cette opération ?
- [ ] Est-ce que je peux réutiliser un module existant ?

Si la réponse est "OUI" à une de ces questions → **Utiliser le module centralisé**

---

## 🔧 Modification des Modules

### Pour modifier une configuration commune :

1. **Modifier UNIQUEMENT le module centralisé**

   - Exemple : Changer `MAX_FILE_SIZE` dans `upload-config.js`
   - Tous les middlewares qui utilisent ce module seront automatiquement mis à jour

2. **Tester l'impact**

   - Vérifier que tous les middlewares fonctionnent toujours

3. **Documenter le changement**
   - Mettre à jour ce fichier si nécessaire

---

## 📁 Structure des Logs

Les logs sont centralisés dans `logs/image-uploads.log` :

```
logs/
└── image-uploads.log          → Log actuel
└── image-uploads-2025-12-01.log → Logs archivés (rotation automatique)
```

**Rotation automatique :**

- Quand le fichier dépasse 10 MB
- Garde les 5 derniers fichiers de log
- Création automatique d'un nouveau fichier

---

## ✅ Avantages de la Centralisation

1. **Pas de duplication** → Un seul endroit à modifier
2. **Cohérence** → Même logique partout
3. **Maintenance facile** → Modifications centralisées
4. **Journalisation complète** → Traçabilité de toutes les opérations
5. **Code propre** → Modules réutilisables

---

## 🎯 Prochaines Étapes

Pour intégrer la centralisation dans les middlewares existants :

1. Remplacer les duplications par les imports des modules centralisés
2. Ajouter la journalisation dans tous les middlewares
3. Tester que tout fonctionne correctement
4. Documenter les changements

**Note :** Ces modifications peuvent être faites progressivement sans casser l'existant.
