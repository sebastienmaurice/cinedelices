// Gestion de l'upload et de la prévisualisation de l'image de recette

document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("uploadButton");
  const recipeImageInput = document.getElementById("recipeImageInput");
  const recipeImagePreview = document.getElementById("recipeImagePreview");

  // Vérification que les éléments existent
  if (!uploadButton || !recipeImageInput || !recipeImagePreview) {
    console.error("Éléments d'upload d'image introuvables");
    return;
  }

  // Quand on clique sur le bouton, on déclenche le clic sur l'input file
  uploadButton.addEventListener("click", (e) => {
    e.preventDefault();
    recipeImageInput.click();
  });

  // Quand un fichier est sélectionné
  recipeImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (!file) {
      console.log("Aucun fichier sélectionné");
      return;
    }

    // Vérification du type de fichier
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert(
        "Format de fichier non supporté. Veuillez utiliser JPG, JPEG, PNG ou WEBP."
      );
      recipeImageInput.value = ""; // Réinitialiser l'input
      return;
    }

    // Vérification de la taille du fichier (max 5 MB)
    const maxSize = 5 * 1024 * 1024; // 5 MB en octets
    if (file.size > maxSize) {
      alert(
        "Le fichier est trop volumineux. La taille maximale est de 5 MB."
      );
      recipeImageInput.value = ""; // Réinitialiser l'input
      return;
    }

    // Prévisualisation de l'image
    const reader = new FileReader();

    reader.onload = (event) => {
      // Mettre à jour l'image de prévisualisation avec l'image sélectionnée
      recipeImagePreview.src = event.target.result;
      recipeImagePreview.alt = "Prévisualisation de l'image de la recette";

      // Feedback visuel optionnel
      console.log(`Image sélectionnée : ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    };

    reader.onerror = () => {
      alert("Erreur lors de la lecture du fichier.");
      recipeImageInput.value = "";
    };

    // Lire le fichier comme URL de données
    reader.readAsDataURL(file);
  });
});
