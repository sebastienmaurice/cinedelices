console.clear();

// Sélectionner toutes les colonnes avec overlay
const columns = document.querySelectorAll(
  ".recipe-column-left, .recipe-column-center, .recipe-column-right, .ingredients-column, .preparation-column, .film-form-container"
);

columns.forEach((column) => {
  const overlay = column.querySelector(".overlay");
  if (!overlay) return;

  // Créer une carte overlay rouge (inspiré du CodePen)
  const overlayCard = document.createElement("div");
  overlayCard.classList.add("overlay-card");
  overlay.appendChild(overlayCard);

  // Synchroniser la taille de l'overlay avec la colonne
  const resizeOverlay = () => {
    overlayCard.style.width = `${column.offsetWidth}px`;
    overlayCard.style.height = `${column.offsetHeight}px`;
  };

  resizeOverlay();
  window.addEventListener("resize", resizeOverlay);

  // Mettre à jour la position du masque de l'overlay
  const updateOverlayMask = (e) => {
    const rect = column.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    overlay.style.setProperty("--opacity", "1");
    overlay.style.setProperty("--x", `${x}px`);
    overlay.style.setProperty("--y", `${y}px`);
  };

  // Déplacer le masque avec la souris
  column.addEventListener("pointermove", updateOverlayMask);
  column.addEventListener("pointerleave", () => {
    overlay.style.setProperty("--opacity", "0");
  });
});
