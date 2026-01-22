// fonction portant sur le bouton pour afficher plus de films et plus ou moins de recettes

function initButtonHidden() {
    // pour voir plus de films dans la page des films (sans retour arrière)
    const moviesButton = document.getElementById('see__all__movies__button');
    const moviesList = document.getElementById('movies__list');
    
    // si les éléments existent
    if (moviesButton && moviesList) {
        const moviesCount = moviesList.querySelectorAll('article').length;

        const desktopMediaQuery = window.matchMedia("(min-width: 901px)");
        const getInitialLimit = () => (desktopMediaQuery.matches ? 9 : 6);

        const updateMoviesButtonVisibility = () => {
            if (moviesButton.style.display === "none" && !moviesList.classList.contains('only__display__9__films')) {
                return;
            }

            const limit = getInitialLimit();
            moviesButton.style.display = moviesCount > limit ? "" : "none";
        };

        updateMoviesButtonVisibility();
        moviesButton.textContent = "Voir plus";
        // au clic sur le bouton
        moviesButton.addEventListener('click', () => {
            moviesList.classList.remove('only__display__9__films');
            moviesButton.style.display = "none";
        });

        if (desktopMediaQuery.addEventListener) {
            desktopMediaQuery.addEventListener("change", updateMoviesButtonVisibility);
        } else if (desktopMediaQuery.addListener) {
            desktopMediaQuery.addListener(updateMoviesButtonVisibility);
        }
    }

    // pour voir plus de recettes dans la page des recettes (sans retour arrière)
    const recipesButton = document.getElementById('see__all__recipes__button');
    const recipesList = document.getElementById('recipes__list');
    // si les éléments existent
    if (recipesButton && recipesList) {
        const recipesCount = recipesList.querySelectorAll('article').length;
        const desktopMediaQuery = window.matchMedia("(min-width: 901px)");
        const getInitialLimit = () => (desktopMediaQuery.matches ? 9 : 6);

        const updateRecipesButtonVisibility = () => {
            if (recipesButton.style.display === "none" && !recipesList.classList.contains('only__display__9__recipes')) {
                return;
            }

            const limit = getInitialLimit();
            recipesButton.style.display = recipesCount > limit ? "" : "none";
        };

        updateRecipesButtonVisibility();
        recipesButton.textContent = "Voir plus";
        // au clic sur le bouton
        recipesButton.addEventListener('click', () => {
            recipesList.classList.remove('only__display__9__recipes');
            recipesButton.style.display = "none";
        });

        if (desktopMediaQuery.addEventListener) {
            desktopMediaQuery.addEventListener("change", updateRecipesButtonVisibility);
        } else if (desktopMediaQuery.addListener) {
            desktopMediaQuery.addListener(updateRecipesButtonVisibility);
        }
    }
}

initButtonHidden();