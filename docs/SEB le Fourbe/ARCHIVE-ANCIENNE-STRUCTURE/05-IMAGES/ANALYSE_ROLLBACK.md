# Analyse Git - Rollback vers Pipeline Simple

**Date :** 2025-12-18  
**Objectif :** Revenir à un pipeline d'images simple et stable

---

## 📋 ANALYSE DE L'HISTORIQUE GIT

### Commit Stable Identifié

**Commit** : `2e5a1c3` - "Sauvegarde avant intégration Sharp pour traitement automatique des images"

**Date** : Avant l'intégration de Sharp et face-api.js

---

## ✅ ÉTAT AU COMMIT STABLE (2e5a1c3)

### 1. Dépendances (package.json)

**Dépendances présentes** :

- ✅ `multer@^2.0.2` - Upload de fichiers
- ✅ `express@^5.1.0` - Framework web
- ✅ `sequelize@^6.37.7` - ORM
- ❌ **PAS de Sharp**
- ❌ **PAS de face-api.js**
- ❌ **PAS de @tensorflow/tfjs-node**
- ❌ **PAS de canvas**

**Total** : 10 dépendances (vs 15 actuellement)

### 2. Fichiers Utilitaires

**Fichiers présents** :

- ✅ `app/middlewares/upload.middleware.js` - Upload recettes (simple)
- ✅ `app/middlewares/upload-movie.middleware.js` - Upload films (simple)

**Fichiers ABSENTS** (ajoutés après) :

- ❌ `app/utils/image-pipeline.js` - Pipeline complexe
- ❌ `app/utils/image-utils.js` - Utilitaires images
- ❌ `app/utils/upload-config.js` - Config centralisée
- ❌ `app/utils/logger.js` - Logger images
- ❌ `app/utils/test-*.js` - Scripts de test

### 3. Controllers - État Simple

#### `admin.controllers.js` - validateMovie()

**Version simple (2e5a1c3)** :

```javascript
async validateMovie(req, res) {
  try {
    const movieId = parseInt(req.params.id);
    const updateData = { status: true };

    if (req.file) {
      // Construire le chemin relatif de l'image pour la BDD
      updateData.picture = `/images/movies/${req.file.filename}`;
    }

    await Movie.update(updateData, { where: { id: movieId } });
    res.redirect("/admin?success=movie_validated");
  } catch (error) {
    console.error("Erreur lors de la validation du film:", error);
    res.status(500).send("Erreur lors de la validation du film");
  }
}
```

**Caractéristiques** :

- ✅ Simple et direct
- ✅ Pas de traitement d'image
- ✅ Stockage direct du chemin Multer
- ✅ Pas de dépendances externes

#### `add-recipes-movies.controllers.js` - addRecipe()

**Version simple (2e5a1c3)** :

```javascript
async addRecipe(req, res) {
  try {
    const { name, description, category, ingredients, preparation, time, difficulty, id_movie } = req.body;

    const newRecipe = await Recipe.create({
      name,
      description,
      category,
      ingredients,
      preparation,
      time,
      difficulty,
      id_movie,
      picture: req.file ? `/images/recipes/${req.file.filename}` : null,
    });

    res.status(201).render("add-recipes-movies", {
      newRecipe,
      role: req.userRole,
      successMessage: "✅ Ta recette est envoyée...",
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { ... });
  }
}
```

**Caractéristiques** :

- ✅ Simple et direct
- ✅ Pas de traitement d'image
- ✅ Stockage direct du chemin Multer
- ✅ Pas de dépendances externes

### 4. Middlewares Upload

**Version simple (2e5a1c3)** :

#### `upload.middleware.js`

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/images/recipes");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, "recipe-" + nameWithoutExt + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter, // JPG, JPEG, PNG, WEBP
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
```

**Caractéristiques** :

- ✅ Configuration simple et directe
- ✅ Pas de dépendances externes
- ✅ Validation MIME type basique
- ✅ Nommage simple avec timestamp

---

## 📊 COMPARAISON AVANT/APRÈS

| Aspect             | Commit Stable (2e5a1c3) | État Actuel                                  |
| ------------------ | ----------------------- | -------------------------------------------- |
| **Dépendances**    | 10 packages             | 15 packages (+Sharp, face-api, canvas, tfjs) |
| **Fichiers utils** | 0 fichier image         | 6+ fichiers image                            |
| **Complexité**     | Simple (Multer direct)  | Complexe (Pipeline + AI)                     |
| **Traitement**     | Aucun                   | Crop + Resize + Optimize + Face detection    |
| **Stabilité**      | ✅ Stable               | ⚠️ Erreurs CPU possibles                     |
| **Lisibilité**     | ✅ Très lisible         | ⚠️ Code complexe                             |

---

## 🎯 RECOMMANDATION : ROLLBACK

### Pourquoi un rollback est préférable

1. ✅ **Commit stable identifié** : `2e5a1c3` fonctionnait correctement
2. ✅ **Code simple** : Facile à comprendre et maintenir
3. ✅ **Pas de dépendances lourdes** : Pas de problèmes CPU
4. ✅ **Comportement prévisible** : Pas de traitement magique
5. ✅ **Moins de fichiers** : Codebase plus propre

### Ce qui sera restauré

1. ✅ **Controllers simples** : Stockage direct du chemin Multer
2. ✅ **Middlewares simples** : Configuration Multer basique
3. ✅ **Pas de pipeline** : Pas de traitement automatique
4. ✅ **Package.json propre** : Retrait des dépendances inutiles

### Ce qui sera supprimé

1. ❌ `app/utils/image-pipeline.js` (996 lignes)
2. ❌ `app/utils/image-utils.js`
3. ❌ `app/utils/upload-config.js`
4. ❌ `app/utils/logger.js` (si uniquement pour images)
5. ❌ `app/utils/test-*.js` (scripts de test)
6. ❌ Dépendances : sharp, face-api.js, @tensorflow/tfjs-node, canvas

---

## ⚠️ POINTS D'ATTENTION

### Fichiers à conserver (si existaient avant)

- ✅ `app/middlewares/upload.middleware.js` (restaurer version simple)
- ✅ `app/middlewares/upload-movie.middleware.js` (restaurer version simple)
- ✅ Autres fichiers utils non liés aux images

### Modifications à préserver (si importantes)

- ✅ Améliorations des controllers non liées aux images
- ✅ Améliorations des vues
- ✅ Corrections de bugs non liées aux images

---

## 🔧 PLAN D'ACTION

### Option 1 : Rollback Complet (RECOMMANDÉ)

```bash
# 1. Sauvegarder l'état actuel
git stash

# 2. Revenir au commit stable
git checkout 2e5a1c3 -- app/controllers/admin.controllers.js
git checkout 2e5a1c3 -- app/controllers/add-recipes-movies.controllers.js
git checkout 2e5a1c3 -- app/middlewares/upload.middleware.js
git checkout 2e5a1c3 -- app/middlewares/upload-movie.middleware.js

# 3. Supprimer les fichiers ajoutés
rm app/utils/image-pipeline.js
rm app/utils/image-utils.js
rm app/utils/upload-config.js
# etc.

# 4. Nettoyer package.json (retirer Sharp, face-api, etc.)
```

### Option 2 : Nettoyage Manuel (si rollback impossible)

1. Supprimer les imports de `processImage` dans les controllers
2. Restaurer la logique simple de stockage direct
3. Supprimer les fichiers utils images
4. Nettoyer package.json

---

## ✅ VALIDATION POST-ROLLBACK

### À vérifier

1. ✅ Upload de recette fonctionne
2. ✅ Upload de film (admin) fonctionne
3. ✅ Images affichées correctement
4. ✅ Pas d'erreurs au démarrage
5. ✅ Code simple et lisible

---

**Fin de l'analyse**
