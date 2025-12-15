/**
 * Script pour charger l'image d'un film existant dans la BDD
 * quand la page est chargée avec un film pré-sélectionné (via URL /add-recipes-movies/:id)
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    // Vérifier si un filmId est présent dans le champ hidden
    const filmIdHidden = document.getElementById("filmId-hidden");
    if (!filmIdHidden || !filmIdHidden.value) {
      return; // Pas de film existant sélectionné
    }

    const filmId = filmIdHidden.value.trim();
    if (!filmId || isNaN(parseInt(filmId))) {
      return; // ID invalide
    }

    // Récupérer les informations complètes du film pour obtenir son image
    try {
      const response = await fetch(`/movies/api/get/${filmId}`);

      if (response.ok) {
        const data = await response.json();

        // Si le film existe avec une image, l'afficher
        if (data.success && data.movie && data.movie.picture) {
          const filmSelectedImage = document.querySelector(
            ".film-selected-image img"
          );

          if (filmSelectedImage) {
            filmSelectedImage.src = data.movie.picture.startsWith("/")
              ? data.movie.picture
              : `/${data.movie.picture}`;
            filmSelectedImage.alt = `Affiche du film ${data.movie.title || ""}`;

            // Cacher le message "* L'image de votre film sera intégrée..."
            const filmImageNote = document.querySelector(".film-image-note");
            if (filmImageNote) {
              filmImageNote.style.display = "none";
            }

            console.log("✅ Image du film chargée:", data.movie.picture);
          }
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement de l'image du film:", error);
    }
  });
})();
