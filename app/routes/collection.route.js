import { Router } from "express";
import collectionController from "../controllers/collection.controller.js";

const collectionRouter = Router();

// GET /collection/ — Ma Collection : Univers, Fonds, Cadres, Trophées (protégé, voir index.route.js)
collectionRouter.get("/", collectionController.collectionPage);

// GET /collection/univers/:genre — Fiche détaillée d'un Univers (Phase 3)
collectionRouter.get("/univers/:genre", collectionController.universDetailPage);

// POST /collection/univers/:genre/fond — Équiper un Fond débloqué (Phase 15)
collectionRouter.post("/univers/:genre/fond", collectionController.equiperFond);

// POST /collection/univers/:genre/cadre — Équiper un Cadre débloqué (Phase 15)
collectionRouter.post("/univers/:genre/cadre", collectionController.equiperCadre);

// POST /collection/univers-actif — Définir l'Univers actif (Phase 15)
collectionRouter.post("/univers-actif", collectionController.setUniversActif);

export default collectionRouter;
