import { Movie, Recipe } from "../models/index.js";



const recipesController = {
 
  //afficher les infos du film dans la bannière de présentation de la page du film et ses recettes

   async movieRecipes (req, res){
    try {
      // On récupère d’abord le film
      const movie = await Movie.findByPk(req.params.id);
  
      // Si le film n’existe pas
      if (!movie) {
        return res.status(404).send("pages/error");
      }
  
      // Puis les recettes associées
      const recipes = await Recipe.findAll({where: { id_movie: movie.id }});
  
      // Et enfin on affiche la page
      res.render("recipes-movie", { movie, recipes });
    } catch (error) {
      console.error(error);
      res.status(500).send("pages/error", { message: "Erreur serveur" });
    }
  },


 //les recettes du film
 //movieRecipes(req, res) {
  //  res.render("recipes-movie");
  //},

  

  //Filtrage recettes par categories (tous, entrée, plat, dessert)
  filtredRecipes(req, res) {
    res.send("filtre des recettes du film");
  },

  //le detail recette
  detailRecipes(req, res) {
    res.send("detail de la recette du film");
  },
};

export default recipesController;