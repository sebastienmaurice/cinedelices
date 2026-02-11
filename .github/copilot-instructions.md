# Ciné Délices - Instructions pour AI Agents

## Architecture Générale

**Ciné Délices** est une plateforme permettant aux utilisateurs de découvrir et partager des recettes inspirées de films. Stack : **Express.js + EJS + Sequelize + PostgreSQL**.

### Structure MVC

- **Controllers** (`app/controllers/`) : Logique métier et orchestration des requêtes
- **Models** (`app/models/`) : Relations Sequelize (User, Movie, Recipe, Notice, UsersRecipes)
- **Routes** (`app/routes/`) : Routage centralisé via `index.route.js` qui agrège tous les sous-routeurs
- **Views** (`app/views/`) : Templates EJS avec partials pour la navigation
- **Utils** (`app/utils/`) : Helpers centralisés (error-handler, movie-image-helper, search-cache, etc.)

## Patterns Critiques

### 1. Gestion d'Erreurs Unifiée

Tous les controllers doivent utiliser les fonctions d'`error-handler.js` :

```javascript
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
// Usage : renderNotFound(res, "Film", req.userRole); // 404 avec message personnalisé
// Usage : renderServerError(res, error, req.userRole); // 500 automatique
```

**Jamais** de `res.status(404).render()` duplicatif dans les controllers.

### 2. Authentification par JWT en Cookies

- Token stocké dans cookie `httpOnly` (2h expiration)
- Middleware `verifyToken` (global) décide du statut utilisateur :
  - ✅ Valide → `req.user`, `req.userId`, `req.userPseudo`, `req.userRole` définis
  - ✗ Invalide/Expiré → Cookie supprimé, erreur 401 rendue
  - ⚠️ Absent → Passe quand même (`req.userRole = undefined`) pour accès public
- Routes protégées utilisent `isLogged` ou `isAdmin` middleware en pointeur

### 3. Validation avec Joi (Strict)

- **Tous** les inputs utilisateurs sont validés avec Joi en middleware
- Schemas dans `app/validators/` (user.validator.js, recipe.validator.js, etc.)
- `.unknown(true)` autorise champs supplémentaires sans erreur
- Messages d'erreur localisés en français, jointure avec `<br>` pour multi-messages
- XSS auto-sanitization via `express-xss-sanitizer` (middleware global)

### 4. Modèles & Relations N↔N

Définition centralisée des relations dans [index.model.js](app/models/index.model.js) :

```javascript
// Jonction User ↔ Recipe (utilisateurs favoris/collections)
User.belongsToMany(Recipe, { through: UsersRecipes, timestamps: false });
Recipe.belongsToMany(User, { through: UsersRecipes, timestamps: false });
```

Toujours importer des models via `index.model.js` pour éviter dépendances circulaires.

### 5. Conventions Sequelize

- Table names en snake_case (ex: `users_recipes`, `picture_status`)
- Clés étrangères : `id_user`, `id_movie`, `id_recipe`
- Pas de timestamps auto (défini dans sequelize-client.js)
- Attributs booléens pour status (`status: true/false` = publié)

## Workflows Essentiels

### Démarrage

```bash
npm run dev  # Lance node --watch index.js (avec reload auto)
```

### Base de Données

```bash
npm run db:init                          # Crée schéma initial
npm run db:migrate-pending-edits         # Aplique dernière migration
# Autres : db:migrate-genres, db:migrate-user-ownership, etc.
```

Migrations stockées dans `app/data/migration_*.sql` (une par feature).

### Routes

- Index centralisé : [index.route.js](app/routes/index.route.js)
- Patterns : `/auth/*`, `/admin/*`, `/movies/*`, `/recipes-movie/*`, `/add-recipes-movies/*`, `/api/tmdb/*`
- Protection : `isLogged` (connecté), `isAdmin` (rôle admin)

## Pièges & Anti-Patterns

❌ **Ne PAS faire :**

1. Duplique la gestion 404/500 → Utilise `renderNotFound()`
2. Vérifier manuellement `req.userRole` dans controllers → Utilise middlewares de protection
3. Hacher manuellement les mots de passe → Utilise `argon2` toujours
4. Requêtes SQL brutes → Sequelize seulement
5. Importer des modèles individuels → Via `index.model.js`

✅ **À faire :**

1. Valider TOUS inputs avec Joi en middleware avant le controller
2. Utiliser `StatusCodes` de `http-status-codes` pour les réponses
3. Inclure relations pertinentes dans `.findOne()` / `.findAll()` avec `include: []`
4. Logs avec `console.error()` pour erreurs, `console.log()` pour events (ex: user login)
5. Tester migrations PostgreSQL avant merge (ils sont appliqués seul une fois en prod)

## Conventions Spécifiques

### Imports du Projet

```javascript
import { User, Recipe, Movie } from "../models/index.model.js";
import { renderNotFound } from "../utils/error-handler.js";
import { StatusCodes } from "http-status-codes";
```

### Structure des Controllers

1. Extraction des données (`const { field } = req.body`)
2. Try/catch wrapper
3. Requête DB avec includes
4. Vérifications nullité avec `renderNotFound()`
5. Rendu de la vue ou redirection

### Images

- Dossier images : `app/public/images/`
- Helper centralisé : [movie-image-helper.js](app/utils/movie-image-helper.js) pour enrichir les films avec chemins
- Format support : `.jpg`, `.jpeg`, `.png`, `.webp`

## Fichiers de Référence

| Fichier                                                                            | Concept                |
| ---------------------------------------------------------------------------------- | ---------------------- |
| [app/models/index.model.js](app/models/index.model.js)                             | Relations centralisées |
| [app/utils/error-handler.js](app/utils/error-handler.js)                           | 404/500 unifiés        |
| [app/middlewares/is-authed.middleware.js](app/middlewares/is-authed.middleware.js) | Auth JWT               |
| [app/validators/user.validator.js](app/validators/user.validator.js)               | Pattern Joi            |
| [app/controllers/auth.controller.js](app/controllers/auth.controller.js)           | Patterns complets      |
