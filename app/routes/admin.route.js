import { Router } from "express";
import adminController from "../controllers/admin.controllers.js";
import { isAdmin } from "../middlewares/is-admin.middleware.js";

const adminRouter = Router();

//?prefix /admin dans index.route.js pourtoutes les routes ci-dessous

// routes page admin
adminRouter.get("/", isAdmin, adminController.admin);
// routes recettes/films
//! GET a remplacer par la bonne methode (DELETE, PUT, PATCH...)
adminRouter.get("/deleteR", adminController.deleteRecipe);
adminRouter.get("/updateR", adminController.updateRecipe);
adminRouter.get("/validateR", adminController.validateRecipe);

// routes utilisateurs
//! GET a remplacer par la bonne methode (DELETE, PUT, PATCH...)
adminRouter.get("/deleteU", adminController.deleteUser);

export default adminRouter;
