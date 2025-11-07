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

btnLogin?.addEventListener("click", () => {
  modal.classList.add("active");
  loginForm.classList.add("active");
  registerForm.classList.remove("active");
});

btnRegister?.addEventListener("click", () => {
  modal.classList.add("active");
  registerForm.classList.add("active");
  loginForm.classList.remove("active");
});

modalClose?.addEventListener("click", () => modal.classList.remove("active"));
modalOverlay?.addEventListener("click", () => modal.classList.remove("active"));

goToRegister?.addEventListener("click", () => {
  loginForm.classList.remove("active");
  registerForm.classList.add("active");
});

goToLogin?.addEventListener("click", () => {
  registerForm.classList.remove("active");
  loginForm.classList.add("active");
});
