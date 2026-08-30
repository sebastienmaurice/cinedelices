// route pour aiguillage vers les autres

import { Router } from "express";
import authRouter from "./auth.route.js";
import homeRouter from "./home.route.js";
import adminRouter from "./admin.route.js";
import moviesRouter from "./movies.route.js";
import recipesRouter from "./recipes-movie.route.js";
import addRecipesMoviesRouter from "./add-recipes-movies.route.js";
import contactAboutRouter from "./contact-about.route.js";
import tmdbRouter from "./tmdb.route.js";
import favoritesRouter from "./favorites.route.js";
import ratingsRouter from "./ratings.route.js";
import noticesRouter from "./notices.route.js";
import authorRouter from "./author.route.js";
import mentionsLegalesRouter from "./mentions-legales.route.js";
import sitemapRouter from "./sitemap.route.js";
import cinepassRouter from "./cinepass.route.js";
import contributionsRouter from "./contributions.route.js";
import collectionRouter from "./collection.route.js";
import { isAdmin } from "../middlewares/is-admin.middleware.js";
import { isLogged } from "../middlewares/is-authed.middleware.js";

const router = Router();

router.use(sitemapRouter);
router.use("/auth", authRouter);
router.use(homeRouter);

router.use("/movies", moviesRouter); // Ajout du préfixe /movies pour les routes movies
router.use("/admin", isAdmin, adminRouter); // Ajout du préfixe /admin pour les routes admin
router.use("/recipes-movie", recipesRouter); // Ajout du préfixe /recipes pour les routes recipes
router.use("/add-recipes-movies", isLogged, addRecipesMoviesRouter); // Route pour ajouter un film et une recette
router.use("/contact-about", contactAboutRouter); // Route pour la page de contact et à propos
router.use("/api/tmdb", isLogged, tmdbRouter); // Route API pour TMDB (protégée par authentification)
router.use("/api/favorites", favoritesRouter); // Route API pour les favoris
router.use("/api/ratings", ratingsRouter); // Route API pour les notes
router.use("/api/notices", noticesRouter); // Route API pour les interactions sur les avis (like)
router.use("/auteur", authorRouter); // Page publique auteur (gamification)
router.use("/cinepass", isLogged, cinepassRouter); // CinéPass — nouvel espace UX de la gamification (V4)
router.use("/contributions", isLogged, contributionsRouter); // Contributions — recettes/films/avis/activité
router.use("/collection", isLogged, collectionRouter); // Ma Collection — Univers cinématographiques / Fonds / Cadres / Trophées (V1 mock)
router.use("/mentions-legales", mentionsLegalesRouter); // Page mentions légales

export default router;
