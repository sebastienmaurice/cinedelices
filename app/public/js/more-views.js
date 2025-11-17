// fonction portant sur le bouton pour afficher plus ou moins de films et de recettes

function initButtonHidden() {
    // pour voir tous les films ou seulement 3 dans la page des films
    const moviesButton = document.getElementById('see__all__movies__button');
    const moviesList = document.getElementById('movies__list');
    
    // si les éléments existent
    if (moviesButton && moviesList) {
        moviesButton.textContent = "Voir tous les films";
        // au clic sur le bouton
        moviesButton.addEventListener('click', () => {
            const isLimited = moviesList.classList.toggle('only__display__3__films');
            moviesButton.textContent = isLimited ? "Voir tous les films" : "Voir moins";
        });
    }

    // pour voir toutes les recettes ou seulement 3 dans la page des recettes
    const recipesButton = document.getElementById('see__all__recipes__button');
    const recipesList = document.getElementById('recipes__list');
    // si les éléments existent
    if (recipesButton && recipesList) {
        recipesButton.textContent = "Voir toutes les recettes";
        // au clic sur le bouton
        recipesButton.addEventListener('click', () => {
            const isLimited = recipesList.classList.toggle('only__display__3__recipes');
            recipesButton.textContent = isLimited ? "Voir toutes les recettes" : "Voir moins";
        });
    }
}

initButtonHidden();