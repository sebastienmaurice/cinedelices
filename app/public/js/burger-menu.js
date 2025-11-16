// burger-menu.js

// ======================================================
// MENU BURGER
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const burgerMenu = document.querySelector(".burger-menu");
  const nav = document.querySelector(".navigationheader");
  const navLinks = document.querySelectorAll(".navigationheader-link");
  const main = document.querySelector("main");
  const footer = document.querySelector("footer");

  if (!burgerMenu || !nav) return; // sécurité si éléments manquants

  // Ouvrir / fermer le menu burger
  function openMenu() {
    burgerMenu.setAttribute("aria-expanded", "true");
    burgerMenu.classList.add("active");
    nav.classList.add("active");
    document.body.classList.add("menu-open");
    if (main) main.setAttribute("aria-hidden", "true");
    if (footer) footer.setAttribute("aria-hidden", "true");
    nav.setAttribute("aria-hidden", "false");
  }
  function closeMenu() {
    burgerMenu.setAttribute("aria-expanded", "false");
    burgerMenu.classList.remove("active");
    nav.classList.remove("active");
    document.body.classList.remove("menu-open");
    if (main) main.removeAttribute("aria-hidden");
    if (footer) footer.removeAttribute("aria-hidden");
    nav.setAttribute("aria-hidden", "true");
  }
  burgerMenu.addEventListener("click", () => {
    const isExpanded = burgerMenu.getAttribute("aria-expanded") === "true";
    if (isExpanded) closeMenu();
    else openMenu();
  });

  // Fermer le menu au clic sur un lien
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Fermer avec la touche Échap
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burgerMenu.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });
});
