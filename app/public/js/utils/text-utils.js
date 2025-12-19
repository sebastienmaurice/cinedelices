/**
 * Utilitaires centralisés pour la manipulation de texte
 * Ciné Délices - Refactoring Étape 3.3
 *
 * Ce module centralise les fonctions de normalisation de texte qui étaient
 * similaires dans tmdb-validator.js et movie-search-advanced.js.
 *
 * Avantages :
 * - Réduction de duplication
 * - Cohérence de la normalisation de texte
 * - Facilité de maintenance
 */

/**
 * Normalise un texte pour la recherche ou la comparaison
 * Convertit en minuscules, supprime les accents et nettoie les espaces
 *
 * @param {string} text - Texte à normaliser
 * @returns {string} - Texte normalisé
 *
 * @example
 * normalizeText("Café"); // "cafe"
 * normalizeText("Les Goonies"); // "les goonies"
 */
function normalizeText(text) {
  if (!text) return "";

  return text
    .toLowerCase() // Convertir en minuscules
    .normalize("NFD") // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .trim(); // Supprimer les espaces en début/fin
}

/**
 * Normalise un titre de film pour la comparaison
 * Utilisé pour comparer des titres en ignorant les accents et la casse
 *
 * @param {string} title - Titre à normaliser
 * @returns {string} - Titre normalisé
 *
 * @example
 * normalizeTitle("L'Arche"); // "larche"
 */
function normalizeTitle(title) {
  return normalizeText(title);
}

// Exposer les fonctions globalement pour utilisation dans les scripts non-modulaires
// Refactoring : centralisation des fonctions de normalisation similaires
window.normalizeText = normalizeText;
window.normalizeTitle = normalizeTitle;
