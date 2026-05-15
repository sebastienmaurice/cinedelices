import { Router } from "express";
import homeController from "../controllers/home.controllers.js";

const homeRouter = Router();

homeRouter.get("/", homeController.home);
homeRouter.get("/sitemap.xml", homeController.sitemap);

export default homeRouter;
