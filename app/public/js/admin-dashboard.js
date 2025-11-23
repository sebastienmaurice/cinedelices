document.addEventListener("DOMContentLoaded", () => {
  // Toggle des dropdowns
  const dropdownButtons = document.querySelectorAll(".dropdown-btn");

  dropdownButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const container = document.getElementById(targetId);
      if (!container) return;

      // Toggle affichage
      container.classList.toggle("show");

      // Rotation de la flèche
      const icon = btn.querySelector(".toggle-icon");
      if (icon) icon.classList.toggle("rotate");
    });
  });

  // Activation d’un item sidebar
  const listItems = document.querySelectorAll(".dropdown-container .list-item");
  const adminMain = document.querySelector(".admin-main");

  listItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Retirer active sur tous
      listItems.forEach((i) => i.classList.remove("active-item"));
      // Ajouter sur celui cliqué
      item.classList.add("active-item");

      // Scroll vers le main
      adminMain.scrollIntoView({ behavior: "smooth" });

      // Debug
      console.log(
        "Sélection:",
        item.closest(".dropdown-container")?.id,
        "->",
        item.textContent.trim()
      );
    });
  });

  // Burger menu mobile
  const burger = document.querySelector(".burger-menu");
  const nav = document.querySelector(".navigationheader");

  if (burger && nav) {
    burger.addEventListener("click", () => {
      burger.classList.toggle("active");
      nav.classList.toggle("active");
    });
  }

  // Boutons validation
  const btnValid = document.querySelector(".btn-valid");
  const btnRefus = document.querySelector(".btn-refus");

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

  // Afficher les alertes après redirection basées sur les paramètres URL
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get("success");

  if (success === "movie_validated") {
    alert("✅ Film validé avec succès !");
  } else if (success === "movie_rejected") {
    alert("❌ Film refusé et supprimé.");
  } else if (success === "recipe_validated") {
    alert("✅ Recette validée avec succès !");
  } else if (success === "recipe_rejected") {
    alert("❌ Recette refusée et supprimée.");
  } else if (success === "user_deleted") {
    alert("🗑️ Utilisateur supprimé avec succès.");
  }
});
