// /app/routes/user-profile.route.js
import { Router } from "express";

const router = Router();

// Route pour afficher la page user-profile
router.get("/profil", (req, res) => {
  res.render("user-profile");
});

export default router;
