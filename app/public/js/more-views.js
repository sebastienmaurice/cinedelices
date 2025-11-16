// pour voir tous les films ou seulement 3 dans la page des films

function initButtonHidden() {
    const button = document.getElementById('see__all__movies__button');
    const articlesList = document.getElementById('movies__list');
    
    button.textContent = "Voir tous les films"; // texte initial
    
    button.addEventListener('click', () => {
        // Toggle retourne true si la classe est AJOUTÉE
        const isLimited = articlesList.classList.toggle('only__display__3__films');
        
        // Si la classe est présente = affichage limité → bouton "Voir tous"
        // Si la classe est absente = affichage complet → bouton "Voir moins"
        button.textContent = isLimited ? "Voir tous les films" : "Voir moins";
    });
}

initButtonHidden();