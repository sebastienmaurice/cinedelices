document.addEventListener("DOMContentLoaded", () => {
  // Récupération des éléments
  const modal = document.getElementById("authModal");
  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.getElementById("modalClose");

  const btnLogin = document.getElementById("btnLogin"); // bouton header Connexion
  const btnRegister = document.getElementById("btnRegister"); // bouton header Inscription

  const loginForm = document.getElementById("loginForm"); // form Connexion
  const registerForm = document.getElementById("registerForm"); // form Inscription

  const goToRegister = document.getElementById("goToRegister"); // switch inside login
  const goToLogin = document.getElementById("goToLogin"); // switch inside register

  if (!modal || !overlay || !closeBtn || !btnLogin || !btnRegister) return;

  // Ouvrir modal sur le formulaire désiré
  function openModal(showLogin = true) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // bloque scroll page
    if (showLogin) {
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
    } else {
      registerForm.classList.add("active");
      loginForm.classList.remove("active");
    }
  }

  // Fermer modal popup
  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Écouteurs pour le header
  btnLogin.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(true); // ouvre Connexion
  });
  btnRegister.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(false); // ouvre Inscription
  });

  // Écouteurs pour switcher entre formulaires
  goToRegister.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(false);
  });
  goToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(true);
  });

  // Fermer modal au clic sur croix ou overlay
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  // Fermer modal avec ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
});
