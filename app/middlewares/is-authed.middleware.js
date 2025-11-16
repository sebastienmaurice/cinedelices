import jwt from "jsonwebtoken";

// Middleware pour vérifier le token JWT

function verifyToken(req, res, next) {
  // On récupère le token JWT stocké dans les cookies du navigateur
  const token = req.cookies.token;
  
  // Si aucun token n'est trouvé (utilisateur pas connecté)
  if (!token) {
    // ➡️ On laisse passer quand même (pas d'erreur)
    // L'utilisateur pourra accéder aux pages publiques
    // Mais req.userRole restera undefined
    return next();
  }
  
  // Si un token existe, on essaie de le vérifier
  try {
    // On décode le token avec la clé secrète
    // Si le token est valide, decoded contiendra les données (user_id, pseudo, role)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // On vérifie que toutes les données importantes sont présentes
    if (!decoded.user_id || !decoded.pseudo || !decoded.role) {
      // S'il manque des données, on considère le token comme invalide
      throw new Error("Token invalide: données manquantes");
    }
    
    // On stocke les données décodées dans req pour les utiliser partout
    req.user = decoded;              // Objet complet
    req.userId = decoded.user_id;     // ID de l'utilisateur
    req.userPseudo = decoded.pseudo;  // Pseudo de l'utilisateur
    req.userRole = decoded.role;      // Rôle (admin ou user)
    
    // ➡️ Tout est OK, on passe à la suite (route suivante ou middleware suivant)
    next();
    
  } catch (error) {
    // Si une erreur se produit (token invalide, expiré, ou corrompu)
    
    // On log l'erreur dans la console pour le debug
    console.error("Token invalide:", error.message);
    
    // On supprime le cookie invalide du navigateur
    res.clearCookie("token");
    
    // On vérifie si c'est une erreur d'expiration
    if (error.name === "TokenExpiredError") {
      // Token expiré : message spécifique
      return res.status(401).render("error", {
        error: "401",  // Code d'erreur HTTP
        message: "Session expirée. Veuillez vous reconnecter",
        role: undefined,  // Pas de rôle car token invalide
      });
    } else {
      // Autre erreur (token modifié, signature invalide, etc.)
      return res.status(401).render("error", {
        error: "401",
        message: "Session invalide. Veuillez vous reconnecter",
        role: undefined,  // Pas de rôle car token invalide
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
