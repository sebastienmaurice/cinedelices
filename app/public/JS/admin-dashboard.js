document.addEventListener("DOMContentLoaded", () => {
  // ======================================================
  // SIDEBAR : toggle des listes
  // ======================================================

  const sidebarButtons = document.querySelectorAll(".sidebar-btn");

  sidebarButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;

      // Cherche l'élément par ID ou par classe fallback
      let targetList = document.getElementById(targetId);
      if (!targetList) {
        targetList = document.querySelector(
          `.sidebar-list[data-id='${targetId}']`
        );
      }

      if (!targetList) {
        console.warn(`Toggle sidebar: aucun élément trouvé pour ${targetId}`);
        return;
      }

      // toggle affichage
      const isVisible = targetList.style.display === "flex";
      targetList.style.display = isVisible ? "none" : "flex";
      targetList.style.flexDirection = "column";

      // Animation simple (fade)
      targetList.style.opacity = isVisible ? 0 : 1;
      targetList.style.transition = "opacity 0.3s ease";
    });
  });

  // ======================================================
  // ADMIN : clic sur un item de la sidebar pour afficher détails
  // ======================================================

  const adminMain = document.querySelector(".admin-main");
  const listItems = document.querySelectorAll(".sidebar-list .list-item");

  listItems.forEach((item) => {
    item.addEventListener("click", () => {
      listItems.forEach((el) => el.classList.remove("active-item"));
      item.classList.add("active-item");

      const type = item.closest(".sidebar-list")?.id || "unknown";
      const name = item.textContent;

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
