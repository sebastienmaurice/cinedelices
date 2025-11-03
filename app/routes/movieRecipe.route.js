import { Router } from "express";

const movieRecipeRouter = Router();

// GET pour afficher le formulaire
movieRecipeRouter.get("/add-movie-recipe", (req, res) => {
  res.render("add-movie-recipe"); // ton fichier ejs dans views
});

export default movieRecipeRouter;
