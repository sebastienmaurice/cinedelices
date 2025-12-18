/**
 * Helper centralisé pour la gestion des erreurs HTTP
 * Ciné Délices - Refactoring Étape 2
 *
 * Ce module centralise la gestion des erreurs 404 (ressource non trouvée)
 * et 500 (erreur serveur) qui étaient dupliquées dans tous les controllers.
 *
 * Avantages :
 * - Réduction de ~25-30 blocs de code dupliqué
 * - Cohérence des messages d'erreur
 * - Facilité de maintenance (modification en un seul endroit)
 * - Code plus lisible dans les controllers
 */

/**
 * Rend une page d'erreur 404 (ressource non trouvée)
 *
 * @param {Object} res - Objet response Express
 * @param {string} resourceType - Type de ressource (ex: "Film", "Recette", "Utilisateur")
 * @param {string} userRole - Rôle de l'utilisateur (pour l'affichage conditionnel dans la vue)
 * @returns {Object} - Réponse HTTP 404 avec rendu de la vue error
 *
 * @example
 * if (!movie) {
 *   return renderNotFound(res, "Film", req.userRole);
 * }
 */
export function renderNotFound(res, resourceType = "Ressource", userRole = null) {
  return res.status(404).render("error", {
    error: "404",
    message: `${resourceType} introuvable.`,
    role: userRole,
  });
}

/**
 * Rend une page d'erreur 500 (erreur serveur)
 *
 * @param {Object} res - Objet response Express
 * @param {Error} error - L'erreur capturée (optionnel, pour le logging)
 * @param {string} userRole - Rôle de l'utilisateur (pour l'affichage conditionnel dans la vue)
 * @param {string} customMessage - Message d'erreur personnalisé (optionnel)
 * @returns {Object} - Réponse HTTP 500 avec rendu de la vue error
 *
 * @example
 * try {
 *   // code...
 * } catch (error) {
 *   return renderServerError(res, error, req.userRole);
 * }
 */
export function renderServerError(res, error = null, userRole = null, customMessage = null) {
  // Log l'erreur dans la console pour le debugging (si disponible)
  if (error) {
    console.error("Erreur serveur:", error);
  }

  return res.status(500).render("error", {
    error: "500",
    message: customMessage || "Erreur serveur.",
    role: userRole,
  });
}

/**
 * Gère les erreurs de manière générique (wrapper pour try/catch)
 * Utile si on veut centraliser encore plus la gestion d'erreurs
 *
 * @param {Function} asyncFn - Fonction asynchrone à exécuter
 * @param {Object} res - Objet response Express
 * @param {string} userRole - Rôle de l'utilisateur
 * @param {string} customMessage - Message d'erreur personnalisé
 *
 * @example
 * await handleAsyncError(async () => {
 *   const movie = await Movie.findByPk(id);
 *   // ...
 * }, res, req.userRole);
 */
export async function handleAsyncError(asyncFn, res, userRole = null, customMessage = null) {
  try {
    return await asyncFn();
  } catch (error) {
    return renderServerError(res, error, userRole, customMessage);
  }
}
