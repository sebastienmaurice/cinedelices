import jwt from "jsonwebtoken";

function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.redirect("/login");
  }
}

app.get("/profil/:id", verifyToken, (req, res) => {
  res.render("profil", { user: req.user });
});