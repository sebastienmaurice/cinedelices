(() => {
  const profilePage = document.querySelector(".profile-page");
  if (!profilePage) return;

  const userId = document.querySelector("main[data-user-id]")?.dataset.userId || profilePage.dataset.userId;
  const editButton   = document.getElementById("editProfileBtn");
  const saveButton   = document.getElementById("saveProfileBtn");
  const cancelButton = document.getElementById("cancelProfileBtn");
  const toastContainer = document.querySelector(".profile-toast-wrap");
  const removeAvatarBtn = document.getElementById("removeAvatarBtn");
  const avatarInput = document.getElementById("avatar");
  const avatarImg = profilePage.querySelector(".avatar-img");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const editPseudoBtn   = document.getElementById("editPseudoBtn");
  const savePseudoBtn   = document.getElementById("savePseudoBtn");
  const cancelPseudoBtn = document.getElementById("cancelPseudoBtn");
  const pseudoInput   = document.getElementById("username");
  const pseudoDisplay = document.getElementById("pseudoDisplay");

  const editableInputs = profilePage.querySelectorAll(
    "#profileInfoForm input, #profileAvatarForm input[type='text'], #profilePrefsForm input"
  );

  let removeAvatar = false;
  let isEditing = false;

  // Sauvegarder les valeurs initiales pour le bouton Annuler
  const _origValues = {};
  editableInputs.forEach((input) => {
    _origValues[input.id || input.name] = input.value;
  });

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

  // Exposer pour les scripts inline de la page (banner upload, etc.)
  window.showProfileToast = showToast;

  const setEditingState = (enabled) => {
    isEditing = enabled;
    editableInputs.forEach((input) => { input.disabled = !enabled; });
    if (saveButton)   saveButton.style.display   = enabled ? "" : "none";
    if (cancelButton) cancelButton.style.display = enabled ? "" : "none";
    if (editButton)   editButton.style.display   = enabled ? "none" : "";
    if (!enabled) { removeAvatar = false; }
  };

  setEditingState(false);

  let pictureStatus = profilePage.dataset.pictureStatus;

  const getOrCreateBadge = () => {
    let badge = profilePage.querySelector(".avatar-photo-status");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "avatar-photo-status";
      profilePage.querySelector(".avatar-frame")?.appendChild(badge);
    }
    return badge;
  };

  const dismissBadge = (badge, delay = 3500) => {
    setTimeout(() => {
      badge.style.transition = "opacity .6s";
      badge.style.opacity = "0";
      setTimeout(() => badge.remove(), 650);
    }, delay);
  };

  const updatePhotoUI = (status) => {
    pictureStatus = status;
    profilePage.dataset.pictureStatus = status;

    if (status === "pending") {
      if (avatarInput) avatarInput.disabled = true;
      if (removeAvatarBtn) removeAvatarBtn.disabled = true;
      const badge = getOrCreateBadge();
      badge.className = "avatar-photo-status avatar-photo-status--pending";
      badge.innerHTML = '<span class="b-dot"></span>En attente';
    } else if (status === "rejected") {
      if (avatarInput) avatarInput.disabled = false;
      if (removeAvatarBtn) removeAvatarBtn.disabled = false;
      const badge = getOrCreateBadge();
      badge.className = "avatar-photo-status avatar-photo-status--rejected";
      badge.innerHTML = '<span class="b-dot"></span>Refusée';
    } else {
      if (avatarInput) avatarInput.disabled = false;
      if (removeAvatarBtn) removeAvatarBtn.disabled = false;
      const badge = getOrCreateBadge();
      badge.className = "avatar-photo-status avatar-photo-status--ok";
      badge.innerHTML = '<span class="b-dot"></span>Vérifié';
      dismissBadge(badge, 3500);
    }
  };

  // État initial
  if (pictureStatus === "pending") {
    showToast("Votre photo est en cours de validation par un administrateur. Elle apparaîtra dès son approbation.", "warning");
  } else if (pictureStatus === "rejected") {
    showToast("Photo refusée. Vous pouvez en téléverser une nouvelle.", "warning");
  }

  // ── PSEUDO EDIT ──────────────────────────────────
  /* Démarrer le poll si le pseudo est déjà en attente au chargement */
  const _initialPseudoStatus = document.querySelector(".pseudo-status-badge--pending") ? "pending" : null;
  if (_initialPseudoStatus === "pending") startPseudoPoll();
  /* ── helpers mode édition pseudo ── */
  const _originalPseudo = pseudoInput ? pseudoInput.value : "";

  function enterPseudoEditMode() {
    if (!pseudoInput) return;
    if (pseudoDisplay) pseudoDisplay.style.display = "none";
    pseudoInput.style.display = "block";
    pseudoInput.disabled = false;
    pseudoInput.focus();
    pseudoInput.select();
    if (editPseudoBtn) editPseudoBtn.style.display = "none";
    if (savePseudoBtn) savePseudoBtn.style.display = "inline-flex";
    if (cancelPseudoBtn) cancelPseudoBtn.style.display = "inline-flex";
  }

  function exitPseudoEditMode(restoreValue) {
    if (pseudoInput) {
      if (restoreValue) pseudoInput.value = _originalPseudo;
      pseudoInput.disabled = true;
      pseudoInput.style.display = "none";
    }
    if (pseudoDisplay) pseudoDisplay.style.display = "block";
    if (editPseudoBtn) editPseudoBtn.style.display = "";
    if (savePseudoBtn) savePseudoBtn.style.display = "none";
    if (cancelPseudoBtn) cancelPseudoBtn.style.display = "none";
  }

  /* ── Polling pseudo status ── */
  let pseudoPollInterval = null;
  function stopPseudoPoll() { if (pseudoPollInterval) { clearInterval(pseudoPollInterval); pseudoPollInterval = null; } }
  function startPseudoPoll() {
    stopPseudoPoll();
    pseudoPollInterval = setInterval(async () => {
      try {
        const r = await fetch(`/auth/profil/${userId}/pseudo/status`);
        const d = await r.json();
        if (!d.success) return;
        if (d.pseudo_status === "approved") {
          stopPseudoPoll();
          /* Mettre à jour l'affichage avec le nouveau pseudo approuvé */
          if (pseudoDisplay) {
            const words = d.pseudo.split(" ");
            const last = words.pop(), rest = words.join(" ");
            const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
            pseudoDisplay.innerHTML = (rest ? esc(rest) + " " : "") + "<em>" + esc(last) + "</em>";
          }
          /* Remplacer le badge pending par le bouton edit */
          const row = document.querySelector(".hero-pseudo-row");
          const badge = row?.querySelector(".pseudo-status-badge");
          if (badge) {
            const btn = document.createElement("button");
            btn.type = "button"; btn.className = "hero-pseudo-edit"; btn.id = "editPseudoBtn";
            btn.title = "Modifier le pseudo";
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
            btn.addEventListener("click", enterPseudoEditMode);
            badge.replaceWith(btn);
          }
          showToast("Pseudo approuvé et mis à jour !", "success");
        } else if (d.pseudo_status === "rejected") {
          stopPseudoPoll();
          const row = document.querySelector(".hero-pseudo-row");
          const badge = row?.querySelector(".pseudo-status-badge");
          if (badge) badge.className = "pseudo-status-badge pseudo-status-badge--rejected";
          if (badge) badge.innerHTML = `<span class="b-dot"></span>Pseudo refusé`;
          showToast("Votre demande de pseudo a été refusée.", "error");
        }
      } catch { /* silencieux */ }
    }, 6000);
  }

  editPseudoBtn?.addEventListener("click", enterPseudoEditMode);
  cancelPseudoBtn?.addEventListener("click", () => exitPseudoEditMode(true));
  pseudoInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); savePseudoBtn?.click(); }
    if (e.key === "Escape") { e.preventDefault(); exitPseudoEditMode(true); }
  });

  savePseudoBtn?.addEventListener("click", async () => {
    if (!pseudoInput) return;
    const pseudo = pseudoInput.value.trim();
    if (!pseudo) { showToast("Le pseudo ne peut pas être vide.", "error"); return; }
    if (pseudo === _originalPseudo) { exitPseudoEditMode(false); return; }
    const formData = new FormData();
    formData.append("pseudo", pseudo);
    try {
      const response = await fetch(`/auth/profil/${userId}/update`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Erreur lors de la mise à jour.");
      exitPseudoEditMode(false);
      /* Afficher badge "en attente" à la place du bouton edit */
      const row = document.querySelector(".hero-pseudo-row");
      const editBtn = row?.querySelector(".hero-pseudo-edit");
      if (editBtn) {
        const badge = document.createElement("span");
        badge.className = "pseudo-status-badge pseudo-status-badge--pending";
        badge.innerHTML = `<span class="b-dot"></span>En attente`;
        editBtn.replaceWith(badge);
      }
      showToast("Pseudo soumis — en attente de validation par un admin.", "success");
      startPseudoPoll();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  if (editButton) {
    editButton.addEventListener("click", () => {
      setEditingState(true);
      showToast("Mode édition activé.", "success");
      document.querySelector("#firstname")?.focus();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      // Restaurer les valeurs originales
      editableInputs.forEach((input) => {
        const key = input.id || input.name;
        if (key in _origValues) input.value = _origValues[key];
      });
      setEditingState(false);
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", () => {
      if (!isEditing) {
        setEditingState(true);
        showToast("Mode édition activé.", "success");
      }
      removeAvatar = true;
      if (avatarImg) {
        avatarImg.src = "/images/image-default-profile.jpg";
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
        avatarInput.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Votre photo est trop volumineuse (max 5 Mo). Compressez-la avant de l'envoyer.", "error");
        avatarInput.value = "";
        return;
      }

      // Prévisualisation immédiate
      const reader = new FileReader();
      reader.onload = (event) => {
        if (avatarImg && event.target?.result) {
          avatarImg.src = event.target.result;
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
        showToast("Photo envoyée ✓ Un administrateur va l'examiner avant de la publier sur votre profil.", "success");
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
      // N'envoyer le pseudo que s'il a été explicitement modifié
      const origPseudo = (_origValues["username"] || "").trim();
      if (pseudo && pseudo !== origPseudo) formData.append("pseudo", pseudo);
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

  // ====================================================
  // EDIT RECIPE MODAL
  // ====================================================
  const editRecipeModal = document.getElementById("editRecipeModal");
  const editModalCancel = document.getElementById("editModalCancel");
  const editModalSave = document.getElementById("editModalSave");
  let activeEditItem = null;

  // ── Gestion des 3 slots photo dans le modal édition ──
  const _photoSlots = [1, 2, 3].map((n) => ({
    n,
    slot:  () => document.getElementById(`edit-ps-${n}`),
    prev:  () => document.getElementById(`edit-ps-prev-${n}`),
    input: () => document.getElementById(`edit-ps-input-${n}`),
    del:   () => document.getElementById(`edit-ps-del-${n}`),
  }));

  const _setSlotPhoto = (n, url) => {
    const s = _photoSlots[n - 1];
    if (!s) return;
    const slotEl = s.slot();
    const prevEl = s.prev();
    if (!slotEl || !prevEl) return;
    if (url) {
      prevEl.style.backgroundImage = `url("${url}")`;
      slotEl.classList.add("has-photo");
    } else {
      prevEl.style.backgroundImage = "";
      slotEl.classList.remove("has-photo");
      const inp = s.input();
      if (inp) inp.value = "";
    }
  };

  const _clearAllSlots = () => [1, 2, 3].forEach((n) => _setSlotPhoto(n, null));

  // Brancher les slots
  _photoSlots.forEach(({ n, slot, input, del }) => {
    // Clic sur le slot (hors bouton del) → ouvrir fichier
    slot()?.addEventListener("click", (e) => {
      const delEl = del();
      if (delEl && (e.target === delEl || delEl.contains(e.target))) return;
      input()?.click();
    });
    // Sélection de fichier
    input()?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast("Photo trop volumineuse (max 2 Mo).", "error");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => _setSlotPhoto(n, ev.target.result);
      reader.readAsDataURL(file);
    });
    // Bouton supprimer
    del()?.addEventListener("click", (e) => { e.stopPropagation(); _setSlotPhoto(n, null); });
  });

  const openEditModal = (item) => {
    activeEditItem = item;
    document.getElementById("editField-name").value = item.dataset.name || "";
    document.getElementById("editField-category").value = item.dataset.category || "";
    document.getElementById("editField-time").value = item.dataset.time || "";
    document.getElementById("editField-difficulty").value = item.dataset.difficulty || "";
    document.getElementById("editField-description").value = decodeURIComponent(item.dataset.description || "");

    // Ingrédients → RTE
    const ingRte = document.getElementById("profil-ing-rte");
    if (ingRte && window.RteMini) {
      const rawIng = decodeURIComponent(item.dataset.ingredients || "").trim();
      let ingItems = [];
      if (rawIng.startsWith("[")) { try { ingItems = JSON.parse(rawIng); } catch (_) {} }
      RteMini.loadIntoRte(ingRte, ingItems, "ingredients");
    }
    // Préparation → RTE
    const prepRte = document.getElementById("profil-prep-rte");
    if (prepRte && window.RteMini) {
      const rawPrep = decodeURIComponent(item.dataset.preparation || "").trim();
      let prepItems = [];
      if (rawPrep.startsWith("[")) { try { prepItems = JSON.parse(rawPrep); } catch (_) {} }
      RteMini.loadIntoRte(prepRte, prepItems, "preparation");
    }

    // Pré-remplir les slots avec les photos actuelles
    _clearAllSlots();
    try {
      const pics = JSON.parse(decodeURIComponent(item.dataset.pictures || "[]"));
      pics.slice(0, 3).forEach((url, i) => { if (url) _setSlotPhoto(i + 1, url); });
    } catch (_) {
      const mainPic = item.dataset.picture;
      if (mainPic) _setSlotPhoto(1, mainPic);
    }

    // Adapter le sous-titre selon le statut
    const subEl = document.getElementById("editModalSub");
    if (subEl) {
      subEl.textContent = item.dataset.status === "rejected"
        ? "⚠️ Recette refusée — une modification la renverra pour revalidation"
        : "Les modifications sont soumises à validation";
      subEl.style.color = item.dataset.status === "rejected"
        ? "rgba(232,100,60,.9)"
        : "";
    }

    editRecipeModal.classList.add("open");
    document.body.classList.add("modal-open");
  };

  const closeEditModal = () => {
    editRecipeModal?.classList.remove("open");
    document.body.classList.remove("modal-open");
    activeEditItem = null;
    _clearAllSlots();
  };

  editModalCancel?.addEventListener("click", closeEditModal);
  editRecipeModal?.addEventListener("click", (e) => {
    if (e.target === editRecipeModal) closeEditModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editRecipeModal?.classList.contains("open")) closeEditModal();
  });

  const _hintMessages = {
    pending:  { cls: "account-item__hint--pending",  text: "⏳ Modification en attente de validation." },
    approved: { cls: "account-item__hint--approved", text: "✓ Modification approuvée." },
    rejected: { cls: "account-item__hint--rejected", text: "✕ Modification refusée. Vous pouvez soumettre une nouvelle modification." },
  };

  const _setEditHint = (item, state) => {
    const body = item.querySelector(".item-card__body");
    if (!body) return;
    let hint = body.querySelector(".account-item__hint");
    if (state === "none") { hint?.remove(); return; }
    const cfg = _hintMessages[state];
    if (!cfg) return;
    if (!hint) {
      hint = document.createElement("p");
      const actions = body.querySelector(".item-card__actions");
      actions ? body.insertBefore(hint, actions) : body.appendChild(hint);
    }
    hint.className = `account-item__hint ${cfg.cls}`;
    hint.textContent = cfg.text;
  };

  editModalSave?.addEventListener("click", async () => {
    if (!activeEditItem) return;
    const item = activeEditItem;
    if ((item.dataset.editStatus || "none") === "pending") {
      showToast("Modification déjà en attente.", "warning");
      return;
    }

    const payload = {};
    const formData = new FormData();
    // Champs courts : comparer directement avec le dataset
    ["name", "category", "time", "difficulty"].forEach((name) => {
      const el = document.getElementById(`editField-${name}`);
      if (!el) return;
      const val = el.value.trim();
      const original = (item.dataset[name] || "").trim();
      if (val && val !== original) {
        payload[name] = val;
        formData.append(name, val);
      }
    });
    // Sérialiser les RTEs dans les hidden inputs avant comparaison
    if (window.RteMini) {
      const ingRte  = document.getElementById("profil-ing-rte");
      const ingHid  = document.getElementById("editField-ingredients");
      const prepRte = document.getElementById("profil-prep-rte");
      const prepHid = document.getElementById("editField-preparation");
      if (ingRte  && ingHid)  ingHid.value  = JSON.stringify(RteMini.rteToJson(ingRte,  "ingredients"));
      if (prepRte && prepHid) prepHid.value = JSON.stringify(RteMini.rteToJson(prepRte, "preparation"));
    }
    // Champs longs : le dataset est encodé en URI, décoder pour comparer
    ["description", "ingredients", "preparation"].forEach((name) => {
      const el = document.getElementById(`editField-${name}`);
      if (!el) return;
      const val = el.value.trim();
      const original = decodeURIComponent(item.dataset[name] || "").trim();
      if (val && val !== original) {
        payload[name] = val;
        formData.append(name, val);
      }
    });
    // Collecter les fichiers des 3 slots photo
    let hasNewPhotos = false;
    [1, 2, 3].forEach((n) => {
      const inp = document.getElementById(`edit-ps-input-${n}`);
      if (inp?.files?.[0]) {
        formData.append("pictures", inp.files[0]);
        hasNewPhotos = true;
      }
    });

    if (Object.keys(payload).length === 0 && !hasNewPhotos) {
      showToast("Aucune modification détectée.", "warning");
      return;
    }

    const endpoint = `/auth/profil/${userId}/recipes/${item.dataset.id}/update`;
    try {
      const response = await fetch(endpoint, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Erreur lors de la mise à jour.");

      if (data.pending) {
        item.dataset.editStatus = "pending";
        const editBtn = item.querySelector(".account-edit-btn");
        if (editBtn) editBtn.disabled = true;
        _setEditHint(item, "pending");
        closeEditModal();
        showToast(data.message || "Modification envoyée pour validation.", "warning");
        return;
      }

      // Recette rejetée resoumise → statut visuel → pending
      if (data.resubmitted) {
        item.dataset.status = "pending";
        item.dataset.creaStatus = "pending";
        const badge = item.querySelector(".lr-status");
        if (badge) {
          badge.className = "lr-status lrs--attente";
          badge.innerHTML = '<span class="lr-status-dot"></span> En attente';
        }
        const subEl = item.querySelector(".list-row__sub");
        if (subEl) {
          const muted = subEl.querySelector(".lr-sub-muted");
          if (!muted) {
            subEl.insertAdjacentHTML("beforeend", ' <span class="lr-sub-muted">· En cours de modération…</span>');
          }
        }
        _setEditHint(item, "none");
        closeEditModal();
        showToast(data.message || "Recette renvoyée pour validation.", "success");
        return;
      }

      const titleEl = item.querySelector(".account-item__title");
      const metaEl = item.querySelector(".account-item__meta");
      if (payload.name && titleEl) titleEl.textContent = payload.name;
      if (metaEl) {
        const category = payload.category || item.dataset.category;
        const time = payload.time || item.dataset.time;
        const difficulty = payload.difficulty || item.dataset.difficulty;
        metaEl.textContent = `${category} · ${time} min · ${difficulty}`;
      }
      ["name", "category", "time", "difficulty"].forEach((k) => {
        if (payload[k]) item.dataset[k] = payload[k];
      });
      ["description", "ingredients", "preparation"].forEach((k) => {
        if (payload[k]) item.dataset[k] = encodeURIComponent(payload[k]);
      });
      closeEditModal();
      showToast(data.message || "Mise à jour effectuée.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  // ====================================================
  // PER-ITEM HANDLERS (edit btn → modal, delete)
  // ====================================================
  const items = profilePage.querySelectorAll(".account-item");
  items.forEach((item) => {
    const type = item.dataset.type;
    const editBtn = item.querySelector(".account-edit-btn");
    const deleteBtn = item.querySelector(".account-delete-btn");
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

    editBtn?.addEventListener("click", () => {
      if (type !== "recipe") return;
      if (getEditStatus() === "pending") {
        showToast("Modification déjà en attente.", "warning");
        return;
      }
      openEditModal(item);
    });

    deleteBtn?.addEventListener("click", async () => {
      if ((type === "notice" || type === "recipe") && getDeleteStatus() === "pending") {
        showToast("Suppression déjà en attente de validation.", "warning");
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
            hint.textContent = "Demande de suppression en attente de validation admin.";
            metaEl?.insertAdjacentElement("afterend", hint);
          } else {
            hintEl.textContent = "Demande de suppression en attente de validation admin.";
          }
          item.dataset.deleteRequest = "pending";
          setStatusBadge("Suppression en attente", "is-pending");
          return;
        }

        item.remove();
        showToast(data.message || "Suppression effectuée.", "success");
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
    const section = input.closest(".col");
    if (!section) return;

    const clearBtn = section.querySelector(".collections-section__search-clear");
    const noResultsMsg = section.querySelector(
      ".collections-section__no-results"
    );
    const listContainer = section.querySelector(".collections-section__list");

    let activeStatus = "all";

    const filterItems = () => {
      const query = input.value.trim().toLowerCase();
      const sectionItems = listContainer.querySelectorAll(".account-item");
      let visibleCount = 0;

      sectionItems.forEach((item) => {
        const statusMatch =
          activeStatus === "all" || item.dataset.status === activeStatus;

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

        const textMatch = !query || fullHaystack.includes(query);

        if (statusMatch && textMatch) {
          item.classList.remove("is-filtered-out");
          visibleCount++;
        } else {
          item.classList.add("is-filtered-out");
        }
      });

      if (noResultsMsg) {
        noResultsMsg.style.display =
          visibleCount === 0 ? "" : "none";
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

    section.querySelectorAll(".filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        section.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        activeStatus = pill.dataset.filter || "all";
        filterItems();
      });
    });
  });
})();
