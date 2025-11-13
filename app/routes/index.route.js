// route pour aiguillage vers les autres

import { Router } from "express";
import authRouter from "./auth.route.js";
import homeRouter from "./home.route.js";
import adminRouter from "./admin.route.js";
import moviesRouter from "./movies.route.js";
import recipesRouter from "./recipes-movie.route.js";
import addRecipesMoviesRouter from "./add-recipes-movies.route.js";
import { verifyToken } from "../middlewares/is-authed.middleware.js";
import { isAdmin } from "../middlewares/is-admin.middleware.js";

import { isAdmin } from "../middlewares/is-admin.middleware.js";

const router = Router();

router.use("/auth", authRouter);
router.use(homeRouter);

router.use("/movies", moviesRouter); // Ajout du préfixe /movies pour les routes movies
router.use("/admin", isAdmin, adminRouter); // Ajout du préfixe /admin pour les routes admin
router.use("/recipes-movie", recipesRouter); // Ajout du préfixe /recipes pour les routes recipes
router.use("/add-recipes-movies", addRecipesMoviesRouter); // Route pour ajouter un film et une recette

export default router;
