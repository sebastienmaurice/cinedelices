import {
  Recipe,
  Movie,
  Notice,
  User,
  UsersRecipes,
} from "../models/index.model.js";
const adminController = {
  // Page principale admin
  // accueil admin
  //!route fonctionnelle
  async admin(req, res) {
    try {
      const recipes = await Recipe.findAll({
        where: { status: "false" },
      });
      const movies = await Movie.findAll({
        where: { status: "false" },
      });
      const avis = await Notice.findAll();
      const users = await User.findAll();

      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        role: req.userRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },

  // Soumission du formulaire d'ajout de recette (POST)
  saveMovieRecipe(req, res) {
    res.send("POST saveMovieRecipe - à implémenter");
  },

  // Liste des recettes pour admin
  listRecipes(req, res) {
    res.send("Liste des recettes - à implémenter");
  },

  //! en cours de construction Page d'édition d'une recette

  async editRecipe(req, res) {
    try {
      const recipes = await Recipe.findAll({
        where: { status: "false" },
      });
      const movies = await Movie.findAll({
        where: { status: "false" },
      });
      const avis = await Notice.findAll();
      const users = await User.findAll();
      const recipeId = req.params.id;
      const upRecipe = await Recipe.findByPk(recipeId);
      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        upRecipe,
        role: req.userRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },

  // Soumission de la modification d'une recette
  updateRecipe(req, res) {
    res.send("mettre a jour recette");
  },

  // Suppression d'une recette
  deleteRecipe(req, res) {
    res.send("supprimer une recette");
  },

  // Valider une recette
  validateRecipe(req, res) {
    res.send("valider une recette");
  },

  //! Supprimer un utilisateur
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Vérifier si l'utilisateur existe
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).render("error", {
          error: "404",
          message: "Utilisateur introuvable.",
          role: req.userRole,
        });
      }

      // Supprimer d'abord les notices (avis) associées à cet utilisateur
      // Supprimer les entrées dans la table de jonction UsersRecipes
      await Notice.destroy({ where: { id_user: userId } });
      await UsersRecipes.destroy({ where: { id_user: userId } });

      // Ensuite, supprimer l'utilisateur
      await User.destroy({ where: { id: userId } });

      // Rediriger vers le tableau de bord admin avec un message de succès
      res.redirect("/admin?success=user_deleted");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur lors de la suppression de l'utilisateur.",
        role: req.userRole,
      });
    }
  },
};

export default adminController;
