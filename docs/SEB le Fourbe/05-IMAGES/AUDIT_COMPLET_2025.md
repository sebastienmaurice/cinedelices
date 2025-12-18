# AUDIT COMPLET DU PIPELINE D'IMAGES - Ciné Délices

**Date :** 2025-01-XX  
**Projet :** Ciné Délices  
**Objectif :** Audit complet du fonctionnement actuel du pipeline d'images

---

## 📋 RÉSUMÉ EXÉCUTIF

Le pipeline d'images est **partiellement implémenté et fonctionnel**. Sharp est activé et opérationnel pour le traitement des images (crop, resize, optimize), mais certaines fonctionnalités documentées ne sont pas implémentées (face-api.js, Google Vision API, génération de banners).

---

## ✅ POINTS CONFORMES

### 1. Multer Upload ✅

- **Recettes** : Upload fonctionnel via `upload.middleware.js`

  - Destination : `app/public/images/recipes/` (puis traitement vers `recipes/cards/`)
  - Validation MIME : JPG, JPEG, PNG, WEBP ✅
  - Limite taille : 5 MB ✅
  - Nommage : `recipe-{nom}-{timestamp}-{random}.{ext}` ✅

- **Films** : Upload fonctionnel via `upload-movie.middleware.js`
  - Destination : `app/public/images/movies/` (puis traitement vers `movies/cards/`)
  - Validation MIME : JPG, JPEG, PNG, WEBP ✅
  - Limite taille : 5 MB ✅
  - Nommage : `movie-{nom}-{timestamp}-{random}.{ext}` ✅

### 2. Sharp - Traitement d'Images ✅ ACTIVÉ

- **Installation** : ✅ Sharp v0.33.5 installé dans `package.json`
- **Pipeline activé** : ✅ `enableCrop`, `enableResize`, `enableOptimize` activés par défaut
- **Fonctionnalités** :
  - ✅ Crop intelligent (centré, ratio correct)
  - ✅ Redimensionnement avec préservation du ratio
  - ✅ Optimisation et compression
  - ✅ Conversion de format (JPG pour films, WebP pour recettes)
  - ✅ Conservation des originaux dans dossiers séparés

### 3. Structure de Dossiers ✅

```
app/public/images/
├── movies/
│   ├── cards/          ✅ Existe et utilisé
│   ├── banners/        ✅ Existe mais non utilisé
│   └── originals/      ⚠️ Créé automatiquement par le pipeline
├── recipes/
│   ├── cards/          ✅ Existe et utilisé
│   └── originals/      ⚠️ Créé automatiquement par le pipeline
└── event/              ✅ Existe (images statiques)
```

### 4. Pipeline de Traitement ✅

- **Fichier** : `app/utils/image-pipeline.js`
- **Fonction principale** : `processImage()`
- **Flux** :
  1. ✅ Récupération nom entité depuis BDD
  2. ✅ Génération slug + random
  3. ✅ Conservation original dans `originals/`
  4. ✅ Crop intelligent (centré, ratio correct)
  5. ✅ Redimensionnement (maxWidth/maxHeight)
  6. ✅ Optimisation (compression, conversion format)
  7. ✅ Nettoyage fichiers temporaires
  8. ✅ Retour chemin relatif pour BDD

### 5. Configuration par Type ✅

- **Movie Card** : 640x960px, JPG, qualité 85% ✅
- **Movie Banner** : 1920x600px, JPG, qualité 90% ✅ (configuré mais non généré)
- **Recipe Card** : 640x360px, WebP, qualité 85% ✅

### 6. Gestion d'Erreurs ✅

- ✅ Logs détaillés via `logger.js`
- ✅ Fallback sur image originale en cas d'erreur
- ✅ Erreurs loggées mais n'empêchent pas l'enregistrement
- ✅ Messages d'erreur clairs

### 7. Validation ✅

- ✅ Validation MIME type (JPG, JPEG, PNG, WEBP)
- ✅ Limite de taille (5 MB)
- ✅ Validation des paramètres du pipeline

---

## ⚠️ POINTS À AMÉLIORER

### 1. Génération de Banners pour Films ⚠️

**Problème** : Le pipeline supporte `MOVIE_BANNER` mais n'est jamais appelé.

**Code actuel** :

```javascript
// app/controllers/admin.controllers.js - validateMovie()
const imageResult = await processImage({
  imageType: IMAGE_TYPES.MOVIE_CARD, // ❌ Seulement CARD
  // ...
});
```

**Impact** : Les banners ne sont jamais générés, seul le dossier existe.

**Solution recommandée** :

```javascript
// Générer à la fois card ET banner
const cardResult = await processImage({
  imageType: IMAGE_TYPES.MOVIE_CARD,
  // ...
});

const bannerResult = await processImage({
  imageType: IMAGE_TYPES.MOVIE_BANNER,
  // ...
});
```

### 2. Conversion WebP en Mode Dev ⚠️

**Problème** : La documentation indique que WebP est désactivé en dev, mais le code convertit toujours les recettes en WebP.

**Code actuel** :

```javascript
// app/utils/image-pipeline.js
[IMAGE_TYPES.RECIPE_CARD]: {
  format: "webp", // ❌ Toujours WebP, même en dev
}
```

**Impact** : Incohérence avec la documentation.

**Solution recommandée** : Ajouter une condition basée sur `NODE_ENV` :

```javascript
format: process.env.NODE_ENV === "production" ? "webp" : "jpg",
```

### 3. Dossiers Originals Non Créés ⚠️

**Problème** : Les dossiers `originals/` n'existent pas encore sur le disque.

**Impact** : Les originaux ne sont pas conservés pour les images déjà uploadées.

**Solution** : Le code crée automatiquement les dossiers lors du prochain upload. Pas d'action immédiate nécessaire, mais vérifier que les permissions sont correctes.

### 4. Nommage des Fichiers ⚠️

**Problème** : Les noms de fichiers peuvent contenir des caractères spéciaux ou espaces.

**Exemple réel** : `movie-Le silence des agneaux-1764145159444-648907832.png`

**Impact** : Risque de problèmes avec certains systèmes de fichiers ou serveurs web.

**Solution** : Le pipeline utilise `slugifier()` pour générer les slugs, mais Multer utilise encore le nom original. Le pipeline devrait être appelé systématiquement.

### 5. Gestion des Anciennes Images ⚠️

**Problème** : Lors du remplacement d'une image, l'ancienne reste sur le disque.

**Impact** : Accumulation de fichiers inutilisés, gaspillage d'espace disque.

**Solution recommandée** : Supprimer l'ancienne image avant d'enregistrer la nouvelle :

```javascript
// Dans validateMovie() ou addRecipe()
if (movie.picture) {
  const oldImagePath = path.join(__dirname, "../public", movie.picture);
  await fs.unlink(oldImagePath).catch(() => {}); // Ignorer si fichier inexistant
}
```

---

## ❌ PROBLÈMES CRITIQUES

### 1. face-api.js Non Implémenté ❌

**Statut** : Mentionné dans la documentation mais **non installé ni implémenté**.

**Code actuel** :

```javascript
enableFaceDetection: false, // ❌ Toujours false
```

**Impact** : Le crop intelligent utilise uniquement un crop centré, pas de détection de visages.

**Solution** :

- Option 1 : Installer et intégrer face-api.js
- Option 2 : Mettre à jour la documentation pour indiquer que seul le crop centré est utilisé

**Recommandation** : Option 2 (crop centré fonctionne bien pour la plupart des cas).

### 2. Google Vision API Non Implémenté ❌

**Statut** : Mentionné dans `RAPPORT_IMPLEMENTATION.md` mais **aucun service créé**.

**Impact** : Pas de validation de contenu, pas de détection de zones d'intérêt via Vision API.

**Fichiers manquants** :

- `app/services/vision-api.service.js` ❌ N'existe pas

**Solution** :

- Option 1 : Implémenter Google Vision API
- Option 2 : Mettre à jour la documentation pour retirer les références à Vision API

**Recommandation** : Option 2 (pas de besoin immédiat, le système fonctionne sans).

### 3. Images de Profil Non Fonctionnelles ❌

**Statut** : Interface présente mais **aucun backend**.

**Fichiers concernés** :

- `app/views/user-profile.ejs` (lignes 81-87) ✅ Interface présente
- `app/routes/user-profile.route.js` ❌ Route vide
- Pas de controller ❌
- Pas de middleware d'upload ❌

**Impact** : Fonctionnalité incomplète.

**Solution** : Implémenter l'upload de profil (optionnel pour l'instant).

### 4. Images Event Non Gérées via Upload ❌

**Statut** : Images statiques, pas d'interface d'upload.

**Impact** : Les images du hero slider doivent être ajoutées manuellement dans le dossier.

**Solution** : Créer une interface admin pour gérer les images event (optionnel).

---

## 📊 COMPARAISON CODE vs DOCUMENTATION

| Fonctionnalité         | Documentation       | Code Réel          | Statut         |
| ---------------------- | ------------------- | ------------------ | -------------- |
| Multer upload          | ✅ Documenté        | ✅ Implémenté      | ✅ Conforme    |
| Sharp crop             | ✅ Documenté        | ✅ Implémenté      | ✅ Conforme    |
| Sharp resize           | ✅ Documenté        | ✅ Implémenté      | ✅ Conforme    |
| Sharp optimize         | ✅ Documenté        | ✅ Implémenté      | ✅ Conforme    |
| Conservation originaux | ✅ Documenté        | ✅ Implémenté      | ✅ Conforme    |
| Génération cards       | ✅ Documenté        | ✅ Implémenté      | ✅ Conforme    |
| Génération banners     | ✅ Documenté        | ❌ Non généré      | ❌ Incohérence |
| face-api.js            | ✅ Documenté        | ❌ Non implémenté  | ❌ Incohérence |
| Google Vision API      | ✅ Documenté        | ❌ Non implémenté  | ❌ Incohérence |
| Conversion WebP dev    | ❌ Désactivé en dev | ✅ Toujours activé | ⚠️ Incohérence |
| Images profil          | ⚠️ Mentionné        | ❌ Non implémenté  | ❌ Incohérence |
| Images event upload    | ⚠️ Mentionné        | ❌ Non implémenté  | ❌ Incohérence |

---

## 🔧 INSTRUCTIONS POUR LE DÉVELOPPEUR

### Corrections Prioritaires

#### 1. Générer les Banners pour les Films

**Fichier** : `app/controllers/admin.controllers.js`

**Modification** :

```javascript
// Ligne ~130
if (req.file) {
  try {
    // Générer la card
    const cardResult = await processImage({
      imagePath: req.file.path,
      imageType: IMAGE_TYPES.MOVIE_CARD,
      entityId: movieId,
      entityType: "movie",
      enableCrop: true,
      enableResize: true,
      enableOptimize: true,
    });

    // Générer le banner
    const bannerResult = await processImage({
      imagePath: req.file.path, // Utiliser le même fichier source
      imageType: IMAGE_TYPES.MOVIE_BANNER,
      entityId: movieId,
      entityType: "movie",
      enableCrop: true,
      enableResize: true,
      enableOptimize: true,
    });

    // Utiliser la card pour la BDD (comme actuellement)
    updateData.picture = cardResult.relativePath;

    // Optionnel : Stocker aussi le banner dans un champ séparé
    // updateData.banner = bannerResult.relativePath;
  } catch (imageError) {
    // ...
  }
}
```

#### 2. Désactiver WebP en Mode Dev

**Fichier** : `app/utils/image-pipeline.js`

**Modification** :

```javascript
// Ligne ~45
[IMAGE_TYPES.RECIPE_CARD]: {
  maxWidth: 640,
  maxHeight: 360,
  quality: 85,
  format: process.env.NODE_ENV === "production" ? "webp" : "jpg",
  enableFaceDetection: false,
},
```

#### 3. Supprimer les Anciennes Images

**Fichier** : `app/controllers/admin.controllers.js`

**Modification** :

```javascript
// Ligne ~115
async validateMovie(req, res) {
  try {
    const movieId = parseInt(req.params.id);
    const movie = await Movie.findByPk(movieId);

    // Supprimer l'ancienne image si elle existe
    if (movie && movie.picture && req.file) {
      const oldImagePath = path.join(
        __dirname,
        "../public",
        movie.picture
      );
      try {
        await fs.unlink(oldImagePath);
        console.log(`🗑️ Ancienne image supprimée: ${oldImagePath}`);
      } catch (err) {
        // Ignorer si fichier inexistant
        console.warn(`⚠️ Impossible de supprimer l'ancienne image: ${err.message}`);
      }
    }

    const updateData = { status: true };
    // ... reste du code
  }
}
```

**Fichier** : `app/controllers/add-recipes-movies.controllers.js`

**Modification similaire** pour `addRecipe()` et `addMovieAndRecipe()`.

### Améliorations Optionnelles

#### 4. Mettre à Jour la Documentation

- Retirer les références à face-api.js (non implémenté)
- Retirer les références à Google Vision API (non implémenté)
- Corriger la section sur la conversion WebP
- Documenter que seul le crop centré est utilisé (pas de détection de visages)

#### 5. Implémenter face-api.js (Optionnel)

Si besoin de détection de visages :

1. Installer : `npm install face-api.js @tensorflow/tfjs-node`
2. Télécharger les modèles face-api.js
3. Modifier `cropImage()` dans `image-pipeline.js` pour utiliser face-api.js
4. Activer `enableFaceDetection: true` dans la config

#### 6. Implémenter Google Vision API (Optionnel)

Si besoin de validation de contenu :

1. Installer : `npm install @google-cloud/vision`
2. Créer `app/services/vision-api.service.js`
3. Ajouter les variables d'environnement
4. Intégrer dans le pipeline avant le traitement Sharp

---

## 📈 STATISTIQUES ACTUELLES

### Fichiers sur Disque

- **Movies** :

  - Cards : 3 fichiers dans `movies/cards/`
  - Originaux : 7 fichiers dans `movies/` (anciens, avant pipeline)
  - Banners : 0 fichier (dossier vide)

- **Recipes** :
  - Cards : 5 fichiers dans `recipes/cards/`
  - Originaux : 8 fichiers dans `recipes/` (anciens, avant pipeline)

### Taille des Images

- Images originales : ~500 KB - 2 MB
- Images traitées : ~50-200 KB (réduction significative grâce à Sharp)

---

## ✅ CONCLUSION

### Points Forts

- ✅ Pipeline Sharp fonctionnel et bien implémenté
- ✅ Crop intelligent (centré) opérationnel
- ✅ Redimensionnement et optimisation efficaces
- ✅ Conservation des originaux
- ✅ Gestion d'erreurs robuste
- ✅ Structure de code propre et modulaire

### Points Faibles

- ❌ Banners non générés (code présent mais non appelé)
- ❌ face-api.js et Google Vision API documentés mais non implémentés
- ⚠️ Conversion WebP toujours activée même en dev
- ⚠️ Pas de nettoyage des anciennes images

### Recommandations

1. **Priorité 1** : Générer les banners pour les films
2. **Priorité 2** : Désactiver WebP en mode dev
3. **Priorité 3** : Supprimer les anciennes images lors du remplacement
4. **Priorité 4** : Mettre à jour la documentation pour refléter l'état réel

Le système est **fonctionnel** mais nécessite quelques corrections pour être **complet et cohérent** avec la documentation.

---

**Fin du rapport d'audit**
