import { Router } from "express";
import contributionsController from "../controllers/contributions.controller.js";

const contributionsRouter = Router();

// GET /contributions/ — nouvel espace « ce que j'apporte à Ciné Délices » (protégé, voir index.route.js)
contributionsRouter.get("/", contributionsController.contributionsPage);

export default contributionsRouter;
