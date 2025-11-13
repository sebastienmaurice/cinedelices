import { Recipe, Movie, Notice, User } from "../models/index.js";
const adminController = {
  // Page principale admin
  // accueil admin
  //!route fonctionnelle
  async admin(req, res) {
    try {
      const recipes = await Recipe.findAll({
        where: { status: "false" },
      });
      const movies = await Movie.findAll({
        where: { status: "false" },
      });
      const avis = await Notice.findAll();
      const users = await User.findAll();
      Role = string(req.userRole);
      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        role: req.userRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("pages/error");
    }
  },

  // Page pour ajouter une recette inspirée d'un film
  addMovieRecipe(req, res) {
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
    res.send("mettre a jour recette");
  },

  // Suppression d'une recette
  deleteRecipe(req, res) {
    res.send("supprimer une recette");
  },

  // Valider une recette
  validateRecipe(req, res) {
    res.send("valider une recette");
  },

  // Supprimer un utilisateur
  deleteUser(req, res) {
    res.send("supprimer utilisateur");
  },
};

export default adminController;
