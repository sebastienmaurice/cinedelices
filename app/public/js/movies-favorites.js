/**
 * Gestion des favoris sur les cards de films
 * - Toggle favori via API AJAX
 * - Affichage tooltip si non connecté
 * - Animation lors du toggle
 */

document.addEventListener("DOMContentLoaded", () => {
  const favoriteButtons = document.querySelectorAll(".btn-favorite");
  const isLoggedIn = window.CINEDELICES?.isLoggedIn || false;

  favoriteButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Si non connecté, ouvrir le modal de connexion
      if (!isLoggedIn) {
        // Utiliser le système de popup existant si disponible
        if (typeof openModal === "function") {
          openModal("login");
        } else {
          // Fallback : afficher un message via alert ou notification
          showNotification("Connectez-vous pour ajouter des favoris", "info");
        }
        return;
      }

      const movieId = btn.dataset.movieId;
      const isFavorite = btn.dataset.isFavorite === "true";

      // Désactiver le bouton pendant la requête
      btn.disabled = true;
      btn.style.opacity = "0.6";

      try {
        const response = await fetch("/api/favorites/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ movieId: parseInt(movieId) }),
        });

        const data = await response.json();

        if (data.success) {
          // Mettre à jour l'état visuel
          const newState = data.isFavorite;
          btn.dataset.isFavorite = newState;

          // Changer l'icône
          const icon = btn.querySelector("i");
          icon.className = newState
            ? "fa-solid fa-heart"
            : "fa-regular fa-heart";

          // Mettre à jour les attributs d'accessibilité
          const label = newState
            ? "Retirer des favoris"
            : "Ajouter aux favoris";
          btn.setAttribute("aria-label", label);
          btn.setAttribute("title", label);

          // Animation
          btn.classList.add("animating");
          setTimeout(() => btn.classList.remove("animating"), 400);

          // Notification de succès
          showNotification(data.message, "success");
        } else {
          console.error("Erreur:", data.message);
          showNotification(data.message || "Erreur lors de l'opération", "error");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
        showNotification("Erreur de connexion au serveur", "error");
      } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
      }
    });
  });

  /**
   * Affiche une notification temporaire
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, error, info)
   */
  function showNotification(message, type = "info") {
    // Vérifier si un système de notification existe déjà
    if (typeof window.showToast === "function") {
      window.showToast(message, type);
      return;
    }

    // Créer une notification simple si aucun système n'existe
    const existingNotif = document.querySelector(".favorites-notification");
    if (existingNotif) {
      existingNotif.remove();
    }

    const notification = document.createElement("div");
    notification.className = `favorites-notification favorites-notification--${type}`;
    notification.innerHTML = `
      <i class="fa-solid ${
        type === "success"
          ? "fa-check-circle"
          : type === "error"
          ? "fa-exclamation-circle"
          : "fa-info-circle"
      }"></i>
      <span>${message}</span>
    `;

    // Styles inline pour la notification
    Object.assign(notification.style, {
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      padding: "1rem 1.5rem",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "0.95rem",
      fontWeight: "500",
      zIndex: "9999",
      animation: "slideIn 0.3s ease",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      backgroundColor:
        type === "success"
          ? "#2e7d32"
          : type === "error"
          ? "#c62828"
          : "#1565c0",
      color: "#fff",
    });

    document.body.appendChild(notification);

    // Supprimer après 3 secondes
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease forwards";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Ajouter les keyframes pour l'animation
  if (!document.querySelector("#favorites-notification-styles")) {
    const style = document.createElement("style");
    style.id = "favorites-notification-styles";
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
});
