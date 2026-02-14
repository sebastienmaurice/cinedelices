document.addEventListener("DOMContentLoaded", () => {
  const toastContainer = document.querySelector(".admin-toast");

  const showToast = (message, type = "") => {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `admin-toast__item ${type ? `is-${type}` : ""}`.trim();
    const titleMap = {
      success: "Succès : ",
      warning: "Attention : ",
      error: "Erreur : ",
    };
    const prefix = type && titleMap[type] ? titleMap[type] : "";
    const titleSpan = document.createElement("span");
    titleSpan.className = "admin-toast__title";
    titleSpan.textContent = prefix;
    const messageSpan = document.createElement("span");
    messageSpan.className = "admin-toast__message";
    messageSpan.textContent = message;
    toast.appendChild(titleSpan);
    toast.appendChild(messageSpan);
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3500);
  };

  // Burger menu mobile
  const burger = document.querySelector(".burger-menu");
  const nav = document.querySelector(".navigationheader");

  if (burger && nav) {
    burger.addEventListener("click", () => {
      burger.classList.toggle("active");
      nav.classList.toggle("active");
    });
  }

  // Afficher les alertes après redirection basées sur les paramètres URL
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get("success");
  const toastMap = {
    movie_validated: { message: "Film validé avec succès.", type: "success" },
    movie_rejected: { message: "Film refusé et supprimé.", type: "warning" },
    movie_edit_approved: {
      message: "Modification du film validée.",
      type: "success",
    },
    movie_edit_rejected: {
      message: "Modification du film refusée.",
      type: "warning",
    },
    movie_delete_approved: {
      message: "Suppression du film approuvée.",
      type: "error",
    },
    movie_delete_rejected: {
      message: "Demande de suppression refusée.",
      type: "warning",
    },
    recipe_validated: { message: "Recette validée avec succès.", type: "success" },
    recipe_edit_approved: {
      message: "Modification de la recette validée.",
      type: "success",
    },
    recipe_edit_rejected: {
      message: "Modification de la recette refusée.",
      type: "warning",
    },
    recipe_updated: { message: "Recette mise à jour.", type: "success" },
    recipe_update_empty: {
      message: "Aucune modification détectée.",
      type: "warning",
    },
    recipe_update_error: {
      message: "Erreur lors de la mise à jour de la recette.",
      type: "error",
    },
    recipe_rejected: { message: "Recette refusée et supprimée.", type: "warning" },
    user_deleted: { message: "Utilisateur supprimé avec succès.", type: "error" },
    user_photo_approved: { message: "Photo de profil validée.", type: "success" },
    user_photo_rejected: { message: "Photo de profil refusée.", type: "warning" },
    notice_validated: { message: "Avis validé.", type: "success" },
    notice_rejected: { message: "Avis refusé.", type: "warning" },
    notice_edit_approved: {
      message: "Modification de l'avis validée.",
      type: "success",
    },
    notice_edit_rejected: {
      message: "Modification de l'avis refusée.",
      type: "warning",
    },
    notice_delete_approved: {
      message: "Suppression de l'avis approuvée.",
      type: "error",
    },
    notice_delete_rejected: {
      message: "Suppression de l'avis refusée.",
      type: "warning",
    },
    admin_movie_deleted: {
      message: "Film supprimé par l'administrateur.",
      type: "success",
    },
    admin_movie_delete_error: {
      message: "Erreur lors de la suppression du film.",
      type: "error",
    },
    admin_recipe_deleted: {
      message: "Recette supprimée par l'administrateur.",
      type: "success",
    },
    admin_recipe_delete_error: {
      message: "Erreur lors de la suppression de la recette.",
      type: "error",
    },
    admin_notice_deleted: {
      message: "Avis supprimé par l'administrateur.",
      type: "success",
    },
    admin_notice_delete_error: {
      message: "Erreur lors de la suppression de l'avis.",
      type: "error",
    },
    admin_movie_updated: {
      message: "Film mis à jour par l'administrateur.",
      type: "success",
    },
    admin_movie_update_error: {
      message: "Erreur lors de la mise à jour du film.",
      type: "error",
    },
    admin_recipe_updated: {
      message: "Recette mise à jour par l'administrateur.",
      type: "success",
    },
    admin_recipe_update_error: {
      message: "Erreur lors de la mise à jour de la recette.",
      type: "error",
    },
    admin_notice_updated: {
      message: "Avis mis à jour par l'administrateur.",
      type: "success",
    },
    admin_notice_update_error: {
      message: "Erreur lors de la mise à jour de l'avis.",
      type: "error",
    },
  };

  if (success && toastMap[success]) {
    const { message, type } = toastMap[success];
    showToast(message, type);
  }

  const sections = document.querySelectorAll("[data-admin-section]");
  const tabs = document.querySelectorAll(".admin-tab");
  const tabPanels = document.querySelectorAll(".admin-tab-panel");

  const setActiveSection = (sectionName) => {
    sections.forEach((section) => {
      const isTarget = section.dataset.adminSection === sectionName;
      section.classList.toggle("is-hidden", !isTarget);
    });
  };

  const setActivePanel = (panelName) => {
    tabPanels.forEach((panel) => {
      const isTarget = panel.dataset.panel === panelName;
      panel.classList.toggle("is-open", isTarget);
    });
  };

  if (tabs.length > 0) {
    setActiveSection("validations");
    setActivePanel("validations");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.section;
        if (!target) return;
        tabs.forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        setActiveSection(target);
        setActivePanel(target);
      });
    });
  }

  const detailItems = document.querySelectorAll(".admin-sidebar-item");
  const detailCards = document.querySelectorAll(".admin-detail-card");
  const detailEmpty = document.querySelector(".admin-detail-empty");

  const setActiveDetail = (detailId) => {
    let hasActive = false;
    detailCards.forEach((card) => {
      const isTarget = card.dataset.detailId === detailId;
      card.classList.toggle("is-active", isTarget);
      if (isTarget) hasActive = true;
    });
    if (detailEmpty) {
      detailEmpty.classList.toggle("is-active", !hasActive);
    }
  };

  detailItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.detailTarget;
      if (!target) return;
      detailItems.forEach((btn) => btn.classList.remove("is-active"));
      item.classList.add("is-active");
      setActiveDetail(target);
    });
  });

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
          // Respecter le formaction du bouton cliqué (ex: Refuser vs Valider)
          if (submitter && submitter.hasAttribute("formaction")) {
            form.action = submitter.getAttribute("formaction");
          }
          form.submit();
        }
      });
    });
  };

  confirmFormActions(
    'form[action^="/admin/deleteUser/"]',
    "admin.deleteUser"
  );
  confirmFormActions(
    'form[action^="/admin/rejectMovie/"]',
    "admin.rejectMovie"
  );
  confirmFormActions(
    'form[action^="/admin/rejectRecipe/"]',
    "admin.rejectRecipe"
  );
  confirmFormActions(
    'form[action^="/admin/rejectNotice/"]',
    "admin.rejectNotice"
  );
  confirmFormActions(
    'form[action^="/admin/validateMovie/"]',
    "admin.validateMovie"
  );
  confirmFormActions(
    'form[action^="/admin/validateRecipe/"]',
    "admin.validateRecipe"
  );
  confirmFormActions(
    'form[action^="/admin/validateNotice/"]',
    "admin.validateNotice"
  );
  confirmFormActions(
    'form[action^="/admin/users/"][action$="/photo/approve"]',
    "admin.approveProfilePhoto"
  );
  confirmFormActions(
    'form[action^="/admin/users/"][action$="/photo/reject"]',
    "admin.rejectProfilePhoto"
  );
  confirmFormActions(
    'form[action^="/admin/movies/"][action$="/delete/approve"]',
    "admin.approveMovieDelete"
  );
  confirmFormActions(
    'form[action^="/admin/movies/"][action$="/delete/reject"]',
    "admin.rejectMovieDelete"
  );
  confirmFormActions(
    'form[action^="/admin/notices/"][action$="/delete/approve"]',
    "admin.approveNoticeDelete"
  );
  confirmFormActions(
    'form[action^="/admin/notices/"][action$="/delete/reject"]',
    "admin.rejectNoticeDelete"
  );
  confirmFormActions(
    'form[action^="/admin/movies/"][action$="/edit/approve"]',
    "admin.approveMovieEdit"
  );
  confirmFormActions(
    'form[action^="/admin/movies/"][action$="/edit/reject"]',
    "admin.rejectMovieEdit"
  );
  confirmFormActions(
    'form[action^="/admin/recipes/"][action$="/edit/approve"]',
    "admin.approveRecipeEdit"
  );
  confirmFormActions(
    'form[action^="/admin/recipes/"][action$="/edit/reject"]',
    "admin.rejectRecipeEdit"
  );
  confirmFormActions(
    'form[action^="/admin/notices/"][action$="/edit/approve"]',
    "admin.approveNoticeEdit"
  );

  confirmFormActions(
    'form[action^="/admin/movies/"][action$="/delete/direct"]',
    "admin.directDeleteMovie"
  );
  confirmFormActions(
    'form[action^="/admin/recipes/"][action$="/delete/direct"]',
    "admin.directDeleteRecipe"
  );
  confirmFormActions(
    'form[action^="/admin/notices/"][action$="/delete/direct"]',
    "admin.directDeleteNotice"
  );
  confirmFormActions(
    'form[action^="/admin/notices/"][action$="/edit/reject"]',
    "admin.rejectNoticeEdit"
  );

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

  const initPublishedSection = (section) => {
    const items = Array.from(section.querySelectorAll(".admin-list-item"));
    const searchInput = section.querySelector("[data-search-input]");
    const clearBtn = section.querySelector("[data-search-clear]");
    const totalInfo = section.querySelector("[data-search-total]");
    const noResults = section.querySelector("[data-no-results]");
    const titleEl = section.querySelector("[data-search-title]");
    const titleBase = titleEl ? titleEl.textContent : "";
    const pagination = section.querySelector(".admin-pagination");
    const prevBtn = pagination?.querySelector(".admin-pagination__prev");
    const nextBtn = pagination?.querySelector(".admin-pagination__next");
    const info = pagination?.querySelector(".admin-pagination__info");
    const pageSize = parseInt(section.dataset.pageSize || "6", 10);
    let currentPage = 1;
    let filteredItems = items;
    let globalQuery = "";

    const update = () => {
      const total = filteredItems.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;

      items.forEach((item) => item.classList.add("is-hidden"));
      filteredItems.slice(start, end).forEach((item) =>
        item.classList.remove("is-hidden")
      );

      if (info) {
        info.textContent = `Page ${currentPage} / ${totalPages}`;
      }
      if (totalInfo) {
        const label =
          section.querySelector("h3")?.textContent?.toLowerCase() || "éléments";
        totalInfo.textContent = `${filteredItems.length} ${label} affichés sur ${items.length}`;
      }
      if (titleEl) {
        titleEl.textContent = `${titleBase} (${filteredItems.length}/${items.length})`;
      }
      if (prevBtn) prevBtn.disabled = currentPage === 1;
      if (nextBtn) nextBtn.disabled = currentPage === totalPages;
      if (pagination) {
        pagination.style.display = total > pageSize ? "flex" : "none";
      }
      if (noResults) {
        noResults.style.display = total === 0 ? "block" : "none";
      }
    };

    const applyFilters = () => {
      const localQuery = (searchInput?.value || "").trim().toLowerCase();
      filteredItems = items.filter((item) => {
        const haystack = item.dataset.search || "";
        const matchesLocal = !localQuery || haystack.includes(localQuery);
        const matchesGlobal = !globalQuery || haystack.includes(globalQuery);
        return matchesLocal && matchesGlobal;
      });
      currentPage = 1;
      update();
    };

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        applyFilters();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        applyFilters();
      });
    }

    prevBtn?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage -= 1;
        update();
      }
    });

    nextBtn?.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
      if (currentPage < totalPages) {
        currentPage += 1;
        update();
      }
    });

    update();

    return {
      setGlobalQuery: (query) => {
        globalQuery = query;
        applyFilters();
      },
      resetGlobal: () => {
        globalQuery = "";
        applyFilters();
      },
      getFilteredCount: () => filteredItems.length,
      getTotalCount: () => items.length,
      getLabel: () => titleBase,
    };
  };

  const publishedSections = Array.from(
    document.querySelectorAll(".admin-published-section")
  ).map(initPublishedSection);

  const globalSearch = document.querySelector("[data-search-global]");
  const globalClear = document.querySelector(
    ".admin-search--global [data-search-clear]"
  );
  const globalReset = document.querySelector("[data-search-reset]");
  const globalTotal = document.querySelector("[data-search-total-global]");

  const globalTitle = document.querySelector("[data-global-title]");
  const globalTitleBase = globalTitle ? globalTitle.textContent : "";

  const updateGlobalTotal = () => {
    if (globalTotal) {
      const total = publishedSections.reduce(
        (sum, section) => sum + section.getTotalCount(),
        0
      );
      const filtered = publishedSections.reduce(
        (sum, section) => sum + section.getFilteredCount(),
        0
      );
      globalTotal.textContent = `${filtered} résultats affichés sur ${total}`;
      if (globalTotal.dataset) {
        globalTotal.dataset.filtered = String(filtered);
      }
      if (globalTitle) {
        globalTitle.textContent = `${globalTitleBase} (${filtered}/${total})`;
      }
    }
  };

  // handlers moved below to update global no-results as well

  const globalNoResults = document.querySelector("[data-no-results-global]");
  const globalZeroBadge = document.querySelector("[data-global-zero-badge]");
  const updateGlobalNoResults = () => {
    if (!globalNoResults || !globalTotal) return;
    const filtered = parseInt(globalTotal.dataset.filtered || "0", 10);
    globalNoResults.style.display = filtered === 0 ? "flex" : "none";
    if (globalZeroBadge) {
      globalZeroBadge.classList.toggle("is-visible", filtered === 0);
    }
  };

  const updateAllGlobal = () => {
    updateGlobalTotal();
    updateGlobalNoResults();
  };

  if (globalSearch) {
    globalSearch.addEventListener("input", () => {
      const query = globalSearch.value.trim().toLowerCase();
      publishedSections.forEach((section) => section.setGlobalQuery(query));
      updateAllGlobal();
    });
  }

  if (globalClear) {
    globalClear.addEventListener("click", () => {
      if (globalSearch) {
        globalSearch.value = "";
        globalSearch.dispatchEvent(new Event("input"));
      } else {
        publishedSections.forEach((section) => section.resetGlobal());
        updateAllGlobal();
      }
    });
  }

  if (globalReset) {
    globalReset.addEventListener("click", () => {
      if (globalSearch) {
        globalSearch.value = "";
      }
      publishedSections.forEach((section) => section.resetGlobal());
      updateAllGlobal();
    });
  }

  updateAllGlobal();

  // ====================================================== //
  // ======= MODAL ÉDITION UNIFIÉ (Films, Recettes, Avis) = //
  // ====================================================== //

  /**
   * Modal générique réutilisable pour l'édition de :
   * - Films validés (titre, année, genre, synopsis)
   * - Recettes validées (titre, catégorie, temps, difficulté, description, ingrédients, préparation)
   * - Avis validés (note, commentaire)
   *
   * Fonctionnalités :
   * - openEditModal(type, data) : fonction unique qui adapte le modal selon le type
   * - Auto-resize textarea (CSS field-sizing + JS fallback)
   * - Fermeture via backdrop, bouton ×, bouton Annuler ou touche Échap
   * - Pré-remplissage automatique des champs
   */

  const editModal = document.getElementById("admin-edit-modal");
  const editForm = document.getElementById("admin-edit-form");
  const modalCloseButtons = editModal?.querySelectorAll("[data-modal-close]");
  const modalSections = editModal?.querySelectorAll("[data-modal-section]");
  const modalIcons = editModal?.querySelectorAll("[data-modal-icon]");
  const modalTitleText = editModal?.querySelector("[data-modal-title-text]");

  // Titres du modal par type
  const modalTitles = {
    movie: "Éditer le film",
    recipe: "Éditer la recette",
    notice: "Éditer l'avis",
  };

  // Routes du formulaire par type
  const modalRoutes = {
    movie: (id) => `/admin/movies/${id}/edit/direct`,
    recipe: (id) => `/admin/recipes/${id}/edit/direct`,
    notice: (id) => `/admin/notices/${id}/edit/direct`,
  };

  /**
   * Auto-resize du textarea
   * Fallback pour les navigateurs sans support de field-sizing
   * @param {HTMLTextAreaElement} textarea
   */
  const autoResizeTextarea = (textarea) => {
    if (!textarea) return;
    textarea.style.height = "auto";
    const minHeight = 80;
    const maxHeight = 200;
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = newHeight + "px";
  };

  /**
   * Auto-resize sur tous les textareas visibles du modal
   */
  const autoResizeAllTextareas = () => {
    editModal?.querySelectorAll(".admin-modal__textarea--autosize").forEach((ta) => {
      if (ta.offsetParent !== null) {
        autoResizeTextarea(ta);
      }
    });
  };

  /**
   * Afficher la section correspondant au type et masquer les autres
   * @param {string} type - "movie" | "recipe" | "notice"
   */
  const showModalSection = (type) => {
    // Sections conditionnelles
    modalSections?.forEach((section) => {
      section.style.display = section.dataset.modalSection === type ? "flex" : "none";
    });
    // Icônes dynamiques
    modalIcons?.forEach((icon) => {
      icon.style.display = icon.dataset.modalIcon === type ? "inline-flex" : "none";
    });
    // Titre dynamique
    if (modalTitleText) {
      modalTitleText.textContent = modalTitles[type] || "Éditer";
    }

    // Désactiver les champs des sections masquées (évite la validation HTML)
    modalSections?.forEach((section) => {
      const isActive = section.dataset.modalSection === type;
      section.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = !isActive;
      });
    });
  };

  /**
   * Pré-remplir les champs selon le type
   * @param {string} type - "movie" | "recipe" | "notice"
   * @param {Object} data - Données à injecter
   */
  const prefillModal = (type, data) => {
    if (type === "movie") {
      const titleInput = document.getElementById("edit-movie-title");
      const yearInput = document.getElementById("edit-movie-year");
      const genreSelect = document.getElementById("edit-movie-genre");
      const synopsisTextarea = document.getElementById("edit-movie-synopsis");

      if (titleInput) titleInput.value = data.title || "";
      if (yearInput) yearInput.value = data.year || "";
      if (genreSelect) {
        // Match insensible à la casse
        const genreLower = (data.genre || "").toLowerCase();
        const match = Array.from(genreSelect.options).find(
          (opt) => opt.value.toLowerCase() === genreLower
        );
        genreSelect.value = match ? match.value : (data.genre || "");
      }
      if (synopsisTextarea) {
        synopsisTextarea.value = data.synopsis || "";
      }
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
        const catMatch = Array.from(categorySelect.options).find(
          (opt) => opt.value.toLowerCase() === (data.category || "").toLowerCase()
        );
        categorySelect.value = catMatch ? catMatch.value : (data.category || "");
      }
      if (timeInput) timeInput.value = data.time || "";
      if (difficultySelect) {
        const diffMatch = Array.from(difficultySelect.options).find(
          (opt) => opt.value.toLowerCase() === (data.difficulty || "").toLowerCase()
        );
        difficultySelect.value = diffMatch ? diffMatch.value : (data.difficulty || "");
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
      if (authorDisplay) authorDisplay.textContent = data.author || "-";
      if (recipeDisplay) recipeDisplay.textContent = data.recipe || "-";
    }
  };

  /**
   * Ouvrir le modal unifié
   * @param {string} type - "movie" | "recipe" | "notice"
   * @param {Object} data - Données de l'item à éditer (doit contenir .id)
   */
  const openEditModal = (type, data) => {
    if (!editModal || !editForm) return;

    // 1. Afficher la bonne section
    showModalSection(type);

    // 2. Définir l'action du formulaire
    if (modalRoutes[type]) {
      editForm.action = modalRoutes[type](data.id);
    }

    // 3. Pré-remplir les champs
    prefillModal(type, data);

    // 4. Ouvrir le modal
    editModal.classList.add("is-open");
    document.body.classList.add("modal-open");

    // 5. Auto-resize des textareas après affichage
    setTimeout(() => {
      autoResizeAllTextareas();
      // Focus sur le premier input visible
      const firstInput = editModal.querySelector(
        `[data-modal-section="${type}"] input:not([disabled]), [data-modal-section="${type}"] select:not([disabled]), [data-modal-section="${type}"] textarea:not([disabled])`
      );
      firstInput?.focus();
    }, 100);

    // 6. Gestionnaire Échap
    document.addEventListener("keydown", handleEscapeKey);
  };

  /**
   * Fermer le modal
   */
  const closeEditModal = () => {
    if (!editModal) return;

    editModal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", handleEscapeKey);

    // Réinitialiser le formulaire après la transition
    setTimeout(() => {
      editForm?.reset();
    }, 300);
  };

  /**
   * Gérer la touche Échap pour fermer le modal
   * @param {KeyboardEvent} e
   */
  const handleEscapeKey = (e) => {
    if (e.key === "Escape") {
      closeEditModal();
    }
  };

  // Initialiser l'auto-resize sur tous les textareas du modal
  editModal?.querySelectorAll(".admin-modal__textarea--autosize").forEach((ta) => {
    ta.addEventListener("input", () => autoResizeTextarea(ta));
  });

  // Attacher les événements d'ouverture (délégation sur les boutons data-edit-btn)
  document.querySelectorAll("[data-edit-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.editType;
      // Construire l'objet data depuis les data-attributes
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

  // Attacher les événements de fermeture
  modalCloseButtons?.forEach((btn) => {
    btn.addEventListener("click", closeEditModal);
  });

  // Fermer au clic sur le backdrop
  editModal
    ?.querySelector(".admin-modal__backdrop")
    ?.addEventListener("click", closeEditModal);

  // Empêcher la propagation du clic dans le dialog
  editModal
    ?.querySelector(".admin-modal__dialog")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
    });

  console.log("✅ Module modal édition unifié initialisé (films, recettes, avis)");
});
