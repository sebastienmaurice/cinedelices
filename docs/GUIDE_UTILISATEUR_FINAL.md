# Guide Utilisateur Final - Architecture Images Ciné Délices

## 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des Modules](#structure-des-modules)
3. [Utilisation des Modules](#utilisation-des-modules)
4. [Journalisation](#journalisation)
5. [Recherche Avancée](#recherche-avancée)
6. [Activation Future](#activation-future)

---

## 🎯 Vue d'Ensemble

Cette architecture permet de gérer de manière centralisée et automatisée toutes les opérations liées aux images (Movies & Recipes) dans Ciné Délices.

### Fonctionnalités Actives

- ✅ Organisation automatique dans les dossiers (`cards`, `banners`)
- ✅ Barre de recherche avancée sur la page Movies
- ✅ Journalisation complète de toutes les opérations
- ✅ Architecture modulaire (aucune duplication)

### Fonctionnalités Préparées (Non Activées)

- ⏳ Pipeline de traitement d'images (crop/resize/optimize)
- ⏳ Renommage intelligent avec slugs
- ⏳ Nettoyage automatique des fichiers orphelins
- ⏳ Recherche IA

---

## 📁 Structure des Modules

### Modules Utilitaires (`app/utils/`)

```
image-utils.js       → Fonctions utilitaires (slug, random, dossiers)
image-pipeline.js    → Pipeline de traitement (non activé)
upload-config.js     → Configuration centralisée Multer
logger.js            → Système de journalisation
cleanup.js           → Nettoyage automatique (non activé)
```

### Middlewares (`app/middlewares/`)

```
upload-movie.middleware.js  → Upload images films
upload.middleware.js        → Upload images recettes
```

### Controllers (`app/controllers/`)

```
admin.controllers.js              → Validation films (avec journalisation)
add-recipes-movies.controllers.js → Ajout recettes (avec journalisation)
movies.controllers.js             → Recherche films (API)
```

---

## 🔧 Utilisation des Modules

### 1. Générer un Slug

```javascript
import { slugifier } from "./utils/image-utils.js";

const slug = slugifier("Harry Potter"); // "harry-potter"
```

### 2. Générer un Nombre Aléatoire

```javascript
import { generateRandom } from "./utils/image-utils.js";

const random = generateRandom(); // 17645830421209820
```

### 3. Déterminer un Dossier

```javascript
import { determineImageFolder, IMAGE_TYPES } from "./utils/image-utils.js";

const folder = determineImageFolder(IMAGE_TYPES.MOVIE_CARD);
// Retourne: "/path/to/app/public/images/movies/cards"
```

### 4. Configuration Multer

```javascript
import {
  createImageFilter,
  MULTER_COMMON_CONFIG,
} from "./utils/upload-config.js";

const upload = multer({
  storage: storage,
  fileFilter: createImageFilter(),
  ...MULTER_COMMON_CONFIG,
});
```

### 5. Journaliser une Opération

```javascript
import { logUpload, logUploadError, LOG_LEVELS } from "./utils/logger.js";

// Upload réussi
await logUpload({
  type: "movie-card",
  filename: "movie-harry-123.jpg",
  originalName: "harry.jpg",
  destination: "/path/to/cards",
  size: 102400,
  mimetype: "image/jpeg",
  entityId: 1,
});

// Erreur
await logUploadError(error, {
  type: "movie-card",
  entityId: 1,
});
```

---

## 📝 Journalisation

### Fichier de Log

**Chemin :** `logs/image-uploads.log`

**Format :**

```
[2025-12-01T10:30:45.123Z] [SUCCESS] Upload d'image réussi | Data: {...}
```

### Rotation Automatique

- **Taille max :** 10 MB
- **Archivage :** 5 fichiers maximum
- **Format archivé :** `image-uploads-{timestamp}.log`

### Consultation des Logs

```bash
# Voir les derniers logs
tail -f logs/image-uploads.log

# Rechercher dans les logs
grep "ERROR" logs/image-uploads.log
```

---

## 🔍 Recherche Avancée

### Utilisation

1. Aller sur la page `/movies`
2. Taper dans le champ de recherche
3. Les résultats s'affichent automatiquement dans le dropdown
4. Cliquer sur un résultat pour voir la fiche film

### Fonctionnalités

- ✅ Recherche par titre
- ✅ Recherche par année
- ✅ Recherche par genre
- ✅ Debounce de 300ms
- ✅ Autocomplétion
- ✅ Bouton "Créer une fiche film" si aucun résultat

### API Backend

**Route :** `GET /movies/api/search?query=...`

**Réponse :**

```json
{
  "success": true,
  "movies": [...],
  "hasResults": true,
  "query": "harry"
}
```

---

## 🚀 Activation Future

### 1. Activer le Pipeline

**Étape 1 :** Modifier les controllers pour utiliser `processImage()`

**Exemple :**

```javascript
import { processImage, IMAGE_TYPES } from "../utils/image-pipeline.js";

if (req.file) {
  const result = await processImage({
    imagePath: req.file.path,
    imageType: IMAGE_TYPES.MOVIE_CARD,
    entityId: movieId,
    entityType: "movie",
  });
  updateData.picture = result.relativePath;
}
```

**Étape 2 :** Installer Sharp (si traitement activé)

```bash
npm install sharp
```

**Étape 3 :** Activer les traitements

```javascript
enableResize: true,
enableOptimize: true,
```

### 2. Activer le Nettoyage

**Dans `cleanup.js` :**

```javascript
const CLEANUP_ENABLED = true; // ⚠️ Activer avec précaution
```

**Utilisation :**

```javascript
import { cleanupOrphanImages } from "./utils/cleanup.js";

const result = await cleanupOrphanImages({
  dryRun: false, // Mode réel
});
```

### 3. Activer la Recherche IA

**Dans `movie-search.js` :**

- Retirer `disabled` du bouton IA
- Implémenter la fonctionnalité IA

---

## 📊 Statistiques

### Modules Créés

- **Utilitaires :** 5 modules
- **Middlewares :** 2 (mis à jour)
- **Controllers :** 3 (modifiés)
- **Routes :** 1 (modifiée)
- **Frontend :** 2 fichiers (JS + CSS)
- **Documentation :** 11+ documents

### Lignes de Code

- **Code source :** ~2000 lignes
- **Documentation :** ~3000 lignes

---

## ⚠️ Points d'Attention

### Nettoyage

- **Non activé par défaut** → `CLEANUP_ENABLED = false`
- Tester toujours en mode `dryRun: true` avant activation

### Pipeline

- **Non activé dans les controllers** → Utilise encore `req.file` directement
- Nécessite l'ID de l'entité avant traitement

### Traitements

- **Sharp non installé** → Traitements non fonctionnels
- **face-api.js non installé** → Crop intelligent non fonctionnel

---

## 🆘 Support

### Documentation Disponible

- `app/utils/README.md` → Documentation des utilitaires
- `app/utils/PIPELINE_README.md` → Documentation du pipeline
- `app/utils/CENTRALISATION.md` → Guide de centralisation
- `docs/BILAN_GLOBAL_PHASES_1-7.md` → Bilan global

### Logs

- Consulter `logs/image-uploads.log` pour le suivi des opérations
- Les erreurs sont journalisées avec stack trace complète

---

**Dernière mise à jour :** 2025-12-01
