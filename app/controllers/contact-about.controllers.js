const contactAboutController = {
  // Page Contact + À propos
  contactAbout(req, res) {
    res.render("contact-about", { role: req.userRole });
  },
};

export default contactAboutController;
