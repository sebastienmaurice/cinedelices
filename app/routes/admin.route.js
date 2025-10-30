import { Router } from "express";
import adminController from "../controllers/admin.controllers.js";
import { isAdmin } from "../middlewares/is-admin.middleware.js";

const adminRouter = Router();

adminRouter.get("/admin", isAdmin, adminController.admin);

export default adminRouter;
