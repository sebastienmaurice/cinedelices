# Reste A Faire

avant de commencer les features a venir.

---

## partie ADMIN

- [x] ajout image recette par defaut  
  - fait
  - "app/public/images/default-recipe.jpg"  
  - nettoyage code et indentation.  
  
- [x] upload image de film;  
  - fichiers impactés:
    - app/middlewares/upload-movie.middleware.js (nouveau)
    - app/public/js/admin-dashboard.js (lignes 59 - 128)
    - app/controllers/movies.controllers.js
    - app/routes/admin.route.js
    - app/views/admin-dashboard.ejs

- [ ] (FRONT) affichage des avis a valider;  
- [ ] (BACK)affichage des avis a valider;  
- [ ] valider l'avis;  
- [ ] supprimer l'avis;  

## partie ajout de recettes

- [X] masquer bouton "je valide ma fiche" (SI la section Movie n'est pas renseigné);  
  - fait dans add-recipes-movies.ejs (ligne 274)
  -     ```html  

            <% if (typeof newMovie !== "undefined" ) { %>
            <button class="btn btn--red form-validation-btn">
            Je valide ma recette
            </button>
            <% } %>
        ```
- [ ] (FRONT) voir pour notification quand la requete est envoyée (appuis boutons film et recette et pour celle de l'ajout de l'avis dans detail recette);  

## partie detail recette

- [ ] requete ajouter un avis;  
- [ ] (BACK) ajouter la note generale dans la requete d'ajout d'avis si possible;  
- [ ] valider l'avis;  
- [ ] supprimer l'avis;  

## partie compte user (profil)

- [ ] upload image de profil;  
- [ ] requete suppression compte;  
- [ ] requete mise a jour compte;  

## nettoyage code

- [x] app/controllers/add-recipes-movies.controllers.js;  
  - suppression console.log() devenu inutile  
  
- [x] app/views/recipe-detail.ejs  
  - debug images  

- [x] app/views/add-recipes-movies.ejs  
  - preview image fonctionnelle  
  
- [x] docs/
  - deplacement de MULTER_IMPLEMENTATION.md dans le dossier docs/ludo ...
  - ajout UPLOAD_IMAGE_FILM_ADMIN.md  

- [x] optimisation page home
  - suppression de l'image cinoche1.jpg du module events (perfo passée de 45% a 83%)  

- [x] optimisation page admin
  - deplacement du js de upload image film de "admin-dashboard.js" vers "admin-picture-upload.js"
  - conditionnement de l'activation "admin-picture-upload.js" (!pas besoin si pas de film a valider sur la partie droite ==> perfo a 90%)  
