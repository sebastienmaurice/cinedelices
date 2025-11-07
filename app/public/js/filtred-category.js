// filtrage des différentes catégories de plats

Filtred();

function Filtred() {
  const selectElement = document.getElementById("search");
  const movieId = document.getElementById("movie").dataset.id;

  if (selectElement) {
    selectElement.addEventListener("change", function () {
      const selectedValue = this.value;
      console.log("Catégorie sélectionnée :", selectedValue);

      // Redirection vers la route qui affiche la page filtrée en fonction de la catégorie choisie

      window.location.href = `/recipes-movie/category/${movieId}/${selectedValue}`;
      // Le navigateur va charger cette nouvelle page comme si l'utilisateur cliquait sur un lien
    });
  }
}
