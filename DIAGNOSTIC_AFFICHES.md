# 🔍 DIAGNOSTIC : Problème des Affiches Manquantes

## Flux Complet Analysé

### ✅ 1. **Création d'un Film (Post /add-recipes-movies/movie-and-recipe)**

**Étape 1** : Film créé via TMDB
- `downloadTmdbPoster(tmdb_id, type, title)` → `/images/movies/originals/{slug}.jpg`
- Le chemin est stocké dans `Movie.picture`
- ✅ Film auto-approuvé si TMDB_ID (ligne 365-366)

```javascript
movie = await Movie.create({
  ...
  picture: picturePath,  // ← AFFICHE STOCKÉE 🖼️
  ...(parsedTmdbId ? { status: "approved", validated_at: new Date() } : {}),
});
```

---

### ⚠️ 2. **Validation Admin (POST /admin/validateMovie/:id)**

**Étape 2** : Admin approuve le film
- ❌ **PROBLÈME POTENTIEL** : La fonction `validateMovie` ne réinitialise que `status` et `validated_at`
- ✅ Le champ `picture` n'est PAS modifié durant la validation
- ✅ L'affiche devrait être conservée

```javascript
async validateMovie(req, res) {
  const updateData = { status: "approved", validated_at: new Date() };
  await Movie.update(updateData, { where: { id: movieId } });
  // ✅ picture n'est pas touché — devrait être OK
}
```

---

### ✅ 3. **Affichage sur /movies/ (GET /movies)**

**Étape 3** : Page `/movies/` charge et affiche les films

```javascript
// movies.controllers.js (ligne 805)
const enrichedMovies = enrichMoviesWithImagePaths(moviesWithCounts);

// Puis en vue (ligne 204)
src="<%= movie.cardPath || movie.picture %>"
```

**Processus d'enrichissement** :

1. `enrichMovieWithImagePaths(movie)` vérifie si `movie.picture` existe
2. Génère `cardPath` = `/images/movies/cards/card-{slug}.jpg`
3. **FALLBACK** : Si `cardPath` n'existe pas sur disque → utilise `originalPath` (le `/images/movies/originals/{slug}.jpg`)
4. Résultat final : `cardPath` = `movie.picture` (valeur par défaut/fallback)

---

## 🎯 Problèmes Identifiés

### **PROBLÈME 1 : Affichage filtré mais data manquante en BDD**

Si films créés NON via TMDB (manuellement par admin), pas de `picture` stockée !

**Solution** : Vérifier si les films manuels ont bien une affiche uploadée

---

### **PROBLÈME 2 : Films "pending" ne sont pas affichés sur /movies/**

```javascript
// movies.controllers.js (ligne 706-708)
where: {
  status: "approved",  // ← FILTRE CRITIQUE
  id: { [Op.in]: movieIdsWithApprovedRecipes },
},
```

✅ C'est normal — seuls les films approuvés s'affichent

---

### **PROBLÈME 3 : Affiches TMDB ne téléchargées qu'à la création**

Quand un film est créé :
- ✅ TMDB_ID → télécharge l'affiche
- ❌ Film MANUEL → pas d'affiche (sauf uploadée)

Quand admin approuve :
- ❌ L'admin N'UPLOAD pas une nouvelle affiche
- ❌ L'affiche n'est pas régénérée depuis TMDB

---

## 🔧 Points de Vérification à Faire

### 1. **Vérifier qu'une affiche est bien stockée en BDD**
```sql
SELECT id, title, picture, status
FROM movies
WHERE status = 'approved'
LIMIT 10;
```

### 2. **Vérifier que le fichier existe sur disque**
```bash
ls -la /images/movies/originals/
```

### 3. **Vérifier le chemin généré par l'enrichissement**
Ajouter un log dans `enrichMovieWithImagePaths()` pour voir:
- Chemin original stocké
- Chemin card généré
- Si le fichier existe

### 4. **Vérifier la page admin**
- Lors de l'approbation, l'affiche est-elle visible ?
- Cela indique si le problème vient du contrôleur admin ou de `/movies/`

---

## 📋 Checklist Recommandée

- [ ] Vérifier les films approuvés manquent-ils d'affiche en BDD ?
- [ ] Les affiches TMDB sont-elles bien téléchargées ?
- [ ] Le contrôleur admin modifie-t-il accidentellement le champ `picture` ?
- [ ] Les films ne sont-ils pas supprimés lors de la validation ?

