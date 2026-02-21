/**
 * Utilitaires de recherche avancée pour les films
 * Fonctionnalités : Fuzzy search, phonétique, scoring
 */

/**
 * Calcul de la distance de Levenshtein entre deux chaînes
 * Plus la distance est faible, plus les chaînes sont similaires
 * 
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Distance de Levenshtein (0 = identique)
 */
export function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Tableau pour stocker les distances
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialisation : coût pour transformer une chaîne vide
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Calcul de la distance
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // Suppression
        dp[i][j - 1] + 1,      // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  
  return dp[m][n];
}

/**
 * Normalise une chaîne pour la recherche
 * Retire les accents, convertit en minuscules, retire la ponctuation
 * 
 * @param {string} text - Texte à normaliser
 * @returns {string} - Texte normalisé
 */
export function normalizeText(text) {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .normalize("NFD")                    // Décompose les accents
    .replace(/[\u0300-\u036f]/g, "")     // Retire les accents
    .replace(/[^\w\s]/g, "")             // Retire la ponctuation
    .replace(/\s+/g, " ")                // Normalise les espaces
    .trim();
}

/**
 * Calcule un score de similarité entre 0 et 1
 * 1 = identique, 0 = complètement différent
 * 
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Score de similarité (0-1)
 */
export function similarityScore(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  
  // Si identique après normalisation
  if (normalized1 === normalized2) return 1;
  
  // Calcul de la distance de Levenshtein
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  if (maxLength === 0) return 1;
  
  // Score basé sur la distance (plus la distance est faible, plus le score est élevé)
  return 1 - (distance / maxLength);
}

/**
 * Vérifie si un texte contient une sous-chaîne (recherche exacte)
 * 
 * @param {string} text - Texte dans lequel chercher
 * @param {string} query - Chaîne à rechercher
 * @returns {boolean} - true si trouvé
 */
export function exactMatch(text, query) {
  if (!text || !query) return false;
  return normalizeText(text).includes(normalizeText(query));
}

/**
 * Extrait les mots-clés d'une requête de recherche
 * Retire les articles et mots communs
 * 
 * @param {string} query - Requête de recherche
 * @returns {string[]} - Tableau de mots-clés
 */
export function extractKeywords(query) {
  const stopWords = [
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou",
    "sa", "son", "ses", "à", "au", "aux", "avec", "pour", "dans",
    "sur", "sous", "par", "pour", "vers", "dans", "parmi",
  ];
  
  return normalizeText(query)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word));
}

/**
 * Score de pertinence pour un film
 * Combine plusieurs facteurs : exact match, fuzzy, phonétique, etc.
 * 
 * @param {object} movie - Objet film
 * @param {string} query - Requête de recherche
 * @returns {number} - Score de pertinence (0-100)
 */
export function calculateRelevanceScore(movie, query) {
  if (!movie || !query) return 0;
  
  const normalizedQuery = normalizeText(query);
  let score = 0;
  
  // 1. Correspondance exacte dans le titre (poids: 40)
  const titleNormalized = normalizeText(movie.title || "");
  if (titleNormalized === normalizedQuery) {
    score += 40;
  } else if (titleNormalized.startsWith(normalizedQuery)) {
    score += 35;
  } else if (exactMatch(movie.title, query)) {
    score += 30;
  }
  
  // 2. Score de similarité fuzzy (poids: 30)
  const fuzzyScore = similarityScore(movie.title, query);
  score += fuzzyScore * 30;
  
  // 3. Recherche dans le genre (poids: 15)
  if (exactMatch(movie.genre, query)) {
    score += 15;
  }
  
  // 4. Recherche par année (poids: 10)
  if (movie.year && query.match(/\d{4}/)) {
    const yearQuery = parseInt(query.match(/\d{4}/)[0]);
    if (movie.year === yearQuery) {
      score += 10;
    } else if (Math.abs(movie.year - yearQuery) <= 2) {
      score += 5;
    }
  }
  
  // 5. Bonus pour films validés (poids: 5)
  if (movie.status === "approved") {
    score += 5;
  }
  
  return Math.min(score, 100); // Limite à 100
}

/**
 * Trie les films par score de pertinence décroissant
 * 
 * @param {Array} movies - Tableau de films avec scores
 * @returns {Array} - Tableau trié
 */
export function sortByRelevance(movies) {
  return movies.sort((a, b) => {
    // Priorité au score de pertinence
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // En cas d'égalité, trier par titre alphabétique
    return (a.title || "").localeCompare(b.title || "");
  });
}
