# Reste A Faire

avant de commencer les features a venir.

---

## partie ADMIN

- [x] ajout image recette par defaut  
  - fait
  - "app/public/images/default-recipe.jpg"  
  - nettoyage code et indentation.  
- [ ] upload image de film;  
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
- [x] docs/  
  - deplacement de MULTER_IMPLEMENTATION.md dans le dossier docs/ludo ...
