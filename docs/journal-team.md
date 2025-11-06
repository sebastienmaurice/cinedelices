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

- 5 install sequelize  

`npm i sequelize`  

- 6 install postgresql  

`npm i pg`  

</details>  

<details>  

<summary>preparation structure</summary>

- créer un fichier `.env`  
  ==> *prendre exemple sur .env.example*

- `.gitignore`  
  
    - dossier "node.modules
    - fichier `.env`
    - `journal.md` perso

- `package.json`  
  
  ```json     ...
    "type":"module",
    ...
    "scripts": {
    "dev": "node --watch index.js"
    }
    ```  
</details>  

---  

<details>  

<summary>structure</summary>  

```structure
    
.
├── app
│   ├── controllers
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
│   │   └── mock-admin.middleware.js
│   ├── models
│   │   ├── baseModel.js
│   │   ├── index.js
│   │   ├── movie.js
│   │   ├── notice.js
│   │   ├── recipe.js
│   │   ├── user.js
│   │   └── users_recipes.js
│   ├── public
│   │   ├── css
│   │   │   ├── films.css
│   │   │   ├── home.css
│   │   │   ├── recipes-movie.css
│   │   │   ├── reset.css
│   │   │   └── user-profile.css
│   │   ├── html
│   │   │   ├── home.html
│   │   │   └── movies.html
│   │   ├── HTML
│   │   │   ├── films.html
│   │   │   ├── recipes-film.html
│   │   │   └── user-profile.html
│   │   ├── images
│   │   │   ├── background-1.jpg
│   │   │   ├── background-2.jpg
│   │   │   ├── bande-film.png
│   │   │   ├── bg-8.jpg
│   │   │   ├── cinoche1.jpg
│   │   │   ├── croco-dundee-2.jpg
│   │   │   ├── dessert-backtothefuture-2.jpg
│   │   │   ├── doc-and-marty-peach-pie-1.jpg
│   │   │   ├── doc-et-marty-2.jpg
│   │   │   ├── kaamelott-2.png
│   │   │   ├── logo-cine-delices.png
│   │   │   ├── marty-and-doc-eating.png
│   │   │   ├── profile-defaut-1.jpg
│   │   │   ├── salle-cinoche-1.jpg
│   │   │   └── sparrow-2.jpg
│   │   └── JS
│   │       └── home.js
│   ├── routes
│   │   ├── admin.route.js
│   │   ├── auth.route.js
│   │   ├── home.route.js
│   │   ├── index.route.js
│   │   ├── movies.route.js
│   │   ├── recipes-movie.route.js
│   │   └── user-profile.route.js
│   └── views
│       ├── home.ejs
│       ├── movies.ejs
│       ├── partials
│       │   ├── footer.ejs
│       │   └── header.ejs
│       ├── recipes-movie.ejs
│       └── user-profile.ejs
├── docs
│   └── journal-team.md
├── index.js
├── journal.md
├── node_modules
├── package.json
├── package-lock.json
└── README.md

```  

</details>  

## MVP  

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

### BDD  

![BDD](/docs/schema_bdd.jpg)

### dynamisation des vues  

- [ ] home
- [x] movies
- [ ] recipes-movie

### securisation et authentification  

- [ ] middleware authentification
