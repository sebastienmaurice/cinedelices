import { Router } from "express";
import authorController from "../controllers/author.controller.js";

const authorRouter = Router();

// Page publique d'un auteur : GET /auteur/:id
authorRouter.get("/:id", authorController.authorPage);

export default authorRouter;
