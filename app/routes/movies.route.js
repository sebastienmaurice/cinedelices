import { Router } from "express";
import moviesController from "../controllers/movies.controllers.js";

const moviesRouter = Router();

// route pour les films
moviesRouter.get("/", moviesController.moviesList);

// API Route pour la recherche avancée (DOIT être avant /:genre pour éviter les conflits)
moviesRouter.get("/api/search", moviesController.searchMovies);

// API Route pour la recherche avancée avec fuzzy search et enrichissement TMDB
moviesRouter.get("/search-advanced", moviesController.searchMoviesAdvanced);

// API Route pour récupérer les infos complètes d'un film TMDB (DOIT être avant /:genre)
moviesRouter.get("/get-tmdb-info/:tmdb_id", moviesController.getTmdbInfo);

//Filtrage des films par genre (tous, action, comedie, drame...)
moviesRouter.get("/:genre", moviesController.filtredMovies);

export default moviesRouter;
