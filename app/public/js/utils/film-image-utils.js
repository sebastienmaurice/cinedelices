/**
 * Utilitaires centralisés pour la gestion des images de films
 * Ciné Délices - Refactoring Étape 2
 *
 * Ce module centralise la fonction updateFilmImage() qui était dupliquée
 * dans movie-autocomplete-form.js et tmdb-validator.js.
 *
 * Avantages :
 * - Réduction de 2-3 fonctions dupliquées
 * - Cohérence de la logique d'affichage des images
 * - Facilité de maintenance (modification en un seul endroit)
 *
 * Note : Exposé globalement (window.updateFilmImage) pour être utilisé
 * par les scripts non-modulaires
 */

/**
 * Met à jour l'image du film dans le conteneur .film-selected-image
 *
 * Pour les films existants avec image : récupère l'image depuis l'API et l'affiche
 * Pour les nouveaux films ou films sans image : affiche l'image par défaut
 *
 * @param {Object|null} movie - Objet film avec au minimum { id } si existant
 *
 * @example
 * // Film existant
 * updateFilmImage({ id: 5, title: "Harry Potter" });
 *
 * // Nouveau film ou pas de film
 * updateFilmImage(null);
 */
async function updateFilmImage(movie) {
  const filmSelectedImage = document.querySelector(".film-selected-image img");
  if (!filmSelectedImage) return;

  // Si c'est un film TMDB avec poster_path (URL CDN directe), l'afficher immédiatement
  if (movie && !movie.isLocal && movie.poster_path) {
    filmSelectedImage.src = movie.poster_path;
    filmSelectedImage.alt = `Affiche du film ${movie.title || movie.original_title || ""}`;
    return;
  }

  // Si c'est un film existant (movie.id existe), récupérer ses données complètes pour avoir l'image
  if (movie && movie.id) {
    try {
      // Récupérer les informations complètes du film depuis la BDD via une route API
      const response = await fetch(`/movies/api/get/${movie.id}`);

      if (response.ok) {
        const data = await response.json();

        // Si le film existe avec une image, l'afficher (utiliser cardPath si disponible)
        const imagePath = data.movie?.cardPath || data.movie?.picture;
        if (data.success && data.movie && imagePath) {
          filmSelectedImage.src = imagePath.startsWith("/")
            ? imagePath
            : `/${imagePath}`;
          filmSelectedImage.alt = `Affiche du film ${
            data.movie.title || movie.title || movie.original_title || ""
          }`;
          return;
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'image du film:",
        error
      );
    }
  }

  // Nouveau film ou film sans image : image par défaut
  filmSelectedImage.src = "/images/image-default-movie.jpg";
  filmSelectedImage.alt = "Image de film par defaut";
}

// Exposer la fonction globalement pour utilisation dans les scripts non-modulaires
// Refactoring : centralisation de updateFilmImage pour éviter duplication
window.updateFilmImage = updateFilmImage;
