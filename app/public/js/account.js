(() => {
  const profilePage = document.querySelector(".profile-page");
  if (!profilePage) return;

  const userId = profilePage.dataset.userId;
  const editButton = document.getElementById("editProfileBtn");
  const saveButton = document.getElementById("saveProfileBtn");
  const toastContainer = document.querySelector(".profile-toast");
  const removeAvatarBtn = document.getElementById("removeAvatarBtn");
  const avatarInput = document.getElementById("avatar");
  const avatarImage = document.querySelector(".profile-photo");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");

  const editableInputs = profilePage.querySelectorAll(
    "#profileInfoForm input, #profileAvatarForm input[type='text'], #profilePrefsForm input"
  );

  let removeAvatar = false;
  let isEditing = false;

  const showToast = (message, type = "") => {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `profile-toast__item ${type ? `is-${type}` : ""}`.trim();
    const titleMap = {
      success: "Succès : ",
      warning: "Attention : ",
      error: "Erreur : ",
    };
    const prefix = type && titleMap[type] ? titleMap[type] : "";
    const titleSpan = document.createElement("span");
    titleSpan.className = "profile-toast__title";
    titleSpan.textContent = prefix;
    const messageSpan = document.createElement("span");
    messageSpan.className = "profile-toast__message";
    messageSpan.textContent = message;
    toast.appendChild(titleSpan);
    toast.appendChild(messageSpan);
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3500);
  };

  const setEditingState = (enabled) => {
    isEditing = enabled;
    editableInputs.forEach((input) => {
      input.disabled = !enabled;
    });
    if (!enabled) {
      removeAvatar = false;
    }
  };

  setEditingState(false);

  let pictureStatus = profilePage.dataset.pictureStatus;
  const avatarBadge = profilePage.querySelector(".profile-avatar__badge");
  const avatarNote = profilePage.querySelector(".profile-avatar__note");
  const statusBanner = profilePage.querySelector(".profile-status-banner");

  const updatePhotoUI = (status) => {
    pictureStatus = status;
    profilePage.dataset.pictureStatus = status;

    if (status === "pending") {
      if (avatarInput) avatarInput.disabled = true;
      if (removeAvatarBtn) removeAvatarBtn.disabled = true;
      if (avatarImage) {
        avatarImage.classList.add("profile-photo--pending");
      }
      if (avatarBadge) {
        avatarBadge.className = "profile-avatar__badge media-status-badge media-status-badge--pending";
        avatarBadge.textContent = "En attente";
        avatarBadge.style.display = "";
      }
      if (avatarNote) {
        avatarNote.textContent = "Validation en cours par Ciné Délices";
      }
      if (statusBanner) {
        statusBanner.textContent = "Votre photo de profil est en attente de validation par Ciné Délices.";
        statusBanner.className = "profile-status-banner";
        statusBanner.style.display = "";
      }
    } else if (status === "rejected") {
      if (avatarInput) avatarInput.disabled = false;
      if (removeAvatarBtn) removeAvatarBtn.disabled = false;
      if (avatarImage) {
        avatarImage.classList.remove("profile-photo--pending");
      }
      if (avatarBadge) {
        avatarBadge.className = "profile-avatar__badge media-status-badge media-status-badge--rejected";
        avatarBadge.textContent = "Refusée";
        avatarBadge.style.display = "";
      }
      if (avatarNote) {
        avatarNote.textContent = "Photo refusée — vous pouvez en téléverser une nouvelle";
      }
    } else {
      if (avatarInput) avatarInput.disabled = false;
      if (removeAvatarBtn) removeAvatarBtn.disabled = false;
      if (avatarImage) {
        avatarImage.classList.remove("profile-photo--pending");
      }
    }
  };

  // Appliquer l'état initial
  if (pictureStatus === "pending") {
    updatePhotoUI("pending");
    showToast("Photo en attente de validation.", "warning");
  } else if (pictureStatus === "rejected") {
    updatePhotoUI("rejected");
    showToast("Photo refusée. Vous pouvez en téléverser une nouvelle.", "warning");
  }

  if (editButton) {
    editButton.addEventListener("click", () => {
      setEditingState(true);
      showToast("Mode édition activé.", "success");
      const firstField = document.querySelector("#firstname");
      firstField?.focus();
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", () => {
      if (!isEditing) {
        setEditingState(true);
        showToast("Mode édition activé.", "success");
      }
      removeAvatar = true;
      if (avatarImage) {
        avatarImage.src = "/images/image-default-profile.jpg";
      }
      showToast("La photo sera supprimée lors de l'enregistrement.", "success");
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener("change", async () => {
      if (!avatarInput.files || !avatarInput.files[0]) return;

      const file = avatarInput.files[0];
      if (!file.type.startsWith("image/")) {
        showToast("Le fichier sélectionné n'est pas une image.", "error");
        return;
      }

      // Prévisualisation immédiate
      const reader = new FileReader();
      reader.onload = (event) => {
        if (avatarImage && event.target?.result) {
          avatarImage.src = event.target.result;
        }
      };
      reader.readAsDataURL(file);
      removeAvatar = false;

      // Upload indépendant immédiat
      showToast("Envoi de la photo en cours...");
      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const response = await fetch(`/auth/profil/${userId}/photo`, {
          method: "POST",
          body: formData,
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : null;

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Erreur lors de l'envoi de la photo.");
        }

        updatePhotoUI("pending");
        showToast("Photo envoyée. En attente de validation.", "success");
      } catch (error) {
        showToast(error.message, "error");
      }

      // Reset l'input pour permettre de re-sélectionner le même fichier
      avatarInput.value = "";
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      if (!isEditing) {
        setEditingState(true);
        showToast("Mode édition activé.", "success");
        return;
      }

      showToast("Enregistrement en cours...");

      const formData = new FormData();
      const firstName = document.getElementById("firstname")?.value?.trim();
      const lastName = document.getElementById("lastname")?.value?.trim();
      const email = document.getElementById("email")?.value?.trim();
      const pseudo = document.getElementById("username")?.value?.trim();
      const password = document.getElementById("password")?.value?.trim();

      if (firstName) formData.append("first_name", firstName);
      if (lastName) formData.append("last_name", lastName);
      if (email) formData.append("email", email);
      if (pseudo) formData.append("pseudo", pseudo);
      if (password) formData.append("password", password);

      const notifyRecipes = document.querySelector("input[name='notify_recipes']");
      const notifyCinema = document.querySelector("input[name='notify_cinema']");
      if (notifyRecipes) {
        formData.append("notify_recipes", notifyRecipes.checked ? "true" : "false");
      }
      if (notifyCinema) {
        formData.append("notify_cinema", notifyCinema.checked ? "true" : "false");
      }

      if (removeAvatar) {
        formData.append("remove_avatar", "true");
      }

      try {
        const response = await fetch(`/auth/profil/${userId}/update`, {
          method: "POST",
          body: formData,
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : null;

        if (!response.ok || !data?.success) {
          const fallbackMessage =
            data?.message ||
            (response.ok ? "Erreur lors de la mise à jour." : "Erreur serveur.");
          throw new Error(fallbackMessage);
        }

        showToast("Profil mis à jour avec succès.", "success");
        setEditingState(false);
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
      const actionConfig =
        (window.getConfirmConfig && window.getConfirmConfig("account.deleteAccount")) ||
        {};
      const confirmDelete = await window.confirmAction(actionConfig);
      if (!confirmDelete) return;

      showToast("Suppression du compte en cours...", "warning");

      try {
        const response = await fetch(`/auth/profil/${userId}/delete`, {
          method: "POST",
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : null;

        if (!response.ok || !data?.success) {
          const fallbackMessage =
            data?.message ||
            (response.ok ? "Erreur lors de la suppression." : "Erreur serveur.");
          throw new Error(fallbackMessage);
        }

        window.location.href = "/";
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  }

  const carousel = profilePage.querySelector(".profile-mini-carousel");
  const prevBtn = profilePage.querySelector(".profile-mini-carousel__nav--prev");
  const nextBtn = profilePage.querySelector(".profile-mini-carousel__nav--next");

  if (carousel && prevBtn && nextBtn) {
    const scrollAmount = 200;

    prevBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    nextBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }

  const items = profilePage.querySelectorAll(".account-item");
  items.forEach((item) => {
    const type = item.dataset.type;
    const editBtn = item.querySelector(".account-edit-btn");
    const deleteBtn = item.querySelector(".account-delete-btn");
    const editPanel = item.querySelector(".account-item__edit");
    const cancelBtn = item.querySelector(".account-cancel-btn");
    const saveBtn = item.querySelector(".account-save-btn");
    const previewSpan = item.querySelector(".account-item__preview span");
    const titleEl = item.querySelector(".account-item__title");
    const metaEl = item.querySelector(".account-item__meta");
    const hintEl = item.querySelector(".account-item__hint");
    const headerEl = item.querySelector(".account-item__header");
    const getEditStatus = () => item.dataset.editStatus || "none";
    const getDeleteStatus = () => item.dataset.deleteRequest || "none";

    const setStatusBadge = (label, statusClass) => {
      if (!headerEl) return;
      const existing = headerEl.querySelector(".account-item__status");
      if (existing) {
        existing.textContent = label;
        existing.className = `account-item__status ${statusClass}`.trim();
        return;
      }
      const badge = document.createElement("span");
      badge.className = `account-item__status ${statusClass}`.trim();
      badge.textContent = label;
      headerEl.appendChild(badge);
    };

    const updatePreview = () => {
      if (!previewSpan || !editPanel) return;
      const inputs = editPanel.querySelectorAll("input, textarea");
      const values = {};
      inputs.forEach((input) => {
        if (input.type === "file") return;
        values[input.name] = input.value.trim();
      });
      if (type === "recipe") {
        previewSpan.textContent = `${values.name || ""} • ${values.category || ""} • ${values.time || ""} min • ${values.difficulty || ""}`.trim();
      } else if (type === "movie") {
        previewSpan.textContent = `${values.title || ""} • ${values.year || ""} • ${values.genre || ""}`.trim();
      } else if (type === "notice") {
        previewSpan.textContent = `${values.quote || ""}/5 • ${values.content || ""}`.trim();
      }
    };

    editBtn?.addEventListener("click", () => {
      if (!editPanel) return;
      if (getEditStatus() === "pending") {
        showToast("Modification déjà en attente.", "warning");
        return;
      }
      editPanel.classList.add("is-open");
      updatePreview();
    });

    cancelBtn?.addEventListener("click", () => {
      if (!editPanel) return;
      editPanel.classList.remove("is-open");
    });

    editPanel?.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("input", updatePreview);
    });

    saveBtn?.addEventListener("click", async () => {
      if (!editPanel) return;
      if (getEditStatus() === "pending") {
        showToast("Modification déjà en attente.", "warning");
        return;
      }

      const payload = {};
      const formData = new FormData();
      const fields = editPanel.querySelectorAll("input, textarea");
      fields.forEach((input) => {
        if (input.type === "file") {
          if (input.files && input.files[0]) {
            formData.append(input.name, input.files[0]);
          }
          return;
        }
        if (input.value.trim()) {
          payload[input.name] = input.value.trim();
          formData.append(input.name, input.value.trim());
        }
      });

      if (Object.keys(payload).length === 0 && formData.entries().next().done) {
        showToast("Aucune modification détectée.", "warning");
        return;
      }

      const endpoint =
        type === "recipe"
          ? `/auth/profil/${userId}/recipes/${item.dataset.id}/update`
          : type === "movie"
            ? `/auth/profil/${userId}/movies/${item.dataset.id}/update`
            : `/auth/profil/${userId}/notices/${item.dataset.id}/update`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: type === "recipe" ? undefined : { "Content-Type": "application/json" },
          body: type === "recipe" ? formData : JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Erreur lors de la mise à jour.");
        }

        if (data.pending) {
          item.dataset.editStatus = "pending";
          if (editBtn) editBtn.disabled = true;
          setStatusBadge("Modif en attente", "is-pending");
          editPanel.classList.remove("is-open");
          showToast(data.message || "Modification envoyée.", "warning");
          return;
        }

        if (type === "recipe") {
          if (payload.name && titleEl) titleEl.textContent = payload.name;
          if (metaEl) {
            const category = payload.category || item.dataset.category;
            const time = payload.time || item.dataset.time;
            const difficulty = payload.difficulty || item.dataset.difficulty;
            metaEl.textContent = `${category} • ${time} min • ${difficulty}`;
          }
          item.dataset.category = payload.category || item.dataset.category;
          item.dataset.time = payload.time || item.dataset.time;
          item.dataset.difficulty = payload.difficulty || item.dataset.difficulty;
        } else if (type === "movie") {
          if (payload.title && titleEl) titleEl.textContent = payload.title;
          if (metaEl) {
            const year = payload.year || item.dataset.year;
            const genre = payload.genre || item.dataset.genre;
            metaEl.textContent = `${year} • ${genre}`;
          }
          item.dataset.year = payload.year || item.dataset.year;
          item.dataset.genre = payload.genre || item.dataset.genre;
        } else if (type === "notice") {
          if (payload.content && titleEl) {
            const textEl = item.querySelector(".account-item__text");
            if (textEl) textEl.textContent = payload.content;
          }
          if (metaEl && payload.quote) {
            const dateText = metaEl.textContent.split("•")[0]?.trim() || "";
            metaEl.textContent = `${dateText} • ${payload.quote}/5`.trim();
          }
        }

        editPanel.classList.remove("is-open");
        showToast(data.message || "Mise à jour effectuée.", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    });

    deleteBtn?.addEventListener("click", async () => {
      if (type === "notice" && getDeleteStatus() === "pending") {
        showToast("Suppression déjà en attente.", "warning");
        return;
      }
      const actionKey = type === "recipe" ? "account.deleteRecipe" : "account.deleteNotice";
      const actionConfig =
        (window.getConfirmConfig && window.getConfirmConfig(actionKey)) || {};
      const confirmDelete = await window.confirmAction(actionConfig);
      if (!confirmDelete) return;

      const endpoint =
        type === "recipe"
          ? `/auth/profil/${userId}/recipes/${item.dataset.id}/delete`
          : type === "movie"
            ? `/auth/profil/${userId}/movies/${item.dataset.id}/delete`
            : `/auth/profil/${userId}/notices/${item.dataset.id}/delete`;

      try {
        const response = await fetch(endpoint, { method: "POST" });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Erreur lors de la suppression.");
        }
        if (data.request) {
          showToast(data.message || "Demande envoyée.", "warning");
          if (deleteBtn) {
            deleteBtn.textContent = "Demande envoyée";
            deleteBtn.disabled = true;
          }
          if (!hintEl) {
            const hint = document.createElement("p");
            hint.className = "account-item__hint";
            hint.textContent =
              "Demande de suppression en attente de validation admin.";
            metaEl?.insertAdjacentElement("afterend", hint);
          } else {
            hintEl.textContent =
              "Demande de suppression en attente de validation admin.";
          }
          item.dataset.deleteRequest = "pending";
          setStatusBadge("Suppression en attente", "is-pending");
          return;
        }

        item.remove();
        showToast(data.message || "Suppression effectuée.", "success");

        if (type === "recipe" && hintEl) {
          hintEl.remove();
        }
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  // ====================================================
  // COLLECTIONS: TOGGLE COLLAPSE/EXPAND
  // ====================================================
  const toggleHeaders = profilePage.querySelectorAll(
    ".collections-section__toggle"
  );

  toggleHeaders.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const section = toggle.closest(".collections-section");
      if (!section) return;

      const isCollapsed = section.classList.toggle("is-collapsed");
      toggle.setAttribute("aria-expanded", String(!isCollapsed));
    });
  });

  // ====================================================
  // COLLECTIONS: SEARCH FILTER PER SECTION
  // ====================================================
  const searchInputs = profilePage.querySelectorAll(
    ".collections-section__search-input"
  );

  searchInputs.forEach((input) => {
    const section = input.closest(".collections-section");
    if (!section) return;

    const clearBtn = section.querySelector(".collections-section__search-clear");
    const noResultsMsg = section.querySelector(
      ".collections-section__no-results"
    );
    const listContainer = section.querySelector(".collections-section__list");

    const filterItems = () => {
      const query = input.value.trim().toLowerCase();
      const sectionItems = listContainer.querySelectorAll(".account-item");
      let visibleCount = 0;

      sectionItems.forEach((item) => {
        const searchable = [
          item.dataset.name || "",
          item.dataset.title || "",
          item.dataset.category || "",
          item.dataset.year || "",
          item.dataset.genre || "",
          item.dataset.difficulty || "",
        ]
          .join(" ")
          .toLowerCase();

        const textContent =
          item.querySelector(".account-item__text")?.textContent || "";
        const hintContent =
          item.querySelector(".account-item__hint")?.textContent || "";
        const fullHaystack =
          searchable +
          " " +
          textContent.toLowerCase() +
          " " +
          hintContent.toLowerCase();

        if (!query || fullHaystack.includes(query)) {
          item.classList.remove("is-filtered-out");
          visibleCount++;
        } else {
          item.classList.add("is-filtered-out");
        }
      });

      if (noResultsMsg) {
        noResultsMsg.style.display =
          query && visibleCount === 0 ? "" : "none";
      }

      if (clearBtn) {
        clearBtn.classList.toggle("is-visible", query.length > 0);
      }
    };

    input.addEventListener("input", filterItems);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        filterItems();
        input.focus();
      });
    }
  });
})();
