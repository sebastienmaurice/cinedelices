# Pré-remplissage du formulaire `/add-recipes-movies/` depuis TMDB

## 📋 Objectif

Lorsqu'un utilisateur clique sur une suggestion de film dans la page `/movies` (recherche avancée), il est redirigé vers `/add-recipes-movies/?tmdb_id=XXX`. La page doit automatiquement récupérer les informations complètes du film depuis TMDB et pré-remplir tous les champs du formulaire.

---

## ✅ Fonctionnalités Implémentées

### 1. **Backend - Endpoint TMDB**

**Fichier :** `app/controllers/movies.controllers.js`

**Endpoint :** `GET /movies/get-tmdb-info/:tmdb_id`

**Fonctionnalités :**

- ✅ Récupère les informations complètes d'un film depuis l'API TMDB
- ✅ Mappe les genres TMDB vers les genres locaux
- ✅ Retourne toutes les informations nécessaires : titre FR/EN, année, genre, note, synopsis, poster, etc.

**Réponse JSON :**

```json
{
  "success": true,
  "movie": {
    "tmdb_id": 105,
    "title_fr": "Retour vers le futur",
    "title_en": "Back to the Future",
    "year": 1985,
    "genre": "science-fiction",
    "genres": ["science-fiction", "aventure", "comédie"],
    "note": "8.3",
    "overview": "Synopsis complet...",
    "poster": "https://image.tmdb.org/t/p/w500/...",
    "backdrop": "https://image.tmdb.org/t/p/original/...",
    "release_date": "1985-07-03",
    "runtime": 116
  }
}
```

### 2. **Route Backend**

**Fichier :** `app/routes/movies.route.js`

**Route ajoutée :**

```javascript
moviesRouter.get("/get-tmdb-info/:tmdb_id", moviesController.getTmdbInfo);
```

⚠️ **Important :** Cette route doit être définie **AVANT** la route `/:genre` pour éviter les conflits d'URL.

### 3. **Script Frontend**

**Fichier :** `app/public/js/tmdb-form-prefill.js`

**Fonctionnalités :**

- ✅ Détecte le paramètre `tmdb_id` dans l'URL (query string)
- ✅ Optionnel : pré-remplit le titre si le paramètre `title` est présent (feedback immédiat)
- ✅ Appelle l'endpoint backend pour récupérer les informations complètes
- ✅ Pré-remplit tous les champs du formulaire :
  - Champs visibles : `#film-name`, `#film-year`, `#film-genre`
  - Champs cachés : `#tmdbId-hidden`, `#titleFR-hidden`, `#tmdbYear-hidden`, `#tmdbGenre-hidden`
  - Champs standards : `#film-title-hidden`, `#film-year-hidden`, `#film-genre-hidden`
- ✅ Met à jour la colonne de gauche (`film-info-box`) :
  - Titre du film
  - Genre
  - Année
  - Affiche (poster)
- ✅ Affiche un indicateur de chargement pendant la récupération
- ✅ Gère les erreurs (film non trouvé, erreur API, etc.)
- ✅ Déclenche un événement personnalisé `tmdbFormPrefilled` pour notifier les autres scripts

### 4. **Intégration dans la Vue**

**Fichier :** `app/views/add-recipes-movies.ejs`

**Script ajouté :**

```html
<!-- pré-remplissage formulaire depuis TMDB -->
<script src="/js/tmdb-form-prefill.js" defer></script>
```

---

## 🔄 Flux Utilisateur

1. **Utilisateur sur `/movies`**

   - Tape "Retour vers" dans la recherche
   - Voit la suggestion "Retour vers le futur" (via TMDB)
   - Clique sur la suggestion

2. **Redirection vers `/add-recipes-movies/`**

   - URL : `/add-recipes-movies/?tmdb_id=105&title=Retour vers le futur`
   - Le script `tmdb-form-prefill.js` détecte le `tmdb_id`

3. **Pré-remplissage automatique**

   - Le script pré-remplit immédiatement le titre (si fourni dans l'URL)
   - Appelle l'endpoint `/movies/get-tmdb-info/105`
   - Reçoit toutes les informations du film
   - Pré-remplit tous les champs du formulaire
   - Met à jour la colonne de gauche avec l'affiche et les infos

4. **Utilisateur peut modifier**
   - Tous les champs restent **modifiables**
   - L'utilisateur peut corriger ou compléter les informations
   - Validation et soumission comme d'habitude

---

## 📝 Champs Pré-remplis

### Formulaire de Film (Section 1)

- ✅ **Nom du film** (`#film-name`) → `movie.title_fr`
- ✅ **Année** (`#film-year`) → `movie.year`
- ✅ **Genre** (`#film-genre`) → `movie.genre` (sélectionné dans le select)

### Colonne de Gauche (Section 2)

- ✅ **Affiche** (`.film-selected-image img`) → `movie.poster`
- ✅ **Titre affiché** (`#display-film-name`) → `movie.title_fr`
- ✅ **Genre affiché** (`#display-film-genre`) → `movie.genre`
- ✅ **Année affichée** (`#display-film-year`) → `movie.year`

### Champs Cachés (Formulaire Unifié)

- ✅ `#tmdbId-hidden` → `movie.tmdb_id`
- ✅ `#titleFR-hidden` → `movie.title_fr`
- ✅ `#tmdbYear-hidden` → `movie.year`
- ✅ `#tmdbGenre-hidden` → `movie.genre`
- ✅ `#film-title-hidden` → `movie.title_fr`
- ✅ `#film-year-hidden` → `movie.year`
- ✅ `#film-genre-hidden` → `movie.genre`

---

## 🛠️ Gestion des Erreurs

Le script gère plusieurs cas d'erreur :

1. **Film non trouvé sur TMDB**

   - Message d'erreur dans la console
   - Formulaire reste vide et modifiable

2. **Erreur API TMDB**

   - Message d'erreur dans la console
   - Formulaire reste utilisable (saisie manuelle possible)

3. **Pas de `tmdb_id` dans l'URL**
   - Le script ne fait rien
   - Comportement normal du formulaire vide

---

## 🔌 Événements Personnalisés

Le script déclenche un événement personnalisé après le pré-remplissage réussi :

```javascript
document.addEventListener("tmdbFormPrefilled", (event) => {
  const movie = event.detail.movie;
  console.log("Film pré-rempli:", movie);
  // Autres scripts peuvent écouter cet événement
});
```

---

## 📦 Dépendances

### Backend

- `TMDB_API_KEY` : Clé API TMDB (dans `.env`)
- `TMDB_API_URL` : URL de l'API TMDB (par défaut : `https://api.themoviedb.org/3`)

### Frontend

- Aucune dépendance externe
- Compatible avec les scripts existants :
  - `movie-autocomplete-form.js`
  - `tmdb-validator.js`
  - `unified-form-handler.js`
  - `film-preview-handler.js`

---

## ✅ Tests

### Test Manuel

1. Aller sur `/movies`
2. Rechercher "Retour vers"
3. Cliquer sur "Retour vers le futur" (suggestion TMDB)
4. Vérifier que :
   - ✅ L'URL contient `?tmdb_id=105`
   - ✅ Le formulaire est pré-rempli avec les infos du film
   - ✅ L'affiche s'affiche dans la colonne de gauche
   - ✅ Tous les champs sont modifiables
   - ✅ La soumission fonctionne normalement

### Test avec Film Non Existant

1. Accéder directement à `/add-recipes-movies/?tmdb_id=999999`
2. Vérifier que :
   - ✅ Un message d'erreur apparaît (console)
   - ✅ Le formulaire reste vide
   - ✅ L'utilisateur peut saisir manuellement

---

## 📚 Fichiers Modifiés/Créés

### Créés

- ✅ `app/public/js/tmdb-form-prefill.js` - Script de pré-remplissage

### Modifiés

- ✅ `app/controllers/movies.controllers.js` - Fonction `getTmdbInfo()` ajoutée
- ✅ `app/routes/movies.route.js` - Route `/get-tmdb-info/:tmdb_id` ajoutée
- ✅ `app/views/add-recipes-movies.ejs` - Script intégré

---

## 🎯 Prochaines Améliorations Possibles

- [ ] Afficher un message de succès visuel à l'utilisateur
- [ ] Ajouter un spinner de chargement plus visible
- [ ] Pré-remplir aussi le synopsis dans un champ optionnel
- [ ] Gérer le cas où le film existe déjà dans la BDD locale
- [ ] Pré-remplir automatiquement si le film existe déjà (utiliser `tmdb_id` pour chercher)

---

**Date** : Décembre 2025  
**Status** : ✅ **Implémenté et fonctionnel**
