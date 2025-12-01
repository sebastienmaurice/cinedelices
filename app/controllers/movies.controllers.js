import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { Op } from "sequelize";

const moviesController = {
  // Recherche avancée de films (API)
  async searchMovies(req, res) {
    try {
      const { query } = req.query;

      // Si pas de query ou query vide, retourner tous les films
      if (!query || query.trim() === "") {
        const allMovies = await Movie.findAll({
          where: { status: true }, // Uniquement les films validés
          limit: 20, // Limiter les résultats
          order: [["title", "ASC"]],
        });

        return res.json({
          success: true,
          movies: allMovies,
          hasResults: allMovies.length > 0,
        });
      }

      const searchTerm = query.trim();

      // Construire les conditions de recherche
      const searchConditions = [
        // Recherche dans le titre (insensible à la casse, partielle)
        {
          title: {
            [Op.iLike]: `%${searchTerm}%`,
          },
        },
        // Recherche par genre (insensible à la casse)
        {
          genre: {
            [Op.iLike]: `%${searchTerm}%`,
          },
        },
      ];

      // Ajouter la recherche par année si la query est un nombre
      if (!isNaN(parseInt(searchTerm))) {
        searchConditions.push({
          year: parseInt(searchTerm),
        });
      }

      // Recherche avancée : titre, année, genre
      const movies = await Movie.findAll({
        where: {
          status: true, // Uniquement les films validés
          [Op.or]: searchConditions,
        },
        limit: 20, // Limiter les résultats
        order: [["title", "ASC"]], // Ordre alphabétique simple
      });

      return res.json({
        success: true,
        movies: movies,
        hasResults: movies.length > 0,
        query: searchTerm,
      });
    } catch (error) {
      console.error("Erreur lors de la recherche de films:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche de films",
        error: error.message,
      });
    }
  },

  //Filtrage des films par genre (tous, action, comedie, drame...)
  async filtredMovies(req, res) {
    try {
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
