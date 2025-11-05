import { Router } from "express";
import moviesController from "../controllers/movies.controllers.js";

const moviesRouter = Router();

// route principale
moviesRouter.get("/", moviesController.moviesList);

//!changer les methodes selon les besoins
//Filtrage des films par genre (tous, action, comedie, drame...)
moviesRouter.get("/filtredMovies", moviesController.filtredMovies);



export default moviesRouter;
