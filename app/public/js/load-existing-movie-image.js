/**
 * Script pour charger l'image d'un film existant dans la BDD
 * quand la page est chargée avec un film pré-sélectionné (via URL /add-recipes-movies/:id)
 *
 * Si le film a une image locale (cardPath ≠ default), l'affiche directement.
 * Sinon, si le film a un tmdb_id, récupère le poster depuis l'API TMDB.
 */
(function () {
  "use strict";

  const DEFAULT_IMG = "/images/movie-default-img.png";

  document.addEventListener("DOMContentLoaded", async () => {
    const filmIdHidden = document.getElementById("filmId-hidden");
    if (!filmIdHidden || !filmIdHidden.value) return;

    const filmId = filmIdHidden.value.trim();
    if (!filmId || isNaN(parseInt(filmId))) return;

    const filmSelectedImage = document.querySelector(".film-selected-image img");
    if (!filmSelectedImage) return;

    try {
      // 1. Récupérer les données du film depuis la BDD
      const response = await fetch(`/movies/api/get/${filmId}`);
      if (!response.ok) return;

      const data = await response.json();
      if (!data.success || !data.movie) return;

      let imagePath = data.movie?.cardPath || data.movie?.picture;

      // 2. Si pas d'image locale, tenter de récupérer le poster TMDB
      if ((!imagePath || imagePath === DEFAULT_IMG) && data.movie.tmdb_id) {
        const type = data.movie.type || "film";
        try {
          const tmdbRes = await fetch(
            `/movies/get-tmdb-info/${data.movie.tmdb_id}?type=${type}`
          );
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            if (tmdbData.success && tmdbData.movie?.poster) {
              imagePath = tmdbData.movie.poster;
            }
          }
        } catch (_) {
          // TMDB indisponible : on garde l'image par défaut
        }
      }

      // 3. Appliquer l'image si elle n'est pas le fallback par défaut
      if (imagePath && imagePath !== DEFAULT_IMG) {
        // Gère les URLs absolues (https://image.tmdb.org/...) ET les chemins locaux (/images/...)
        filmSelectedImage.src = imagePath.startsWith("http")
          ? imagePath
          : imagePath.startsWith("/")
          ? imagePath
          : `/${imagePath}`;
        filmSelectedImage.alt = `Affiche du film ${data.movie.title || ""}`;

        const filmImageNote = document.querySelector(".film-image-note");
        if (filmImageNote) filmImageNote.style.display = "none";

        console.log("✅ Image du film chargée:", imagePath);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement de l'image du film:", error);
    }
  });
})();
