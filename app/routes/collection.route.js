import { Router } from "express";
import collectionController from "../controllers/collection.controller.js";

const collectionRouter = Router();

// GET /collection/ — Ma Collection : Univers, Fonds, Cadres, Trophées (protégé, voir index.route.js)
collectionRouter.get("/", collectionController.collectionPage);

// GET /collection/univers/:genre — Fiche détaillée d'un Univers (Phase 3)
collectionRouter.get("/univers/:genre", collectionController.universDetailPage);

export default collectionRouter;
