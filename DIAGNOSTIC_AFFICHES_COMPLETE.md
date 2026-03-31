# 🎬 Diagnostic Complet - Affiches de Films et Recettes

## ✅ Résumé du Diagnostic (31 mars 2026)

### 📊 État Global

| Entité | Total | Approuvé | Avec Affiche | Problèmes |
|--------|-------|----------|--------------|-----------|
| Films | 8 | 7 | 7 | 5 chemins cassés |
| Recettes | 8 | 8 | 8 | 0 |
| Photos Recettes | 12 | - | 12 | 0 |

✅ **Recettes et photos** : Tout fonctionne correctement
❌ **Films** : 5/7 films approuvés ont des chemins incorrects

---

## 🔴 Problème Identifié : URLs TMDB au lieu de Chemins Locaux

### Films avec Problèmes (URLs Externes)

| ID | Titre | Chemin en BDD | Problème |
|----|-------|---------------|---------|
| 1 | Harry Potter | `https://image.tmdb.org/t/p/w500/fbxQ44...` | ❌ URL distante |
| 2 | American Pie | `https://image.tmdb.org/t/p/w500/OP7Jh...` | ❌ URL distante |
| 3 | Bienvenue chez les Ch'tis | `https://image.tmdb.org/t/p/w500/dfht1...` | ❌ URL distante |
| 4 | Le silence des agneaux | `https://image.tmdb.org/t/p/w500/sSQDx...` | ❌ URL distante |
| 5 | Indiana Jones - Arche | `https://image.tmdb.org/t/p/w500/nTsll...` | ❌ URL distante |

### Films Corrects (Chemins Locaux)

| ID | Titre | Chemin en BDD | Statut |
|----|-------|---------------|--------|
| 6 | Breaking Bad | `/images/movies/originals/breaking-bad.jpg` | ✅ Local |
| 7 | Ratatouille | `/images/movies/originals/ratatouille.jpg` | ✅ Local |

---

## ⚙️ Flux Attendu vs Réalité

### ✅ Flux Correct (Breaking Bad, Ratatouille)

```
User crée film → POST /add-recipes-movies/movie-and-recipe
    ↓
Code : Line 345-353
    if (parsedTmdbId) {
      picturePath = await downloadTmdbPoster(parsedTmdbId, type, title)
      // Télécharge depuis TMDB et retourne /images/movies/originals/title.jpg
    }
    ↓
Code : Line 363
    picture: picturePath  // = "/images/movies/originals/breaking-bad.jpg"
    ↓
Affiche stockée en BDD ✅
```

### ❌ Flux Actuel (Harry Potter, American Pie, etc.)

```
Films créés à une période antérieure
    ↓
Code ancien ou buggué retournait URL TMDB directe
    picture: "https://image.tmdb.org/t/p/w500/..."
    ↓
Affiche stockée en BDD ❌
```

---

## 🎯 Conséquences

### Sur la Page `/movies/`

```javascript
// Lors du rendu
const movie = { picture: "https://image.tmdb.org/..." }
enrichMovieWithImagePaths(movie)
  ├─ Génère cardPath = "/images/movies/cards/card-harry-potter.jpg"
  ├─ Mais ce fichier n'existe pas!
  └─ Fallback vers originalPath = URL TMDB

// Résultat :
// ✅ L'image charge depuis TMDB (temporaire)
// ❌ Pas de control local
// ❌ Dépendance TMDB
```

---

## 🛠️ Solutions

### Solution 1 : Re-télécharger les Affiches (RECOMMANDÉ)

**Route existante :** `POST /admin/migrate-movie-images`

```
admin.controllers.js : migrateMovieImages()
  ├─ Récupère tous films avec tmdb_id
  ├─ Appelle downloadTmdbPoster() pour chacun
  ├─ Sauvegarde chemin local : /images/movies/originals/{slug}.jpg
  └─ Met à jour BDD
```

**Accès :**
1. Se connecter à l'admin
2. Aller sur le dashboard admin
3. Trouver le bouton "Migrer les affiches TMDB" (ou)
4. Appel direct cURL :
```bash
curl -X POST http://localhost:3000/admin/migrate-movie-images \
  -H "Cookie: session=YOUR_SESSION_ID"
```

**Résultat attendu :**
```json
{
  "success": true,
  "total": 7,
  "updated": [
    { "id": 1, "title": "Harry Potter", "path": "/images/movies/originals/harry-potter.jpg" },
    { "id": 2, "title": "American Pie", "path": "/images/movies/originals/american-pie.jpg" },
    { "id": 3, "title": "Bienvenue chez les Ch'tis", "path": "/images/movies/originals/bienvenue-chez-les-chtis.jpg" },
    { "id": 4, "title": "Le silence des agneaux", "path": "/images/movies/originals/le-silence-des-agneaux.jpg" },
    { "id": 5, "title": "Indiana Jones et les Aventuriers...", "path": "/images/movies/originals/indiana-jones-et-les-aventuriers-de-larche-perdue.jpg" }
  ],
  "failed": [],
  "skipped": []
}
```

### Solution 2 : Corriger Manuellement en SQL (Si CLI ne fonctionne pas)

```sql
-- 1. Vérifier les films à corriger
SELECT id, title, tmdb_id, picture
FROM movies
WHERE picture LIKE 'https://image.tmdb.org%'
  AND status='approved';

-- 2. Pour chaque film, il faudrait :
--    a. Télécharger l'affiche TMDB
--    b. Sauvegarder en app/public/images/movies/originals/{slug}.jpg
--    c. Mettre à jour BDD avec le chemin local
```

---

## 📋 Checklist de Résolution

- [ ] **Accéder à l'admin** - Se connecter en tant qu'admin
- [ ] **Exécuter la migration** - POST /admin/migrate-movie-images
- [ ] **Vérifier le rapport**
  - [ ] "updated" contient 5 films
  - [ ] "failed" est vide
  - [ ] "skipped" est vide
- [ ] **Valider en BDD**
  ```sql
  SELECT id, title, picture FROM movies WHERE status='approved' ORDER BY id;
  ```
  - [ ] Tous les `picture` = `/images/movies/originals/...`
- [ ] **Valider sur disque**
  - [ ] Fichiers existent dans `app/public/images/movies/originals/`
  ```bash
  ls -la app/public/images/movies/originals/
  ```
- [ ] **Tester la page /movies/**
  - [ ] Toutes les affiches s'affichent
  - [ ] Pas d'erreurs 404
  - [ ] Images charge rapidement

---

## 🧪 Avant/Après Fix

### AVANT (État Actuel - ❌)

```
Requête API : GET /movies/api/get/1
Réponse :
{
  "movie": {
    "picture": "https://image.tmdb.org/t/p/w500/fbxQ44VRdM2PVzHSNajUseUteem.jpg",
    "cardPath": "/images/movies/cards/card-harry-potter.jpg",
    "bannerPath": "/images/movies/banners/banner-harry-potter.jpg"
  }
}

Sur la page /movies/ → cardPath/bannerPath n'existent pas
Fallback vers picture (URL TMDB) → L'image charge mais ce n'est pas idéal
```

### APRÈS (État Désiré - ✅)

```
Requête API : GET /movies/api/get/1
Réponse :
{
  "movie": {
    "picture": "/images/movies/originals/harry-potter.jpg",
    "cardPath": "/images/movies/cards/card-harry-potter.jpg",
    "bannerPath": "/images/movies/banners/banner-harry-potter.jpg",
    "originalPath": "/images/movies/originals/harry-potter.jpg"
  }
}

Sur la page /movies/ → Les fichiers avec chemins locaux existent
→ Les affiches s'affichent correctement depuis le serveur local
→ Performance optimale, pas de dépendance externe
```

---

## 📚 Fichiers Impliqués

| Fichier | Rôle | Ligne Important |
|---------|------|-----------------|
| `utils/tmdb-image-downloader.js` | Télécharge les affiches TMDB | L 120 : retourne chemin local |
| `utils/movie-image-helper.js` | Génère les chemins d'images | L 486-489 : enrichissement |
| `controllers/add-recipes-movies.controllers.js` | Crée films/recettes | L 363 : stocker picture |
| `controllers/admin.controllers.js` | Migration affiches | L 239-278 : migrateMovieImages() |
| `controllers/movies.controllers.js` | Affiche page /movies/ | L 805 : enrichir les films |

---

## ✅ Conclusion

### Statut Diagnostic

| Étape | Statut |
|-------|--------|
| **Investigation** | ✅ Complétée |
| **Cause Trouvée** | ✅ URLs TMDB au lieu de chemins locaux |
| **Affectation** | ✅ 5 films sur 7 |
| **Solution** | ✅ Route migration disponible |
| **Documentation** | ✅ Complète |
| **Prochaine Étape** | ⏳ Exécuter `POST /admin/migrate-movie-images` |

### Impact sur Utilisateurs

- ✅ Recettes : Aucun problème détecté
- ✅ Photos recettes : Aucun problème détecté
- ❌ Films : 5 films ont des affiches mal enregistrées

**Action requise :** Exécuter la migration pour corriger les 5 films.
