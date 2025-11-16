# Journal du groupe

## Installation

<details>

<summary>installation environnement</summary>

- 1 initialise le projet

`npm init -y`

- 2 install express

`npm i express`

- 3 install variables d'environnement

`npm i dotenv`

- 4 install moteur de vues

`npm i ejs`

<<<<<<< HEAD
- 5 install orm sequelize (Object Relational Mapping)  
  
  programme qui se place en interface entre l'appli et la bdd
=======
- 5 install sequelize
>>>>>>> feat/redesign-page

`npm i sequelize`

<<<<<<< HEAD
- 6 install SGBD postgresql  
  
  (Système de Gestion de Base de Données relationnel)
=======
- 6 install postgresql
>>>>>>> feat/redesign-page

`npm i pg`

<<<<<<< HEAD
- 7 install programme pour hacher et verifier les mots de passe

`npm i argon2`

- 8 install "jsonwebtoken" pour gérer l’authentification et l’autorisation.  

`npm i jsonwebtoken`

- 9 install "cookie-parser" pour gerer les cookies  
  
`npm install cookie-parser`

- 10 install "express-xss-sanitizer"  
  
  pour assainit les données d’entrée des utilisateurs afin de prévenir les attaques de Cross Site Scripting (XSS)  
  
`npm i express-xss-sanitizer`  

- 11 install "http-status-codes"  
  
  constantes énumérant les codes d’état HTTP  

`npm i http-status-codes`  

- 12 install "joi": "^17.13.3",
  
  pour nettoyer et le valider les données ( depuis la V 16, Joi integre des fonction de sanitize).
  dossier validator (par convention le plus utilisé)
  
`npm i joi`

</details>  
=======
</details>
>>>>>>> feat/redesign-page

<details>

<summary>preparation structure</summary>

- créer un fichier `.env`  
  ==> _prendre exemple sur .env.example_

- `.gitignore`

  - dossier "node.modules
  - fichier `.env`
  - `journal.md` perso

- `package.json`
  ````json ...
    "type":"module",
    ...
    "scripts": {
    "dev": "node --watch index.js"
    }
    ```
  </details>
  ````

---

<details>

<summary>structure</summary>

```structure

.
├── app
│   ├── controllers
│   │   ├── add-recipes-movies.controllers.js
│   │   ├── admin.controllers.js
│   │   ├── auth.controller.js
│   │   ├── home.controllers.js
│   │   ├── movies.controllers.js
│   │   └── recipes-movie.controllers.js
│   ├── data
│   │   └── create_db.sql
│   ├── database
│   │   └── sequelize-client.js
│   ├── db
│   │   └── client.js
│   ├── middlewares
│   │   ├── is-admin.middleware.js
│   │   ├── is-authed.middleware.js
│   │   └── mock-admin.middleware.js
│   ├── models
│   │   ├── baseModel.js
│   │   ├── index.model.js
│   │   ├── movie.model.js
│   │   ├── notice.model.js
│   │   ├── recipe.model.js
│   │   ├── user.model.js
│   │   └── users_recipes.model.js
│   ├── public
│   │   ├── css
│   │   │   ├── add-recipes-movies.css
│   │   │   ├── admin-dashboard.css
│   │   │   ├── base.css
│   │   │   ├── burger-menu.css
│   │   │   ├── films.css
│   │   │   ├── help.css
│   │   │   ├── home.css
│   │   │   ├── recipe-detail.css
│   │   │   ├── recipes-movie.css
│   │   │   ├── reset.css
│   │   │   └── user-profile.css
│   │   ├── html
│   │   ├── images
│   │   │   
│   │   └── js
│   │       ├── admin-dashboard.js
│   │       ├── burger-menu.js
│   │       ├── filtred-category.js
│   │       ├── filtred-genre.js
│   │       ├── glowy-container.js
│   │       ├── popup-connexion.js
│   │       ├── recipe-detail.js
│   │       └── register-form.js
│   ├── routes
│   │   ├── add-recipes-movies.route.js
│   │   ├── admin.route.js
│   │   ├── auth.route.js
│   │   ├── home.route.js
│   │   ├── index.route.js
│   │   ├── movies.route.js
│   │   ├── recipes-movie.route.js
│   │   └── user-profile.route.js
│   ├── validators
│   │   ├── movie.validator.js
│   │   ├── notice.validator.js
│   │   ├── recipe.validator.js
│   │   ├── userRecipe.validator.js
│   │   └── user.validator.js
│   └── views
│       ├── add-recipes-movies.ejs
│       ├── admin
│       │   └── admin.ejs
│       ├── admin-dashboard.ejs
│       ├── error.ejs
│       ├── home.ejs
│       ├── movies.ejs
│       ├── partials
│       │   ├── footer.ejs
│       │   ├── header.ejs
│       │   ├── head-resources.ejs
│       │   └── popup-connexion.ejs
│       ├── recipe-detail.ejs
│       ├── recipes-movie.ejs
│       └── user-profile.ejs
├── docs
│   ├── home.jpg
│   ├── journal-team.md
│   ├── MCD.png
│   ├── MLD.png
│   └── schema_bdd.jpg
├── index.js
├── journal.md
├── node_modules
├── package.json
├── package-lock.json
├── README.md
└── STRUCTURE_PARTIALS.md


```

</details>

<<<<<<< HEAD
## Conception

### MVP  
=======
## MVP
>>>>>>> feat/redesign-page

- enregistrement des utilisateurs
- authentification des utilisateurs
- suppression utilisateur
- de noter les recettes,
- laisser un commentaire,
- de mettre en favori ses préférées,
- d’ajouter des recettes dans les films via un formulaire,
- contrôler les données des recettes soumises,
- possibilité de valider la recette,
- ajouter, supprimer et modifier les recettes,
- le droit de révoquer les utilisateurs (suppression de compte)

<<<<<<< HEAD
### wireframe  

- dans le drive cinedelices

### maquette  

- dans le drive cinedelices

### MCD  

![MCD](/docs/MCD.png)

### MLD  

![MLD](/docs/MLD.png)

### Model de structure

- Monolitique  

## Creation BDD postgresql  

- [x] bdd  
  - creation script a partir du MLD  
  
    - data /create_db.sql  

  - connection sequelize > BDD  
  
    - database /sequelize-client.js  


=======
## wireframe

- dans le drive cinedelices

## maquette

- dans le drive cinedelices

## MCD

![MCD](/docs/MCD.png)

## MLD

![MLD](/docs/MLD.png)

- [ ] routes

  - index (aiguillage des routes)
  - home
  - movies
  - recipes-movie
  - user-profile
  - admin
  - auth

- [ ] vues
  - home.ejs
  - movies.ejs
  - recipes-movie.ejs
  - user-profile.ejs
- [x] bdd
  - creation script a partir du MLD
  - creation des models
>>>>>>> feat/redesign-page

### BDD

![BDD](/docs/schema_bdd.jpg)

<<<<<<< HEAD
## Partie serveur

### création des routes  

- [X] add-recipes-movies.route.js
- [X] admin.route.js
- [X] auth.route.js
- [X] home.route.js
- [X] index.route.js # route principale (aiguillage vers les routes)
- [X] movies.route.js
- [X] recipes-movie.route.js
- [X] user-profile.route.js

### création des controllers  

- [X] add-recipes-movies.controllers.js # controlleur ajout recettes
- [X] admin.controllers.js # controlleur reservée admin
- [X] auth.controller.js # controlleur reservée authentification
- [X] home.controllers.js  # controlleur page d'acceuil
- [X] movies.controllers.js # controlleur films
- [X] recipes-movie.controllers.js # controlleur recettes

### création des middlewares  

- [X] is-admin.middleware.js # donne accès aux utilisateurs avec role est "admin"
- [X] is-authed.middleware.js # donne accès aux utilisateurs connectés
- [?] mock-admin.middleware.js  

### création des models  

- [X] baseModel.js # gère l'id
- [X] index.model.js  # liaison des models
- [X] movie.model.js
- [X] notice.model.js
- [X] recipe.model.js
- [X] user.model.js
- [X] users_recipes.model.js

### création des validators  

- [X] movie.validator.js
- [X] notice.validator.js
- [X] recipe.validator.js
- [X] userRecipe.validator.js
- [X] user.validator.js

### sécurisation des routes  

- [X] dans index.js  
  
```js
  
app.use(verifyToken); // Middleware global pour vérifier le token et définir req.user si connecté
app.use(xss()); // Middleware global : nettoie automatiquement req.body, req.query, req.params

```

### gestion des erreurs  

- [X] redirige les erreurs vers page error.ejs
- [X] page error.ejs  
- [X] ajout middleware de gestion 404 dans index.js
  
```js
  
// middleware (404)
app.use((req, res) => {
  res.status(404).render("error", { role: req.userRole });
});

```

```js
  //extrait de error.ejs
<% if (typeof error === "undefined") { %> 
  <p>route invalide</p>
  ..............
<% } else if (error !== "" ) { %>
  <h3>erreur <%= error %></h3>
  <p><%- message %></p>
  <br><br>
<% } else { %>
  <h3>erreur </h3>
  <p>erreur inconnue</p>
  <br><br>

<% } %>

```

### contrôle du role de l'user  

- [X] is-admin.middleware

```js
  
  // 🔹 Vérification normale
  if (userRole === "admin") {
    return next();
  }

  // 🔹 Accès interdit
  res.status(403).render("error", {
    error: "403",
    message: "Route interdite. Vous n'êtes pas administrateur.",
    role: req.userRole,
  });

```  

- [X] ajout middleware de gestion 404 dans index.js
  
```js
  
  // Vérification normale
  if (userRole === "user" || userRole === "admin") {
    next();
  } else {
    // Accès interdit
  ....
  
```

## Partie client

### création des views

géré par le moteur de vue EJS  

- pages  
  
- [X] add-recipes-movies.ejs
- [X] admin-dashboard.ejs
- [X] error.ejs
- [X] home.ejs
- [X] movies.ejs
- [X] recipe-detail.ejs
- [X] recipes-movie.ejs
- [X] user-profile.ejs

- partials (centralisation partie communes à toutes les pages *(D.R.Y)*)  

- [X] footer.ejs
- [X] header.ejs
- [X] head-resources.ejs
- [X] popup-connexion.ejs

### création des styles

- [X] add-recipes-movies.css
- [X] admin-dashboard.css
- [X] base.css
- [X] burger-menu.css
- [X] films.css
- [X] help.css
- [X] home.css
- [X] recipe-detail.css
- [X] recipes-movie.css
- [X] reset.css
- [X] user-profile.css

### création de la dynamisation des pages en javaScript

- [X] admin-dashboard.js
- [X] burger-menu.js
- [X] filtred-category.js
- [X] filtred-genre.js
- [X] glowy-container.js
- [X] popup-connexion.js
- [X] recipe-detail.js
- [X] register-form.js

### dynamisation des vues  

- [X] dynamisation barre de navigation suivant les droits de l'utilisateur (simple utilisateur, user logger, admin)
=======
### dynamisation des vues

- [ ] home
- [x] movies
- [ ] recipes-movie

### securisation et authentification

- [ ] middleware authentification
>>>>>>> feat/redesign-page
