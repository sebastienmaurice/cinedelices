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
