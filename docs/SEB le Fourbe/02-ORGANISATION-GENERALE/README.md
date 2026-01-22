# 02 - Organisation Générale du Projet

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Arborescence du projet](#arborescence-du-projet)
3. [Séparation Front/Back](#séparation-frontback)
4. [Rôle de chaque dossier](#rôle-de-chaque-dossier)
5. [Architecture MVC](#architecture-mvc)
6. [Bonnes pratiques appliquées](#bonnes-pratiques-appliquées)

---

## Vue d'ensemble

### Structure générale

Un projet web est organisé en **dossiers** qui ont chacun un **rôle précis**. Cette organisation permet de :

- ✅ **Trouver rapidement** le code dont on a besoin
- ✅ **Comprendre** comment le projet est structuré
- ✅ **Maintenir** le code facilement
- ✅ **Travailler en équipe** sans se marcher dessus

### Principe de base

> **"Chaque chose à sa place, et chaque place a sa chose"**

Cela signifie que :
- Le code HTML va dans un dossier
- Le code CSS va dans un autre
- Le code JavaScript va ailleurs
- Le code serveur (back-end) est séparé du code client (front-end)

---

## Arborescence du projet

### Structure complète

```
dwwm-cinedelices/
│
├── 📄 index.js                    # Point d'entrée de l'application
├── 📄 package.json                # Dépendances et scripts npm
├── 📄 .env                        # Variables d'environnement (non versionné)
│
├── 📁 app/                        # Code de l'application
│   ├── 📁 controllers/            # Logique métier (contrôleurs)
│   ├── 📁 models/                # Modèles de données (base de données)
│   ├── 📁 routes/                # Définition des routes (URLs)
│   ├── 📁 middlewares/           # Middlewares (fonctions intermédiaires)
│   ├── 📁 views/                 # Templates EJS (pages HTML)
│   ├── 📁 public/                # Fichiers statiques (CSS, JS, images)
│   ├── 📁 utils/                 # Utilitaires (fonctions réutilisables)
│   ├── 📁 validators/            # Validateurs de données
│   └── 📁 data/                  # Scripts SQL (création BDD, migrations)
│
├── 📁 docs/                       # Documentation
└── 📁 node_modules/              # Dépendances npm (généré automatiquement)
```

### Explication simple

- **`index.js`** : C'est le fichier qui démarre le serveur. C'est le "moteur" de l'application.
- **`package.json`** : Liste toutes les bibliothèques utilisées (comme une liste de courses).
- **`.env`** : Contient les informations sensibles (mots de passe, clés API) qui ne doivent pas être partagées.
- **`app/`** : Tout le code de l'application est ici.

---

## Séparation Front/Back

### Qu'est-ce que le Front-End ?

Le **front-end** (ou **client**) c'est ce que l'utilisateur **voit et utilise** dans son navigateur :

- Les pages HTML
- Les styles CSS
- Le JavaScript qui rend la page interactive
- Les images, polices, etc.

**Où se trouve le front-end dans le projet ?**

```
app/
├── views/          # Templates HTML (EJS)
└── public/         # CSS, JS, images (fichiers statiques)
    ├── css/
    ├── js/
    └── images/
```

### Qu'est-ce que le Back-End ?

Le **back-end** (ou **serveur**) c'est ce qui **fonctionne sur le serveur** et que l'utilisateur ne voit pas :

- La logique métier (comment les données sont traitées)
- L'accès à la base de données
- L'authentification
- Les appels API

**Où se trouve le back-end dans le projet ?**

```
app/
├── controllers/    # Logique métier
├── models/         # Accès à la base de données
├── routes/         # Définition des URLs
├── middlewares/    # Fonctions intermédiaires
└── utils/          # Fonctions utilitaires
```

### Pourquoi séparer ?

**Avantages de la séparation** :

1. **Clarté** : On sait où chercher le code
2. **Maintenance** : Plus facile de modifier une partie sans casser l'autre
3. **Équipe** : Plusieurs développeurs peuvent travailler en parallèle
4. **Sécurité** : Le code sensible (back-end) n'est pas accessible au client

---

## Rôle de chaque dossier

### 📁 `app/controllers/`

**Rôle** : Contient la **logique métier** de l'application.

**Exemple concret** :
- Quand un utilisateur cherche un film, le contrôleur `movies.controllers.js` :
  1. Récupère la recherche
  2. Interroge la base de données
  3. Formate les résultats
  4. Envoie la réponse

**Fichiers** :
- `movies.controllers.js` → Gestion des films
- `recipes-movie.controllers.js` → Gestion des recettes
- `auth.controller.js` → Authentification (connexion/inscription)
- `admin.controllers.js` → Administration
- `home.controllers.js` → Page d'accueil

### 📁 `app/models/`

**Rôle** : Définit la **structure des données** et permet d'accéder à la base de données.

**Exemple concret** :
- Le modèle `Movie` représente un film dans la base de données
- Il permet de créer, lire, modifier, supprimer des films

**Fichiers** :
- `movie.model.js` → Modèle pour les films
- `recipe.model.js` → Modèle pour les recettes
- `user.model.js` → Modèle pour les utilisateurs
- `notice.model.js` → Modèle pour les avis

### 📁 `app/routes/`

**Rôle** : Définit les **URLs** (adresses web) et les associe aux contrôleurs.

**Exemple concret** :
- `/movies` → Affiche la liste des films
- `/movies/search-advanced` → Recherche avancée
- `/auth/login` → Page de connexion

**Fichiers** :
- `movies.route.js` → Routes pour les films
- `recipes-movie.route.js` → Routes pour les recettes
- `auth.route.js` → Routes d'authentification
- `index.route.js` → Route principale (aiguille vers les autres)

### 📁 `app/middlewares/`

**Rôle** : Fonctions qui s'exécutent **avant** les contrôleurs.

**Exemple concret** :
- `is-authed.middleware.js` → Vérifie si l'utilisateur est connecté
- `is-admin.middleware.js` → Vérifie si l'utilisateur est admin
- `upload.middleware.js` → Gère l'upload de fichiers

**Pourquoi ?** : Pour éviter de répéter le même code dans chaque contrôleur.

### 📁 `app/views/`

**Rôle** : Contient les **templates HTML** (fichiers `.ejs`).

**Exemple concret** :
- `home.ejs` → Page d'accueil
- `movies.ejs` → Page de liste des films
- `recipes-movie.ejs` → Page de détail d'un film avec ses recettes

**Note** : Les fichiers `.ejs` permettent d'injecter des données dynamiques dans le HTML.

### 📁 `app/public/`

**Rôle** : Fichiers **statiques** servis directement au navigateur.

**Sous-dossiers** :
- `css/` → Styles CSS
- `js/` → JavaScript côté client
- `images/` → Images (films, recettes, etc.)

**Important** : Ces fichiers sont accessibles directement via l'URL (ex: `/css/home.css`).

### 📁 `app/utils/`

**Rôle** : Fonctions **réutilisables** dans tout le projet.

**Exemple concret** :
- `search-utils.js` → Fonctions de recherche (fuzzy search, scoring)
- `error-handler.js` → Gestion des erreurs
- `movie-image-helper.js` → Aide à la gestion des images de films

**Pourquoi ?** : Pour éviter de dupliquer le code.

### 📁 `app/validators/`

**Rôle** : Valide les **données** avant de les utiliser.

**Exemple concret** :
- Vérifie qu'un email est bien formaté
- Vérifie qu'un mot de passe est assez fort
- Vérifie qu'un titre de film n'est pas vide

**Pourquoi ?** : Pour sécuriser l'application et éviter les erreurs.

### 📁 `app/data/`

**Rôle** : Scripts SQL pour créer et modifier la base de données.

**Fichiers** :
- `create_db.sql` → Crée les tables
- `migration_*.sql` → Modifie la structure (ajout de colonnes, etc.)

---

## Architecture MVC

### Qu'est-ce que MVC ?

**MVC** signifie **Model-View-Controller** (Modèle-Vue-Contrôleur).

C'est une **architecture** qui organise le code en 3 parties :

### 1. Model (Modèle) → `app/models/`

**Rôle** : Gère les **données** et l'accès à la base de données.

**Exemple** :
```javascript
// movie.model.js
const Movie = sequelize.define('Movie', {
  title: DataTypes.STRING,
  year: DataTypes.INTEGER,
  genre: DataTypes.STRING
});
```

### 2. View (Vue) → `app/views/`

**Rôle** : Affiche les **données** à l'utilisateur (HTML).

**Exemple** :
```ejs
<!-- movies.ejs -->
<h1>Liste des films</h1>
<% movies.forEach(movie => { %>
  <div><%= movie.title %></div>
<% }) %>
```

### 3. Controller (Contrôleur) → `app/controllers/`

**Rôle** : Fait le **lien** entre le modèle et la vue.

**Exemple** :
```javascript
// movies.controllers.js
async moviesList(req, res) {
  const movies = await Movie.findAll(); // Model
  res.render('movies', { movies });      // View
}
```

### Flux MVC dans Ciné Délices

```
1. Utilisateur demande /movies
   ↓
2. Route → movies.route.js
   ↓
3. Controller → movies.controllers.js
   ↓
4. Model → movie.model.js → Base de données
   ↓
5. Controller reçoit les données
   ↓
6. View → movies.ejs → HTML généré
   ↓
7. HTML envoyé au navigateur
```

---

## Bonnes pratiques appliquées

### 1. Séparation des responsabilités

**Principe** : Chaque fichier a **une seule responsabilité**.

**Exemple** :
- `movies.controllers.js` → Gère uniquement les films
- `auth.controller.js` → Gère uniquement l'authentification
- `admin.controllers.js` → Gère uniquement l'administration

**Avantage** : Plus facile de trouver et modifier le code.

### 2. Réutilisation du code

**Principe** : Éviter de **dupliquer** le code.

**Exemple** :
- Fonction `normalizeText()` dans `search-utils.js` → Utilisée partout
- Middleware `is-authed.middleware.js` → Utilisé sur plusieurs routes

**Avantage** : Si on modifie une fonction, tous les endroits qui l'utilisent sont mis à jour.

### 3. Nommage clair

**Principe** : Les noms de fichiers et variables sont **explicites**.

**Exemple** :
- ✅ `movies.controllers.js` → On sait que c'est pour les films
- ✅ `is-authed.middleware.js` → On sait que ça vérifie l'authentification
- ❌ `ctrl.js` → On ne sait pas ce que c'est

**Avantage** : On comprend le code sans le lire.

### 4. Organisation par fonctionnalité

**Principe** : Regrouper les fichiers **par fonctionnalité**.

**Exemple** :
- Tout ce qui concerne les films → `movies.*`
- Tout ce qui concerne l'authentification → `auth.*`

**Avantage** : On trouve rapidement tout ce qui concerne une fonctionnalité.

### 5. Documentation

**Principe** : Commenter le code et documenter les fonctions complexes.

**Exemple** :
```javascript
/**
 * Calcule un score de pertinence pour un film
 * @param {object} movie - Objet film
 * @param {string} query - Requête de recherche
 * @returns {number} - Score de pertinence (0-100)
 */
function calculateRelevanceScore(movie, query) {
  // ...
}
```

**Avantage** : On comprend rapidement ce que fait une fonction.

---

## 🎯 Ce que vous avez appris

✅ Comment un projet web est organisé  
✅ La différence entre front-end et back-end  
✅ Le rôle de chaque dossier  
✅ L'architecture MVC  
✅ Les bonnes pratiques de développement  

---

## 📖 Prochaines étapes

Maintenant que vous comprenez l'organisation du projet, vous pouvez :

→ **[Découvrir le Design & Front-End](./../03-DESIGN-FRONTEND/README.md)**

---

**Retour à l'[index principal](./../README.md)**
