/**
 * Helpers génériques pour la validation et le rejet d'entités (Movie, Recipe)
 * Ciné Délices - Refactoring Étape 2
 *
 * ⚠️ NOTE : Ce module est préparé mais pas encore utilisé dans le code.
 * Il pourrait être utilisé pour simplifier les fonctions validateMovie/validateRecipe
 * et rejectMovie/rejectRecipe dans admin.controllers.js dans une future refactorisation.
 *
 * Ce module centralise les fonctions validateMovie/validateRecipe et rejectMovie/rejectRecipe
 * qui avaient un pattern très similaire dans admin.controllers.js.
 *
 * Avantages :
 * - Réduction de 4 fonctions similaires à 2 fonctions génériques
 * - Cohérence des messages d'erreur et redirections
 * - Facilité de maintenance
 */

/**
 * Valide une entité (passe status à true)
 *
 * @param {Object} Model - Modèle Sequelize (Movie, Recipe, etc.)
 * @param {number} entityId - ID de l'entité à valider
 * @param {string} successParam - Paramètre de succès pour la redirection (ex: "movie_validated")
 * @param {string} entityType - Type d'entité pour les messages d'erreur (ex: "film", "recette")
 * @returns {Promise<Object>} - Résultat de l'update Sequelize
 *
 * @example
 * await validateEntity(Movie, movieId, "movie_validated", "film");
 */
export async function validateEntity(Model, entityId, successParam, entityType = "entité") {
  await Model.update(
    { status: true },
    { where: { id: entityId } }
  );
}

/**
 * Rejette (supprime) une entité
 *
 * @param {Object} Model - Modèle Sequelize (Movie, Recipe, etc.)
 * @param {number} entityId - ID de l'entité à rejeter
 * @param {string} successParam - Paramètre de succès pour la redirection (ex: "movie_rejected")
 * @param {string} entityType - Type d'entité pour les messages d'erreur (ex: "film", "recette")
 * @returns {Promise<number>} - Nombre d'entités supprimées
 *
 * @example
 * await rejectEntity(Movie, movieId, "movie_rejected", "film");
 */
export async function rejectEntity(Model, entityId, successParam, entityType = "entité") {
  return await Model.destroy({
    where: { id: entityId },
  });
}
