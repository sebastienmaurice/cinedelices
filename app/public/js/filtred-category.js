/**
 * Filtrage des recettes par catégorie
 * Redirige vers la page recipes-movie filtrée selon la catégorie sélectionnée
 */

Filtred();

function Filtred() {
  const selectElement = document.getElementById("search");
  const movieElement = document.getElementById("movie");
  const movieId = movieElement?.dataset.id;

  if (selectElement && movieId) {
    selectElement.addEventListener("change", function () {
      const selectedValue = this.value;

      // Redirection vers la route qui affiche la page filtrée en fonction de la catégorie choisie
      // Le navigateur va charger cette nouvelle page comme si l'utilisateur cliquait sur un lien
      window.location.href = `/recipes-movie/category/${movieId}/${selectedValue}`;
    });
  }
}
