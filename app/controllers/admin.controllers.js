const adminController = {
  //accueil admin
  admin(req, res) {
    res.send("page admin");
  },

  // Supprimer une recette
  deleteRecipe(req, res) {
    res.send("supprimer une recette");
  },

  // modifier une recette
  updateRecipe(req, res) {
    res.send("mettre a jour recette");
  },

  // valider une recette
  validateRecipe(req, res) {
    res.send("valider une recette");
  },

  // supprimer un utilisateur
  deleteUser(req, res) {
    res.send("supprimer utilisateur");
  },
};

export default adminController;
