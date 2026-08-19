import { Router } from "express";
import tmdbController from "../controllers/tmdb.controllers.js";

const tmdbRouter = Router();

// Recherche de film via TMDB
tmdbRouter.get("/search", tmdbController.searchMovie);

// Détails complémentaires (réalisateur, compositeur, casting, bande-annonce)
tmdbRouter.get("/details", tmdbController.getMovieDetails);

export default tmdbRouter;

