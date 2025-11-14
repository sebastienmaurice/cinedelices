
const form = document.getElementById("registerForm");
const password = document.getElementById("password"); 
const confirmPassword = document.getElementById("confirmPassword");
const errorMessage = document.getElementById("errorMessage");

// Vérification en temps réel que les mots de passe sont identiques
confirmPassword.addEventListener("input", function () {
  if (password.value !== confirmPassword.value) {
    errorMessage.style.display = "block";
  } else {
    errorMessage.style.display = "none";
  }
});

// Vérification finale à la soumission du formulaire
form.addEventListener("submit", function (event) {
  if (password.value !== confirmPassword.value) {
    event.preventDefault(); // Empêche l'envoi du formulaire
    errorMessage.style.display = "block";
  }
});
