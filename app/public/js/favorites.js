/**
 * Gestion unifiée des favoris et des notes (films et recettes)
 *
 * Ce script gère :
 * - Toggle favori via API AJAX (POST /api/favorites/toggle)
 * - Notes interactives via API AJAX (POST /api/ratings)
 *
 * Supporte les deux types d'entités :
 * - Films (data-entity-type="movie")
 * - Recettes (data-entity-type="recipe")
 */

/* ── Compteur favoris nav — mise à jour en temps réel ─────────────── */
function _updateNavFavCount(delta) {
  const el = document.getElementById("navFavCount");
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) {
    el.textContent = "";
    el.classList.remove("has-favs");
  } else {
    el.textContent = next > 99 ? "99+" : next;
    el.classList.add("has-favs");
  }
}

/* ── XP toast (affiché uniquement pour les membres) ───────────────── */
function _showXpToast(xpGained, leveledUp, rank) {
  if (!xpGained) return;
  const msg = leveledUp
    ? `+${xpGained} XP — Niveau supérieur ! ${rank}`
    : `+${xpGained} XP`;
  if (window._cdToast) { window._cdToast(msg, "success"); return; }
  // fallback léger si gamification.js absent
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;background:#1a7a46;color:#fff;padding:10px 18px;border-radius:6px;font-size:.85rem;box-shadow:0 4px 16px rgba(0,0,0,.4);pointer-events:none;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = window.CINEDELICES?.isLoggedIn || false;

  // ============================================================
  // FAVORIS
  // ============================================================
  initFavorites();

  // ============================================================
  // NOTES (RATINGS)
  // ============================================================
  initRatings();

  /**
   * Initialise les boutons favoris
   */
  function initFavorites() {
    const favoriteButtons = document.querySelectorAll(".btn-fav");

    favoriteButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) {
          if (typeof openModal === "function") {
            openModal("login");
          } else {
            showNotification("Connectez-vous pour ajouter des favoris", "info");
          }
          return;
        }

        const entityType = btn.dataset.entityType || "movie";
        const entityId = btn.dataset.entityId || btn.dataset.movieId;

        if (!entityId) {
          console.error("ID d'entité manquant sur le bouton favori");
          return;
        }

        btn.disabled = true;
        btn.style.opacity = "0.6";

        try {
          const response = await fetch("/api/favorites/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityId: parseInt(entityId),
              entityType: entityType,
            }),
          });

          const data = await response.json();

          if (data.success) {
            const newState = data.isFavorite;
            btn.dataset.isFavorite = newState;

            // Remplacer l'icône SVG
            if (window.LucideIcons) {
              window.LucideIcons.replace(btn, 'heart', { filled: newState });
            }

            const textSpan = btn.querySelector(".btn-favorite__text");
            if (textSpan) {
              textSpan.textContent = newState ? "Dans mes favoris" : "Ajouter aux favoris";
            }

            const label = newState ? "Retirer des favoris" : "Ajouter aux favoris";
            btn.setAttribute("aria-label", label);
            btn.setAttribute("title", label);

            btn.classList.add("animating");
            setTimeout(() => btn.classList.remove("animating"), 400);

            // Mise à jour compteur nav en temps réel
            _updateNavFavCount(newState ? +1 : -1);

            showNotification(data.message, "success");
            if (newState) _showXpToast(data.xpGained, data.leveledUp, data.rank);
          } else {
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
  }

  /**
   * Initialise les éléments de notation interactifs
   */
  function initRatings() {
    const ratingElements = document.querySelectorAll(".rating-interactive");

    ratingElements.forEach((ratingEl) => {
      const stars = ratingEl.querySelectorAll(".star[data-value]");
      const entityId = ratingEl.dataset.entityId;
      const entityType = ratingEl.dataset.entityType || "movie";

      if (!stars.length) return;

      // Hover effect
      stars.forEach((star) => {
        star.addEventListener("mouseenter", () => {
          if (!isLoggedIn) return;
          const value = parseInt(star.dataset.value);
          highlightStars(stars, value);
        });

        star.addEventListener("mouseleave", () => {
          const currentRating = ratingEl.dataset.userRating || ratingEl.dataset.average || 0;
          highlightStars(stars, Math.round(parseFloat(currentRating)));
        });

        // Click to rate
        star.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!isLoggedIn) {
            if (typeof openModal === "function") {
              openModal("login");
            } else {
              showNotification("Connectez-vous pour noter", "info");
            }
            return;
          }

          const score = parseInt(star.dataset.value);

          try {
            const response = await fetch("/api/ratings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                entityId: parseInt(entityId),
                entityType: entityType,
                score: score,
              }),
            });

            const data = await response.json();

            if (data.success) {
              ratingEl.dataset.userRating = data.score;
              ratingEl.dataset.average = data.average;
              ratingEl.dataset.count = data.count;

              highlightStars(stars, score);

              const valueEl = ratingEl.querySelector(".rating-value");
              if (valueEl) {
                // Garder le format existant (avec ou sans /5)
                const currentText = valueEl.textContent;
                if (currentText.includes("/5")) {
                  valueEl.textContent = data.average + "/5";
                } else {
                  valueEl.textContent = data.average;
                }
              }

              ratingEl.setAttribute("title", `Votre note : ${score}/5`);

              stars.forEach((s, i) => {
                if (i < score) {
                  s.classList.add("animating");
                  setTimeout(() => s.classList.remove("animating"), 400);
                }
              });

              showNotification(data.message, "success");
            } else {
              showNotification(data.message || "Erreur lors de la notation", "error");
            }
          } catch (error) {
            console.error("Erreur réseau:", error);
            showNotification("Erreur de connexion au serveur", "error");
          }
        });
      });

      // Curseur pointer si connecté
      if (isLoggedIn) {
        stars.forEach((star) => {
          star.style.cursor = "pointer";
        });
      }
    });
  }

  /**
   * Met en surbrillance les étoiles jusqu'à la valeur donnée
   */
  function highlightStars(stars, value) {
    stars.forEach((star, index) => {
      if (index < value) {
        star.classList.add("is-active");
      } else {
        star.classList.remove("is-active");
      }
    });
  }

  /**
   * Affiche une notification temporaire
   */
  function showNotification(message, type = "info") {
    if (typeof window.showToast === "function") {
      window.showToast(message, type);
      return;
    }

    const existingNotif = document.querySelector(".favorites-notification");
    if (existingNotif) existingNotif.remove();

    const notification = document.createElement("div");
    notification.className = `favorites-notification favorites-notification--${type}`;

    const iconName = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
    const iconSVG = window.LucideIcons ? window.LucideIcons.create(iconName) : '';
    notification.innerHTML = `
      ${iconSVG}
      <span>${message}</span>
    `;

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
      backgroundColor: type === "success" ? "#2e7d32" : type === "error" ? "#c62828" : "#1565c0",
      color: "#fff",
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease forwards";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Ajouter les keyframes et styles pour animations
  if (!document.querySelector("#favorites-notification-styles")) {
    const style = document.createElement("style");
    style.id = "favorites-notification-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      .star.animating {
        animation: starPulse 0.4s ease;
      }
      @keyframes starPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.4); }
        100% { transform: scale(1); }
      }
      .rating-interactive .star {
        transition: transform 0.2s ease, color 0.2s ease;
      }
      .rating-interactive .star:hover {
        transform: scale(1.2);
      }
    `;
    document.head.appendChild(style);
  }
});

