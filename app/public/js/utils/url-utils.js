/**
 * Utilitaires centralisés pour la manipulation d'URL
 * Ciné Délices - Refactoring Étape 3.3
 *
 * Ce module centralise les fonctions de manipulation d'URL qui étaient dupliquées
 * dans tmdb-validator.js, tmdb-form-prefill.js et movie-autocomplete-form.js.
 *
 * Avantages :
 * - Réduction de 3 fonctions dupliquées
 * - Cohérence de la gestion des URLs
 * - Facilité de maintenance
 */

/**
 * Met à jour l'URL pour supprimer les paramètres de requête spécifiés
 * Utilisé notamment pour nettoyer les paramètres tmdb_id et title après sélection d'un film
 *
 * @param {Array<string>} paramsToRemove - Tableau des noms de paramètres à supprimer
 *
 * @example
 * // Supprimer tmdb_id et title
 * removeURLParams(['tmdb_id', 'title']);
 */
function removeURLParams(paramsToRemove = []) {
  const url = new URL(window.location.href);

  // Supprimer chaque paramètre de la liste
  paramsToRemove.forEach((param) => {
    url.searchParams.delete(param);
  });

  // Mettre à jour l'URL sans recharger la page
  window.history.replaceState({}, "", url.toString());
}

/**
 * Met à jour l'URL pour supprimer les paramètres tmdb_id et title
 * Fonction spécifique utilisée après sélection d'un film pour nettoyer l'URL
 *
 * Refactoring : remplace la fonction updateURL() dupliquée dans 3 fichiers
 */
function cleanMovieParamsFromURL() {
  removeURLParams(["tmdb_id", "title"]);
}

// Exposer les fonctions globalement pour utilisation dans les scripts non-modulaires
// Refactoring : centralisation des fonctions updateURL dupliquées
window.removeURLParams = removeURLParams;
window.cleanMovieParamsFromURL = cleanMovieParamsFromURL;
