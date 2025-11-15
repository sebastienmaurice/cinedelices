import { Recipe, Movie, Notice, User } from "../models/index.model.js";

const moviesController = {
  //Filtrage des films par genre (tous, action, comedie, drame...)
  async filtredMovies(req, res) {
    try {
      console.log(req.params);
      const { genre } = req.params;

      let movies;
      if (!genre || genre === "all" || genre === "tous") {
        movies = await Movie.findAll();
      } else {
        movies = await Movie.findAll({
          where: { genre: genre },
        });
      }

      // Rendu de la vue avec les genres filtrés

      res.render("movies", {
        movies,
        selectedGenre: genre || "tous",
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

  // Affichage de la liste des films sur la page des films
  async moviesList(req, res) {
    try {
      const movies = await Movie.findAll();
      const selectedGenre = req.query.genre || "tous";

      // Si un genre est passé en query, filtrer les films
      let filteredMovies = movies;
      if (selectedGenre && selectedGenre !== "tous") {
        filteredMovies = movies.filter(
          (movie) => movie.genre === selectedGenre
        );
      }

      res.render("movies", {
        movies: filteredMovies,
        selectedGenre,
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
};

export default moviesController;
