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

  btnValid?.addEventListener("click", () => alert("Recette / film validé ✅"));
  btnRefus?.addEventListener("click", () => alert("Recette / film refusé ❌"));
});
