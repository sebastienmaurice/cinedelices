/**
 * Gestionnaire pour le formulaire unifié film + recette
 * Synchronise les données entre le formulaire de prévisualisation du film
 * et le formulaire unifié qui sera soumis
 */

document.addEventListener("DOMContentLoaded", () => {
  const unifiedForm = document.getElementById("unified-form");
  const filmPreviewForm = document.getElementById("film-preview-form");

  if (!unifiedForm) {
    console.warn("Formulaire unifié non trouvé");
    return;
  }

  // Champs du formulaire de film
  const filmNameInput = document.getElementById("film-name");
  const filmYearInput = document.getElementById("film-year");
  const filmGenreSelect = document.getElementById("film-genre");

  // Champs hidden du formulaire unifié
  const filmIdHidden = document.getElementById("filmId-hidden");
  const filmTitleHidden = document.getElementById("film-title-hidden");
  const filmYearHidden = document.getElementById("film-year-hidden");
  const filmGenreHidden = document.getElementById("film-genre-hidden");

  if (!filmNameInput || !filmYearInput || !filmGenreSelect) {
    console.warn("Champs du formulaire film non trouvés");
    return;
  }

  // Si un filmId est déjà présent au chargement (film existant via URL /add-recipes-movies/:id)
  // Vider les champs pour nouveau film pour éviter la confusion
  if (filmIdHidden && filmIdHidden.value) {
    if (filmTitleHidden) filmTitleHidden.value = "";
    if (filmYearHidden) filmYearHidden.value = "";
    if (filmGenreHidden) filmGenreHidden.value = "";
    console.log("✅ Film existant détecté (filmId:", filmIdHidden.value + ")");
  }

  /**
   * Synchroniser les valeurs du film vers le formulaire unifié
   */
  function syncFilmDataToUnifiedForm() {
    if (
      !filmIdHidden ||
      !filmTitleHidden ||
      !filmYearHidden ||
      !filmGenreHidden
    ) {
      return;
    }

    // Vérifier si un filmId existe (film existant via URL ou autocomplétion)
    const existingFilmIdInput = unifiedForm.querySelector(
      'input[name="filmId"]'
    );
    const hasFilmId =
      filmIdHidden.value || (existingFilmIdInput && existingFilmIdInput.value);

    if (hasFilmId) {
      // Film existant sélectionné : utiliser le filmId
      if (existingFilmIdInput && existingFilmIdInput.value) {
        filmIdHidden.value = existingFilmIdInput.value;
      }
      // Vider les champs pour nouveau film
      filmTitleHidden.value = "";
      filmYearHidden.value = "";
      filmGenreHidden.value = "";

      // Vérifier si un tmdbId est présent (film sélectionné via TMDB)
      const tmdbIdHidden = document.getElementById("tmdbId-hidden");
      if (tmdbIdHidden) {
        tmdbIdHidden.value = "";
      }
      return;
    }

    // Nouveau film : copier les valeurs des champs film
    filmIdHidden.value = "";

    // Utiliser les valeurs des champs cachés TMDB si présents (sélection TMDB)
    const tmdbIdHidden = document.getElementById("tmdbId-hidden");
    const titleFRHidden = document.getElementById("titleFR-hidden");
    const tmdbYearHidden = document.getElementById("tmdbYear-hidden");
    const tmdbGenreHidden = document.getElementById("tmdbGenre-hidden");

    if (tmdbIdHidden && tmdbIdHidden.value) {
      // Film sélectionné via TMDB : utiliser les valeurs TMDB
      filmTitleHidden.value =
        titleFRHidden && titleFRHidden.value
          ? titleFRHidden.value
          : filmNameInput.value.trim();
      filmYearHidden.value =
        tmdbYearHidden && tmdbYearHidden.value
          ? tmdbYearHidden.value
          : filmYearInput.value.trim();
      filmGenreHidden.value =
        tmdbGenreHidden && tmdbGenreHidden.value
          ? tmdbGenreHidden.value
          : filmGenreSelect.value.trim();
    } else {
      // Film saisi manuellement : utiliser les valeurs des champs visibles
      filmTitleHidden.value = filmNameInput.value.trim();
      filmYearHidden.value = filmYearInput.value.trim();
      filmGenreHidden.value = filmGenreSelect.value.trim();
    }
  }

  /**
   * Validation avant soumission
   */
  function validateUnifiedForm() {
    // Vérifier que soit un filmId existe (film existant), soit les champs film sont remplis
    const hasFilmId = filmIdHidden && filmIdHidden.value;
    const hasFilmData =
      filmTitleHidden &&
      filmTitleHidden.value.trim() &&
      filmYearHidden &&
      filmYearHidden.value.trim() &&
      filmGenreHidden &&
      filmGenreHidden.value.trim();

    // Si film existant sélectionné, validation OK pour le film
    // Mais on doit quand même valider les champs de la recette après
    if (hasFilmId) {
      // Film existant : pas besoin de vérifier tmdbId
      // On continue pour valider les champs de la recette
    } else {
      // Nouveau film : vérifier que les champs sont remplis
      if (!hasFilmData) {
        alert(
          "Veuillez sélectionner un film existant ou créer un nouveau film avant de soumettre la recette."
        );
        return false;
      }

      // Pour un nouveau film, vérifier qu'un tmdbId est présent (validation TMDB)
      // Mais seulement si aucun filmId n'est présent (pas un film existant sélectionné)
      const filmIdHidden = document.getElementById("filmId-hidden");
      const tmdbIdHidden = document.getElementById("tmdbId-hidden");

      // Si c'est un film existant (filmId présent), pas besoin de vérifier tmdbId
      if (
        !filmIdHidden ||
        !filmIdHidden.value ||
        filmIdHidden.value.trim() === ""
      ) {
        // C'est un nouveau film : vérifier tmdbId
        if (
          !tmdbIdHidden ||
          !tmdbIdHidden.value ||
          tmdbIdHidden.value.trim() === ""
        ) {
          alert(
            "Aucun film correspondant trouvé sur TMDB. Veuillez sélectionner une suggestion ou corriger le titre du film."
          );
          filmNameInput?.focus();
          return false;
        }
      }
    }

    // Vérifier les champs de la recette
    const recipeName = document.getElementById("recipe-name");
    const recipeDescription = document.getElementById("recipe-context");
    const recipeCategory = document.getElementById("category");
    const recipeDifficulty = document.getElementById("difficulty");
    const recipeTime = document.getElementById("recipe-time");
    const recipeIngredients = document.getElementById("ingredients");
    const recipePreparation = document.getElementById("preparation");

    if (!recipeName || !recipeName.value.trim()) {
      alert("Le nom de la recette est obligatoire.");
      recipeName?.focus();
      return false;
    }

    if (!recipeDescription || !recipeDescription.value.trim()) {
      alert("Le contexte de la recette est obligatoire.");
      recipeDescription?.focus();
      return false;
    }

    if (!recipeCategory || !recipeCategory.value) {
      alert("La catégorie est obligatoire.");
      recipeCategory?.focus();
      return false;
    }

    if (!recipeDifficulty || !recipeDifficulty.value) {
      alert("La difficulté est obligatoire.");
      recipeDifficulty?.focus();
      return false;
    }

    if (!recipeTime || !recipeTime.value || parseInt(recipeTime.value) < 1) {
      alert("Le temps de préparation est obligatoire (minimum 1 minute).");
      recipeTime?.focus();
      return false;
    }

    if (!recipeIngredients || !recipeIngredients.value.trim()) {
      alert("Les ingrédients sont obligatoires.");
      recipeIngredients?.focus();
      return false;
    }

    if (!recipePreparation || !recipePreparation.value.trim()) {
      alert("La préparation est obligatoire.");
      recipePreparation?.focus();
      return false;
    }

    return true;
  }

  // Synchroniser les données avant chaque soumission
  unifiedForm.addEventListener("submit", (e) => {
    // Synchroniser les données du film
    syncFilmDataToUnifiedForm();

    // Valider le formulaire
    if (!validateUnifiedForm()) {
      e.preventDefault();
      return false;
    }
  });

  // Synchroniser aussi quand les champs du film changent
  if (filmNameInput) {
    filmNameInput.addEventListener("blur", syncFilmDataToUnifiedForm);
  }
  if (filmYearInput) {
    filmYearInput.addEventListener("blur", syncFilmDataToUnifiedForm);
  }
  if (filmGenreSelect) {
    filmGenreSelect.addEventListener("change", syncFilmDataToUnifiedForm);
  }

  console.log("✅ Gestionnaire formulaire unifié initialisé");
});

