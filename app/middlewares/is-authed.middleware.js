import jwt from "jsonwebtoken";

// Middleware pour vérifier le token JWT

function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    //return res.status(401).json({ error: "Veuillez vous connecter" });
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.user_id || !decoded.pseudo || !decoded.role) {
      throw new Error("Token invalide: données manquantes");
    }

    // Stockage des propriétés pour un accès facile
    req.user = decoded;
    req.userId = decoded.user_id;
    req.userPseudo = decoded.pseudo;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    console.error("Token invalide:", error.message);
    res.clearCookie("token");
    if (error.name === "TokenExpiredError") {
      return res.status(401).render("error", {
        error: "401",
        message: "Session expirée. Veuillez vous reconnecter",
        role: req.userRole,
      });
    } else {
      return res.status(401).render("error", {
        error: "401",
        message: "session invalide. Veuillez vous reconnecter",
        role: req.userRole,
      });
    }
  }
}

// Middleware pour injecter l'id de l'utilisateur connecté dans les params si nécessaire

function injectId(req, res, next) {
  try {
    // Si la route contient :id ou si il n'y a pas d'id dans les params, on utilise l'id du token pour s'identifier au profil de l'id connecté
    if (req.params.id === ":id" || req.params.id === undefined) {
      req.params.id = req.userId;
    }

    next();
  } catch (error) {
    console.error("Token invalide:", error.message);
    res.clearCookie("token");
    if (error.name === "TokenExpiredError") {
      return res.status(401).render("error", {
        error: "401",
        message: "Session expirée. Veuillez vous reconnecter",
        role: req.userRole,
      });
    } else {
      return res.status(401).render("error", {
        error: "401",
        message: "Session invalide. Veuillez vous reconnecter",
        role: req.userRole,
      });
    }
  }
}

function isLogged(req, res, next) {
  const userRole = req.userRole;

  // Vérification normale
  if (userRole === "user" || userRole === "admin") {
    next();
  } else {
    // Accès interdit

    res.status(403).render("error", {
      error: "403",
      message: "Route interdite. Vous n'êtes pas connecté.",
      role: req.userRole,
    });
  }
}

export { verifyToken, injectId, isLogged };
