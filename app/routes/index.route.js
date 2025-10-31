//route pour aiguillage vers les autres

import { Router } from "express";
import authRouter from "./auth.route.js";
import homeRouter from "./home.route.js";
import adminRouter from "./admin.route.js";
import moviesRouter from "./movies.route.js";

const router = Router();
router.use(authRouter);
router.use(homeRouter);
router.use("/movies", moviesRouter); // Ajout du préfixe /movies pour les routes movies
router.use("/admin", adminRouter); // Ajout du préfixe /admin pour les routes admin

export default router;
