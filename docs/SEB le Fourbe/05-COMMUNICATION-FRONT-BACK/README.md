# 05 - Communication Front/Back

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Comment ça fonctionne ?](#comment-ça-fonctionne)
3. [Exemples concrets](#exemples-concrets)
4. [Cycle complet d'une action](#cycle-complet-dune-action)
5. [Types de communication](#types-de-communication)

---

## Vue d'ensemble

### Le problème à résoudre

Un site web a **deux parties** qui doivent **communiquer** :

1. **Le front-end** (navigateur) : Ce que l'utilisateur voit et utilise
2. **Le back-end** (serveur) : Ce qui traite les données et accède à la base de données

**Comment font-ils pour communiquer ?**

→ Ils utilisent le **protocole HTTP** (HyperText Transfer Protocol)

### Principe de base

```
[Front-End]  ←→  HTTP  ←→  [Back-End]  ←→  [Base de données]
(Navigateur)              (Serveur)         (PostgreSQL)
```

---

## Comment ça fonctionne ?

### 1. Requête HTTP (Request)

**C'est quoi ?** : Le front-end **demande** quelque chose au back-end.

**Exemple** : "Donne-moi la liste des films"

**Comment ?** : Via une **URL** (adresse web) + une **méthode HTTP** (GET, POST, etc.)

### 2. Réponse HTTP (Response)

**C'est quoi ?** : Le back-end **répond** avec des données.

**Exemple** : "Voici la liste des films : [...]"

**Format** : Généralement en **JSON** (JavaScript Object Notation)

### 3. Méthodes HTTP utilisées

| Méthode | Utilisation | Exemple |
|---------|-------------|---------|
| **GET** | Récupérer des données | Afficher la liste des films |
| **POST** | Envoyer des données | Créer un nouveau film |
| **PUT** | Modifier des données | Modifier un film existant |
| **DELETE** | Supprimer des données | Supprimer un film |

---

## Exemples concrets

### Exemple 1 : Afficher la liste des films

#### Ce que l'utilisateur fait

1. L'utilisateur va sur la page `/movies`
2. Le navigateur charge la page

#### Ce qui se passe en coulisse

**Étape 1 : Requête HTTP**

```javascript
// Le navigateur fait automatiquement une requête GET
GET /movies
```

**Étape 2 : Le serveur traite la requête**

```javascript
// app/routes/movies.route.js
moviesRouter.get("/", moviesController.moviesList);

// app/controllers/movies.controllers.js
async moviesList(req, res) {
  // 1. Récupérer les films depuis la base de données
  const movies = await Movie.findAll({ where: { status: true } });
  
  // 2. Enrichir avec les chemins d'images
  const enrichedMovies = enrichMoviesWithImagePaths(movies);
  
  // 3. Générer la page HTML avec les données
  res.render("movies", { movies: enrichedMovies });
}
```

**Étape 3 : Réponse HTML**

Le serveur envoie une page HTML complète avec les films intégrés.

**Étape 4 : Affichage**

Le navigateur affiche la page avec tous les films.

---

### Exemple 2 : Rechercher un film (AJAX)

#### Ce que l'utilisateur fait

1. L'utilisateur tape "harry" dans la barre de recherche
2. Les résultats s'affichent en temps réel (sans recharger la page)

#### Ce qui se passe en coulisse

**Étape 1 : JavaScript écoute la saisie**

```javascript
// app/public/js/movie-search-advanced.js
searchInput.addEventListener("input", handleSearchInput);

function handleSearchInput(event) {
  const query = event.target.value.trim();
  
  // Debounce : attendre 400ms avant de chercher
  debounceTimer = setTimeout(() => {
    performSearch(query);
  }, 400);
}
```

**Étape 2 : Requête AJAX (fetch)**

```javascript
async function performSearch(query) {
  // Faire une requête HTTP vers le serveur
  const response = await fetch(
    `/movies/search-advanced?query=${encodeURIComponent(query)}`
  );
  
  // Le serveur répond avec du JSON
  const data = await response.json();
  
  // Afficher les résultats dans le dropdown
  displayResults(data.results);
}
```

**Étape 3 : Le serveur traite la requête**

```javascript
// app/controllers/movies.controllers.js
async searchMoviesAdvanced(req, res) {
  const { query } = req.query;
  
  // 1. Vérifier le cache
  const cacheKey = searchCache.generateKey(query);
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }
  
  // 2. Rechercher dans la base de données locale
  const localMovies = await Movie.findAll({ /* ... */ });
  
  // 3. Rechercher sur TMDB (API externe)
  const tmdbResults = await searchTmdb(query);
  
  // 4. Combiner et trier les résultats
  const results = combineAndSort(localMovies, tmdbResults);
  
  // 5. Mettre en cache
  searchCache.set(cacheKey, results);
  
  // 6. Répondre en JSON
  res.json({
    success: true,
    results: results,
    hasResults: results.length > 0
  });
}
```

**Étape 4 : Affichage des résultats**

```javascript
function displayResults(results) {
  // Créer des mini-cartes pour chaque résultat
  results.forEach(movie => {
    const card = createMovieCard(movie);
    searchResults.appendChild(card);
  });
}
```

---

### Exemple 3 : Se connecter (Formulaire)

#### Ce que l'utilisateur fait

1. L'utilisateur remplit le formulaire de connexion
2. L'utilisateur clique sur "Se connecter"

#### Ce qui se passe en coulisse

**Étape 1 : Soumission du formulaire**

```html
<!-- app/views/partials/popup-connexion.ejs -->
<form id="loginForm" action="/auth/login" method="POST">
  <input type="text" name="pseudo" required />
  <input type="password" name="password" required />
  <button type="submit">Se connecter</button>
</form>
```

**Étape 2 : Requête POST**

```javascript
// Le navigateur envoie automatiquement une requête POST
POST /auth/login
Content-Type: application/x-www-form-urlencoded

pseudo=john&password=secret123
```

**Étape 3 : Le serveur traite la connexion**

```javascript
// app/controllers/auth.controller.js
async login(req, res) {
  const { pseudo, password } = req.body;
  
  // 1. Chercher l'utilisateur dans la base de données
  const user = await User.findOne({ where: { pseudo } });
  
  if (!user) {
    return res.status(401).render("error", {
      error: "401",
      message: "Pseudo ou mot de passe invalide"
    });
  }
  
  // 2. Vérifier le mot de passe (haché avec Argon2)
  const ok = await argon2.verify(user.password, password);
  
  if (!ok) {
    return res.status(401).render("error", {
      error: "401",
      message: "Pseudo ou mot de passe invalide"
    });
  }
  
  // 3. Créer un token JWT
  const token = jwt.sign(
    { user_id: user.id, pseudo: user.pseudo, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
  
  // 4. Stocker le token dans un cookie
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 2 // 2 heures
  });
  
  // 5. Rediriger vers la page d'accueil
  res.redirect("/");
}
```

**Étape 4 : Redirection**

L'utilisateur est redirigé vers la page d'accueil, maintenant connecté.

---

## Cycle complet d'une action

### Cas concret : Afficher les recettes d'un film

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UTILISATEUR                                               │
│    Clique sur "Voir les recettes" d'un film                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. NAVIGATEUR (Front-End)                                    │
│    - Détecte le clic                                         │
│    - Charge la page /recipes-movie/123                       │
│    - Fait une requête GET /recipes-movie/123                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVEUR (Back-End)                                        │
│    - Route : recipes-movie.route.js                          │
│    - Contrôleur : recipes-movie.controllers.js               │
│    - Récupère le film et ses recettes depuis la BDD         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. BASE DE DONNÉES (PostgreSQL)                              │
│    - SELECT * FROM movies WHERE id = 123                     │
│    - SELECT * FROM recipes WHERE id_movie = 123              │
│    - Retourne les données                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SERVEUR (Back-End)                                        │
│    - Reçoit les données de la BDD                           │
│    - Génère la page HTML avec EJS                            │
│    - Envoie la page HTML au navigateur                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. NAVIGATEUR (Front-End)                                    │
│    - Reçoit la page HTML                                     │
│    - Charge les CSS et JS                                     │
│    - Affiche la page à l'utilisateur                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Types de communication

### 1. Communication synchrone (Page complète)

**Quand ?** : Chargement d'une page complète

**Comment ?** : Le navigateur charge une nouvelle page

**Exemple** : Aller sur `/movies`

**Avantages** :
- ✅ Simple à comprendre
- ✅ Fonctionne même sans JavaScript

**Inconvénients** :
- ❌ Recharge toute la page
- ❌ Plus lent

### 2. Communication asynchrone (AJAX)

**Quand ?** : Mise à jour partielle de la page

**Comment ?** : JavaScript fait une requête en arrière-plan

**Exemple** : Recherche de films en temps réel

**Avantages** :
- ✅ Plus rapide (pas de rechargement)
- ✅ Expérience utilisateur fluide

**Inconvénients** :
- ❌ Nécessite JavaScript
- ❌ Plus complexe à implémenter

### 3. Communication WebSocket (non utilisé dans ce projet)

**Quand ?** : Communication en temps réel bidirectionnelle

**Exemple** : Chat en temps réel, notifications push

**Note** : Non implémenté dans Ciné Délices

---

## 🎯 Ce que vous avez appris

✅ Comment le front-end et le back-end communiquent  
✅ Les méthodes HTTP (GET, POST, etc.)  
✅ La différence entre requête synchrone et asynchrone  
✅ Le cycle complet d'une action utilisateur  
✅ Comment fonctionnent les requêtes AJAX  

---

## 📖 Prochaines étapes

Maintenant que vous comprenez la communication Front/Back, vous pouvez :

→ **[Découvrir les fonctionnalités clés en détail](./../06-FONCTIONNALITES-CLES/README.md)**

---

**Retour à l'[index principal](./../README.md)**
