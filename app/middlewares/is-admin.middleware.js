export function isAdmin(req, res, next) {
  // Récupérer le rôle de l'utilisateur qui a été ajouté à `req` via le middleware `isAuthed`
  const userRole = req.userRole;

  // 🔹 Si on est en dev et que req.userRole n'est pas défini, on peut forcer l'admin
  if (!userRole && process.env.NODE_ENV === "development") {
    console.warn("⚠️ Aucun rôle trouvé, on simule un admin en dev");
    req.userRole = "admin";
    return next();
  }

  // 🔹 Vérification normale
  if (userRole === "admin") {
    return next();
  }

  // 🔹 Accès interdit
  res.status(403).send("Route interdite. Vous n'êtes pas admin.");
}
