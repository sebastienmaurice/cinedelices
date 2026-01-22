export function isAdmin(req, res, next) {
  // Récupérer le rôle de l'utilisateur qui a été ajouté à `req` via le middleware `isAuthed`
  const userRole = req.userRole;

  // 🔹 Vérification normale
  if (userRole === "admin") {
    return next();
  }

  // 🔹 Accès interdit
  res.status(403).render("error", {
    error: "403",
    message: "Route interdite. Vous n'êtes pas administrateur.",
    role: req.userRole,
  });
}
