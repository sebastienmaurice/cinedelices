# Pipeline de Traitement d'Images - ACTUEL

## 📋 Description

Module centralisé pour le traitement des images uploadées dans Ciné Délices. Architecture complète avec **Sharp** activé pour crop, resize et optimize.

✅ **IMPORTANT** : Les traitements réels (crop, resize, optimize) sont **ACTIVÉS** et fonctionnels. Le pipeline utilise Sharp pour le traitement automatique des images.

---

## 🎯 Objectif

Le pipeline permet de :

1. Récupérer automatiquement le nom du film/recette depuis la BDD
2. Générer un nom de fichier intelligent (slug + random)
3. Préparer les étapes de traitement (crop, resize, optimize)
4. Sauvegarder dans le bon dossier selon le type d'image

---

## 🏗️ Architecture

### Entrées du Pipeline

```javascript
{
  imagePath: string,      // Chemin absolu de l'image uploadée
  imageType: string,      // Type : "movie-card", "movie-banner", "recipe-card"
  entityId: number,       // ID du film ou de la recette
  entityType: string,     // "movie" ou "recipe"
  enableCrop: boolean,    // Activer crop intelligent (activé par défaut)
  enableResize: boolean,  // Activer redimensionnement (activé par défaut)
  enableOptimize: boolean // Activer optimisation (activé par défaut)
}
```

### Sortie du Pipeline

```javascript
{
  success: boolean,
  originalPath: string,   // Chemin original
  finalPath: string,      // Chemin final (absolu)
  relativePath: string,   // Chemin relatif pour la BDD
  filename: string,       // Nom du fichier généré
  slug: string,           // Slug généré
  random: number          // Nombre aléatoire généré
}
```

---

## 📝 Exemples d'Utilisation

### Exemple 1 : Traitement d'une image de film (sans traitement)

```javascript
import { processImage, IMAGE_TYPES } from "./utils/image-pipeline.js";

// Après un upload Multer, dans un controller
const result = await processImage({
  imagePath: req.file.path, // Chemin généré par Multer
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: movieId, // ID du film depuis req.params.id
  entityType: "movie",
  // Par défaut, tous les traitements sont désactivés
});

// Résultat :
// {
//   success: true,
//   originalPath: "/path/to/upload/temp.jpg",
//   finalPath: "/path/to/app/public/images/movies/cards/movie-card-harry-potter-17645830421209820.jpg",
//   relativePath: "/images/movies/cards/movie-card-harry-potter-17645830421209820.jpg",
//   filename: "movie-card-harry-potter-17645830421209820.jpg",
//   slug: "harry-potter",
//   random: 17645830421209820
// }

// Sauvegarder dans la BDD
await Movie.update(
  { picture: result.relativePath },
  { where: { id: movieId } }
);
```

### Exemple 2 : Traitement d'une image de recette

```javascript
import { processImage, IMAGE_TYPES } from "./utils/image-pipeline.js";

const result = await processImage({
  imagePath: req.file.path,
  imageType: IMAGE_TYPES.RECIPE_CARD,
  entityId: recipeId,
  entityType: "recipe",
});

await Recipe.update(
  { picture: result.relativePath },
  { where: { id: recipeId } }
);
```

### Exemple 3 : Avec traitement activé (actuel)

```javascript
// ✅ Sharp est installé et activé
const result = await processImage({
  imagePath: req.file.path,
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: movieId,
  entityType: "movie",
  enableCrop: true, // ✅ Crop intelligent activé (centré)
  enableResize: true, // ✅ Redimensionnement activé
  enableOptimize: true, // ✅ Optimisation activée
});
```

---

## 🔄 Flux du Pipeline

```
1. VALIDATION
   ↓
2. RÉCUPÉRATION NOM ENTITÉ (BDD)
   ↓
3. GÉNÉRATION SLUG + RANDOM
   ↓
4. DÉTERMINATION DOSSIER DESTINATION
   ↓
5. GÉNÉRATION NOUVEAU NOM DE FICHIER
   ↓
6. PIPELINE DE TRAITEMENT (✅ ACTIVÉ)
   ├─→ Crop intelligent (centré, ratio préservé)
   ├─→ Redimensionnement (maxWidth/maxHeight)
   └─→ Optimisation (compression, conversion format)
   ↓
7. COPIE/SAUVEGARDE FICHIER FINAL
   ↓
8. RETOUR CHEMIN RELATIF POUR BDD
```

---

## ⚙️ Configuration par Type d'Image

### Movie Card

- **Dimensions max** : 640x960px
- **Qualité** : 85%
- **Format** : JPG
- **Face detection** : Non activé

### Movie Banner

- **Dimensions max** : 1920x600px
- **Qualité** : 90%
- **Format** : JPG
- **Face detection** : Non activé

### Recipe Card

- **Dimensions max** : 640x360px
- **Qualité** : 85%
- **Format** : WebP (toujours, même en dev - à corriger)
- **Face detection** : Non activé (face-api.js non implémenté)

---

## ✅ Étapes Actives (Implémentées)

### 1. Crop Intelligent (Sharp) ✅

**Objectif** : Cropper l'image en préservant le ratio cible, centré automatiquement.

**Implémentation actuelle** :

```javascript
// ✅ Implémenté dans cropImage()
// 1. Charger l'image avec Sharp
// 2. Calculer les dimensions de crop (ratio préservé)
// 3. Centrer le crop horizontalement ou verticalement
// 4. Extraire la zone avec Sharp
```

**Note** : Détection de visages (face-api.js) non implémentée. Le crop est centré automatiquement.

### 2. Redimensionnement (Sharp) ✅

**Objectif** : Redimensionner automatiquement selon les dimensions configurées.

**Implémentation actuelle** :

```javascript
// ✅ Implémenté dans resizeImage()
// 1. Charger l'image avec Sharp
// 2. Obtenir les dimensions actuelles
// 3. Calculer les nouvelles dimensions (ratio préservé)
// 4. Redimensionner avec algorithme Lanczos3 (qualité élevée)
// 5. Sauvegarder
```

### 3. Optimisation (Sharp) ✅

**Objectif** : Compresser et convertir au format optimal.

**Implémentation actuelle** :

```javascript
// ✅ Implémenté dans optimizeImage()
// 1. Charger l'image avec Sharp
// 2. Convertir au format souhaité (WebP, JPG, etc.)
// 3. Appliquer la compression (qualité configurable)
// 4. Optimiser les métadonnées (suppression EXIF sauf orientation)
// 5. Sauvegarder
```

## 🚧 Améliorations Futures (Optionnelles)

### 1. Détection de Visages (face-api.js)

**Objectif** : Détecter automatiquement les visages et centrer le crop sur eux.

**Implémentation future** :

```javascript
// TODO: Intégrer face-api.js dans cropImage()
// 1. Installer: npm install face-api.js @tensorflow/tfjs-node
// 2. Charger les modèles face-api.js
// 3. Détecter les visages dans l'image
// 4. Calculer la zone optimale centrée sur les visages
// 5. Cropper l'image avec Sharp
```

**Note** : Non prioritaire, le crop centré fonctionne bien pour la plupart des cas.

---

## 🔌 Intégration avec Multer

### Architecture Actuelle

```
Multer Upload → req.file.path → Pipeline → Nouveau fichier nommé → BDD
```

### Exemple dans un Controller

```javascript
// app/controllers/admin.controllers.js
import { processImage, IMAGE_TYPES } from "../utils/image-pipeline.js";

async validateMovie(req, res) {
  try {
    const movieId = parseInt(req.params.id);
    const updateData = { status: true };

    if (req.file) {
      // Utiliser le pipeline
      const result = await processImage({
        imagePath: req.file.path,
        imageType: IMAGE_TYPES.MOVIE_CARD,
        entityId: movieId,
        entityType: "movie",
      });

      updateData.picture = result.relativePath;

      // Optionnel : Supprimer l'ancien fichier temporaire
      // await fs.unlink(req.file.path);
    }

    await Movie.update(updateData, { where: { id: movieId } });
    res.redirect("/admin?success=movie_validated");
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).send("Erreur lors de la validation");
  }
}
```

---

## 📦 Dépendances

Dépendances installées :

```bash
npm install sharp  # ✅ Installé (v0.33.5)
```

Dépendances optionnelles (non installées) :

```bash
npm install face-api.js @tensorflow/tfjs-node  # ❌ Non installé (optionnel)
```

✅ **Note** : Sharp est installé et activé. Le pipeline traite automatiquement toutes les images.

---

## 🧪 Tests

### Test de base (sans traitement)

```javascript
const result = await processImage({
  imagePath: "/path/to/test.jpg",
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: 1,
  entityType: "movie",
});

console.log(result);
// Doit retourner un objet avec success: true et les chemins
```

---

## 🔍 Logs et Debug

Le pipeline affiche des logs pour chaque étape :

- `📁 Dossier créé: ...` - Création de dossier
- `📋 Fichier copié: ...` - Copie de fichier
- `🚧 [SIMULATION] ...` - Étape non activée

---

## ⚠️ Notes Importantes

1. **Traitement réel activé** : Le pipeline traite automatiquement toutes les images (crop, resize, optimize)
2. **BDD requise** : Le pipeline a besoin d'accéder à la BDD pour récupérer le nom du film/recette
3. **Gestion d'erreurs** : Toutes les erreurs sont propagées, à gérer dans les controllers. Fallback sur image originale en cas d'erreur.
4. **Fichiers temporaires** : Les fichiers temporaires sont automatiquement nettoyés après traitement
5. **Conservation originaux** : Les originaux sont copiés dans `originals/` avant traitement

---

## 🎯 État Actuel

1. ✅ Architecture complète
2. ✅ Intégration dans les controllers
3. ✅ Sharp installé et activé
4. ✅ Traitements réels activés (crop, resize, optimize)
5. ✅ Tests et validation effectués

## 🔧 Améliorations Recommandées

1. ⏳ Générer les banners pour les films (code présent mais non appelé)
2. ⏳ Désactiver WebP en mode dev (garder format original)
3. ⏳ Supprimer les anciennes images lors du remplacement
4. ⏳ Optionnel : Intégrer face-api.js pour détection de visages
