/**
 * Helper pour générer les chemins d'images de films (banners, cards, originals)
 * depuis le chemin original stocké en BDD.
 *
 * LOGIQUE DE STOCKAGE :
 * - La BDD stocke le chemin original : /images/movies/movie-{title-slug}-{timestamp}.{ext}
 * - Les images traitées sont organisées dans des sous-dossiers :
 *   - Banners : /images/movies/banners/banner-{title-slug}.{ext}
 *   - Cards   : /images/movies/cards/card-{title-slug}.{ext}
 *   - Originals : /images/movies/originals/original-{title-slug}.{ext}
 *
 * FALLBACK :
 * Si les images traitées (card, banner) n'existent pas sur disque,
 * le chemin original stocké en BDD est utilisé en remplacement.
 */

import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { cldOptimize } from "./cloudinary-url.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, "../public");

// =============================================================================
// CONFIGURATION DES CAS SPÉCIAUX
// =============================================================================

/**
 * Tableau des mots-clés spéciaux nécessitant un traitement particulier.
 *
 * POURQUOI CE TABLEAU ?
 * En français, les articles élidés comme "l'" posent problème lors de la slugification.
 * Par exemple, "L'Arche" pourrait devenir "larche" au lieu de "l-arche".
 *
 * COMMENT L'ÉTENDRE ?
 * Ajoutez simplement de nouvelles entrées au format :
 * { pattern: /regex/gi, replacement: "slug-correspondant" }
 *
 * EXEMPLES D'UTILISATION :
 * - "L'Arche de Noé" → "l-arche-de-noe"
 * - "L'Aventure commence" → "l-aventure-commence"
 */
const SPECIAL_WORDS = [
  { pattern: /\bl['']arche/gi, replacement: "l-arche" },
  { pattern: /\bl['']aventure/gi, replacement: "l-aventure" },
  { pattern: /\bl['']amour/gi, replacement: "l-amour" },
  { pattern: /\bl['']histoire/gi, replacement: "l-histoire" },
  { pattern: /\bl['']homme/gi, replacement: "l-homme" },
  { pattern: /\bl['']odyss[ée]e/gi, replacement: "l-odyssee" },
  { pattern: /\bl['']empire/gi, replacement: "l-empire" },
  { pattern: /\bl[''][ée]t[ée]/gi, replacement: "l-ete" },
  { pattern: /\bl['']hiver/gi, replacement: "l-hiver" },
  { pattern: /\bl[''][îi]le/gi, replacement: "l-ile" },
];

/**
 * Configuration des types d'images supportés.
 *
 * POURQUOI CETTE CONFIGURATION ?
 * Centralise les informations de chaque type d'image (dossier, préfixe)
 * pour faciliter l'ajout de nouveaux types sans modifier la logique principale.
 */
const IMAGE_TYPES = {
  banner: { folder: "banners", prefix: "banner" },
  card: { folder: "cards", prefix: "card" },
  original: { folder: "originals", prefix: "original" },
};

/**
 * Extension par défaut si aucune n'est détectée.
 * Utilisée uniquement en dernier recours.
 */
const DEFAULT_EXTENSION = ".jpg";

/**
 * Chemin vers l'image par défaut quand aucune image n'est disponible.
 */
const DEFAULT_MOVIE_IMAGE = "/images/image-default-movie.jpg";

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Normalise un titre de film en slug pour générer le nom de fichier.
 *
 * TRANSFORMATIONS APPLIQUÉES :
 * 1. Mise en minuscules
 * 2. Normalisation Unicode (décomposition des accents)
 * 3. Suppression des diacritiques (accents)
 * 4. Application des cas spéciaux (tableau SPECIAL_WORDS)
 * 5. Gestion des apostrophes avec l'article "l'"
 * 6. Suppression des apostrophes restantes
 * 7. Nettoyage de la ponctuation
 * 8. Conversion des espaces en tirets
 * 9. Nettoyage final (tirets multiples, tirets en début/fin)
 *
 * SÉCURITÉ :
 * Cette fonction nettoie tous les caractères potentiellement dangereux,
 * ne laissant que des lettres minuscules, chiffres et tirets.
 *
 * @param {string} title - Titre du film
 * @returns {string} - Slug normalisé (ex: "harry-potter")
 *
 * @example
 * slugifyTitle("Harry Potter") // → "harry-potter"
 * slugifyTitle("Bienvenue chez les Ch'tis") // → "bienvenue-chez-les-chtis"
 * slugifyTitle("L'Arche de Noé") // → "l-arche-de-noe"
 */
function slugifyTitle(title) {
  if (!title) return "";

  let slug = title
    .toLowerCase()
    .normalize("NFD") // Décompose les accents (é → e + ́)
    .replace(/[\u0300-\u036f]/g, ""); // Retire les diacritiques

  // Application des cas spéciaux définis dans SPECIAL_WORDS
  // POURQUOI : Permet de gérer proprement les articles élidés français
  for (const { pattern, replacement } of SPECIAL_WORDS) {
    slug = slug.replace(pattern, replacement);
  }

  return slug
    .replace(/\bl\s*['']\s*/g, "l-") // "l'" ou "l'" → "l-" (gère espaces optionnels)
    .replace(/['']/g, "") // Supprime les apostrophes restantes (ex: "Ch'tis" → "Chtis")
    .replace(/[^\w\s-]/g, "") // Retire la ponctuation sauf tirets
    .replace(/\s+/g, "-") // Remplace espaces par tirets
    .replace(/_/g, "-") // Remplace underscores par tirets
    .replace(/-+/g, "-") // Remplace tirets multiples par un seul
    .replace(/^-+|-+$/g, "") // Retire tirets en début/fin
    .trim();
}

/**
 * Extrait l'extension d'un chemin de fichier.
 *
 * POURQUOI CETTE FONCTION ?
 * Permet de conserver l'extension originale du fichier au lieu de forcer .jpg,
 * assurant ainsi la cohérence entre les différents types d'images.
 *
 * @param {string} path - Chemin du fichier
 * @returns {string} - Extension avec le point (ex: ".jpg", ".png") ou extension par défaut
 */
function extractExtension(path) {
  if (!path) return DEFAULT_EXTENSION;

  const match = path.match(/\.[a-zA-Z0-9]+$/);
  return match ? match[0].toLowerCase() : DEFAULT_EXTENSION;
}

/**
 * Vérifie si une chaîne ressemble à un timestamp Unix (13 chiffres pour ms, 10 pour s).
 *
 * POURQUOI CETTE VÉRIFICATION ?
 * Les timestamps Unix ont généralement 10 chiffres (secondes) ou 13 chiffres (millisecondes).
 * Un nombre comme "2001" (4 chiffres) n'est probablement PAS un timestamp mais une année.
 *
 * AMÉLIORATION PAR RAPPORT À L'ANCIENNE VERSION :
 * L'ancien code considérait tout nombre comme un potentiel timestamp.
 * Cette version est plus précise et évite les faux positifs.
 *
 * @param {string} str - Chaîne à vérifier
 * @returns {boolean} - true si c'est probablement un timestamp
 */
function isLikelyTimestamp(str) {
  if (!/^\d+$/.test(str)) return false;

  const length = str.length;
  // Les timestamps Unix : 10 chiffres (secondes) ou 13 chiffres (millisecondes)
  // On accepte aussi 9-14 chiffres pour être flexible
  return length >= 9 && length <= 14;
}

/**
 * Extrait le slug du film depuis un chemin original de la BDD.
 *
 * FORMATS SUPPORTÉS :
 * 1. Format original : "movie-{slug}-{timestamp1}-{timestamp2}.{ext}"
 * 2. Format originals : "original-{slug}.{ext}"
 *
 * CORRECTION DE LA DÉTECTION DE TIMESTAMPS :
 * L'ancienne version considérait tout nombre comme un timestamp, ce qui causait
 * des problèmes avec des slugs contenant des années (ex: "2001-l-odyssee").
 *
 * La nouvelle version vérifie que les nombres ont la longueur typique
 * d'un timestamp Unix (9-14 chiffres) avant de les supprimer.
 *
 * @param {string} originalPath - Chemin original depuis la BDD
 * @returns {string|null} - Slug extrait ou null si impossible
 *
 * @example
 * extractSlugFromPath("/images/movies/movie-harry_potter-1763858232674-340071843.png")
 * // → "harry-potter"
 *
 * extractSlugFromPath("/images/movies/movie-2001-odyssee-1763858232674-340071843.png")
 * // → "2001-odyssee" (les années sont préservées, seuls les vrais timestamps sont retirés)
 */
function extractSlugFromPath(originalPath) {
  if (!originalPath) return null;

  try {
    // Extraire le nom de fichier
    const filename = originalPath.split("/").pop();

    if (!filename) {
      return null;
    }

    // Format "original-{slug}.{ext}" (dossier originals/)
    if (filename.startsWith("original-")) {
      const withoutPrefix = filename.replace(/^original-/, "");
      const withoutExt = withoutPrefix.replace(/\.[^.]+$/, "");
      return slugifyTitle(withoutExt);
    }

    // Format "movie-{slug}-{timestamp1}-{timestamp2}.{ext}"
    if (filename.startsWith("movie-")) {
      const withoutPrefix = filename.replace(/^movie-/, "");
      const withoutExt = withoutPrefix.replace(/\.[^.]+$/, "");

      const parts = withoutExt.split("-");

      // CORRECTION : Vérification améliorée des timestamps
      // On retire uniquement les parties qui ressemblent à de vrais timestamps Unix
      // (nombres de 9-14 chiffres), pas les années comme "2001"
      if (parts.length >= 3) {
        const last1 = parts[parts.length - 1];
        const last2 = parts[parts.length - 2];

        // Vérifier si les deux derniers sont de vrais timestamps (pas juste des nombres)
        if (isLikelyTimestamp(last1) && isLikelyTimestamp(last2)) {
          parts.pop();
          parts.pop();
          return slugifyTitle(parts.join("-"));
        }
      }

      // Si pas de timestamp détecté, slugifier directement
      return slugifyTitle(withoutExt);
    }

    // Format non reconnu
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du slug:", error);
    return null;
  }
}

// =============================================================================
// FONCTION GÉNÉRIQUE DE GÉNÉRATION DE CHEMIN
// =============================================================================

/**
 * Génère le chemin vers une image de type spécifique (banner, card, original).
 *
 * FACTORISATION :
 * Cette fonction centralise la logique de génération des chemins qui était
 * auparavant dupliquée dans getMovieBannerPath() et getMovieCardPath().
 * Cela respecte le principe DRY (Don't Repeat Yourself) et facilite la maintenance.
 *
 * LOGIQUE DE PRIORITÉ :
 * 1. Si un titre est fourni, l'utiliser pour générer le slug (méthode la plus fiable)
 * 2. Si le chemin pointe déjà vers le bon dossier, le retourner tel quel
 * 3. Extraire le slug depuis le chemin original (fallback)
 * 4. Retourner l'image par défaut si aucune extraction possible
 *
 * GESTION DES EXTENSIONS :
 * - Pour "banner" et "card" : toujours .jpg (les images sont converties lors du traitement)
 * - Pour "original" : extension dynamique basée sur le fichier source
 *
 * SÉCURITÉ :
 * Les chemins sont construits uniquement à partir de slugs nettoyés et de
 * constantes définies. Aucune entrée utilisateur n'est utilisée directement.
 *
 * @param {"banner"|"card"|"original"} type - Type d'image souhaité
 * @param {string} originalPath - Chemin original depuis la BDD
 * @param {string} [title] - Titre du film (optionnel, prioritaire si fourni)
 * @returns {string} - Chemin vers l'image du type demandé
 *
 * @example
 * getMovieImagePath("banner", "/images/movies/originals/original-harry-potter.png", "Harry Potter")
 * // → "/images/movies/banners/banner-harry-potter.jpg"
 *
 * @example
 * getMovieImagePath("card", "/images/movies/originals/original-matrix.png", "Matrix")
 * // → "/images/movies/cards/card-matrix.jpg"
 */
function getMovieImagePath(type, originalPath, title = null) {
  const typeConfig = IMAGE_TYPES[type];

  if (!typeConfig) {
    console.error(`Type d'image non supporté: ${type}`);
    return DEFAULT_MOVIE_IMAGE;
  }

  const { folder, prefix } = typeConfig;

  // EXTENSION À UTILISER :
  // - Pour "original" : on conserve l'extension du fichier source (dynamique)
  // - Pour "banner" et "card" : toujours .jpg car les images sont converties lors du traitement
  // CORRECTION : Les images traitées (banners, cards) sont TOUJOURS en .jpg,
  // indépendamment du format de l'image originale uploadée.
  const extension = type === "original" ? extractExtension(originalPath) : ".jpg";

  // PRIORITÉ AU TITRE si disponible
  // C'est la méthode la plus fiable pour générer le bon chemin,
  // car le titre correspond exactement au nom du fichier traité.
  if (title && title.trim() !== "") {
    const titleSlug = slugifyTitle(title);
    if (titleSlug) {
      return `/images/movies/${folder}/${prefix}-${titleSlug}${extension}`;
    }
  }

  // Si pas de chemin original, retourner l'image par défaut
  if (!originalPath) {
    return DEFAULT_MOVIE_IMAGE;
  }

  // Si le chemin pointe déjà vers le bon dossier, le retourner tel quel
  // (évite de re-transformer un chemin déjà correct)
  if (originalPath.includes(`/${folder}/`)) {
    return originalPath;
  }

  // FALLBACK : extraire le slug depuis le chemin original
  // Utilisé uniquement si pas de titre fourni
  const slug = extractSlugFromPath(originalPath);

  if (!slug) {
    // Dernier recours : retourner l'image par défaut
    return DEFAULT_MOVIE_IMAGE;
  }

  return `/images/movies/${folder}/${prefix}-${slug}${extension}`;
}

// =============================================================================
// FONCTIONS PUBLIQUES (API)
// =============================================================================

/**
 * Génère le chemin vers l'image banner depuis le chemin original ou le titre.
 *
 * UTILISATION :
 * Cette fonction est un wrapper autour de getMovieImagePath() pour faciliter
 * l'utilisation et maintenir la rétrocompatibilité avec le code existant.
 *
 * @param {string} originalPath - Chemin original depuis la BDD
 * @param {string} [title] - Titre du film (optionnel, prioritaire si fourni)
 * @returns {string} - Chemin vers l'image banner
 *
 * @example
 * getMovieBannerPath("/images/movies/movie-harry_potter-123.png", "Harry Potter")
 * // → "/images/movies/banners/banner-harry-potter.png"
 */
export function getMovieBannerPath(originalPath, title = null) {
  return getMovieImagePath("banner", originalPath, title);
}

/**
 * Génère le chemin vers l'image card depuis le chemin original ou le titre.
 *
 * UTILISATION :
 * Cette fonction est un wrapper autour de getMovieImagePath() pour faciliter
 * l'utilisation et maintenir la rétrocompatibilité avec le code existant.
 *
 * @param {string} originalPath - Chemin original depuis la BDD
 * @param {string} [title] - Titre du film (optionnel, prioritaire si fourni)
 * @returns {string} - Chemin vers l'image card
 *
 * @example
 * getMovieCardPath("/images/movies/movie-harry_potter-123.png", "Harry Potter")
 * // → "/images/movies/cards/card-harry-potter.png"
 */
export function getMovieCardPath(originalPath, title = null) {
  return getMovieImagePath("card", originalPath, title);
}

/**
 * Génère le chemin vers l'image original depuis le chemin stocké en BDD.
 *
 * PARTICULARITÉ :
 * Cette fonction utilise aussi getMovieImagePath() pour la cohérence,
 * mais gère le cas où aucun chemin n'est fourni en générant un chemin
 * basé uniquement sur le titre.
 *
 * @param {string} originalPath - Chemin depuis la BDD
 * @param {string} [title] - Titre du film (optionnel)
 * @returns {string|null} - Chemin vers l'image original ou null
 *
 * @example
 * getMovieOriginalPath(null, "Harry Potter")
 * // → "/images/movies/originals/original-harry-potter.jpg"
 */
export function getMovieOriginalPath(originalPath, title = null) {
  // Cas spécial : si pas de chemin mais un titre, générer le chemin
  if (!originalPath && title) {
    const slug = slugifyTitle(title);
    return slug
      ? `/images/movies/originals/original-${slug}${DEFAULT_EXTENSION}`
      : null;
  }

  return getMovieImagePath("original", originalPath, title);
}

// =============================================================================
// ENRICHISSEMENT D'OBJETS MOVIE
// =============================================================================

/**
 * Enrichit un objet movie avec les chemins banner, card et original.
 *
 * COMPATIBILITÉ SEQUELIZE :
 * Cette fonction gère automatiquement les différents formats d'objets :
 * - Instances Sequelize (avec méthodes get() ou toJSON())
 * - Objets JavaScript simples (plain objects)
 *
 * POURQUOI CETTE CONVERSION ?
 * Les instances Sequelize ont des propriétés spéciales (getters, setters)
 * qui peuvent causer des problèmes lors de la sérialisation JSON.
 * La conversion en objet plain garantit un comportement prévisible.
 *
 * FALLBACKS :
 * Si un chemin ne peut pas être généré, l'image par défaut est utilisée
 * (définie dans DEFAULT_MOVIE_IMAGE).
 *
 * SÉCURITÉ :
 * Le titre est nettoyé (apostrophes normalisées, espaces insécables remplacés)
 * avant d'être utilisé pour générer les slugs.
 *
 * @param {Object} movie - Objet movie (instance Sequelize ou plain object)
 * @returns {Object|null} - Objet movie enrichi avec bannerPath, cardPath, originalPath
 *
 * @example
 * const movie = { title: "Harry Potter", picture: "/images/movies/movie-hp-123.jpg" };
 * enrichMovieWithImagePaths(movie);
 * // → {
 * //     title: "Harry Potter",
 * //     picture: "/images/movies/movie-hp-123.jpg",
 * //     bannerPath: "/images/movies/banners/banner-harry-potter.jpg",
 * //     cardPath: "/images/movies/cards/card-harry-potter.jpg",
 * //     originalPath: "/images/movies/originals/original-harry-potter.jpg"
 * //   }
 */
export function enrichMovieWithImagePaths(movie) {
  if (!movie) return null;

  // ÉTAPE 1 : Conversion en objet plain
  // Gère les instances Sequelize et les objets simples de manière uniforme
  let moviePlain;

  if (movie.get && typeof movie.get === "function") {
    // Instance Sequelize avec méthode get()
    try {
      moviePlain = movie.get({ plain: true });
    } catch (e) {
      // Fallback vers toJSON() si get() échoue
      moviePlain = movie.toJSON ? movie.toJSON() : { ...movie };
    }
  } else if (movie.toJSON && typeof movie.toJSON === "function") {
    // Instance avec méthode toJSON() (Sequelize ou autre ORM)
    moviePlain = movie.toJSON();
  } else {
    // Objet simple : copie profonde pour éviter les effets de bord
    moviePlain = JSON.parse(JSON.stringify(movie));
  }

  // ÉTAPE 2 : Extraction et nettoyage des données
  const originalPath = moviePlain.picture || null;
  let title = moviePlain.title || "";

  // Nettoyage du titre pour normaliser les caractères spéciaux
  if (title) {
    title = title
      .replace(/['']/g, "'") // Normaliser les apostrophes typographiques
      .replace(/\u00A0/g, " ") // Remplacer espaces insécables par espaces normaux
      .trim();
  }

  // ÉTAPE 3 : Génération des chemins via la fonction centralisée
  let bannerPath = getMovieBannerPath(originalPath, title);
  let cardPath = getMovieCardPath(originalPath, title);
  const originalPathEnriched = getMovieOriginalPath(originalPath, title);

  // ÉTAPE 3b : Fallback vers l'image originale si card/banner n'existe pas sur disque
  // Les images uploadées via l'admin n'ont pas forcément de version card/banner générée.
  // Depuis la migration Cloudinary, `originalPath` est le plus souvent une URL
  // https://res.cloudinary.com/... (jamais un fichier local) : on applique alors une
  // transformation Cloudinary à la volée pour ne pas retomber sur l'image pleine taille.
  if (cardPath && !existsSync(join(PUBLIC_DIR, cardPath))) {
    cardPath = originalPath ? cldOptimize(originalPath, 400) : DEFAULT_MOVIE_IMAGE;
  }
  if (bannerPath && !existsSync(join(PUBLIC_DIR, bannerPath))) {
    bannerPath = originalPath ? cldOptimize(originalPath, 1200) : DEFAULT_MOVIE_IMAGE;
  }

  // ÉTAPE 4 : Création de l'objet enrichi
  return Object.assign({}, moviePlain, {
    bannerPath,
    cardPath,
    originalPath: originalPathEnriched,
  });
}

/**
 * Enrichit un tableau de movies avec les chemins d'images.
 *
 * UTILISATION :
 * Pratique pour traiter les résultats d'une requête Sequelize findAll()
 * en une seule opération.
 *
 * @param {Array} movies - Tableau d'objets movie
 * @returns {Array} - Tableau de movies enrichis
 *
 * @example
 * const movies = await Movie.findAll();
 * const enrichedMovies = enrichMoviesWithImagePaths(movies);
 */
export function enrichMoviesWithImagePaths(movies) {
  if (!movies || !Array.isArray(movies)) return [];

  return movies.map((movie) => enrichMovieWithImagePaths(movie));
}
