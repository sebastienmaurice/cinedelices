# autocompletion  

remplissage des données du film dans l'ajout d'un film quand on clique sur "ajouter ma recette" de la vue recipes-movie.ejs

## ajout dans la VUE "recipes-movie.ejs"  

à la ligne 76  

`<a class="btn btn--gold" href="/add-recipes-movies/<%= movie.id %>"`

---

## ajout dans la ROUTE "add-recipes-movie.route.js"

à la ligne 14  

``` js
// Route pour la page d'ajout d'une recette dans un film existant
addRecipesMoviesRouter.get("/:id",addRecipesMoviesController.addRecipeToMovies
);
```  

---

## ajout dans le CONTROLLER "add-Recipes-Movies.Controllers.js"  

à la ligne 22  

``` js  

  // Page d'ajout d'une recette dans un film existant
  async addRecipeToMovies(req, res) {
    try {
      const id = req.params.id;

      const newMovie = await Movie.findByPk(id);

      // Rendu de la vue pour le pre-remplissage du film

      res.render("add-recipes-movies", {
        newMovie,
        role: req.userRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },

```  
