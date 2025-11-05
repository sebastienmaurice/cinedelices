document.addEventListener("DOMContentLoaded", () => {
  // ======================================================
  // SIDEBAR : toggle des listes "À valider"
  // ======================================================

  const sidebarButtons = document.querySelectorAll(".sidebar-btn");

  sidebarButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const targetList = document.getElementById(targetId);

      if (!targetList) return;

      // toggle affichage
      targetList.style.display =
        targetList.style.display === "flex" ? "none" : "flex";

      // animation simple
      targetList.style.flexDirection = "column";
    });
  });

  // ======================================================
  // ADMIN : clic sur un item de la sidebar pour afficher détails
  // ======================================================

  const adminMain = document.querySelector(".admin-main");
  const listItems = document.querySelectorAll(".sidebar-list .list-item");

  listItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Désactive l'ancien actif
      listItems.forEach((el) => el.classList.remove("active-item"));
      item.classList.add("active-item");

      const type = item.closest(".sidebar-list").id; // "recettes" ou "films"
      const name = item.textContent;

      // Ici tu peux remplacer le innerHTML par un vrai rendu dynamique
      adminMain.scrollIntoView({ behavior: "smooth" });
      console.log(`Sélection: ${type} -> ${name}`);
    });
  });

  // ======================================================
  // BURGER MENU pour mobile
  // ======================================================

  const burger = document.querySelector(".burger-menu");
  const nav = document.querySelector(".navigationheader");

  if (burger && nav) {
    burger.addEventListener("click", () => {
      burger.classList.toggle("active");
      nav.classList.toggle("active");
    });
  }

  // ======================================================
  // ZONE DE VALIDATION : boutons
  // ======================================================

  const btnValid = document.querySelector(".btn-valid");
  const btnRefus = document.querySelector(".btn-refus");

  btnValid?.addEventListener("click", () => {
    alert("Recette / film validé ✅");
  });

  btnRefus?.addEventListener("click", () => {
    alert("Recette / film refusé ❌");
  });
});
