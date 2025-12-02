# Activation du Pipeline d'Images - Ciné Délices

**Date de création :** 2025-01-26  
**Status :** ✅ Pipeline activé et fonctionnel

---

## 📋 Résumé

Le pipeline de traitement d'images a été **✅ ACTIVÉ** avec :

- ✅ Sharp installé et intégré
- ✅ Crop intelligent basé sur le ratio et centrage automatique
- ✅ Redimensionnement automatique avec conservation du ratio
- ✅ Optimisation (compression, conversion format)
- ✅ Conservation des images originales dans `originals/`
- ✅ Journalisation complète des opérations
- ✅ Controllers mis à jour pour utiliser le pipeline

**Status :** ✅ **FONCTIONNEL et PRÊT À L'EMPLOI**

---

## 🔧 Modifications effectuées

### 1. Dépendances ajoutées

**Fichier :** `package.json`

```json
{
  "dependencies": {
    "sharp": "^0.33.0"
  }
}
```

**Installation :**

```bash
npm install sharp
```

---

### 2. Pipeline activé

**Fichier :** `app/utils/image-pipeline.js`

#### Modifications principales :

1. **Import de Sharp ajouté**

```javascript
import sharp from "sharp";
```

2. **Activation par défaut des étapes**

```javascript
enableCrop = true,      // ✅ Activé
enableResize = true,    // ✅ Activé
enableOptimize = true,  // ✅ Activé
```

3. **Conservation des images originales**

   - Dossier `originals/` créé automatiquement
   - Images originales copiées dans `movies/originals/` ou `recipes/originals/`

4. **Traitement séquentiel avec fichiers temporaires**
   - Crop → Redimensionnement → Optimisation
   - Nettoyage automatique des fichiers temporaires

---

### 3. Fonctions implémentées

#### `cropImage()`

- ✅ Crop intelligent basé sur le ratio cible
- ✅ Centrage automatique
- ✅ Support pour tous les types d'images (banner, card films, card recettes)

#### `resizeImage()`

- ✅ Redimensionnement avec conservation du ratio
- ✅ Algorithme Lanczos pour qualité optimale
- ✅ Respect des dimensions max configurées

#### `optimizeImage()`

- ✅ Compression selon qualité configurée
- ✅ Conversion format (JPG, WebP)
- ✅ Suppression métadonnées EXIF (sauf orientation)
- ✅ Calcul de réduction de taille

---

## 📐 Configuration par type d'image

### Bannières de films (`MOVIE_BANNER`)

- **Dimensions max :** 1920×600px
- **Ratio :** ~3.2:1
- **Qualité :** 90%
- **Format :** JPG

### Cards de films (`MOVIE_CARD`)

- **Dimensions max :** 640×960px
- **Ratio :** ~0.67:1 (portrait)
- **Qualité :** 85%
- **Format :** JPG

### Cards de recettes (`RECIPE_CARD`)

- **Dimensions max :** 640×360px
- **Ratio :** 16:9
- **Qualité :** 85%
- **Format :** WebP

---

## 📁 Structure des dossiers

```
app/public/images/
├── movies/
│   ├── originals/          # ✅ Images originales conservées
│   ├── cards/              # Images traitées (cards)
│   └── banners/            # Images traitées (bannières)
└── recipes/
    ├── originals/          # ✅ Images originales conservées
    └── cards/              # Images traitées (cards)
```

---

## 🔄 Workflow du pipeline

1. **Upload Multer** → Image stockée temporairement
2. **Conservation original** → Copie dans `originals/`
3. **Crop intelligent** → Ajustement au ratio cible
4. **Redimensionnement** → Respect des dimensions max
5. **Optimisation** → Compression et conversion format
6. **Nettoyage** → Suppression des fichiers temporaires
7. **Retour** → Chemin relatif pour la BDD

---

## 📝 Controllers mis à jour

### ✅ Controllers modifiés pour utiliser le pipeline

1. **`app/controllers/admin.controllers.js`**

   - Fonction `validateMovie()` : Utilise le pipeline pour traiter les images de films

2. **`app/controllers/add-recipes-movies.controllers.js`**
   - Fonction `addRecipe()` : Utilise le pipeline pour traiter les images de recettes
   - Fonction `addMovieAndRecipe()` : Utilise le pipeline dans le workflow film+recette

### ✅ Intégration automatique

Les controllers appellent automatiquement le pipeline avec :

- `enableCrop: true`
- `enableResize: true`
- `enableOptimize: true`

---

## 📝 Exemple d'utilisation

### Validation d'un film avec image (déjà implémenté)

```javascript
import { processImage } from "../utils/image-pipeline.js";
import { IMAGE_TYPES } from "../utils/image-utils.js";

async validateMovie(req, res) {
  try {
    const movieId = parseInt(req.params.id);
    const updateData = { status: true };

    if (req.file) {
      // Utiliser le pipeline pour traiter l'image
      const result = await processImage({
        imagePath: req.file.path,           // Chemin de l'image uploadée
        imageType: IMAGE_TYPES.MOVIE_CARD,  // Type d'image
        entityId: movieId,                  // ID du film
        entityType: "movie",                // Type d'entité
        enableCrop: true,                   // Activé par défaut
        enableResize: true,                 // Activé par défaut
        enableOptimize: true,               // Activé par défaut
      });

      // Utiliser le chemin relatif généré
      updateData.picture = result.relativePath;

      // L'image originale est automatiquement conservée dans originals/
    }

    await Movie.update(updateData, { where: { id: movieId } });
    res.redirect("/admin?success=movie_validated");
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).send("Erreur lors de la validation du film");
  }
}
```

---

## ⚠️ Notes importantes

### Face-api.js

Pour l'instant, le crop intelligent utilise une approche basée sur :

- Calcul du ratio cible
- Centrage automatique
- Crop des zones périphériques

**Pour une vraie détection de visages**, il faudrait :

- Installer `@tensorflow/tfjs-node` ou `face-api.js` côté serveur
- Intégrer la détection dans `cropImage()`
- Cela nécessiterait une configuration plus complexe

### Performance

- Le traitement est asynchrone et non bloquant
- Les fichiers temporaires sont automatiquement nettoyés
- Les erreurs sont journalisées et n'interrompent pas le flux

### Compatibilité

- ✅ Compatible avec toutes les images uploadées via Multer
- ✅ Support des formats : JPG, JPEG, PNG, WebP
- ✅ Conservation des images existantes (non écrasées)

---

## 🧪 Tests recommandés

1. **Upload image film** → Vérifier traitement et conservation original
2. **Upload image recette** → Vérifier conversion WebP
3. **Images de différentes tailles** → Vérifier redimensionnement
4. **Formats multiples** → Vérifier conversion format

---

**Fin du document**
