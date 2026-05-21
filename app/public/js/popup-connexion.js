// popup-connexion.js
const modal = document.getElementById("authModal");
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const modalClose = document.getElementById("modalClose");
const modalOverlay = document.getElementById("modalOverlay");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const goToRegister = document.getElementById("goToRegister");
const goToLogin = document.getElementById("goToLogin");

let lastFocusedElement;

// ---------------------- FONCTIONS ----------------------
const modalTitle = document.getElementById("auth-modal-title");

const openModal = (form) => {
  lastFocusedElement = document.activeElement;
  modal.classList.add("active");
  modal.removeAttribute("aria-hidden");            // modal visible pour screen readers
  document.body.style.overflow = "hidden";
  if (form === "login") {
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
    if (modalTitle) modalTitle.textContent = "Connexion";
    loginForm.querySelector("input")?.focus();
  } else {
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
    if (modalTitle) modalTitle.textContent = "Inscription";
    registerForm.querySelector("input")?.focus();
  }
};

// Exposer openModal globalement pour les autres scripts
window.openModal = openModal;

const closeModal = () => {
  if (!modal.classList.contains("active")) return;

  modal.classList.add("fade-out");
  modal.setAttribute("aria-hidden", "true");       // masque pour screen readers à la fermeture
  document.body.style.overflow = "";

  setTimeout(() => {
    modal.classList.remove("active", "fade-out");
    lastFocusedElement?.focus();
  }, 300);
};

// Focus trap
modal.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  if (e.key === "Escape") {
    closeModal();
  }
});

// ---------------------- EVENTS ----------------------
btnLogin?.addEventListener("click", () => openModal("login"));
btnRegister?.addEventListener("click", () => openModal("register"));
// Boutons de la navigation mobile (menu burger)
document.querySelectorAll(".js-login").forEach((el) =>
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openModal("login");
  })
);
document.querySelectorAll(".js-register").forEach((el) =>
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openModal("register");
  })
);

modalClose?.addEventListener("click", closeModal);
modalOverlay?.addEventListener("click", closeModal);

goToRegister?.addEventListener("click", () => {
  loginForm.classList.remove("active");
  registerForm.classList.add("active");
  registerForm.querySelector("input")?.focus();
});

goToLogin?.addEventListener("click", () => {
  registerForm.classList.remove("active");
  loginForm.classList.add("active");
  loginForm.querySelector("input")?.focus();
});
