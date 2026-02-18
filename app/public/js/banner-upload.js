/**
 * banner-upload.js — Logique de la modale d'upload de bannière auteur
 *
 * Ce script orchestre l'interaction entre :
 * - La modale HTML (#bannerModal)
 * - Le cropper (classe BannerCropper définie dans banner-cropper.js)
 * - Le serveur (POST /auth/profil/:id/banner et /banner/delete)
 *
 * FLUX COMPLET :
 * 1. Clic sur "Modifier ma bannière" (#editBannerBtn) → ouvre la modale
 * 2. L'utilisateur choisit une image (input file)
 * 3. L'image est chargée dans le cropper (canvas) → aperçu temps réel
 * 4. L'utilisateur zoom / déplace pour cadrer sa bannière
 * 5. Clic "Enregistrer" → le canvas génère un Blob JPEG 1408×350
 * 6. Le Blob est envoyé via FormData au serveur (pas l'image originale !)
 * 7. Le serveur traite avec Sharp → WebP → sauvegarde
 *
 * POURQUOI LE CROP SE FAIT CÔTÉ FRONTEND :
 * L'utilisateur contrôle visuellement le cadrage.
 * Seule la zone sélectionnée est envoyée → économie de bande passante.
 * Le canvas HTML5 génère une image aux dimensions exactes.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ─── Récupération des éléments du DOM ───
  const editBtn = document.getElementById("editBannerBtn");
  const modal = document.getElementById("bannerModal");
  if (!editBtn || !modal) return;

  const overlay = modal.querySelector(".banner-modal__overlay");
  const closeBtn = document.getElementById("closeBannerModal");
  const cancelBtn = document.getElementById("cancelBannerModal");
  const fileInput = document.getElementById("bannerInput");
  const saveBtn = document.getElementById("saveBannerBtn");
  const resetBtn = document.getElementById("resetBannerBtn");
  const userId = editBtn.dataset.userId;

  // Éléments du cropper
  const canvas = document.getElementById("bannerCropperCanvas");
  const placeholder = document.getElementById("bannerPlaceholder");
  const zoomControl = document.getElementById("bannerZoomControl");
  const zoomRange = document.getElementById("bannerZoomRange");

  // Instanciation du cropper (classe définie dans banner-cropper.js)
  const cropper = new BannerCropper(canvas);
  let hasImage = false;

  // ─── OUVRIR LA MODALE ───
  editBtn.addEventListener("click", () => {
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
  });

  // ─── FERMER LA MODALE ───
  function closeModal() {
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
    resetCropper();
  }

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  // Fermeture avec Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-visible")) {
      closeModal();
    }
  });

  // Clic sur le placeholder → ouvre le sélecteur de fichier
  placeholder.addEventListener("click", () => fileInput.click());

  // ─── SÉLECTION D'UN FICHIER → CHARGEMENT DANS LE CROPPER ───
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Vérification du type MIME côté client
    if (!file.type.startsWith("image/")) {
      showToast("Format non supporté. Utilisez JPG, PNG ou WEBP.", "error");
      return;
    }

    // IMPORTANT : afficher le canvas AVANT de charger l'image
    // Quand le canvas est display:none, clientWidth vaut 0
    // et le calcul des dimensions du cropper échoue silencieusement
    placeholder.style.display = "none";
    canvas.style.display = "block";

    // Charger l'image dans le cropper (canvas)
    // Le cropper calcule automatiquement le zoom minimum et centre l'image
    await cropper.loadImage(file);

    hasImage = true;
    zoomControl.classList.add("is-visible");
    zoomRange.value = 0;
    saveBtn.disabled = false;
  });

  // ─── CONTRÔLE DU ZOOM VIA LE SLIDER ───
  // Le slider va de 0 (zoom minimum) à 100 (zoom maximum)
  // La valeur est convertie en ratio 0-1 pour le cropper
  zoomRange.addEventListener("input", () => {
    cropper.setZoom(zoomRange.value / 100);
  });

  // Synchroniser le slider quand l'utilisateur zoome à la molette
  canvas.addEventListener("wheel", () => {
    zoomRange.value = Math.round(cropper.getZoomPercent() * 100);
  });

  // ─── RÉINITIALISATION DU CROPPER ───
  function resetCropper() {
    hasImage = false;
    fileInput.value = "";
    placeholder.style.display = "flex";
    canvas.style.display = "none";
    zoomControl.classList.remove("is-visible");
    zoomRange.value = 0;
    saveBtn.disabled = true;
    cropper.destroy();
  }

  // ─── ENREGISTRER LA BANNIÈRE ───
  // Génère l'image recadrée via le canvas et l'envoie au serveur
  saveBtn.addEventListener("click", async () => {
    if (!hasImage) return;

    saveBtn.disabled = true;
    saveBtn.textContent = "Envoi...";

    try {
      // Génération du Blob JPEG 1408×350 via le canvas hors-écran
      // C'est cette image recadrée qui est envoyée, pas l'originale
      const blob = await cropper.export();

      if (!blob) {
        showToast("Erreur lors du recadrage.", "error");
        saveBtn.disabled = false;
        saveBtn.textContent = "Enregistrer";
        return;
      }

      // Envoi via FormData (identique à un formulaire multipart classique)
      // Le serveur reçoit un fichier nommé "banner" de type JPEG
      const formData = new FormData();
      formData.append("banner", blob, "banner-cropped.jpg");

      const response = await fetch(`/auth/profil/${userId}/banner`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showToast("Bannière envoyée. En attente de validation.", "success");
        closeModal();
        // Recharger la page pour afficher la bannière (ou le statut "en attente")
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast(data.message || "Erreur lors de l'envoi.", "error");
        saveBtn.disabled = false;
        saveBtn.textContent = "Enregistrer";
      }
    } catch {
      showToast("Erreur réseau.", "error");
      saveBtn.disabled = false;
      saveBtn.textContent = "Enregistrer";
    }
  });

  // ─── BANNIÈRE PAR DÉFAUT (SUPPRESSION) ───
  // Supprime la bannière personnalisée et revient à l'image par défaut
  resetBtn.addEventListener("click", async () => {
    // Confirmation avant suppression (utilise la modale custom si disponible)
    const confirmed = window.confirmAction
      ? await window.confirmAction({
          title: "Supprimer la bannière",
          message: "Votre page auteur reviendra à la bannière par défaut.",
          confirmLabel: "Supprimer",
          cancelLabel: "Annuler",
          variant: "danger",
        })
      : confirm("Revenir à la bannière par défaut ?");

    if (!confirmed) return;

    try {
      const response = await fetch(`/auth/profil/${userId}/banner/delete`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        showToast("Bannière supprimée.", "success");
        closeModal();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast(data.message || "Erreur.", "error");
      }
    } catch {
      showToast("Erreur réseau.", "error");
    }
  });

  // ─── TOAST NOTIFICATION ───
  // Affiche un message temporaire en bas de l'écran (succès ou erreur)
  function showToast(message, type) {
    const existing = document.querySelector(".banner-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `banner-toast banner-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animation d'apparition (via CSS transition)
    requestAnimationFrame(() => toast.classList.add("is-visible"));

    // Disparition après 3 secondes
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
