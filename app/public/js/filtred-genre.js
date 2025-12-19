/**
 * Filtrage des films par genre
 * Redirige vers la page movies filtrée selon le genre sélectionné
 */

Filtred();

function Filtred() {
  const selectElement = document.getElementById("search");

  if (selectElement) {
    selectElement.addEventListener("change", function () {
      const selectedValue = this.value;

      // Redirection vers la route qui affiche la page filtrée en fonction du genre de film choisi
      // Le navigateur va charger cette nouvelle page comme si l'utilisateur cliquait sur un lien
      window.location.href = `/movies/${selectedValue}`;
    });
  }
}