# 🔍 Diagnostic : Conflit Validation Film/Recette et Visibilité

## 📋 Résumé Exécutif

L'implémentation actuelle a une **logique de visibilité partiellement correcte** mais avec des **problèmes critiques** :

✅ **Ce qui fonctionne** :
- Films TMDB auto-approuvés au moment de la création (status = 'approved')
- Logique de filtrage implémentée : les films ne s'affichent que s'ils ont ≥1 recette validée
- Middleware d'authentification et autorisation en place

❌ **Ce qui ne fonctionne pas** :
- **Affiche TMDB non téléchargée** : Breaking Bad créé mais affiche manquante (poster = null)
- **Pas de validation visuelle du statut d'une recette** sur le compte utilisateur
- **Logique de visibilité incomplète** : les films sont filtrés SEULEMENT en frontend (home, movies)
- **Break Bad n'apparaît nulle part** : probablement dû au statut de la recette (pending ≠ approved)

---

## 🔧 Architecture Actuelle

### 1️⃣ Flux Création Film + Recette

```
Utilisateur
    ↓
Recherche TMDB (tmdb-form-prefill.js)
    ↓
Pré-remplissage formulaire
    ↓
/add-recipes-movies/movie-and-recipe (POST)
    ↓
add-recipes-movies.controllers.js:addMovieAndRecipe()
    ↓
[Créer Objet Movie : status = 'approved' si TMDB, sinon 'pending']
    ↓
[Télécharger affiche : downloadTmdbPoster() → picture = URL ou null]
    ↓
[Créer Objet Recipe : status = 'pending' (par défaut)]
    ↓
Base de données
```

### 2️⃣ Statuts Actuellement Supportés

**Movies.status** :
- `pending` : En attente admin (films manuel)
- `approved` : Validé (films TMDB auto-approuvés OU validé par admin)
- `rejected` : Rejeté par admin

**Recipes.status** :
- `pending` : En attente admin
- `approved` : Validé par admin
- `rejected` : Rejeté par admin

### 3️⃣ Visibilité Actuelle

#### Home Controller (home.controllers.js:60-75)
```javascript
// Récupérer les films avec ≥1 recette approuvée
const moviesWithRecipes = await Recipe.findAll({
  where: { status: "approved" },
  group: ["id_movie"]
});
const movieIds = moviesWithRecipes.map(r => r.id_movie);

// Afficher SEULEMENT ces films
const topMovies = await Movie.findAll({
  where: { status: "approved", id: { [Op.in]: movieIds } },
  limit: 4
});
```

**Le problème** : Cette logique existe **uniquement sur la home** !

#### Movies Controller (movies.controllers.js:685-699)
Même logique sur la page movies/

#### Search Advanced (movies.controllers.js:194)
Pas de filtrage par recettes validées !

---

## 🐛 Problème Breaking Bad

### Hypothèse 1 : Affiche non téléchargée
- Film créé avec `status = 'approved'` (TMDB) ✅
- Mais `picture = null` (téléchargement échoué) ❌
- Film visible si recette est approuvée

### Hypothèse 2 : Recette non validée
- Film créé ✅
- Recette créée avec `status = 'pending'` ✅
- Film **INVISIBLE** car recette pas approuvée ❌

**Cause probable** : Recette Breaking Bad en attente validation admin

---

## 📊 Analyse des Contrôleurs

### ✅ add-recipes-movies.controllers.js (Ligne 353)
```javascript
...(parsedTmdbId ? { status: "approved", validated_at: new Date() } : {})
```
→ Films TMDB auto-approuvés ✅

### ❌ tmdb-image-downloader.js (Ligne 79-127)
```javascript
if (!posterPath) {
  console.warn(`⚠️  No poster_path`);
  return null;  // Picture restera null
}
```
→ Si API TMDB ne retourne pas poster_path → picture = null

**Risques identifiés** :
1. TMDB_API_KEY manquante → return null
2. ID invalide → return null
3. Pas de poster_path → return null
4. Erreur réseau → return null
5. Dossier images/movies/originals création → risque permission

---

## 🎯 Problèmes à Résoudre

### 1) Affiche TMDB Manquante
- [ ] Vérifier logs du serveur pour Breaking Bad
- [ ] Vérifier si TMDB a un poster_path pour Breaking Bad
- [ ] Re-télécharger l'affiche si possible

### 2) Affichage Inconsistant
- [ ] Films visibles SEULEMENT si recette approuvée
- [ ] Mais logique implémentée SEULEMENT sur home/movies
- [ ] API search-advanced non filtrée !

### 3) UX Utilisateur Confuse
- [ ] Utilisateur ne comprend pas pourquoi film disparaît
- [ ] Message "en attente de validation" manquant sur compte utilisateur
- [ ] Film TMDB auto-approuvé ne montre pas son statut

### 4) Pas de Distinction de Statut TMDB
- [ ] `approved` = TMDB auto-approuvé OU admin-approuvé
- [ ] Impossible de distinguer visuellement !
- [ ] Solution : ajouter `validated_tmdb` boolean OU garder status + check tmdb_id

---

## 📝 Recommandations

### ✅ Ce qui Fonctionne (Garder)
1. Auto-approbation films TMDB au moment création
2. Logique filtrage recettes approuvées (home/movies)
3. Modèle de données actuellement cohérent

### 🔧 À Implémenter

**Priorité 1** (Critique) :
- [ ] Filtrer API search-advanced par recettes validées
- [ ] Garantir cohérence visibilité partout

**Priorité 2** (Important) :
- [ ] Ajouter logging détaillé pour debugging affiche TMDB
- [ ] Implémenter fallback : s'il pas d'affiche → affiche de couleur par genre
- [ ] Vérifier statut recette aux côtés du film (UX utilisateur)

**Priorité 3** (Nice-to-have) :
- [ ] Ajouter `picture` fallback automatique par genre
- [ ] Système de re-téléchargement affiche si null
- [ ] Dashboard admin pour recettes Breaking Bad

---

## 🚀 Plan d'Action

### Phase 1 : Diagnostic Avancé
```sql
SELECT id, title, tmdb_id, status, picture
FROM movies
WHERE title LIKE '%breaking%' OR tmdb_id = (SELECT tmdb_id FROM movies WHERE title LIKE '%breaking%' LIMIT 1);

SELECT r.id, r.name, r.status, r.id_movie
FROM recipes r
WHERE r.id_movie IN (SELECT id FROM movies WHERE title LIKE '%breaking%');
```

### Phase 2 : Correction du Téléchargement Affiche
- Implémenter retry automatique
- Ajouter logging détaillé
- Fallback image par genre

### Phase 3 : Unifier la Logique de Visibilité
- Créer helper `isMoviePublic(movie, recipes)`
- Utiliser PARTOUT (home, movies, search, api)
- Ajouter tests

### Phase 4 : UX Utilisateur
- Afficher statut recette sur compte utilisateur
- Message clair si film invisible (recette pending)
- Indication visuelle film TMDB auto-approuvé

---

## 📌 Statut Actuel

| Composant | Statut | Notes |
|-----------|--------|-------|
| Auto-approbation TMDB | ✅ Fonctionnelle | Ligne 353 add-recipes-movies.controllers.js |
| Téléchargement affiche | ⚠️ Échoue parfois | Breaking Bad en attente debug |
| Visibilité home | ✅ Correcte | Filtre par recettes approuvées |
| Visibilité movies | ✅ Correcte | Filtre par recettes approuvées |
| Visibilité search-advanced | ❌ Incomplète | Pas de filtrage ! |
| UX utilisateur | ❌ Confuse | Pas de message statut recette |

