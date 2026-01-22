# 06 - Fonctionnalités Clés Expliquées

## 📚 Table des matières

1. [Recherche de films](#recherche-de-films)
2. [Ajout de film et recette](#ajout-de-film-et-recette)
3. [Authentification](#authentification)
4. [Administration](#administration)
5. [Hero Slider](#hero-slider)

---

## Recherche de films

### Description fonctionnelle

La recherche permet de trouver des films et séries en temps réel, en combinant :
- Films locaux (base de données)
- Films/séries TMDB (API externe)

### Fichiers concernés

- **Front-end** : `app/public/js/movie-search-advanced.js`
- **Back-end** : `app/controllers/movies.controllers.js`
- **Utils** : `app/utils/search-utils.js`, `app/utils/search-cache.js`

### Comment ça fonctionne ?

1. L'utilisateur tape dans la barre de recherche
2. JavaScript fait une requête AJAX après 400ms (debounce)
3. Le serveur recherche dans la BDD locale + TMDB
4. Les résultats sont triés par pertinence
5. Affichage dans un dropdown avec mini-cartes

### Ce qu'un junior doit retenir

- ✅ Utilisation de `fetch()` pour les requêtes AJAX
- ✅ Debounce pour éviter trop de requêtes
- ✅ Combinaison de données locales et externes
- ✅ Cache pour optimiser les performances

---

## Ajout de film et recette

### Description fonctionnelle

Permet aux utilisateurs d'ajouter un film (avec pré-remplissage TMDB) et une recette associée.

### Fichiers concernés

- **Vue** : `app/views/add-recipes-movies.ejs`
- **Contrôleur** : `app/controllers/add-recipes-movies.controllers.js`
- **Route** : `app/routes/add-recipes-movies.route.js`

### Comment ça fonctionne ?

1. L'utilisateur cherche un film via TMDB
2. Le formulaire se pré-remplit automatiquement
3. Upload de l'image du film
4. Ajout de la recette associée
5. Validation par un admin

### Ce qu'un junior doit retenir

- ✅ Intégration d'API externe (TMDB)
- ✅ Upload de fichiers (Multer)
- ✅ Validation des données (Joi)
- ✅ Transactions SQL (tout ou rien)

---

## Authentification

### Description fonctionnelle

Système de connexion/inscription avec gestion de session via JWT.

### Fichiers concernés

- **Contrôleur** : `app/controllers/auth.controller.js`
- **Middleware** : `app/middlewares/is-authed.middleware.js`
- **Route** : `app/routes/auth.route.js`

### Comment ça fonctionne ?

1. L'utilisateur se connecte avec pseudo/mot de passe
2. Le serveur vérifie les identifiants
3. Création d'un token JWT
4. Stockage du token dans un cookie httpOnly
5. Le middleware vérifie le token sur chaque requête

### Ce qu'un junior doit retenir

- ✅ Hachage des mots de passe (Argon2)
- ✅ Tokens JWT pour les sessions
- ✅ Cookies httpOnly pour la sécurité
- ✅ Middleware pour protéger les routes

---

## Administration

### Description fonctionnelle

Interface d'administration pour valider les films et recettes.

### Fichiers concernés

- **Vue** : `app/views/admin-dashboard.ejs`
- **Contrôleur** : `app/controllers/admin.controllers.js`
- **Middleware** : `app/middlewares/is-admin.middleware.js`

### Comment ça fonctionne ?

1. Seuls les admins peuvent accéder
2. Affichage des films/recettes en attente de validation
3. Boutons pour valider ou refuser
4. Mise à jour du statut dans la base de données

### Ce qu'un junior doit retenir

- ✅ Système de rôles (user/admin)
- ✅ Protection des routes sensibles
- ✅ Interface d'administration

---

## Hero Slider

### Description fonctionnelle

Carrousel animé sur la page d'accueil avec 4 slides cinématographiques.

### Fichiers concernés

- **Vue** : `app/views/home.ejs` (lignes 27-173)
- **CSS** : `app/public/css/home.css`
- **JS** : `app/public/js/hero-slider.js`

### Comment ça fonctionne ?

1. 4 slides avec animations CSS
2. Parallaxe au mouvement de la souris
3. Zoom progressif automatique
4. Navigation par pagination ou flèches
5. Autoplay toutes les 7 secondes

### Ce qu'un junior doit retenir

- ✅ Animations CSS (@keyframes)
- ✅ Parallaxe JavaScript
- ✅ Gestion des événements
- ✅ Manipulation du DOM

---

## 📖 Documentation détaillée

Pour plus de détails sur chaque fonctionnalité :

- **[Système de recherche TMDB](./../07-TECHNIQUE/SYSTEME_RECHERCHE_TMDB_COMPLET.md)**
- **[Hero Slider](./../09-FONCTIONNALITES-ACTUELLES/HERO_SLIDER_DOCUMENTATION.md)**

---

**Retour à l'[index principal](./../README.md)**
