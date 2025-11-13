const homeController = {
  //page d'accueil
  home(req, res) {
    // recuperation du role de l'user pour dynamiser page suivant ses authorisations => { role: req.userRole }req.userRole

    res.render("home", { role: req.userRole });
  },
};

export default homeController;
