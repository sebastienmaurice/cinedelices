import { Router } from "express";
import homeController from "../controllers/home.controllers.js";

const homeRouter = Router();
// route principale
homeRouter.get("/", homeController.home);

export default homeRouter;
