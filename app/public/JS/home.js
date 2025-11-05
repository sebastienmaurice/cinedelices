// ===== MENU BURGER =====
const burgerMenu = document.querySelector(".burger-menu");
const nav = document.querySelector(".navigationheader");

burgerMenu.addEventListener("click", () => {
  const expanded = burgerMenu.getAttribute("aria-expanded") === "true";
  burgerMenu.setAttribute("aria-expanded", !expanded);
  burgerMenu.classList.toggle("active");
  nav.classList.toggle("active");
});

// Fermer le menu au clic sur un lien
document.querySelectorAll(".navigationheader-link").forEach((link) => {
  link.addEventListener("click", () => {
    burgerMenu.setAttribute("aria-expanded", "false");
    burgerMenu.classList.remove("active");
    nav.classList.remove("active");
  });
});
// ===== FIN MENU BURGER =====
