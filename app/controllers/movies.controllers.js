import {Movie} from "../models/index.js";

const moviesController = {

  //Filtrage des films par genre (tous, action, comedie, drame...)
  filtredMovies(req, res) {
    res.send("filtre des recettes du film");
  },

  // Affichage de la liste des films sur la page des films
  async moviesList(req, res) {
  try {
    const movies = await Movie.findAll();
    res.render("movies", { movies });
  } catch (error) {
    console.error(error);
    res.status(500).send("pages/error");
  }
  },
  };




export default moviesController;


