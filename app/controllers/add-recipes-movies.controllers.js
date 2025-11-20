import { Recipe, Movie, Notice, User } from "../models/index.model.js";

const addRecipesMoviesController = {
  // Page d'ajout de film et recette
  addRecipesMovies(req, res) {
    try {
      // ajout gestion du role
      res.render("add-recipes-movies", { role: req.userRole });
    } catch (error) {
      console.error(error);

      // ← ici, on rend la page d'erreur avec loginPopup: false
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
        loginPopup: false,
      });
    }
  },

  // POST - Ajout du film
  async addMovie(req, res) {
    try {
      const { title, year, genre } = req.body;

      // Ajout du film à la base de données
      // Création du film
      const newMovie = await Movie.create({
        title: title,
        year: year,
        genre: genre,
      });
      //const newMovie = { title, year, genre, id };
      console.log("Nouveau film ajouté :", newMovie);

      // Rendu de la page avec le rôle de l'utilisateur
      res
        .status(201)
        .render("add-recipes-movies", { newMovie, role: req.userRole });
    } catch (error) {
      console.error(error);

      // ← ici, on rend la page d'erreur avec loginPopup: false
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
        //loginPopup: false,
      });
    }
  },

  // POST - Ajout de la recette
  async addRecipe(req, res) {
    try {
      // Récupération des données du formulaire
      const {
        name,
        description,
        category,
        ingredients,
        preparation,
        time,
        difficulty,
        id_movie,
      } = req.body;

     
      
      // Ajout de la recette à la base de données (simulation)
      const newRecipe = await Recipe.create({
        name: name,
        description: description,
        category: category,
        ingredients: ingredients,
        preparation: preparation,
        time: time,
        difficulty: difficulty,
        id_movie: id_movie,
      });
      console.log("Nouvelle recette ajoutée :", newRecipe);

      // Rendu de la page avec le rôle de l'utilisateur
      res
        .status(201)
        .render("add-recipes-movies", { newRecipe, role: req.userRole });
    } catch (error) {
      console.error(error);

      // ← ici, on rend la page d'erreur avec loginPopup: false
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
        //loginPopup: false,
      });
    }
  },
};
export default addRecipesMoviesController;
