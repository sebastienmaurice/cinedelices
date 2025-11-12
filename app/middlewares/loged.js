import jwt from "jsonwebtoken";



function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/?openModal=true");
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

    // Si la route contient :id ou si il n'y a pas d'id dans les params, on utilise l'id du token pour s'identifier au profil de l'id connecté
    if (req.params.id === ':id' || req.params.id === undefined) {
      req.params.id = req.userId;
    }

    next();
  } catch (error) {
    console.error('Token invalide:', error.message);
    res.clearCookie('token');
    if (error.name === 'TokenExpiredError') {
      return res.redirect("/?openModal=true&error=session_expired");
    } else {
      return res.redirect("/?openModal=true&error=invalid_token");
    }
  }
}

export {verifyToken};



