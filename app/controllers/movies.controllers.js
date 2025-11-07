import {Movie} from "../models/index.js";

const moviesController = {

  //Filtrage des films par genre (tous, action, comedie, drame...)
  async filtredMovies(req, res) {
    try {
      console.log(req.params);
      const { genre } = req.params;

      let movies;
      if (!genre || genre === "all") {
        movies = await Movie.findAll();
      } else {
        movies = await Movie.findAll({
          where: {genre: genre},
        });
      }

      // Rendu de la vue avec les genres filtrés
      console.log(movies);
      res.render("movies", { movies, genre });
    } catch (error) {
      console.error(error);
      res.status(500).send("pages/error");
    }
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


