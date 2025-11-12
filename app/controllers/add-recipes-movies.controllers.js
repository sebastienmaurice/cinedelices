const addRecipesMoviesController = {
  // Page d'ajout de film et recette
  addRecipesMovies(req, res) {
    try {
      res.render("add-recipes-movies");
    } catch (error) {
      console.error(error);
      res.status(500).send("pages/error");
    }
  },
};

export default addRecipesMoviesController;

