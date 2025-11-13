const addRecipesMoviesController = {
  // Page d'ajout de film et recette
  addRecipesMovies(req, res) {
    try {
      // ajout gestion du role
      res.render("add-recipes-movies", { role: req.userRole });
    } catch (error) {
      console.error(error);
      res.status(500).send("pages/error");
    }
  },
};

export default addRecipesMoviesController;
