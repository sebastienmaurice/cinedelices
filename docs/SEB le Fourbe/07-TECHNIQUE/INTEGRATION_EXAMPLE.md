# Exemples d'Intégration du Pipeline

## 🎯 Comment utiliser le pipeline dans vos controllers

### 1. Dans `admin.controllers.js` - Validation d'un film

```javascript
import { Movie } from "../models/index.model.js";
import { processImage, IMAGE_TYPES } from "../utils/image-pipeline.js";
import fs from "fs/promises";

async validateMovie(req, res) {
  try {
    const movieId = parseInt(req.params.id);
    const updateData = { status: true };

    // Si un fichier a été uploadé
    if (req.file) {
      try {
        // Traiter l'image avec le pipeline
        const result = await processImage({
          imagePath: req.file.path, // Chemin temporaire de Multer
          imageType: IMAGE_TYPES.MOVIE_CARD,
          entityId: movieId,
          entityType: "movie",
          // Par défaut, tous les traitements sont désactivés
          // enableCrop: false,
          // enableResize: false,
          // enableOptimize: false,
        });

        // Mettre à jour le chemin de l'image
        updateData.picture = result.relativePath;

        // Optionnel : Supprimer le fichier temporaire de Multer
        // await fs.unlink(req.file.path);

        console.log("✅ Image traitée:", result);
      } catch (imageError) {
        console.error("Erreur lors du traitement de l'image:", imageError);
        // Optionnel : supprimer le fichier temporaire en cas d'erreur
        // await fs.unlink(req.file.path).catch(() => {});
        throw imageError;
      }
    }

    // Mettre à jour le film dans la BDD
    await Movie.update(updateData, { where: { id: movieId } });

    res.redirect("/admin?success=movie_validated");
  } catch (error) {
    console.error("Erreur lors de la validation du film:", error);
    res.status(500).send("Erreur lors de la validation du film");
  }
}
```

---

### 2. Dans `add-recipes-movies.controllers.js` - Ajout d'une recette

```javascript
import { Recipe } from "../models/index.model.js";
import { processImage, IMAGE_TYPES } from "../utils/image-pipeline.js";

async addRecipe(req, res) {
  try {
    const {
      name,
      description,
      category,
      ingredients,
      preparation,
      time,
      difficulty,
      id_movie,
    } = req.body;

    // Récupération du chemin de l'image (si présente)
    let imagePath = null;

    if (req.file) {
      try {
        // Créer d'abord la recette pour obtenir son ID
        const newRecipe = await Recipe.create({
          name: name,
          description: description,
          category: category,
          ingredients: ingredients,
          preparation: preparation,
          time: time,
          difficulty: difficulty,
          id_movie: id_movie,
          picture: null, // Temporairement null
        });

        // Traiter l'image avec le pipeline (en utilisant l'ID créé)
        const result = await processImage({
          imagePath: req.file.path,
          imageType: IMAGE_TYPES.RECIPE_CARD,
          entityId: newRecipe.id,
          entityType: "recipe",
        });

        // Mettre à jour la recette avec le chemin de l'image
        await Recipe.update(
          { picture: result.relativePath },
          { where: { id: newRecipe.id } }
        );

        imagePath = result.relativePath;
        console.log("✅ Image de recette traitée:", result);
      } catch (imageError) {
        console.error("Erreur lors du traitement de l'image:", imageError);
        throw imageError;
      }
    } else {
      // Pas d'image, créer la recette sans image
      const newRecipe = await Recipe.create({
        name: name,
        description: description,
        category: category,
        ingredients: ingredients,
        preparation: preparation,
        time: time,
        difficulty: difficulty,
        id_movie: id_movie,
        picture: null,
      });
    }

    res.status(201).render("add-recipes-movies", {
      newRecipe: { ...newRecipe, picture: imagePath },
      role: req.userRole,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      error: "500",
      message: "Erreur serveur.",
      role: req.userRole,
    });
  }
}
```

---

### 3. Avec traitement activé (futur - nécessite Sharp)

```javascript
// ⚠️ Nécessite npm install sharp face-api.js
import { processImage, IMAGE_TYPES } from "../utils/image-pipeline.js";

if (req.file) {
  const result = await processImage({
    imagePath: req.file.path,
    imageType: IMAGE_TYPES.MOVIE_CARD,
    entityId: movieId,
    entityType: "movie",
    enableCrop: true, // ✅ Crop intelligent activé
    enableResize: true, // ✅ Redimensionnement activé
    enableOptimize: true, // ✅ Optimisation activée
  });

  updateData.picture = result.relativePath;
}
```

---

## 🔄 Flux complet avec Multer

```
1. Utilisateur upload une image
   ↓
2. Multer sauvegarde temporairement dans un dossier
   → req.file.path = "/tmp/multer-xxx/image.jpg"
   ↓
3. Controller appelle processImage()
   ↓
4. Pipeline :
   - Récupère le nom du film/recette depuis BDD
   - Génère slug + random
   - Détermine le dossier de destination
   - (Étapes de traitement si activées)
   - Copie/renomme le fichier
   ↓
5. Retourne le chemin relatif
   → result.relativePath = "/images/movies/cards/movie-card-harry-potter-123.jpg"
   ↓
6. Controller met à jour la BDD avec ce chemin
   ↓
7. Optionnel : Supprimer le fichier temporaire de Multer
```

---

## ⚠️ Points d'attention

1. **Gestion d'erreurs** : Toujours entourer `processImage()` dans un try/catch
2. **Fichiers temporaires** : Penser à supprimer `req.file.path` après traitement (optionnel)
3. **BDD requise** : Le pipeline doit accéder à la BDD pour récupérer le nom
4. **Ordre des opérations** : Pour les recettes, créer d'abord la recette pour obtenir son ID

---

## 🧪 Test de base

```javascript
// Test minimal
const result = await processImage({
  imagePath: "/path/to/test-image.jpg",
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: 1, // ID d'un film existant dans la BDD
  entityType: "movie",
});

console.log(result);
// {
//   success: true,
//   relativePath: "/images/movies/cards/movie-card-...",
//   ...
// }
```
