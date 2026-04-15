import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.render("mentions-legales", { title: "Mentions légales · Ciné Délices" });
});

export default router;
