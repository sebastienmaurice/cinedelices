document.addEventListener("DOMContentLoaded", () => {

  // ══════════════════════════════════════════════════════
  // TOAST STACK (nouveau système v2)
  // ══════════════════════════════════════════════════════
  const toastStack = document.getElementById("toast-stack");
  // Legacy fallback
  const toastContainerLegacy = document.querySelector(".admin-toast");

  const showToast = (message, type = "") => {
    // Nouveau système
    if (toastStack) {
      const toast = document.createElement("div");
      const iconMap = {
        success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      };
      toast.className = `toast${type ? ` toast--${type}` : ""}`;
      toast.innerHTML = `${iconMap[type] || ""}<span>${message}</span>`;
      toastStack.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add("in"));
      setTimeout(() => {
        toast.classList.remove("in");
        toast.classList.add("out");
        setTimeout(() => toast.remove(), 350);
      }, 3500);
      return;
    }
    // Fallback legacy
    if (!toastContainerLegacy) return;
    const toast = document.createElement("div");
    const titleMap = { success: "Succès : ", warning: "Attention : ", error: "Erreur : " };
    toast.className = `admin-toast__item ${type ? `is-${type}` : ""}`.trim();
    const titleSpan = document.createElement("span");
    titleSpan.className = "admin-toast__title";
    titleSpan.textContent = type && titleMap[type] ? titleMap[type] : "";
    const messageSpan = document.createElement("span");
    messageSpan.className = "admin-toast__message";
    messageSpan.textContent = message;
    toast.appendChild(titleSpan);
    toast.appendChild(messageSpan);
    toastContainerLegacy.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  // ══════════════════════════════════════════════════════
  // NAVIGATION SIDEBAR — data-nav-view / data-view-id
  // ══════════════════════════════════════════════════════
  const navItems = document.querySelectorAll("[data-nav-view]");
  const views = document.querySelectorAll(".view[data-view-id]");
  const breadcrumbCurrent = document.getElementById("breadcrumb-current");

  const viewLabels = {
    dashboard: "Vue d'ensemble",
    films: "Films",
    recettes: "Recettes",
    avis: "Avis",
    demandes: "Demandes",
    photos: "Photos profil",
    bannieres: "Bannières",
    utilisateurs: "Utilisateurs",
    publies: "Contenus publiés",
  };

  const activateView = (viewId) => {
    // Nav items
    navItems.forEach((item) => {
      item.classList.toggle("is-active", item.dataset.navView === viewId);
    });
    // Views
    views.forEach((view) => {
      view.classList.toggle("is-active", view.dataset.viewId === viewId);
    });
    // Breadcrumb
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = viewLabels[viewId] || viewId;
    }
    // Scroll to top
    document.querySelector(".content")?.scrollTo(0, 0);
  };

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.navView;
      if (target) activateView(target);
    });
  });

  // Activer dashboard par défaut
  activateView("dashboard");

  // ══════════════════════════════════════════════════════
  // SOUS-TABS — data-sub-tab / #sub-panel-id
  // ══════════════════════════════════════════════════════
  const queueTabs = document.querySelectorAll(".queue-tab[data-sub-tab]");

  queueTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.subTab;
      if (!targetId) return;
      // Désactiver les onglets du même groupe (même vue parente)
      const parentView = tab.closest(".view");
      if (parentView) {
        parentView.querySelectorAll(".queue-tab[data-sub-tab]").forEach((t) => {
          t.classList.remove("is-active");
        });
        parentView.querySelectorAll(".sub-panel").forEach((panel) => {
          panel.style.display = "none";
        });
      }
      tab.classList.add("is-active");
      const panel = document.getElementById(targetId);
      if (panel) panel.style.display = "";
    });
  });

  // ══════════════════════════════════════════════════════
  // SIDEBAR TOGGLE (mobile)
  // ══════════════════════════════════════════════════════
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("is-collapsed");
    });
  }

  // ══════════════════════════════════════════════════════
  // TOASTS — URL params (après redirect)
  // ══════════════════════════════════════════════════════
  const urlParams = new URLSearchParams(window.location.search);
  const successParam = urlParams.get("success");
  const toastMap = {
    movie_validated: { message: "Film validé avec succès.", type: "success" },
    movie_rejected: { message: "Film refusé et supprimé.", type: "warning" },
    movie_edit_approved: { message: "Modification du film validée.", type: "success" },
    movie_edit_rejected: { message: "Modification du film refusée.", type: "warning" },
    movie_delete_approved: { message: "Suppression du film approuvée.", type: "error" },
    movie_delete_rejected: { message: "Demande de suppression refusée.", type: "warning" },
    recipe_validated: { message: "Recette validée avec succès.", type: "success" },
    recipe_edit_approved: { message: "Modification de la recette validée.", type: "success" },
    recipe_edit_rejected: { message: "Modification de la recette refusée.", type: "warning" },
    recipe_updated: { message: "Recette mise à jour.", type: "success" },
    recipe_update_empty: { message: "Aucune modification détectée.", type: "warning" },
    recipe_update_error: { message: "Erreur lors de la mise à jour de la recette.", type: "error" },
    recipe_rejected: { message: "Recette refusée et supprimée.", type: "warning" },
    recipe_picture_deleted: { message: "Photo complémentaire refusée et supprimée.", type: "warning" },
    recipe_picture_not_found: { message: "Photo introuvable.", type: "error" },
    recipe_picture_protected: { message: "La photo principale ne peut pas être supprimée ici.", type: "error" },
    user_deleted: { message: "Utilisateur supprimé avec succès.", type: "error" },
    user_photo_approved: { message: "Photo de profil validée.", type: "success" },
    user_photo_rejected: { message: "Photo de profil refusée.", type: "warning" },
    notice_validated: { message: "Avis validé.", type: "success" },
    notice_rejected: { message: "Avis refusé.", type: "warning" },
    notice_edit_approved: { message: "Modification de l'avis validée.", type: "success" },
    notice_edit_rejected: { message: "Modification de l'avis refusée.", type: "warning" },
    notice_delete_approved: { message: "Suppression de l'avis approuvée.", type: "error" },
    notice_delete_rejected: { message: "Suppression de l'avis refusée.", type: "warning" },
    admin_movie_deleted: { message: "Film supprimé par l'administrateur.", type: "success" },
    admin_movie_delete_error: { message: "Erreur lors de la suppression du film.", type: "error" },
    admin_recipe_deleted: { message: "Recette supprimée par l'administrateur.", type: "success" },
    admin_recipe_delete_error: { message: "Erreur lors de la suppression de la recette.", type: "error" },
    admin_notice_deleted: { message: "Avis supprimé par l'administrateur.", type: "success" },
    admin_notice_delete_error: { message: "Erreur lors de la suppression de l'avis.", type: "error" },
    admin_movie_updated: { message: "Film mis à jour par l'administrateur.", type: "success" },
    admin_movie_update_error: { message: "Erreur lors de la mise à jour du film.", type: "error" },
    admin_recipe_updated: { message: "Recette mise à jour par l'administrateur.", type: "success" },
    admin_recipe_update_error: { message: "Erreur lors de la mise à jour de la recette.", type: "error" },
    admin_notice_updated: { message: "Avis mis à jour par l'administrateur.", type: "success" },
    admin_notice_update_error: { message: "Erreur lors de la mise à jour de l'avis.", type: "error" },
  };

  if (successParam && toastMap[successParam]) {
    const { message, type } = toastMap[successParam];
    showToast(message, type);
  }

  // ══════════════════════════════════════════════════════
  // FILTRES INLINE — data-filter-input / data-search-item
  // ══════════════════════════════════════════════════════
  document.querySelectorAll("[data-filter-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      const panelId = input.dataset.filterInput;
      const panel = document.getElementById(panelId) || input.closest(".sub-panel, .view");
      if (!panel) return;
      panel.querySelectorAll("[data-search-item]").forEach((item) => {
        const haystack = item.dataset.searchItem || "";
        item.style.display = !query || haystack.includes(query) ? "" : "none";
      });
      // ctable rows
      panel.querySelectorAll(".admin-list-item[data-search]").forEach((row) => {
        const haystack = row.dataset.search || "";
        row.style.display = !query || haystack.includes(query) ? "" : "none";
      });
    });
  });

  // ══════════════════════════════════════════════════════
  // CONFIRM FORM ACTIONS
  // ══════════════════════════════════════════════════════
  const confirmFormActions = (selector, actionKey, options = {}) => {
    const forms = document.querySelectorAll(selector);
    forms.forEach((form) => {
      form.addEventListener("submit", async (event) => {
        if (!window.confirmAction) return;
        event.preventDefault();
        const submitter = event.submitter;
        const actionConfig =
          (window.getConfirmConfig && window.getConfirmConfig(actionKey)) || {};
        const accepted = await window.confirmAction({
          message: actionConfig.message || options.message,
          variant: actionConfig.variant || options.variant,
          confirmLabel: actionConfig.confirmLabel || options.confirmLabel,
          title: actionConfig.title || options.title,
        });
        if (accepted) {
          if (submitter && submitter.hasAttribute("formaction")) {
            form.action = submitter.getAttribute("formaction");
          }
          form.submit();
        }
      });
    });
  };

  confirmFormActions('form[action^="/admin/deleteUser/"]', "admin.deleteUser");
  confirmFormActions('form[action^="/admin/rejectMovie/"]', "admin.rejectMovie");
  confirmFormActions('form[action^="/admin/rejectRecipe/"]', "admin.rejectRecipe");
  confirmFormActions('form[action^="/admin/rejectNotice/"]', "admin.rejectNotice");
  confirmFormActions('form[action^="/admin/validateMovie/"]', "admin.validateMovie");
  confirmFormActions('form[action^="/admin/validateRecipe/"]', "admin.validateRecipe");
  confirmFormActions('form[action^="/admin/validateNotice/"]', "admin.validateNotice");
  confirmFormActions('form[action^="/admin/users/"][action$="/photo/approve"]', "admin.approveProfilePhoto");
  confirmFormActions('form[action^="/admin/users/"][action$="/photo/reject"]', "admin.rejectProfilePhoto");
  confirmFormActions('form[action^="/admin/movies/"][action$="/delete/approve"]', "admin.approveMovieDelete");
  confirmFormActions('form[action^="/admin/movies/"][action$="/delete/reject"]', "admin.rejectMovieDelete");
  confirmFormActions('form[action^="/admin/notices/"][action$="/delete/approve"]', "admin.approveNoticeDelete");
  confirmFormActions('form[action^="/admin/notices/"][action$="/delete/reject"]', "admin.rejectNoticeDelete");
  confirmFormActions('form[action^="/admin/movies/"][action$="/edit/approve"]', "admin.approveMovieEdit");
  confirmFormActions('form[action^="/admin/movies/"][action$="/edit/reject"]', "admin.rejectMovieEdit");
  confirmFormActions('form[action^="/admin/recipes/"][action$="/edit/approve"]', "admin.approveRecipeEdit");
  confirmFormActions('form[action^="/admin/recipes/"][action$="/edit/reject"]', "admin.rejectRecipeEdit");
  confirmFormActions('form[action^="/admin/notices/"][action$="/edit/approve"]', "admin.approveNoticeEdit");
  confirmFormActions('form[action^="/admin/notices/"][action$="/edit/reject"]', "admin.rejectNoticeEdit");
  confirmFormActions('form[action^="/admin/movies/"][action$="/delete/direct"]', "admin.directDeleteMovie");
  confirmFormActions('form[action^="/admin/recipes/"][action$="/delete/direct"]', "admin.directDeleteRecipe");
  confirmFormActions('form[action^="/admin/notices/"][action$="/delete/direct"]', "admin.directDeleteNotice");

  // ══════════════════════════════════════════════════════
  // UPLOAD PREVIEW
  // ══════════════════════════════════════════════════════
  const uploadInputs = document.querySelectorAll(".admin-upload-input");
  uploadInputs.forEach((input) => {
    input.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showToast("Veuillez choisir une image (JPG, PNG, WEBP).", "error");
        event.target.value = "";
        return;
      }
      const previewContainer = event.target
        .closest(".admin-upload-block")
        ?.querySelector("[data-upload-preview]");
      const previewImg = previewContainer?.querySelector("img");
      if (!previewImg || !previewContainer) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewContainer.dataset.lightboxImage = e.target.result;
        previewContainer.classList.add("is-visible");
      };
      reader.readAsDataURL(file);
    });
  });

  // ══════════════════════════════════════════════════════
  // SECTIONS PUBLIÉES — recherche + pagination
  // ══════════════════════════════════════════════════════
  const initPublishedSection = (section) => {
    const items = Array.from(section.querySelectorAll(".admin-list-item"));
    const searchInput = section.querySelector("[data-search-input]");
    const clearBtn = section.querySelector("[data-search-clear]");
    const noResults = section.querySelector("[data-no-results]");
    const pagination = section.querySelector(".admin-pagination");
    const prevBtn = pagination?.querySelector(".admin-pagination__prev");
    const nextBtn = pagination?.querySelector(".admin-pagination__next");
    const info = pagination?.querySelector(".admin-pagination__info");
    const pageSize = parseInt(section.dataset.pageSize || "10", 10);
    let currentPage = 1;
    let filteredItems = items;

    const update = () => {
      const total = filteredItems.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      items.forEach((item) => item.classList.add("is-hidden"));
      filteredItems.slice(start, end).forEach((item) => item.classList.remove("is-hidden"));
      if (info) info.textContent = `Page ${currentPage} / ${totalPages}`;
      if (prevBtn) prevBtn.disabled = currentPage === 1;
      if (nextBtn) nextBtn.disabled = currentPage === totalPages;
      if (pagination) pagination.style.display = total > pageSize ? "flex" : "none";
      if (noResults) noResults.style.display = total === 0 ? "block" : "none";
    };

    const applyFilters = () => {
      const query = (searchInput?.value || "").trim().toLowerCase();
      filteredItems = items.filter((item) => {
        const haystack = item.dataset.search || "";
        return !query || haystack.includes(query);
      });
      currentPage = 1;
      update();
    };

    searchInput?.addEventListener("input", applyFilters);
    clearBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      applyFilters();
    });
    prevBtn?.addEventListener("click", () => { if (currentPage > 1) { currentPage--; update(); } });
    nextBtn?.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
      if (currentPage < totalPages) { currentPage++; update(); }
    });

    update();
  };

  document.querySelectorAll(".admin-published-section").forEach(initPublishedSection);

  // ══════════════════════════════════════════════════════
  // MODAL ÉDITION UNIFIÉ (Films, Recettes, Avis)
  // ══════════════════════════════════════════════════════
  const editModal = document.getElementById("admin-edit-modal");
  const editForm = document.getElementById("admin-edit-form");
  const modalCloseButtons = editModal?.querySelectorAll("[data-modal-close]");
  const modalSections = editModal?.querySelectorAll("[data-modal-section]");
  const modalIcons = editModal?.querySelectorAll("[data-modal-icon]");
  const modalTitleText = editModal?.querySelector("[data-modal-title-text]");

  const modalTitles = { movie: "Éditer le film", recipe: "Éditer la recette", notice: "Éditer l'avis" };
  const modalRoutes = {
    movie: (id) => `/admin/movies/${id}/edit/direct`,
    recipe: (id) => `/admin/recipes/${id}/edit/direct`,
    notice: (id) => `/admin/notices/${id}/edit/direct`,
  };

  const autoResizeTextarea = (textarea) => {
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 80), 200);
    textarea.style.height = newHeight + "px";
  };

  const autoResizeAllTextareas = () => {
    editModal?.querySelectorAll(".admin-modal__textarea--autosize").forEach((ta) => {
      if (ta.offsetParent !== null) autoResizeTextarea(ta);
    });
  };

  const showModalSection = (type) => {
    modalSections?.forEach((section) => {
      const isActive = section.dataset.modalSection === type;
      section.style.display = isActive ? "flex" : "none";
      section.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = !isActive;
      });
    });
    modalIcons?.forEach((icon) => {
      icon.style.display = icon.dataset.modalIcon === type ? "inline-flex" : "none";
    });
    if (modalTitleText) modalTitleText.textContent = modalTitles[type] || "Éditer";
  };

  const prefillModal = (type, data) => {
    if (type === "movie") {
      const titleInput = document.getElementById("edit-movie-title");
      const yearInput = document.getElementById("edit-movie-year");
      const genreSelect = document.getElementById("edit-movie-genre");
      const synopsisTextarea = document.getElementById("edit-movie-synopsis");
      if (titleInput) titleInput.value = data.title || "";
      if (yearInput) yearInput.value = data.year || "";
      if (genreSelect) {
        const match = Array.from(genreSelect.options).find(
          (opt) => opt.value.toLowerCase() === (data.genre || "").toLowerCase()
        );
        genreSelect.value = match ? match.value : (data.genre || "");
      }
      if (synopsisTextarea) synopsisTextarea.value = data.synopsis || "";
    }
    if (type === "recipe") {
      const nameInput = document.getElementById("edit-recipe-name");
      const categorySelect = document.getElementById("edit-recipe-category");
      const timeInput = document.getElementById("edit-recipe-time");
      const difficultySelect = document.getElementById("edit-recipe-difficulty");
      const descTextarea = document.getElementById("edit-recipe-description");
      const ingredientsTextarea = document.getElementById("edit-recipe-ingredients");
      const prepTextarea = document.getElementById("edit-recipe-preparation");
      if (nameInput) nameInput.value = data.name || "";
      if (categorySelect) {
        const match = Array.from(categorySelect.options).find(
          (opt) => opt.value.toLowerCase() === (data.category || "").toLowerCase()
        );
        categorySelect.value = match ? match.value : (data.category || "");
      }
      if (timeInput) timeInput.value = data.time || "";
      if (difficultySelect) {
        const match = Array.from(difficultySelect.options).find(
          (opt) => opt.value.toLowerCase() === (data.difficulty || "").toLowerCase()
        );
        difficultySelect.value = match ? match.value : (data.difficulty || "");
      }
      if (descTextarea) descTextarea.value = data.description || "";
      if (ingredientsTextarea) ingredientsTextarea.value = data.ingredients || "";
      if (prepTextarea) prepTextarea.value = data.preparation || "";
    }
    if (type === "notice") {
      const quoteInput = document.getElementById("edit-notice-quote");
      const contentTextarea = document.getElementById("edit-notice-content");
      const authorDisplay = document.getElementById("edit-notice-author-display");
      const recipeDisplay = document.getElementById("edit-notice-recipe-display");
      if (quoteInput) quoteInput.value = data.quote || "";
      if (contentTextarea) contentTextarea.value = data.content || "";
      if (authorDisplay) authorDisplay.textContent = data.author || "—";
      if (recipeDisplay) recipeDisplay.textContent = data.recipe || "—";
    }
  };

  const handleEscapeKey = (e) => { if (e.key === "Escape") closeEditModal(); };

  const openEditModal = (type, data) => {
    if (!editModal || !editForm) return;
    showModalSection(type);
    if (modalRoutes[type]) editForm.action = modalRoutes[type](data.id);
    prefillModal(type, data);
    editModal.classList.add("is-open");
    document.body.classList.add("modal-open");
    setTimeout(() => {
      autoResizeAllTextareas();
      const firstInput = editModal.querySelector(
        `[data-modal-section="${type}"] input:not([disabled]), [data-modal-section="${type}"] select:not([disabled]), [data-modal-section="${type}"] textarea:not([disabled])`
      );
      firstInput?.focus();
    }, 100);
    document.addEventListener("keydown", handleEscapeKey);
  };

  const closeEditModal = () => {
    if (!editModal) return;
    editModal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", handleEscapeKey);
    setTimeout(() => editForm?.reset(), 300);
  };

  editModal?.querySelectorAll(".admin-modal__textarea--autosize").forEach((ta) => {
    ta.addEventListener("input", () => autoResizeTextarea(ta));
  });

  document.querySelectorAll("[data-edit-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.editType;
      const data = { id: btn.dataset.editId };
      if (type === "movie") {
        data.title = btn.dataset.editTitle;
        data.year = btn.dataset.editYear;
        data.genre = btn.dataset.editGenre;
        data.synopsis = btn.dataset.editSynopsis;
      }
      if (type === "recipe") {
        data.name = btn.dataset.editName;
        data.category = btn.dataset.editCategory;
        data.time = btn.dataset.editTime;
        data.difficulty = btn.dataset.editDifficulty;
        data.description = btn.dataset.editDescription;
        data.ingredients = btn.dataset.editIngredients;
        data.preparation = btn.dataset.editPreparation;
      }
      if (type === "notice") {
        data.content = btn.dataset.editContent;
        data.quote = btn.dataset.editQuote;
        data.author = btn.dataset.editAuthor;
        data.recipe = btn.dataset.editRecipe;
      }
      openEditModal(type, data);
    });
  });

  modalCloseButtons?.forEach((btn) => btn.addEventListener("click", closeEditModal));
  editModal?.querySelector(".admin-modal__backdrop")?.addEventListener("click", closeEditModal);
  editModal?.querySelector(".admin-modal__dialog")?.addEventListener("click", (e) => e.stopPropagation());

  console.log("✅ Admin dashboard v2 initialisé.");
});
