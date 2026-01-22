/**
 * Helper pour générer les chemins d'images de films (banners et cards)
 * depuis le chemin original stocké en BDD.
 *
 * Logique :
 * - La BDD stocke le chemin original : /images/movies/movie-{title-slug}-{timestamp}.{ext}
 * - Les images traitées sont dans :
 *   - Banners : /images/movies/banners/banner-{title-slug}.jpg
 *   - Cards : /images/movies/cards/card-{title-slug}.jpg
 *
 * Ce helper convertit automatiquement le chemin original vers banner ou card.
 */

/**
 * Normalise un titre de film en slug pour générer le nom de fichier
 * Ex: "Harry Potter" → "harry-potter"
 * Ex: "Bienvenue chez les Ch'tis" → "bienvenue-chez-les-chtis"
 *
 * @param {string} title - Titre du film
 * @returns {string} - Slug normalisé
 */
function slugifyTitle(title) {
  if (!title) return "";

  return title
    .toLowerCase()
    .normalize("NFD") // Décompose les accents
    .replace(/[\u0300-\u036f]/g, "") // Retire les accents
    .replace(/\bl\s*['']\s*/g, "l-") // Cas spécial: "l'" ou "l'" → "l-" (gère les apostrophes avec espaces optionnels)
    .replace(/\bl\s+arche/gi, "l-arche") // Cas spécial: "l Arche" → "l-arche" (gère les espaces)
    .replace(/\blarche/gi, "l-arche") // Cas spécial: "lArche" (sans espace ni apostrophe) → "l-arche"
    .replace(/['']/g, "") // Supprime les autres apostrophes restantes (comme dans "Ch'tis" → "chtis")
    .replace(/[^\w\s-]/g, "") // Retire la ponctuation sauf tirets
    .replace(/\s+/g, "-") // Remplace espaces par tirets
    .replace(/_/g, "-") // Remplace underscores par tirets
    .replace(/-+/g, "-") // Remplace tirets multiples par un seul
    .replace(/^-+|-+$/g, "") // Retire tirets en début/fin
    .trim();
}

/**
 * Extrait le slug du film depuis un chemin original de la BDD
 * Ex: "/images/movies/movie-harry_potter-1763858232674-340071843.png" → "harry-potter"
 *
 * @param {string} originalPath - Chemin original depuis la BDD
 * @returns {string|null} - Slug extrait ou null si impossible
 */
function extractSlugFromPath(originalPath) {
  if (!originalPath) return null;

  try {
    // Extraire le nom de fichier (ex: "movie-harry_potter-1763858232674-340071843.png" ou "original-harry-potter.png")
    const filename = originalPath.split("/").pop();

    if (!filename) {
      return null;
    }

    // Si le fichier est dans originals/ avec le format "original-{slug}.{ext}"
    if (filename.startsWith("original-")) {
      const withoutPrefix = filename.replace(/^original-/, "");
      const withoutExt = withoutPrefix.replace(/\.[^.]+$/, "");
      return slugifyTitle(withoutExt);
    }

    // Si le fichier commence par "movie-"
    if (filename.startsWith("movie-")) {
      // Retirer le préfixe "movie-" et l'extension
      const withoutPrefix = filename.replace(/^movie-/, "");
      const withoutExt = withoutPrefix.replace(/\.[^.]+$/, "");

      // Retirer le timestamp (les deux derniers nombres séparés par tiret)
      // Format attendu: {slug}-{timestamp1}-{timestamp2}
      const parts = withoutExt.split("-");

      // Si les deux derniers éléments sont des nombres (timestamps), les retirer
      if (parts.length >= 3) {
        const last1 = parts[parts.length - 1];
        const last2 = parts[parts.length - 2];

        // Vérifier si les deux derniers sont des nombres (timestamps)
        if (/^\d+$/.test(last1) && /^\d+$/.test(last2)) {
          // Retirer les deux derniers éléments (timestamps)
          parts.pop();
          parts.pop();
          return slugifyTitle(parts.join("-"));
        }
      }

      // Si pas de timestamp détecté, slugifier directement
      return slugifyTitle(withoutExt);
    }

    // Si aucun format reconnu, retourner null
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du slug:", error);
    return null;
  }
}

/**
 * Génère le chemin vers l'image banner depuis le chemin original ou le titre
 *
 * @param {string} originalPath - Chemin original depuis la BDD (ex: "/images/movies/movie-harry_potter-...")
 * @param {string} [title] - Titre du film (optionnel, utilisé si originalPath ne permet pas d'extraire le slug)
 * @returns {string} - Chemin vers l'image banner (ex: "/images/movies/banners/banner-harry-potter.jpg")
 */
export function getMovieBannerPath(originalPath, title = null) {
  if (originalPath && originalPath.includes("/originals/")) {
    return originalPath;
  }
  // Priorité au titre si disponible pour garantir la correspondance avec les fichiers
  if (title && title.trim() !== "") {
    const titleSlug = slugifyTitle(title);
    if (titleSlug) {
      const bannerPath = `/images/movies/banners/banner-${titleSlug}.jpg`;
      return bannerPath;
    }
  }

  if (!originalPath) {
    // Si pas de titre ni de chemin original, retourner image par défaut
    return "/images/image-default-movie.jpg";
  }

  // Si le chemin pointe déjà vers banners, le retourner tel quel
  if (originalPath.includes("/banners/")) {
    return originalPath;
  }

  // Essayer d'extraire le slug depuis le chemin (fallback si pas de titre)
  const slug = extractSlugFromPath(originalPath);

  if (!slug) {
    // Fallback : retourner l'original ou image par défaut
    return originalPath || "/images/image-default-movie.jpg";
  }

  return `/images/movies/banners/banner-${slug}.jpg`;
}

/**
 * Génère le chemin vers l'image card depuis le chemin original ou le titre
 *
 * @param {string} originalPath - Chemin original depuis la BDD (ex: "/images/movies/movie-harry_potter-...")
 * @param {string} [title] - Titre du film (optionnel, utilisé si originalPath ne permet pas d'extraire le slug)
 * @returns {string} - Chemin vers l'image card (ex: "/images/movies/cards/card-harry-potter.jpg")
 */
export function getMovieCardPath(originalPath, title = null) {
  if (originalPath && originalPath.includes("/originals/")) {
    return originalPath;
  }
  // Priorité au titre si disponible pour garantir la correspondance avec les fichiers
  if (title && title.trim() !== "") {
    const titleSlug = slugifyTitle(title);
    if (titleSlug) {
      const cardPath = `/images/movies/cards/card-${titleSlug}.jpg`;
      return cardPath;
    }
  }

  if (!originalPath) {
    // Si pas de titre ni de chemin original, retourner image par défaut
    return "/images/image-default-movie.jpg";
  }

  // Si le chemin pointe déjà vers cards, le retourner tel quel
  if (originalPath.includes("/cards/")) {
    return originalPath;
  }

  // Essayer d'extraire le slug depuis le chemin (fallback si pas de titre)
  const slug = extractSlugFromPath(originalPath);

  if (!slug) {
    // Fallback : retourner l'original ou image par défaut
    return originalPath || "/images/image-default-movie.jpg";
  }

  return `/images/movies/cards/card-${slug}.jpg`;
}

/**
 * Génère le chemin vers l'image original depuis le chemin stocké en BDD
 * (garde le chemin tel quel si c'est déjà un original, sinon le convertit)
 *
 * @param {string} originalPath - Chemin depuis la BDD
 * @param {string} [title] - Titre du film (optionnel)
 * @returns {string} - Chemin vers l'image original
 */
export function getMovieOriginalPath(originalPath, title = null) {
  if (!originalPath) {
    return title
      ? `/images/movies/originals/original-${slugifyTitle(title)}.jpg`
      : null;
  }

  // Si le chemin pointe déjà vers originals, le retourner tel quel
  if (originalPath.includes("/originals/")) {
    return originalPath;
  }

  // Essayer d'extraire le slug depuis le chemin
  let slug = extractSlugFromPath(originalPath);

  // Si impossible d'extraire depuis le chemin, utiliser le titre
  if (!slug && title) {
    slug = slugifyTitle(title);
  }

  if (!slug) {
    // Fallback : retourner l'original tel quel
    return originalPath;
  }

  // Déterminer l'extension (par défaut .jpg, ou garder celle du chemin original)
  const ext = originalPath.match(/\.[^.]+$/)
    ? originalPath.match(/\.[^.]+$/)[0]
    : ".jpg";

  return `/images/movies/originals/original-${slug}${ext}`;
}

/**
 * Enrichit un objet movie avec les chemins banner, card et original
 * Cette fonction ajoute les propriétés bannerPath, cardPath et originalPath
 * à l'objet movie pour utilisation dans les vues
 *
 * @param {Object} movie - Objet movie (peut être une instance Sequelize ou plain object)
 * @returns {Object} - Objet movie enrichi avec les chemins d'images
 */
export function enrichMovieWithImagePaths(movie) {
  if (!movie) return null;

  // Convertir en objet plain si c'est une instance Sequelize
  // Utiliser toJSON() qui est la méthode recommandée par Sequelize
  let moviePlain;
  if (movie.get && typeof movie.get === "function") {
    try {
      moviePlain = movie.get({ plain: true });
    } catch (e) {
      // Si get() échoue, essayer toJSON()
      moviePlain = movie.toJSON ? movie.toJSON() : { ...movie };
    }
  } else if (movie.toJSON && typeof movie.toJSON === "function") {
    moviePlain = movie.toJSON();
  } else {
    // Créer une copie profonde pour éviter les références
    moviePlain = JSON.parse(JSON.stringify(movie));
  }

  const originalPath = moviePlain.picture || null;
  let title = moviePlain.title || "";

  // Nettoyer le titre : remplacer les apostrophes typographiques et espaces insécables
  if (title) {
    title = title
      .replace(/['']/g, "'") // Normaliser les apostrophes typographiques vers apostrophe droite
      .replace(/\u00A0/g, " ") // Remplacer espaces insécables par espaces normaux
      .trim();
  }

  // Calculer les chemins
  const bannerPath = getMovieBannerPath(originalPath, title);
  const cardPath = getMovieCardPath(originalPath, title);
  const originalPathEnriched = getMovieOriginalPath(originalPath, title);

  // Créer un nouvel objet enrichi en utilisant Object.assign pour être sûr
  const enrichedMovie = Object.assign({}, moviePlain, {
    bannerPath,
    cardPath,
    originalPath: originalPathEnriched,
  });

  return enrichedMovie;
}

/**
 * Enrichit un tableau de movies avec les chemins d'images
 *
 * @param {Array} movies - Tableau d'objets movie
 * @returns {Array} - Tableau de movies enrichis
 */
export function enrichMoviesWithImagePaths(movies) {
  if (!movies || !Array.isArray(movies)) return [];

  return movies.map((movie) => enrichMovieWithImagePaths(movie));
}
