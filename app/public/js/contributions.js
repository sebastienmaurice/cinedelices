/**
 * contributions.js — Ciné Délices · /contributions/
 * Étape 2 (Phase 5, recentrage architecture) : reproduit à l'identique la
 * partie "édition/suppression de contenu" de account.js (Mon compte), afin
 * que /contributions/ devienne la vraie destination de gestion. Mêmes
 * routes, mêmes endpoints, même modal — aucune logique métier nouvelle,
 * uniquement son point d'accès UI déplacé/dupliqué ici.
 */
(() => {
  const main = document.querySelector(".ctr-main");
  if (!main) return;

  const userId = main.dataset.userId;
  const toastContainer = document.querySelector(".profile-toast-wrap");

  const showToast = (message, type = "") => {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `profile-toast__item ${type ? `is-${type}` : ""}`.trim();
    const titleMap = { success: "Succès : ", warning: "Attention : ", error: "Erreur : " };
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
    setTimeout(() => toast.remove(), 3500);
  };

  // ====================================================
  // EDIT RECIPE MODAL — identique à account.js
  // ====================================================
  const editRecipeModal = document.getElementById("editRecipeModal");
  const editModalCancel = document.getElementById("editModalCancel");
  const editModalSave = document.getElementById("editModalSave");
  let activeEditItem = null;

  const _photoSlots = [1, 2, 3].map((n) => ({
    n,
    slot: () => document.getElementById(`edit-ps-${n}`),
    prev: () => document.getElementById(`edit-ps-prev-${n}`),
    input: () => document.getElementById(`edit-ps-input-${n}`),
    del: () => document.getElementById(`edit-ps-del-${n}`),
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

  _photoSlots.forEach(({ n, slot, input, del }) => {
    slot()?.addEventListener("click", (e) => {
      const delEl = del();
      if (delEl && (e.target === delEl || delEl.contains(e.target))) return;
      input()?.click();
    });
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
    del()?.addEventListener("click", (e) => { e.stopPropagation(); _setSlotPhoto(n, null); });
  });

  const openEditModal = (item) => {
    activeEditItem = item;
    document.getElementById("editField-name").value = item.dataset.name || "";
    document.getElementById("editField-category").value = item.dataset.category || "";
    document.getElementById("editField-time").value = item.dataset.time || "";
    document.getElementById("editField-difficulty").value = item.dataset.difficulty || "";
    document.getElementById("editField-description").value = decodeURIComponent(item.dataset.description || "");

    const ingRte = document.getElementById("profil-ing-rte");
    if (ingRte && window.RteMini) {
      const rawIng = decodeURIComponent(item.dataset.ingredients || "").trim();
      let ingItems = [];
      if (rawIng.startsWith("[")) { try { ingItems = JSON.parse(rawIng); } catch (_) {} }
      RteMini.loadIntoRte(ingRte, ingItems, "ingredients");
    }
    const prepRte = document.getElementById("profil-prep-rte");
    if (prepRte && window.RteMini) {
      const rawPrep = decodeURIComponent(item.dataset.preparation || "").trim();
      let prepItems = [];
      if (rawPrep.startsWith("[")) { try { prepItems = JSON.parse(rawPrep); } catch (_) {} }
      RteMini.loadIntoRte(prepRte, prepItems, "preparation");
    }

    _clearAllSlots();
    try {
      const pics = JSON.parse(decodeURIComponent(item.dataset.pictures || "[]"));
      pics.slice(0, 3).forEach((url, i) => { if (url) _setSlotPhoto(i + 1, url); });
    } catch (_) {
      const mainPic = item.dataset.picture;
      if (mainPic) _setSlotPhoto(1, mainPic);
    }

    const subEl = document.getElementById("editModalSub");
    if (subEl) {
      subEl.textContent = item.dataset.status === "rejected"
        ? "⚠️ Recette refusée — une modification la renverra pour revalidation"
        : "Les modifications sont soumises à validation";
      subEl.style.color = item.dataset.status === "rejected" ? "rgba(232,100,60,.9)" : "";
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
  editRecipeModal?.addEventListener("click", (e) => { if (e.target === editRecipeModal) closeEditModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editRecipeModal?.classList.contains("open")) closeEditModal();
  });

  editModalSave?.addEventListener("click", async () => {
    if (!activeEditItem) return;
    const item = activeEditItem;
    if ((item.dataset.editStatus || "none") === "pending") {
      showToast("Modification déjà en attente.", "warning");
      return;
    }

    const payload = {};
    const formData = new FormData();
    ["name", "category", "time", "difficulty"].forEach((name) => {
      const el = document.getElementById(`editField-${name}`);
      if (!el) return;
      const val = el.value.trim();
      const original = (item.dataset[name] || "").trim();
      if (val && val !== original) { payload[name] = val; formData.append(name, val); }
    });
    if (window.RteMini) {
      const ingRte = document.getElementById("profil-ing-rte");
      const ingHid = document.getElementById("editField-ingredients");
      const prepRte = document.getElementById("profil-prep-rte");
      const prepHid = document.getElementById("editField-preparation");
      if (ingRte && ingHid) ingHid.value = JSON.stringify(RteMini.rteToJson(ingRte, "ingredients"));
      if (prepRte && prepHid) prepHid.value = JSON.stringify(RteMini.rteToJson(prepRte, "preparation"));
    }
    ["description", "ingredients", "preparation"].forEach((name) => {
      const el = document.getElementById(`editField-${name}`);
      if (!el) return;
      const val = el.value.trim();
      const original = decodeURIComponent(item.dataset[name] || "").trim();
      if (val && val !== original) { payload[name] = val; formData.append(name, val); }
    });
    let hasNewPhotos = false;
    [1, 2, 3].forEach((n) => {
      const inp = document.getElementById(`edit-ps-input-${n}`);
      if (inp?.files?.[0]) { formData.append("pictures", inp.files[0]); hasNewPhotos = true; }
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
        const editBtn = item.querySelector(".contrib-edit-btn");
        if (editBtn) editBtn.disabled = true;
        closeEditModal();
        showToast(data.message || "Modification envoyée pour validation.", "warning");
        return;
      }

      if (data.resubmitted) {
        item.dataset.status = "pending";
        const badge = item.querySelector(".ctr-item__status");
        if (badge) { badge.className = "ctr-item__status ctr-item__status--pending"; badge.textContent = "En attente"; }
        closeEditModal();
        showToast(data.message || "Recette renvoyée pour validation.", "success");
        return;
      }

      const titleEl = item.querySelector(".ctr-item__title");
      if (payload.name && titleEl) titleEl.textContent = payload.name;
      ["name", "category", "time", "difficulty"].forEach((k) => { if (payload[k]) item.dataset[k] = payload[k]; });
      ["description", "ingredients", "preparation"].forEach((k) => { if (payload[k]) item.dataset[k] = encodeURIComponent(payload[k]); });
      closeEditModal();
      showToast(data.message || "Mise à jour effectuée.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  // ====================================================
  // PER-ITEM HANDLERS (edit → modal, delete) — mêmes endpoints
  // que account.js : /auth/profil/:userId/{recipes|movies|notices}/:id/delete
  // ====================================================
  main.querySelectorAll(".account-item").forEach((item) => {
    const type = item.dataset.type;
    const editBtn = item.querySelector(".contrib-edit-btn");
    const deleteBtn = item.querySelector(".contrib-delete-btn");

    editBtn?.addEventListener("click", () => {
      if (type !== "recipe") return;
      if ((item.dataset.editStatus || "none") === "pending") {
        showToast("Modification déjà en attente.", "warning");
        return;
      }
      openEditModal(item);
    });

    deleteBtn?.addEventListener("click", async () => {
      const getDeleteStatus = () => item.dataset.deleteRequest || "none";
      if ((type === "notice" || type === "recipe") && getDeleteStatus() === "pending") {
        showToast("Suppression déjà en attente de validation.", "warning");
        return;
      }
      const actionKey = type === "recipe" ? "account.deleteRecipe" : "account.deleteNotice";
      const actionConfig = (window.getConfirmConfig && window.getConfirmConfig(actionKey)) || {};
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
        if (!response.ok || !data.success) throw new Error(data.message || "Erreur lors de la suppression.");

        if (data.request) {
          showToast(data.message || "Demande envoyée.", "warning");
          if (deleteBtn) deleteBtn.disabled = true;
          item.dataset.deleteRequest = "pending";
          const hint = item.querySelector(".ctr-item__hint");
          if (!hint) {
            const p = document.createElement("p");
            p.className = "ctr-item__hint";
            p.textContent = "Demande de suppression en attente de validation admin.";
            item.querySelector(".ctr-item__main")?.appendChild(p);
          }
          return;
        }

        item.remove();
        showToast(data.message || "Suppression effectuée.", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
})();
