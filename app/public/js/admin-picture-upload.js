// ========================================
// GESTION UPLOAD IMAGE FILM
// ========================================
const uploadFilmButton = document.getElementById("uploadFilmButton");
const filmImageInput = document.getElementById("filmImageInput");
const filmImagePreview = document.getElementById("filmImagePreview");

// Clic sur le bouton upload → ouvre le sélecteur de fichier
if (uploadFilmButton && filmImageInput) {
  uploadFilmButton.addEventListener("click", () => {
    filmImageInput.click();
  });
}

// Quand un fichier est sélectionné → prévisualiser l'image
if (filmImageInput && filmImagePreview) {
  filmImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (file) {
      // Vérifier que c'est bien une image
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onload = (event) => {
          // Afficher la prévisualisation
          filmImagePreview.src = event.target.result;
          console.log("✅ Prévisualisation de l'image:", file.name);
        };

        reader.readAsDataURL(file);
      } else {
        alert("⚠️ Veuillez sélectionner une image (JPG, PNG, WEBP)");
      }
    }
  });
}

// Intercepter la soumission du formulaire pour ajouter l'image
const validateMovieForm = document.getElementById("validateMovieForm");
if (validateMovieForm && filmImageInput) {
  validateMovieForm.addEventListener("submit", (e) => {
    // Si un fichier a été sélectionné, on l'ajoute au formulaire
    if (filmImageInput.files.length > 0) {
      // Créer un nouvel input file dans le formulaire
      const formFileInput = document.createElement("input");
      formFileInput.type = "file";
      formFileInput.name = "filmImage";
      formFileInput.style.display = "none";

      // Transférer le fichier
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(filmImageInput.files[0]);
      formFileInput.files = dataTransfer.files;

      // Ajouter au formulaire
      validateMovieForm.appendChild(formFileInput);

      console.log(
        "📤 Envoi du formulaire avec image:",
        filmImageInput.files[0].name
      );
    } else {
      console.log("📤 Envoi du formulaire sans nouvelle image");
    }
  });
}
// ========================================
// GESTION UPLOAD IMAGE FILM
// ========================================
