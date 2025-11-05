const authController = {
  me(req, res) {
    res.send("page auth");
  },
  //page d'inscription
  register(req, res) {
    res.send("page auth register");
  },
  //page de connexion
  login(req, res) {
    res.send("page auth login");
  },
  //page profil
  profil(req, res) {
    res.render("user-profile"); // "user-profile" est le nom du fichier de la vue EJS
  },
  //page avis
  quote(req, res) {
    res.send("donne note et avis");
  },
  //deconnexion
  logout(req, res) {
    res.send("deconnecté: redirect to home");
  },
};

export default authController;
