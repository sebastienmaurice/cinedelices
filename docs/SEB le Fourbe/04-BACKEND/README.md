# 04 - Back-End

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Back-End](#architecture-backend)
3. [Base de données](#base-de-données)
4. [Logique métier](#logique-métier)

---

## Vue d'ensemble

Le **back-end** est la partie invisible du site. C'est le serveur qui traite les requêtes, accède à la base de données et génère les réponses.

### Technologies utilisées

- **Node.js** : Environnement d'exécution JavaScript
- **Express.js** : Framework web
- **Sequelize** : ORM pour PostgreSQL
- **PostgreSQL** : Base de données relationnelle

---

## Architecture Back-End

### Architecture MVC

Le projet suit l'architecture **MVC** (Model-View-Controller) :

- **Model** (`app/models/`) : Accès à la base de données
- **View** (`app/views/`) : Templates HTML (EJS)
- **Controller** (`app/controllers/`) : Logique métier

### Point d'entrée

**Fichier** : `index.js`

```javascript
import express from "express";
import router from "./app/routes/index.route.js";

const app = express();
app.set("view engine", "ejs");
app.use(express.static("./app/public"));
app.use(router);

app.listen(3000);
```

---

## Base de données

### Structure

**5 tables principales** :
- `users` : Utilisateurs
- `movies` : Films et séries
- `recipes` : Recettes
- `notices` : Avis
- `users_recipes` : Favoris

### Relations

- Un film peut avoir plusieurs recettes
- Une recette appartient à un film
- Un utilisateur peut avoir plusieurs recettes favorites

---

## Logique métier

### Contrôleurs

Chaque contrôleur gère une fonctionnalité :

- `movies.controllers.js` → Films
- `recipes-movie.controllers.js` → Recettes
- `auth.controller.js` → Authentification
- `admin.controllers.js` → Administration

### Middlewares

Fonctions qui s'exécutent avant les contrôleurs :

- `is-authed.middleware.js` → Vérifie l'authentification
- `is-admin.middleware.js` → Vérifie les droits admin
- `upload.middleware.js` → Gère les uploads

---

## 📖 Pour aller plus loin

→ **[Comprendre la communication Front/Back](./../05-COMMUNICATION-FRONT-BACK/README.md)**

---

**Retour à l'[index principal](./../README.md)**
