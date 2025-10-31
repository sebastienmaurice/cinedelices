const moviesController = {
  //page d'accueil
  moviesList(req, res) {
    res.send("liste des films");
  },

  //Filtrage des films par genre (tous, action, comedie, drame...)
  filtredMovies(req, res) {
    res.send("filtre des recettes du film");
  },

  //les recettes du film
  movieRecipes(req, res) {
    res.send("liste des recettes du film");
  },

  //Filtrage recettes par categories (tous, entrée, plat, dessert)
  filtredRecipes(req, res) {
    res.send("filtre des recettes du film");
  },

  //le detail recette
  detailRecipes(req, res) {
    res.send("detail de la recette du film");
  },
};

export default moviesController;
