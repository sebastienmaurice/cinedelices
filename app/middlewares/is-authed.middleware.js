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
    console.error("Token invalide:", error.message);
    res.clearCookie("token");

    // Pour les requêtes AJAX/API, retourner du JSON au lieu de HTML
    const isAjax = req.headers.accept?.includes("application/json") ||
                   req.headers["x-requested-with"] === "XMLHttpRequest" ||
                   req.path.startsWith("/api/");

    if (isAjax) {
      return res.status(401).json({
        success: false,
        message: error.name === "TokenExpiredError"
          ? "Session expirée. Veuillez vous reconnecter"
          : "Session invalide. Veuillez vous reconnecter",
        code: "AUTH_EXPIRED",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).render("error", {
        error: "401",
        message: "Session expirée. Veuillez vous reconnecter",
      });
    } else {
      return res.status(401).render("error", {
        error: "401",
        message: "Session invalide. Veuillez vous reconnecter",
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
        });
    } else {
      return res.status(401).render("error", {
        error: "401",
        message: "Session invalide. Veuillez vous reconnecter",
        });
    }
  }
}

function isLogged(req, res, next) {
  const userRole = req.userRole;

  // Vérification normale
  if (userRole === "user" || userRole === "admin" || userRole === "super_admin") {
    next();
  } else {
    // Accès interdit - on ajoute un paramètre pour ouvrir le popup
    res.status(403).render("error", {
      error: "403",
      message: "Route interdite. Vous n'êtes pas connecté.",
      openLoginPopup: true  // 👈 Nouveau paramètre
    });
  }
}

/**
 * Middleware pour les routes API uniquement
 * Retourne du JSON au lieu de HTML en cas d'erreur
 *
 * POURQUOI CE MIDDLEWARE SÉPARÉ ?
 * - Les pages web attendent du HTML (render)
 * - Les APIs attendent du JSON
 * - C'est une bonne pratique REST
 */
function isLoggedApi(req, res, next) {
  const userRole = req.userRole;

  if (userRole === "user" || userRole === "admin" || userRole === "super_admin") {
    next();
  } else {
    // Pour les API, on retourne TOUJOURS du JSON
    res.status(401).json({
      success: false,
      message: "Vous devez être connecté pour effectuer cette action",
      code: "AUTH_REQUIRED"
    });
  }
}

export { verifyToken, injectId, isLogged, isLoggedApi };
