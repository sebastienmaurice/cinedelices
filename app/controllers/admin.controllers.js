// /app/controllers/admin.controllers.js
const adminController = {

  // Page principale admin
  //accueil admin
  admin(req, res) {
    res.render("admin/admin");
  },

  // Page pour ajouter une recette inspirée d'un film
  addMovieRecipe(req, res) {
    // 👇 on passe des données mock pour éviter les erreurs EJS
    res.render("admin/add-movie-recipe", {
      recipe: {
        image: "/images/test-recipe.jpg",
        alt: "Image test recette",
        title: "Recette Test",
        film: "Film Test",
        description: "Description test de la recette",
        movieImageDefault: "/images/test-movie-default.jpg",
        movieAltDefault: "Film default",
        movieImageHover: "/images/test-movie-hover.jpg",
        movieAltHover: "Film hover",
        quote: { text: "Une citation de film test", film: "Film Test" },
      },
      topRecipes: [
        {
          image: "/images/test1.jpg",
          alt: "Recette 1",
          title: "Top Recette 1",
          film: "Film 1",
          description: "Description 1",
        },
        {
          image: "/images/test2.jpg",
          alt: "Recette 2",
          title: "Top Recette 2",
          film: "Film 2",
          description: "Description 2",
        },
        {
          image: "/images/test3.jpg",
          alt: "Recette 3",
          title: "Top Recette 3",
          film: "Film 3",
          description: "Description 3",
        },
      ],
    });
  },

  // Soumission du formulaire d'ajout de recette (POST)
  saveMovieRecipe(req, res) {
    res.send("POST saveMovieRecipe - à implémenter");
  },

  // Liste des recettes pour admin
  listRecipes(req, res) {
    res.send("Liste des recettes - à implémenter");
  },

  // Page d'édition d'une recette
  editRecipe(req, res) {
    res.send(`Page édition recette ${req.params.id} - à implémenter`);
  },

  // Soumission de la modification d'une recette
  updateRecipe(req, res) {
    res.send(`POST updateRecipe ${req.params.id} - à implémenter`);
  },

  // Suppression d'une recette
  deleteRecipe(req, res) {
    res.send(`POST deleteRecipe ${req.params.id} - à implémenter`);
  },

  // Supprimer une recette
  deleteRecipe(req, res) {
    res.send("supprimer une recette");
  },

  // modifier une recette
  updateRecipe(req, res) {
    res.send("mettre a jour recette");
  },

  // valider une recette
  validateRecipe(req, res) {
    res.send("valider une recette");
  },

  // supprimer un utilisateur
  deleteUser(req, res) {
    res.send("supprimer utilisateur");
  },
};

export default adminController;
