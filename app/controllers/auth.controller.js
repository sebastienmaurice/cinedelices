const authController = {
  me(req, res) {
    res.send("page auth");
  },
  register(req, res) {
    res.send("page auth register");
  },
  login(req, res) {
    res.send("page auth login");
  },
};

export default authController;
