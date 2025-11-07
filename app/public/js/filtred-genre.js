// filtrage des différentes catégories de films

Filtred();

function Filtred() {
  const selectElement = document.getElementById("search");
  
  if (selectElement) {
    selectElement.addEventListener("change", function () {
      const selectedValue = this.value;
      console.log("genre sélectionné :", selectedValue);

      // Redirection vers la route qui affiche la page filtrée en fonction ddu genre de film choisi

      window.location.href = `/movies/${selectedValue}`;
      // Le navigateur va charger cette nouvelle page comme si l'utilisateur cliquait sur un lien
    });
  }
}