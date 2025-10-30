export function isAdmin(req, res, next) {
  // Récupérer le rôle de l'utilisateur qui a été ajouté à `req` via le middleware `isAuthed`
  const userRole = req.userRole;

  if (userRole === "admin") {
    next();
  } else {
    res.send("route interdite. vous n'êtes pas admin");
  }
}
