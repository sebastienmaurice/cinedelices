import { Router } from "express";
import moviesController from "../controllers/movies.controllers.js";

const moviesRouter = Router();

// route pour les films
moviesRouter.get("/", moviesController.moviesList);


//Filtrage des films par genre (tous, action, comedie, drame...)
moviesRouter.get("/:genre", moviesController.filtredMovies);

export default moviesRouter;
