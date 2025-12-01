import { Router } from "express";
import moviesController from "../controllers/movies.controllers.js";

const moviesRouter = Router();

// route pour les films
moviesRouter.get("/", moviesController.moviesList);

// API Route pour la recherche avancée (DOIT être avant /:genre pour éviter les conflits)
moviesRouter.get("/api/search", moviesController.searchMovies);

//Filtrage des films par genre (tous, action, comedie, drame...)
moviesRouter.get("/:genre", moviesController.filtredMovies);

export default moviesRouter;
