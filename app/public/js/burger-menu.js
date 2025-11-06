// burger-menu.js

// ======================================================
// MENU BURGER
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const burgerMenu = document.querySelector(".burger-menu");
  const nav = document.querySelector(".navigationheader");
  const navLinks = document.querySelectorAll(".navigationheader-link");

  if (!burgerMenu || !nav) return; // sécurité si éléments manquants

  // Ouvrir / fermer le menu burger
  burgerMenu.addEventListener("click", () => {
    const isExpanded = burgerMenu.getAttribute("aria-expanded") === "true";
    burgerMenu.setAttribute("aria-expanded", !isExpanded);
    burgerMenu.classList.toggle("active");
    nav.classList.toggle("active");
  });

  // Fermer le menu au clic sur un lien
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      burgerMenu.setAttribute("aria-expanded", "false");
      burgerMenu.classList.remove("active");
      nav.classList.remove("active");
    });
  });
});
