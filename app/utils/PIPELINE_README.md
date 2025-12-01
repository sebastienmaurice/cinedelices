# Pipeline de Traitement d'Images - PHASE 3

## 📋 Description

Module centralisé pour le traitement des images uploadées dans Ciné Délices. Architecture préparée pour intégration future de **Sharp** et **face-api.js**.

⚠️ **IMPORTANT** : Les traitements réels (crop, resize, optimize) ne sont **PAS encore activés**. Ce module prépare uniquement la structure et le flux de données.

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
  enableCrop: boolean,    // Activer crop intelligent (désactivé)
  enableResize: boolean,  // Activer redimensionnement (désactivé)
  enableOptimize: boolean // Activer optimisation (désactivé)
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

### Exemple 3 : Avec traitement activé (futur)

```javascript
// ⚠️ Nécessite Sharp et face-api.js installés
const result = await processImage({
  imagePath: req.file.path,
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: movieId,
  entityType: "movie",
  enableCrop: true, // Crop intelligent activé
  enableResize: true, // Redimensionnement activé
  enableOptimize: true, // Optimisation activée
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
6. PIPELINE DE TRAITEMENT
   ├─→ Crop intelligent (si activé)
   ├─→ Redimensionnement (si activé)
   └─→ Optimisation (si activée)
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
- **Format** : WebP (meilleure compression)
- **Face detection** : Non activé

---

## 🚧 Étapes Prévues (Non Actives)

### 1. Crop Intelligent (face-api.js)

**Objectif** : Détecter automatiquement les visages et cropper l'image pour les centrer.

**Implémentation future** :

```javascript
// TODO: Dans cropImage()
// 1. Charger le modèle face-api.js
// 2. Détecter les visages dans l'image
// 3. Calculer la zone optimale pour le crop
// 4. Cropper l'image avec Sharp
```

### 2. Redimensionnement (Sharp)

**Objectif** : Redimensionner automatiquement selon les dimensions configurées.

**Implémentation future** :

```javascript
// TODO: Dans resizeImage()
// 1. Charger l'image avec Sharp
// 2. Obtenir les dimensions actuelles
// 3. Calculer les nouvelles dimensions (ratio préservé)
// 4. Redimensionner et sauvegarder
```

### 3. Optimisation (Sharp)

**Objectif** : Compresser et convertir au format optimal.

**Implémentation future** :

```javascript
// TODO: Dans optimizeImage()
// 1. Charger l'image avec Sharp
// 2. Convertir au format souhaité (WebP, JPG, etc.)
// 3. Appliquer la compression
// 4. Optimiser les métadonnées
// 5. Sauvegarder
```

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

## 📦 Dépendances Futures

Pour activer les traitements, installer :

```bash
npm install sharp
npm install face-api.js
```

⚠️ **Note** : Ces dépendances ne sont pas encore installées. Le pipeline fonctionne actuellement en mode "copie" uniquement.

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

1. **Aucun traitement réel** : Pour l'instant, le pipeline copie simplement les fichiers avec un nouveau nom
2. **BDD requise** : Le pipeline a besoin d'accéder à la BDD pour récupérer le nom du film/recette
3. **Gestion d'erreurs** : Toutes les erreurs sont propagées, à gérer dans les controllers
4. **Fichiers temporaires** : Les fichiers uploadés par Multer peuvent être supprimés après traitement

---

## 🎯 Prochaines Étapes

1. ✅ Architecture préparée (PHASE 3)
2. ⏳ Intégration dans les middlewares (PHASE 2 - suite)
3. ⏳ Installation de Sharp et face-api.js
4. ⏳ Activation des traitements réels
5. ⏳ Tests et validation
