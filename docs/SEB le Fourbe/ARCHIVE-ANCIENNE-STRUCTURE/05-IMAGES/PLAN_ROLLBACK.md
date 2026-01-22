# Plan de Rollback - Pipeline Images Simple

**Date :** 2025-12-18  
**Commit cible** : `2e5a1c3` - "Sauvegarde avant intégration Sharp"  
**Objectif** : Revenir à un pipeline d'images simple et stable

---

## 📋 RÉSUMÉ DE L'ANALYSE

### Commit Stable Identifié

**Commit** : `2e5a1c3`  
**Message** : "Sauvegarde avant intégration Sharp pour traitement automatique des images"

**État à ce commit** :

- ✅ Upload simple avec Multer
- ✅ Pas de traitement d'image
- ✅ Pas de Sharp
- ✅ Pas de face-api.js
- ✅ Code simple et direct
- ✅ Fonctionnel et stable

---

## 🎯 STRATÉGIE : ROLLBACK SÉLECTIF

Au lieu d'un rollback complet (qui pourrait perdre d'autres améliorations), nous allons faire un **rollback sélectif** uniquement sur les fichiers liés aux images.

---

## 📝 FICHIERS À RESTAURER (depuis 2e5a1c3)

### 1. Controllers

- ✅ `app/controllers/admin.controllers.js` - Méthode `validateMovie()`
- ✅ `app/controllers/add-recipes-movies.controllers.js` - Méthodes `addRecipe()` et `addMovieAndRecipe()`

### 2. Middlewares

- ✅ `app/middlewares/upload.middleware.js` - Version simple
- ✅ `app/middlewares/upload-movie.middleware.js` - Version simple

---

## 🗑️ FICHIERS À SUPPRIMER

### Utilitaires Images (ajoutés après 2e5a1c3)

- ❌ `app/utils/image-pipeline.js` (996 lignes)
- ❌ `app/utils/image-utils.js`
- ❌ `app/utils/upload-config.js`
- ❌ `app/utils/logger.js` (si uniquement pour images)
- ❌ `app/utils/test-face-api-init.js`
- ❌ `app/utils/test-face-detection.js`
- ❌ `app/utils/test-crop-with-face.js`
- ❌ `app/utils/fix-movie-picture-paths.js`
- ❌ `app/utils/fix-movie-picture-paths-manual.js`

---

## 📦 DÉPENDANCES À RETIRER

### package.json

**À retirer** :

- ❌ `sharp@^0.33.5`
- ❌ `face-api.js@^0.22.2`
- ❌ `@tensorflow/tfjs-node@^4.22.0`
- ❌ `canvas@^3.2.0`

**À conserver** :

- ✅ `multer@^2.0.2` (nécessaire pour upload)
- ✅ Toutes les autres dépendances

---

## 🔧 ÉTAPES DU ROLLBACK

### Étape 1 : Sauvegarder l'état actuel

```bash
git stash push -m "Sauvegarde avant rollback pipeline images"
```

### Étape 2 : Restaurer les controllers

```bash
git checkout 2e5a1c3 -- app/controllers/admin.controllers.js
git checkout 2e5a1c3 -- app/controllers/add-recipes-movies.controllers.js
```

### Étape 3 : Restaurer les middlewares

```bash
git checkout 2e5a1c3 -- app/middlewares/upload.middleware.js
git checkout 2e5a1c3 -- app/middlewares/upload-movie.middleware.js
```

### Étape 4 : Supprimer les fichiers utils images

```bash
rm app/utils/image-pipeline.js
rm app/utils/image-utils.js
rm app/utils/upload-config.js
rm app/utils/test-face-api-init.js
rm app/utils/test-face-detection.js
rm app/utils/test-crop-with-face.js
rm app/utils/fix-movie-picture-paths.js
rm app/utils/fix-movie-picture-paths-manual.js
```

### Étape 5 : Nettoyer package.json

Retirer les dépendances inutiles :

- sharp
- face-api.js
- @tensorflow/tfjs-node
- canvas

### Étape 6 : Vérifier logger.js

Si `logger.js` est utilisé uniquement pour les images, le supprimer. Sinon, retirer uniquement les fonctions liées aux images.

---

## ✅ RÉSULTAT ATTENDU

### Code Simple

**Avant (actuel)** :

```javascript
// Controller complexe avec pipeline
const imageResult = await processImage({
  imagePath: req.file.path,
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: movieId,
  entityType: "movie",
  enableCrop: true,
  enableResize: true,
  enableOptimize: true,
});
updateData.picture = imageResult.relativePath;
```

**Après (simple)** :

```javascript
// Controller simple
if (req.file) {
  updateData.picture = `/images/movies/${req.file.filename}`;
}
```

### Pipeline Simple

**Avant** : Multer → Pipeline → Sharp → face-api → Crop → Resize → Optimize → BDD  
**Après** : Multer → BDD

### Dépendances

**Avant** : 15 packages  
**Après** : 11 packages (retrait de 4 packages lourds)

---

## ⚠️ POINTS D'ATTENTION

### Fichiers à vérifier avant suppression

1. **logger.js** : Vérifier s'il est utilisé ailleurs que pour les images
2. **Autres fichiers utils** : Vérifier qu'ils ne sont pas utilisés ailleurs

### Modifications à préserver

- ✅ Améliorations des controllers non liées aux images
- ✅ Améliorations des vues
- ✅ Corrections de bugs non liées aux images
- ✅ Nouvelles routes ou fonctionnalités

---

## 🧪 VALIDATION POST-ROLLBACK

### Tests à effectuer

1. ✅ Upload de recette fonctionne
2. ✅ Upload de film (admin) fonctionne
3. ✅ Images affichées correctement
4. ✅ Pas d'erreurs au démarrage
5. ✅ Code simple et lisible

---

**Fin du plan**
