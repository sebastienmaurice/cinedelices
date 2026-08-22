import { Router } from "express";
import tmdbController from "../controllers/tmdb.controllers.js";

const tmdbRouter = Router();

// Recherche TMDB — un type (movie|tv) par appel, projection minimale, cache 24h.
// Utilisé par l'étape 01 "Mon film ou ma série" du formulaire d'ajout.
tmdbRouter.get("/search", tmdbController.proxySearch);

// Détail complet (+ crédits) d'une fiche TMDB, cache 24h — fiche importée étape 01.
tmdbRouter.get("/detail", tmdbController.proxyDetail);

// Legacy — anciens endpoints combinés movie+tv / crédits-only, plus appelés
// par aucune page mais conservés pour référence.
tmdbRouter.get("/details", tmdbController.getMovieDetails);

export default tmdbRouter;

