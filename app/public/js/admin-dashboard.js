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
      const titleMap = { success: "Succès", warning: "Attention", error: "Erreur" };
      toast.className = `toast${type ? ` toast--${type}` : ""}`;
      toast.innerHTML = `
        <div class="toast__icon">${iconMap[type] || ""}</div>
        <div class="toast__body">
          ${titleMap[type] ? `<div class="toast__title">${titleMap[type]}</div>` : ""}
          <div class="toast__msg">${message}</div>
        </div>`;
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
    recettes: "Recettes",
    avis: "Avis",
    profils: "Profils",
    "photos-recettes": "Photos de recettes",
    "pub-films": "Films",
    "pub-recettes": "Recettes publiées",
    "pub-avis": "Avis publiés",
    utilisateurs: "Utilisateurs",
    gamification: "Gamification",
    logs: "Logs",
    parametres: "Paramètres",
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
      if (target) {
        activateView(target);
        if (target === "gamification" && !gamifLoaded) loadGamificationStats();
      }
    });
  });

  // Activer dashboard par défaut
  activateView("dashboard");

  // ══════════════════════════════════════════════════════
  // VUE LOGS — chargement à la demande + filtres + export
  // ══════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════
  // VUE GAMIFICATION — chargement à la demande
  // ══════════════════════════════════════════════════════
  let gamifLoaded = false;

  async function loadGamificationStats() {
    try {
      const res  = await fetch("/admin/gamification/stats");
      const data = await res.json();
      if (!data.success) return;
      gamifLoaded = true;

      const fmt = (n) => (n ?? 0).toLocaleString("fr-FR");
      const el = (id) => document.getElementById(id);

      if (data.totals) {
        if (el("gamif-total-xp")) el("gamif-total-xp").textContent = fmt(data.totals.total_xp) + " pts";
        if (el("gamif-total-members")) el("gamif-total-members").textContent = fmt(data.totals.total_members);
        if (el("gamif-avg-xp")) el("gamif-avg-xp").textContent = fmt(data.totals.avg_xp) + " pts";
        if (el("gamif-avg-level")) el("gamif-avg-level").textContent = "Niv. " + (data.totals.avg_level ?? "—");
      }

      const tableEl = el("gamif-top-table");
      if (tableEl && data.topMembers?.length) {
        tableEl.innerHTML = data.topMembers.map((m, i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i < data.topMembers.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,.05)' : ''}">
            <span style="font-family:var(--f-title);font-size:.5rem;color:rgba(196,160,82,.5);min-width:20px;">#${i + 1}</span>
            <img src="${m.picture || '/images/image-default-profile.jpg'}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;" />
            <span style="flex:1;font-size:.78rem;color:rgba(232,232,232,.8);">${m.pseudo}</span>
            <span style="font-family:var(--f-title);font-size:.5rem;letter-spacing:.1em;color:rgba(196,160,82,.6);">NIV. ${m.level_code || '—'}</span>
            <span style="font-family:var(--f-display);font-size:.9rem;color:var(--or-titre);min-width:80px;text-align:right;">${fmt(m.points)} pts</span>
          </div>`).join("");
      } else if (tableEl) {
        tableEl.textContent = "Aucune donnée de gamification pour l'instant.";
      }
    } catch (e) {
      console.error("Erreur chargement stats gamification:", e);
    }
  }

  let logsLoaded  = false;
  let _logsData   = []; // cache pour filtrage et export

  const ACTION_LABELS = {
    approve_recipe:            "Recette approuvée",
    reject_recipe:             "Recette refusée",
    approve_notice:            "Avis approuvé",
    reject_notice:             "Avis refusé",
    approve_user_photo:        "Photo profil approuvée",
    reject_user_photo:         "Photo profil refusée",
    approve_user_banner:       "Bannière approuvée",
    reject_user_banner:        "Bannière refusée",
    delete_movie_direct:       "Film supprimé",
    approve_recipe_picture:    "Photo recette approuvée",
    hide_movie:                "Film masqué",
    unhide_movie:              "Film remis en ligne",
    suspend_user:              "Utilisateur suspendu",
    unsuspend_user:            "Suspension levée",
    delete_user:               "Utilisateur supprimé",
    create_user:               "Utilisateur créé",
    change_role:               "Rôle modifié",
    edit_recipe:               "Recette éditée",
    add_recipe_picture:        "Photo recette ajoutée",
    delete_recipe_picture:     "Photo recette supprimée",
    replace_recipe_picture:    "Photo recette remplacée",
    unauthorized_access_attempt: "⚠ Tentative non autorisée",
  };

  function _renderLogRow(log) {
    const date     = new Date(log.created_at).toLocaleString("fr-FR");
    const action   = ACTION_LABELS[log.action] || log.action;
    const isAlert  = log.action === "unauthorized_access_attempt";
    const admin    = log.admin_pseudo
      ? `<span style="color:rgba(196,160,82,.9)">${log.admin_pseudo}</span>`
      : `<span style="opacity:.4">—</span>`;
    const type     = log.target_type || `<span style="opacity:.4">—</span>`;
    const targetId = log.target_id ? `#${log.target_id}` : `<span style="opacity:.4">—</span>`;
    const detail   = log.detail
      ? `<span style="color:rgba(255,255,255,.55)">${log.detail}</span>`
      : `<span style="opacity:.4">—</span>`;
    return `<tr${isAlert ? ' style="background:rgba(220,60,60,.08);"' : ''}>
      <td style="white-space:nowrap; color:rgba(255,255,255,.45); font-size:.68rem;">${date}</td>
      <td>${admin}</td>
      <td style="${isAlert ? 'color:rgba(220,100,80,.9);' : ''}">${action}</td>
      <td>${type}</td>
      <td style="opacity:.6">${targetId}</td>
      <td>${detail}</td>
    </tr>`;
  }

  function _applyLogsFilter() {
    const tbody      = document.getElementById("logs-tbody");
    const emptyMsg   = document.getElementById("logs-empty");
    const textVal    = (document.getElementById("logs-filter-text")?.value || "").toLowerCase().trim();
    const actionVal  = document.getElementById("logs-filter-action")?.value || "";

    const filtered = _logsData.filter((log) => {
      if (actionVal && log.action !== actionVal) return false;
      if (textVal) {
        const haystack = [
          log.action, log.admin_pseudo, log.target_type, log.detail,
        ].join(" ").toLowerCase();
        if (!haystack.includes(textVal)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      tbody.innerHTML = "";
      if (emptyMsg) emptyMsg.style.display = "";
    } else {
      if (emptyMsg) emptyMsg.style.display = "none";
      tbody.innerHTML = filtered.map(_renderLogRow).join("");
    }
  }

  const loadLogs = async () => {
    if (logsLoaded) return;
    const tbody = document.getElementById("logs-tbody");
    if (!tbody) return;

    try {
      const res  = await fetch("/admin/logs");
      const data = await res.json();

      if (!data.success || !data.logs.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:rgba(255,255,255,.35);">Aucun log enregistré.</td></tr>`;
        logsLoaded = true;
        return;
      }

      _logsData  = data.logs;
      logsLoaded = true;

      // Alimenter le select d'actions avec les valeurs distinctes
      const actionSel = document.getElementById("logs-filter-action");
      if (actionSel) {
        const uniqueActions = [...new Set(data.logs.map((l) => l.action))].sort();
        uniqueActions.forEach((a) => {
          const opt   = document.createElement("option");
          opt.value   = a;
          opt.textContent = ACTION_LABELS[a] || a;
          actionSel.appendChild(opt);
        });
        actionSel.addEventListener("change", _applyLogsFilter);
      }

      const textInput = document.getElementById("logs-filter-text");
      if (textInput) textInput.addEventListener("input", _applyLogsFilter);

      _applyLogsFilter();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:rgba(220,60,60,.7);">Erreur lors du chargement des logs.</td></tr>`;
    }
  };

  // Export JSON
  document.getElementById("logs-export-btn")?.addEventListener("click", () => {
    if (!_logsData.length) { showToast("Chargez d'abord les logs.", "error"); return; }
    const blob = new Blob([JSON.stringify(_logsData, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `admin-logs-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  });

  // Intercepter le clic sur le nav item "logs" pour déclencher le fetch
  navItems.forEach((item) => {
    if (item.dataset.navView === "logs") {
      item.addEventListener("click", loadLogs);
    }
  });

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
          panel.classList.remove("is-active");
        });
      }
      tab.classList.add("is-active");
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add("is-active");
    });
  });

  // ══════════════════════════════════════════════════════
  // SIDEBAR TOGGLE (mobile)
  // ══════════════════════════════════════════════════════
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const mainWrapper = document.querySelector(".main-wrapper");

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("is-collapsed");
      mainWrapper?.classList.toggle("sidebar-collapsed");
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
    user_deleted: { message: "Utilisateur supprimé avec succès.", type: "success" },
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

  // Navigation automatique vers un onglet via ?tab=xxx
  const tabParam = urlParams.get("tab");
  if (tabParam) {
    const navBtn = document.querySelector(`[data-nav-view="${tabParam}"]`);
    if (navBtn) navBtn.click();
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
      const servingsInput = document.getElementById("edit-recipe-servings");
      const difficultySelect = document.getElementById("edit-recipe-difficulty");
      const descTextarea = document.getElementById("edit-recipe-description");

      if (nameInput) nameInput.value = data.name || "";
      if (categorySelect) {
        const match = Array.from(categorySelect.options).find(
          (opt) => opt.value.toLowerCase() === (data.category || "").toLowerCase()
        );
        categorySelect.value = match ? match.value : (data.category || "");
      }
      if (timeInput) timeInput.value = data.time || "";
      if (servingsInput) servingsInput.value = data.servings || "";
      if (difficultySelect) {
        const match = Array.from(difficultySelect.options).find(
          (opt) => opt.value.toLowerCase() === (data.difficulty || "").toLowerCase()
        );
        difficultySelect.value = match ? match.value : (data.difficulty || "");
      }
      if (descTextarea) descTextarea.value = data.description || "";
      // Ingrédients → RTE
      const ingRte = document.getElementById("admin-ing-rte");
      if (ingRte) {
        const rawIng = (data.ingredients || "").trim();
        let ingItems = [];
        if (rawIng.startsWith("[")) { try { ingItems = JSON.parse(rawIng); } catch (e) { console.warn("Ingrédients JSON parse error:", e.message, rawIng.substring(0, 100)); } }
        RteMini.loadIntoRte(ingRte, ingItems, "ingredients");
      }
      // Préparation → RTE
      const prepRte = document.getElementById("admin-prep-rte");
      if (prepRte) {
        const rawPrep = (data.preparation || "").trim();
        let prepItems = [];
        if (rawPrep.startsWith("[")) { try { prepItems = JSON.parse(rawPrep); } catch (e) { console.warn("Préparation JSON parse error:", e.message, rawPrep.substring(0, 100)); } }
        RteMini.loadIntoRte(prepRte, prepItems, "preparation");
      }
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
    // Recipe has a file input — needs multipart; other types use urlencoded
    editForm.enctype = type === "recipe" ? "multipart/form-data" : "application/x-www-form-urlencoded";
    // Reset photo preview when opening
    const imgPreview = document.getElementById("edit-recipe-image-preview");
    const fileInput = document.getElementById("edit-recipe-image");
    if (imgPreview) { imgPreview.style.display = "none"; imgPreview.src = ""; }
    if (fileInput) fileInput.value = "";
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

  // Sérialise les RTEs ingrédients/préparation dans les hidden inputs avant soumission
  editForm?.addEventListener("submit", () => {
    const ingRte     = document.getElementById("admin-ing-rte");
    const ingHidden  = document.getElementById("edit-recipe-ingredients");
    const prepRte    = document.getElementById("admin-prep-rte");
    const prepHidden = document.getElementById("edit-recipe-preparation");
    if (ingRte  && ingHidden)  ingHidden.value  = JSON.stringify(RteMini.rteToJson(ingRte,  "ingredients"));
    if (prepRte && prepHidden) prepHidden.value = JSON.stringify(RteMini.rteToJson(prepRte, "preparation"));
  });

  // Initialiser les RTEs (une seule fois au chargement)
  const _ingRte  = document.getElementById("admin-ing-rte");
  const _ingTb   = document.getElementById("admin-ing-tb");
  const _prepRte = document.getElementById("admin-prep-rte");
  const _prepTb  = document.getElementById("admin-prep-tb");
  if (_ingRte  && _ingTb)  RteMini.initEditor({ rteEl: _ingRte,  tbEl: _ingTb,  mode: "ingredients" });
  if (_prepRte && _prepTb) RteMini.initEditor({ rteEl: _prepRte, tbEl: _prepTb, mode: "preparation" });

  // Preview photo recette dans le modal d'édition
  document.getElementById("edit-recipe-image")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    const preview = document.getElementById("edit-recipe-image-preview");
    if (!preview) return;
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      preview.src = "";
      preview.style.display = "none";
    }
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
        data.servings = btn.dataset.editServings;
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

  // ══════════════════════════════════════════════════════
  // MODAL SUSPENSION UTILISATEUR
  // ══════════════════════════════════════════════════════
  const suspendModal = document.getElementById("user-suspension-modal");
  const suspendForm  = document.getElementById("suspend-form");
  let suspendTargetId = null;

  const openSuspendUserModal = (userId, pseudo) => {
    suspendTargetId = userId;
    suspendForm?.reset();
    if (suspendModal) {
      const title = suspendModal.querySelector("#suspend-modal-title");
      if (title) title.textContent = pseudo ? `Suspendre « ${pseudo} »` : "Suspendre l'utilisateur";
      suspendModal.classList.add("is-open");
      document.body.classList.add("modal-open");
      suspendModal.querySelector("#suspend-duration")?.focus();
    }
  };

  const closeSuspendModal = () => {
    suspendModal?.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    suspendTargetId = null;
  };

  document.getElementById("suspend-modal-close")?.addEventListener("click", closeSuspendModal);
  document.getElementById("suspend-modal-cancel")?.addEventListener("click", closeSuspendModal);
  suspendModal?.querySelector(".admin-modal__backdrop")?.addEventListener("click", closeSuspendModal);
  suspendModal?.querySelector(".admin-modal__dialog")?.addEventListener("click", (e) => e.stopPropagation());

  suspendForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!suspendTargetId) return;

    const duration = suspendForm.querySelector("[name='duration']")?.value;
    const reason   = suspendForm.querySelector("[name='reason']")?.value?.trim();

    try {
      const res = await fetch(`/admin/users/${suspendTargetId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: duration, reason }),
      });

      if (res.ok) {
        closeSuspendModal();
        showToast("Utilisateur suspendu", "success");
        setTimeout(() => location.reload(), 1200);
      } else {
        showToast("Erreur lors de la suspension", "error");
      }
    } catch {
      showToast("Erreur lors de la suspension", "error");
    }
  });

  // Délégation : boutons data-suspend-user-id
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-suspend-user-id]");
    if (!btn) return;
    const userId = btn.dataset.suspendUserId;
    const pseudo = btn.dataset.suspendUserPseudo;
    openSuspendUserModal(userId, pseudo);
  });

  // ══════════════════════════════════════════════════════
  // MODAL CRÉATION / ÉDITION UTILISATEUR
  // ══════════════════════════════════════════════════════
  const userRoleModal  = document.getElementById("user-role-modal");
  const userRoleForm   = document.getElementById("user-role-form");
  let urMode           = "create"; // "create" | "edit"
  let urTargetId       = null;

  const openUserModal = (mode, userId = null, data = {}) => {
    urMode = mode;
    urTargetId = userId;
    userRoleForm?.reset();

    const title       = document.getElementById("ur-modal-title");
    const submitLabel = document.getElementById("ur-submit-label");
    const pwdHint     = document.getElementById("ur-password-hint");
    const pwdInput    = document.getElementById("ur-password");

    if (mode === "create") {
      if (title)       title.textContent       = "Créer un utilisateur";
      if (submitLabel) submitLabel.textContent  = "Créer";
      if (pwdHint)     pwdHint.textContent      = "(min. 8 caractères, obligatoire)";
      if (pwdInput)    pwdInput.required        = true;
    } else {
      if (title)       title.textContent       = "Modifier l'utilisateur";
      if (submitLabel) submitLabel.textContent  = "Enregistrer";
      if (pwdHint)     pwdHint.textContent      = "(laisser vide = inchangé)";
      if (pwdInput)    pwdInput.required        = false;
      const pseudoInput = document.getElementById("ur-pseudo");
      const emailInput  = document.getElementById("ur-email");
      const roleSelect  = document.getElementById("ur-role");
      if (pseudoInput) pseudoInput.value = data.pseudo || "";
      if (emailInput)  emailInput.value  = data.email  || "";
      if (roleSelect)  roleSelect.value  = data.role   || "user";
    }

    userRoleModal?.classList.add("is-open");
    document.body.classList.add("modal-open");
    document.getElementById("ur-pseudo")?.focus();
  };

  const closeUserRoleModal = () => {
    userRoleModal?.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    urTargetId = null;
  };

  document.getElementById("ur-modal-close")?.addEventListener("click", closeUserRoleModal);
  document.getElementById("ur-modal-cancel")?.addEventListener("click", closeUserRoleModal);
  userRoleModal?.querySelector(".admin-modal__backdrop")?.addEventListener("click", closeUserRoleModal);
  userRoleModal?.querySelector(".admin-modal__dialog")?.addEventListener("click", (e) => e.stopPropagation());

  userRoleForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pseudo   = document.getElementById("ur-pseudo")?.value?.trim();
    const email    = document.getElementById("ur-email")?.value?.trim();
    const password = document.getElementById("ur-password")?.value;
    const role     = document.getElementById("ur-role")?.value;

    const url = urMode === "create"
      ? "/admin/users/create"
      : `/admin/users/${urTargetId}/edit`;

    try {
      const res  = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, email, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        closeUserRoleModal();
        showToast(urMode === "create" ? "Utilisateur créé" : "Utilisateur modifié", "success");
        setTimeout(() => location.reload(), 1200);
      } else {
        showToast(data.message || "Erreur", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
  });

  // Ouvrir modal (create / edit)
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-create-user]")) { openUserModal("create"); return; }
    const editBtn = e.target.closest("[data-edit-user-id]");
    if (editBtn) {
      openUserModal("edit", editBtn.dataset.editUserId, {
        pseudo: editBtn.dataset.editUserPseudo,
        email:  editBtn.dataset.editUserEmail,
        role:   editBtn.dataset.editUserRole,
      });
    }
  });

  // Changement de rôle inline (select dans la table)
  document.addEventListener("change", async (e) => {
    const sel = e.target.closest("[data-user-role-select]");
    if (!sel) return;
    const userId = sel.dataset.userRoleSelect;
    const role   = sel.value;
    try {
      const res  = await fetch(`/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      showToast(data.success ? "Rôle mis à jour" : (data.message || "Erreur"), data.success ? "success" : "error");
    } catch {
      showToast("Erreur réseau", "error");
    }
  });

  // ══════════════════════════════════════════════════════
  // PANEL PHOTOS RECETTE (dans le modal d'édition)
  // ══════════════════════════════════════════════════════
  let currentRecipeId = null;

  const photosGrid       = document.getElementById("recipe-photos-grid");
  const photosCountBadge = document.getElementById("recipe-photos-count-badge");
  const photoAddZone     = document.getElementById("recipe-photo-add-zone");
  const photoAddInput    = document.getElementById("recipe-photo-add-input");
  const photoAddBtn      = document.getElementById("recipe-photo-add-btn");
  const photosLimitMsg   = document.getElementById("recipe-photos-limit-msg");

  const STATUS_LABELS = { approved: "Validée", pending: "En attente", rejected: "Refusée" };
  const STATUS_COLORS = { approved: "rgba(0,200,100,.8)", pending: "rgba(196,160,82,.9)", rejected: "rgba(220,60,60,.8)" };

  const renderPhotoCard = (pic) => {
    const div = document.createElement("div");
    div.dataset.picId = pic.id;
    div.style.cssText = "width:100px; flex-shrink:0; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:8px; overflow:hidden; display:flex; flex-direction:column;";

    const date = pic.created_at ? new Date(pic.created_at).toLocaleDateString("fr-FR") : "—";
    const statusLabel = STATUS_LABELS[pic.status] || pic.status;
    const statusColor = STATUS_COLORS[pic.status] || "rgba(255,255,255,.5)";
    const canDelete = pic.position >= 2;

    div.innerHTML = `
      <div style="height:80px; overflow:hidden; position:relative; background:rgba(0,0,0,.3);">
        <img src="${pic.file_path}" alt="Photo ${pic.position}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" />
        <span style="position:absolute; top:4px; left:4px; font-size:.55rem; font-weight:700; background:rgba(0,0,0,.7); color:${statusColor}; border-radius:3px; padding:2px 5px;">${statusLabel}</span>
      </div>
      <div style="padding:6px 6px 4px; font-size:.6rem; color:rgba(255,255,255,.4); line-height:1.4;">
        <div>Photo ${pic.position}</div>
        <div>${date}</div>
      </div>
      <div style="padding:0 6px 6px; display:flex; flex-direction:column; gap:4px;">
        ${pic.status === "pending" ? `<button type="button" class="act-btn act-btn--approve" style="font-size:.58rem; padding:3px 6px;" data-photo-approve="${pic.id}">Approuver</button>` : ""}
        <label class="act-btn" style="font-size:.58rem; padding:3px 6px; cursor:pointer; text-align:center; background:rgba(196,160,82,.15); color:rgba(196,160,82,.9); border:1px solid rgba(196,160,82,.25);">
          Remplacer
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style="display:none;" data-photo-replace="${pic.id}" />
        </label>
        ${canDelete ? `<button type="button" class="act-btn act-btn--delete" style="font-size:.58rem; padding:3px 6px;" data-photo-delete="${pic.id}">Supprimer</button>` : ""}
      </div>`;
    return div;
  };

  const refreshPhotosPanel = async (recipeId) => {
    if (!photosGrid) return;
    photosGrid.innerHTML = `<span style="font-size:.7rem; opacity:.35; align-self:center;">Chargement…</span>`;

    try {
      const res  = await fetch(`/admin/recipes/${recipeId}/pictures`);
      const data = await res.json();
      photosGrid.innerHTML = "";

      if (!data.success || !data.pictures.length) {
        photosGrid.innerHTML = `<span style="font-size:.7rem; opacity:.35; align-self:center;">Aucune photo liée.</span>`;
        if (photosCountBadge) photosCountBadge.textContent = "0 / 3";
        if (photoAddZone)    photoAddZone.style.display = "block";
        if (photosLimitMsg)  photosLimitMsg.style.display = "none";
        return;
      }

      const count = data.pictures.length;
      if (photosCountBadge) photosCountBadge.textContent = `${count} / 3`;

      data.pictures.forEach((pic) => photosGrid.appendChild(renderPhotoCard(pic)));

      if (count >= 3) {
        if (photoAddZone)   photoAddZone.style.display = "none";
        if (photosLimitMsg) photosLimitMsg.style.display = "block";
      } else {
        if (photoAddZone)   photoAddZone.style.display = "block";
        if (photosLimitMsg) photosLimitMsg.style.display = "none";
      }
    } catch {
      photosGrid.innerHTML = `<span style="font-size:.7rem; color:rgba(220,60,60,.7);">Erreur de chargement.</span>`;
    }
  };

  // Brancher loadRecipePhotos lors de l'ouverture du modal recette
  const origOpenEditModal = openEditModal;
  // Patch : hook sur activateView → pas nécessaire, on appelle refreshPhotosPanel depuis openEditModal
  // On stocke le recipeId courant dans une variable accessible
  const _patchedPrefill = prefillModal;
  // Plutôt : stocker currentRecipeId dans le handler de data-edit-btn
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit-btn][data-edit-type='recipe']");
    if (!btn) return;
    const rid = btn.dataset.editId;
    if (rid) {
      currentRecipeId = rid;
      // Lancer le fetch photos (légèrement différé pour que le modal s'ouvre d'abord)
      setTimeout(() => refreshPhotosPanel(rid), 80);
    }
  });

  // Délégation événements dans le panel photos
  document.addEventListener("click", async (e) => {
    // Approuver
    const approveBtn = e.target.closest("[data-photo-approve]");
    if (approveBtn) {
      const picId = approveBtn.dataset.photoApprove;
      const res = await fetch(`/admin/recipe-pictures/${picId}/approve-json`, { method: "POST" });
      const data = await res.json();
      if (data.success) { showToast("Photo approuvée", "success"); refreshPhotosPanel(currentRecipeId); }
      else showToast(data.message || "Erreur", "error");
      return;
    }

    // Supprimer
    const deleteBtn = e.target.closest("[data-photo-delete]");
    if (deleteBtn) {
      const picId = deleteBtn.dataset.photoDelete;
      const res = await fetch(`/admin/recipe-pictures/${picId}/delete-json`, { method: "POST" });
      const data = await res.json();
      if (data.success) { showToast("Photo supprimée", "success"); refreshPhotosPanel(currentRecipeId); }
      else showToast(data.message || "Erreur", "error");
      return;
    }
  });

  // Remplacer (file input change dans les cartes)
  document.addEventListener("change", async (e) => {
    const replaceInput = e.target.closest("[data-photo-replace]");
    if (replaceInput && replaceInput.files?.[0]) {
      const picId = replaceInput.dataset.photoReplace;
      const fd = new FormData();
      fd.append("picture", replaceInput.files[0]);
      const res  = await fetch(`/admin/recipe-pictures/${picId}/replace`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { showToast("Photo mise à jour", "success"); refreshPhotosPanel(currentRecipeId); }
      else showToast(data.message || "Erreur", "error");
    }
  });

  // Ajouter nouvelle photo
  photoAddBtn?.addEventListener("click", async () => {
    if (!photoAddInput?.files?.[0] || !currentRecipeId) return;
    const fd = new FormData();
    fd.append("picture", photoAddInput.files[0]);
    const res  = await fetch(`/admin/recipes/${currentRecipeId}/pictures/add`, { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) {
      showToast("Photo ajoutée", "success");
      if (photoAddInput) photoAddInput.value = "";
      refreshPhotosPanel(currentRecipeId);
    } else {
      showToast(data.message || "Erreur lors de l'ajout", "error");
    }
  });

  console.log("✅ Admin dashboard v2 initialisé.");

  // ══════════════════════════════════════════════════════
  // POLLING — nouvelles demandes en attente (toutes les 20s)
  // ══════════════════════════════════════════════════════
  let _pendingSnapshot = null;

  function _updateNavBadge(key, count) {
    const btn = document.querySelector(`[data-pending-key="${key}"]`);
    if (!btn) return;
    let badge = btn.querySelector(".nav-badge");
    if (count > 0) {
      if (!badge) { badge = document.createElement("span"); badge.className = "nav-badge"; btn.appendChild(badge); }
      badge.textContent = count;
    } else {
      badge?.remove();
    }
  }

  async function checkPendingCount() {
    try {
      const r = await fetch("/admin/api/pending-count");
      const d = await r.json();
      if (!d.success) return;

      // Mise à jour des badges nav en temps réel
      _updateNavBadge("recipes",        d.recipes        || 0);
      _updateNavBadge("notices",        d.notices        || 0);
      _updateNavBadge("profils",        d.profils        || 0);
      _updateNavBadge("recipePictures", d.recipePictures || 0);
      _updateNavBadge("filmEdits",      d.filmEdits      || 0);

      if (_pendingSnapshot === null) {
        _pendingSnapshot = d;
        return;
      }

      // Toasts pour les nouvelles demandes
      const newBanners = (d.banners  || 0) - (_pendingSnapshot.banners  || 0);
      const newPhotos  = (d.photos   || 0) - (_pendingSnapshot.photos   || 0);
      const newRecipes = (d.recipes  || 0) - (_pendingSnapshot.recipes  || 0);
      const newPseudos = (d.pseudos  || 0) - (_pendingSnapshot.pseudos  || 0);
      const newNotices = (d.notices  || 0) - (_pendingSnapshot.notices  || 0);

      if (newBanners > 0) showToast(`${newBanners} nouvelle${newBanners > 1 ? 's' : ''} bannière${newBanners > 1 ? 's' : ''} en attente`, "warning");
      if (newPhotos  > 0) showToast(`${newPhotos} nouvelle${newPhotos > 1 ? 's' : ''} photo${newPhotos > 1 ? 's' : ''} de profil en attente`, "warning");
      if (newRecipes > 0) showToast(`${newRecipes} nouvelle${newRecipes > 1 ? 's' : ''} recette${newRecipes > 1 ? 's' : ''} en attente`, "warning");
      if (newPseudos > 0) showToast(`${newPseudos} nouveau${newPseudos > 1 ? 'x' : ''} pseudo${newPseudos > 1 ? 's' : ''} en attente`, "warning");
      if (newNotices > 0) showToast(`${newNotices} nouvel${newNotices > 1 ? 's' : ''} avis${newNotices > 1 ? '' : ''} en attente`, "warning");

      _pendingSnapshot = d;
    } catch { /* silencieux */ }
  }

  checkPendingCount();
  setInterval(checkPendingCount, 15000);
});
