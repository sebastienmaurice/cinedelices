/**
 * Gestionnaire pour le bouton "Je passe à la recette"
 * Valide les informations du film et les affiche dans la colonne gauche
 */

document.addEventListener("DOMContentLoaded", () => {
  const filmPreviewForm = document.getElementById("film-preview-form");
  let goToRecipeButton = filmPreviewForm?.querySelector(".form-footer-btn");

  // Si le bouton n'existe pas (film pré-sélectionné), le créer dynamiquement
  if (!goToRecipeButton && filmPreviewForm) {
    const formFooter = filmPreviewForm.querySelector(".form-footer");
    if (formFooter) {
      goToRecipeButton = document.createElement("button");
      goToRecipeButton.className = "btn btn--red form-footer-btn";
      goToRecipeButton.textContent = "Je passe à la recette";
      formFooter.appendChild(goToRecipeButton);
    }
  }

  if (!goToRecipeButton) {
    return;
  }

  // Champs du formulaire de film
  const filmNameInput = document.getElementById("film-name");
  const filmYearInput = document.getElementById("film-year");
  const filmGenreSelect = document.getElementById("film-genre");

  // Éléments d'affichage dans la colonne gauche
  const displayFilmName = document.getElementById("display-film-name");
  const displayFilmGenre = document.getElementById("display-film-genre");
  const displayFilmYear = document.getElementById("display-film-year");

  if (
    !filmNameInput ||
    !filmYearInput ||
    !filmGenreSelect ||
    !displayFilmName ||
    !displayFilmGenre ||
    !displayFilmYear
  ) {
    console.warn("Éléments du formulaire film ou d'affichage non trouvés");
    return;
  }

  /**
   * Valider les champs du film
   */
  function validateFilmFields() {
    // Si un filmId est présent (film sélectionné via autocomplétion), validation OK
    if (hasFilmId()) {
      return true;
    }

    // Sinon, valider les champs saisis manuellement
    const title = filmNameInput.value.trim();
    const year = filmYearInput.value.trim();
    const genre = filmGenreSelect.value.trim();

    if (!title) {
      alert("Le nom du film est obligatoire.");
      filmNameInput.focus();
      return false;
    }

    if (
      !year ||
      parseInt(year) < 1888 ||
      parseInt(year) > new Date().getFullYear() + 5
    ) {
      alert(
        "L'année du film est obligatoire et doit être valide (entre 1888 et " +
          (new Date().getFullYear() + 5) +
          ")."
      );
      filmYearInput.focus();
      return false;
    }

    if (!genre) {
      alert("Le genre du film est obligatoire.");
      filmGenreSelect.focus();
      return false;
    }

    return true;
  }

  /**
   * Mettre à jour l'affichage dans la colonne gauche
   */
  function updateFilmDisplay() {
    const title = filmNameInput.value.trim();
    const year = filmYearInput.value.trim();
    const genre = filmGenreSelect.value.trim();

    // Mettre à jour les éléments d'affichage
    if (displayFilmName) {
      displayFilmName.textContent = title || "titre";
    }
    if (displayFilmGenre) {
      displayFilmGenre.textContent = genre || "genre";
    }
    if (displayFilmYear) {
      displayFilmYear.textContent = year || "année";
    }
  }

  /**
   * Vérifier si un filmId est présent (film sélectionné via autocomplétion)
   */
  function hasFilmId() {
    const filmIdHidden = document.getElementById("filmId-hidden");
    return filmIdHidden && filmIdHidden.value;
  }

  /**
   * Synchroniser les données vers le formulaire unifié
   */
  function syncToUnifiedForm() {
    const unifiedForm = document.getElementById("unified-form");
    if (!unifiedForm) {
      return;
    }

    // Vérifier si un filmId existe (film sélectionné via autocomplétion)
    const filmIdHidden = document.getElementById("filmId-hidden");
    const filmTitleHidden = document.getElementById("film-title-hidden");
    const filmYearHidden = document.getElementById("film-year-hidden");
    const filmGenreHidden = document.getElementById("film-genre-hidden");

    if (
      !filmIdHidden ||
      !filmTitleHidden ||
      !filmYearHidden ||
      !filmGenreHidden
    ) {
      return;
    }

    // Toujours mettre à jour les champs cachés avec les valeurs actuelles
    // Si l'utilisateur modifie un film existant, on met à jour les valeurs
    filmTitleHidden.value = filmNameInput.value.trim();
    filmYearHidden.value = filmYearInput.value.trim();
    filmGenreHidden.value = filmGenreSelect.value.trim();

    // Si l'utilisateur a modifié les champs d'un film existant, on peut vider le filmId
    // pour indiquer que c'est maintenant un nouveau film ou un film modifié
    // (la logique backend déterminera si c'est un nouveau film ou une modification)
    const currentTitle = filmNameInput.value.trim();
    const currentYear = filmYearInput.value.trim();
    const currentGenre = filmGenreSelect.value.trim();

    // Si les champs ont été modifiés et que tous sont remplis, s'assurer que les données sont bien synchronisées
    if (currentTitle && currentYear && currentGenre) {
      // Les valeurs sont déjà mises à jour ci-dessus
      console.log("✅ Données du film synchronisées vers le formulaire unifié");
    }
  }

  /**
   * Exposer la fonction updateFilmDisplay pour qu'elle puisse être appelée depuis l'extérieur
   */
  window.updateFilmDisplayFromPreview = updateFilmDisplay;

  /**
   * Faire défiler vers la section recette
   */
  function scrollToRecipe() {
    const recipeSection = document.querySelector(".add-recipe-section");
    if (recipeSection) {
      recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /**
   * Gérer le clic sur le bouton "Je passe à la recette"
   */
  goToRecipeButton.addEventListener("click", (e) => {
    e.preventDefault();

    // 1. Valider les champs du film
    if (!validateFilmFields()) {
      return;
    }

    // 2. Mettre à jour l'affichage dans la colonne gauche
    // (les valeurs sont dans les champs, qu'il s'agisse d'un film existant ou nouveau)
    updateFilmDisplay();

    // 3. Synchroniser vers le formulaire unifié
    syncToUnifiedForm();

    // 4. Faire défiler vers la section recette
    scrollToRecipe();

    console.log("✅ Informations du film validées et affichées");
  });

  // Mettre à jour l'affichage en temps réel quand les champs changent
  filmNameInput.addEventListener("input", () => {
    updateFilmDisplay();
    syncToUnifiedForm();
  });

  filmYearInput.addEventListener("input", () => {
    updateFilmDisplay();
    syncToUnifiedForm();
  });

  filmGenreSelect.addEventListener("change", () => {
    updateFilmDisplay();
    syncToUnifiedForm();
  });

  // Mise à jour également au blur pour s'assurer que les valeurs sont bien sauvegardées
  filmNameInput.addEventListener("blur", () => {
    updateFilmDisplay();
    syncToUnifiedForm();
  });

  filmYearInput.addEventListener("blur", () => {
    updateFilmDisplay();
    syncToUnifiedForm();
  });

  console.log("✅ Gestionnaire bouton 'Je passe à la recette' initialisé");
});
