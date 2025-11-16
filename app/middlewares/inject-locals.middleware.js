// Middleware pour rendre les données utilisateur disponibles dans tous les templates EJS
function injectLocals(req, res, next) {
    res.locals.role = req.userRole || undefined;
    res.locals.user = req.user || null;
    res.locals.userId = req.userId || null;
    res.locals.userPseudo = req.userPseudo || null;
    next();
  }

export { injectLocals };