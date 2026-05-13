export function isAdmin(req, res, next) {
  // Récupérer le rôle de l'utilisateur qui a été ajouté à `req` via le middleware `isAuthed`
  const userRole = req.userRole;

  // 🔹 Vérification normale
  if (userRole === "admin" || userRole === "superadmin" || userRole === "super_admin") {
    return next();
  }

  // Non connecté → ouvrir le popup de connexion
  if (!userRole) {
    return res.status(403).render("error", {
      error: "403",
      message: "Connectez-vous avec un compte administrateur pour accéder à cette page.",
      openLoginPopup: true,
    });
  }

  // Connecté mais pas admin → accès refusé
  res.status(403).render("error", {
    error: "403",
    message: "Route interdite. Vous n'êtes pas administrateur.",
  });
}
