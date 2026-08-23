/**
 * add-recipes-movies-step2.js
 * Étape 02 "Ma recette" — si le film sélectionné possède déjà une ou
 * plusieurs recettes publiées sur Ciné Délices, on les propose au
 * contributeur (plutôt que de le laisser recréer une recette en double).
 */
(function () {
  "use strict";

  var nameInput = document.getElementById("recipe-name");
  var box = document.getElementById("dcExistingRecipes");
  if (!nameInput || !box) return;

  var filmIdHidden = document.getElementById("filmId-hidden");
  var fetchedForFilmId = null;
  var existingRecipes = [];

  function escHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function renderBox() {
    if (!existingRecipes.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    var items = existingRecipes.map(function (r) {
      return (
        '<a class="dc-existing-recipe" href="/recipes-movie/details/' + r.id + '" target="_blank" rel="noopener">' +
        '<span class="dc-existing-recipe__badge"><i data-lucide="clapperboard" width="11" height="11" stroke-width="2.2" aria-hidden="true"></i>Ciné Délices</span>' +
        '<span class="dc-existing-recipe__name">' + escHtml(r.name) + "</span>" +
        '<i data-lucide="arrow-up-right" width="13" height="13" stroke-width="2" class="dc-existing-recipe__go" aria-hidden="true"></i>' +
        "</a>"
      );
    }).join("");
    box.innerHTML =
      '<p class="dc-existing-recipes__title">' +
      (existingRecipes.length > 1 ? "Des recettes existent déjà pour ce film :" : "Une recette existe déjà pour ce film :") +
      "</p>" +
      '<div class="dc-existing-recipes__list">' + items + "</div>";
    box.hidden = false;
    if (window.lucide) lucide.createIcons();
  }

  function ensureLoaded() {
    var filmId = (filmIdHidden && filmIdHidden.value || "").trim();
    if (!filmId || filmId === fetchedForFilmId) return Promise.resolve();
    fetchedForFilmId = filmId;
    return fetch("/recipes-movie/api/by-movie/" + encodeURIComponent(filmId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        existingRecipes = (data && data.success && Array.isArray(data.recipes)) ? data.recipes : [];
        renderBox();
      })
      .catch(function () { existingRecipes = []; renderBox(); });
  }

  // Cas "film déjà sélectionné" (arrivée via /add-recipes-movies/:id, ou
  // fiche TMDB déjà reconnue en étape 01) : filmId-hidden a déjà une valeur.
  ensureLoaded();
  // Sinon on retente au premier focus du champ (le temps que l'étape 01 ait
  // rempli filmId-hidden entre-temps).
  nameInput.addEventListener("focus", ensureLoaded);
})();
