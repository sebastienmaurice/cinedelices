# 📐 Analyse : Ratio 16:9 vs 21:9 pour Ciné Délices

**Date :** 27 novembre 2025  
**Objectif :** Déterminer le ratio optimal pour les images de Ciné Délices

---

## 📊 Analyse des ratios actuels

### Images existantes analysées

| Image                             | Dimensions  | Ratio calculé | Proche de       |
| --------------------------------- | ----------- | ------------- | --------------- |
| `image-contact-cinema.jpg`        | 1536 × 672  | 2.28          | **21:9 (2.33)** |
| `image-home-marty-doc.png`        | 1536 × 672  | 2.28          | **21:9 (2.33)** |
| `image-banner-movies.jpg`         | 2405 × 800  | 3.00          | Très large      |
| `image-default-movie.jpg`         | 1920 × 840  | 2.28          | **21:9 (2.33)** |
| `hero-slider-01-harry-potter.jpg` | 1920 × 1097 | 1.75          | **16:9 (1.77)** |
| `hero-slider-04-home-alone.jpg`   | 1920 × 1097 | 1.75          | **16:9 (1.77)** |
| `image-default-recipe.jpg`        | 686 × 300   | 2.28          | **21:9 (2.33)** |

**Observation :** La majorité des images existantes sont proches du **21:9** (ratio 2.28-2.33).

---

## 🎬 Comparaison des ratios

### 16:9 (1.777...)

**Caractéristiques :**

- ✅ Format standard vidéo (TV, YouTube, streaming)
- ✅ Compatible avec tous les écrans
- ✅ Bon équilibre largeur/hauteur
- ✅ Utilisé actuellement dans le CSS (`aspect-ratio: 16/9`)

**Avantages :**

- ✅ **Universel** : Fonctionne bien partout
- ✅ **Responsive** : S'adapte facilement aux mobiles
- ✅ **Standard web** : Format attendu par les utilisateurs
- ✅ **Moins de perte** : Moins de recadrage nécessaire

**Inconvénients :**

- ❌ Moins "cinématographique" que 21:9
- ❌ Peut couper des éléments importants sur images larges

---

### 21:9 (2.333...)

**Caractéristiques :**

- ✅ Format cinéma ultra-large (Cinemascope)
- ✅ Aspect très cinématographique
- ✅ Parfait pour les affiches de films
- ✅ Plus immersif visuellement

**Avantages :**

- ✅ **Thématique** : S'adapte parfaitement au thème "Ciné Délices"
- ✅ **Impact visuel** : Plus spectaculaire et immersif
- ✅ **Affiches films** : Format standard des affiches de cinéma
- ✅ **Déjà utilisé** : Beaucoup d'images existantes sont en 21:9

**Inconvénients :**

- ❌ **Mobile** : Peut être trop large sur petits écrans
- ❌ **Perte verticale** : Plus de contenu coupé en haut/bas
- ❌ **Compatibilité** : Moins standard pour le web

---

## 🎯 Analyse du CSS actuel

### Utilisation de `aspect-ratio: 16/9`

**Fichiers concernés :**

- `app/public/css/home.css` (lignes 914, 952)
- `app/public/css/movies.css` (ligne 549)

**Contexte :**

```css
/* Mobile - Tablette */
.recipe-image-placeholder,
.recette-image {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9; /* ← Utilisé ici */
}

/* Films - Mobile */
.film-card-image {
  height: auto;
  aspect-ratio: 16/9; /* ← Utilisé ici */
}
```

**Hauteurs fixes utilisées :**

- Desktop : `220px`, `260px`, `280px`, `360px`, `400px`
- Mobile : `200px`, `220px`, `260px`

**Observation :** Le CSS utilise principalement des **hauteurs fixes** plutôt que des ratios, sauf en responsive mobile où `aspect-ratio: 16/9` est utilisé.

---

## 💡 Recommandation

### Pour Ciné Délices : **16:9 est optimal**

**Raisons :**

1. ✅ **CSS déjà configuré** : Le code utilise `aspect-ratio: 16/9` en responsive
2. ✅ **Compatible mobile** : Fonctionne mieux sur petits écrans
3. ✅ **Standard web** : Format attendu et optimisé pour le web
4. ✅ **Moins de perte** : Moins de contenu coupé lors du recadrage
5. ✅ **Flexibilité** : S'adapte mieux aux différents contextes d'affichage

### Quand utiliser 21:9 ?

**21:9 peut être utilisé pour :**

- 🎬 **Affiches de films spécifiques** : Si vous voulez un aspect très cinématographique
- 🎬 **Hero banners** : Pour un impact visuel maximal
- 🎬 **Images de fond** : Pour un effet immersif

**Mais attention :**

- ⚠️ Nécessite un CSS adapté
- ⚠️ Peut poser problème sur mobile
- ⚠️ Plus de contenu perdu lors du recadrage

---

## 🔧 Configuration actuelle du pipeline

### Ratio utilisé actuellement : **16:9**

**Fichier :** `app/services/image-processing.service.js` (ligne 43)

```javascript
const targetRatio = 16 / 9; // ≈ 1.777
```

**Comportement :**

- Si `cropCoords` fourni (Vision API) → utilise ces coordonnées
- Si `null` → recadre au centre avec ratio **16:9**

---

## 📋 Tableau comparatif

| Critère               | 16:9           | 21:9                    |
| --------------------- | -------------- | ----------------------- |
| **Ratio**             | 1.777          | 2.333                   |
| **Format**            | Standard vidéo | Cinéma ultra-large      |
| **CSS actuel**        | ✅ Utilisé     | ❌ Non utilisé          |
| **Mobile**            | ✅ Excellent   | ⚠️ Peut être trop large |
| **Desktop**           | ✅ Excellent   | ✅ Excellent            |
| **Thématique**        | ✅ Bon         | ✅✅ Excellent (cinéma) |
| **Perte de contenu**  | ✅ Minimale    | ❌ Plus importante      |
| **Compatibilité web** | ✅✅ Standard  | ⚠️ Moins standard       |
| **Impact visuel**     | ✅ Bon         | ✅✅ Spectaculaire      |

---

## ✅ Conclusion et recommandation finale

### **Recommandation : Garder 16:9**

**Pourquoi :**

1. ✅ Le CSS est déjà configuré pour 16:9
2. ✅ Meilleure compatibilité mobile
3. ✅ Standard web (meilleure performance)
4. ✅ Moins de perte de contenu
5. ✅ Fonctionne bien pour tous les usages

### **Alternative : 21:9 pour les affiches de films uniquement**

Si vous voulez un aspect plus cinématographique pour les **affiches de films** spécifiquement :

**Option 1 : Modifier le ratio pour les films**

```javascript
// Dans image-processing.service.js
const targetRatio = type === "movie" ? 21 / 9 : 16 / 9;
```

**Option 2 : Garder 16:9 partout (recommandé)**

- Plus simple à maintenir
- Compatible avec tout
- Le CSS gère déjà bien le 16:9

---

## 🎬 Exemples visuels

### 16:9 (1920 × 1080)

```
┌─────────────────────────────────────┐
│                                     │
│         Image 16:9                 │
│                                     │
└─────────────────────────────────────┘
```

### 21:9 (2560 × 1080)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              Image 21:9                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Sur mobile (375px de large) :**

- **16:9** : 375 × 211px (hauteur raisonnable)
- **21:9** : 375 × 161px (trop bas, perte de détails)

---

## 📝 Recommandation finale

**✅ Utiliser 16:9 pour toutes les images de Ciné Délices**

**Avantages :**

- Compatible avec le CSS existant
- Optimal pour mobile et desktop
- Standard web
- Moins de perte de contenu
- Facile à maintenir

**Le pipeline actuel est bien configuré avec 16:9 !** 🎉
