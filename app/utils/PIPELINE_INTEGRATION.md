# Guide d'Intégration du Pipeline - PHASE 7

## ⚠️ IMPORTANT

Ce guide montre **comment intégrer le pipeline**, mais le pipeline n'est **PAS encore activé** dans les controllers. Les traitements (crop, resize, optimize) sont **préparés mais non activés**.

---

## 📋 Préparation pour Activation

### État Actuel

1. ✅ Middlewares utilisent les modules centralisés
2. ✅ Journalisation active dans les controllers
3. ✅ Pipeline prêt mais **non utilisé** dans les controllers
4. ⏳ Les controllers utilisent encore directement `req.file`

### Prochaine Étape (après validation)

Remplacer l'utilisation directe de `req.file` par le pipeline `processImage()`.

---

## 🔄 Exemple d'Intégration Future

### Dans `admin.controllers.js` - validateMovie()

**Actuel (sans pipeline) :**

```javascript
if (req.file) {
  updateData.picture = `/images/movies/cards/${req.file.filename}`;
}
```

**Futur (avec pipeline - NON ACTIVÉ) :**

```javascript
import { processImage, IMAGE_TYPES } from "../utils/image-pipeline.js";

if (req.file) {
  try {
    // Utiliser le pipeline pour traitement et renommage
    const result = await processImage({
      imagePath: req.file.path, // Chemin temporaire de Multer
      imageType: IMAGE_TYPES.MOVIE_CARD,
      entityId: movieId,
      entityType: "movie",
      // Les traitements sont désactivés par défaut
      enableCrop: false,
      enableResize: false,
      enableOptimize: false,
    });

    updateData.picture = result.relativePath;

    // Optionnel : Supprimer le fichier temporaire
    // await fs.unlink(req.file.path);
  } catch (error) {
    await logUploadError(error, { context: "validateMovie" });
    throw error;
  }
}
```

---

## 🔧 Activation Progressive

### Phase 1 : Renommage Intelligent (sans traitement)

```javascript
// Le pipeline renomme avec slug + random
const result = await processImage({
  imagePath: req.file.path,
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: movieId,
  entityType: "movie",
  // Pas de traitement, juste renommage
});
```

### Phase 2 : Avec Traitements (après installation Sharp)

```javascript
// Traitements activés (nécessite Sharp installé)
const result = await processImage({
  imagePath: req.file.path,
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: movieId,
  entityType: "movie",
  enableResize: true, // ✅ Activé
  enableOptimize: true, // ✅ Activé
  enableCrop: false, // Pas encore (nécessite face-api.js)
});
```

### Phase 3 : Crop Intelligent (après installation face-api.js)

```javascript
// Tous les traitements activés
const result = await processImage({
  imagePath: req.file.path,
  imageType: IMAGE_TYPES.MOVIE_CARD,
  entityId: movieId,
  entityType: "movie",
  enableCrop: true, // ✅ Activé
  enableResize: true, // ✅ Activé
  enableOptimize: true, // ✅ Activé
});
```

---

## 📝 Notes Importantes

1. **Le pipeline nécessite l'ID du film/recette** → Doit être créé/récupéré avant
2. **Le pipeline renomme automatiquement** → Nom basé sur slug + random
3. **Le pipeline journalise automatiquement** → Pas besoin de logger manuellement
4. **Les traitements sont optionnels** → Peuvent être activés progressivement

---

## ✅ Avantages du Pipeline

1. **Renommage intelligent** → Slug automatique depuis le nom
2. **Organisation** → Fichiers dans les bons dossiers
3. **Journalisation** → Automatique pour toutes les opérations
4. **Extensibilité** → Facile d'ajouter des traitements
5. **Cohérence** → Même logique pour tous les types d'images

---

## 🚧 Statut Actuel

- ✅ Pipeline créé et testé
- ✅ Journalisation intégrée dans le pipeline
- ✅ Utilitaires centralisés
- ⏳ **Intégration dans controllers : EN ATTENTE DE VALIDATION**

---

**Le pipeline est prêt, mais reste NON ACTIVÉ dans les controllers comme demandé.**
