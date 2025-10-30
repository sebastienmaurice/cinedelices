initButtonHidden();

function initButtonHidden() {
    const button = document.getElementById('see-all-products-button');
    const articlesList = document.getElementById('articles-list');

    button.textContent = "Voir tous les produits";

    button.addEventListener('click', () => {
        const isExpanded = articlesList.classList.toggle('only-display-3-articles');
        // Change le texte en fonction de l'état
        button.textContent = isExpanded ? "Voir tous les produits" : "Voir moins";
    });
}