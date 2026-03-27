/**
 * confirm-action.js
 * Fournit window.confirmAction() et window.getConfirmConfig()
 * utilisés par admin-dashboard.js pour les actions destructives.
 */

(function () {

  // ── Configurations par clé d'action ─────────────────────────────────────────
  const CONFIGS = {
    "admin.deleteUser":          { title: "Supprimer l'utilisateur",    message: "Cette action est irréversible. L'utilisateur sera définitivement supprimé.",       variant: "danger",  confirmLabel: "Supprimer" },
    "admin.rejectMovie":         { title: "Refuser le film",            message: "Le film sera rejeté et retiré de la file de validation.",                          variant: "warning", confirmLabel: "Refuser" },
    "admin.rejectRecipe":        { title: "Refuser la recette",         message: "La recette sera rejetée et retirée de la file de validation.",                     variant: "warning", confirmLabel: "Refuser" },
    "admin.rejectNotice":        { title: "Refuser l'avis",             message: "L'avis sera rejeté et retiré de la file de modération.",                          variant: "warning", confirmLabel: "Refuser" },
    "admin.validateMovie":       { title: "Valider le film",            message: "Le film sera publié et visible par tous les utilisateurs.",                        variant: "success", confirmLabel: "Valider" },
    "admin.validateRecipe":      { title: "Valider la recette",         message: "La recette sera publiée et visible par tous les utilisateurs.",                    variant: "success", confirmLabel: "Valider" },
    "admin.validateNotice":      { title: "Valider l'avis",             message: "L'avis sera publié et visible par tous les utilisateurs.",                        variant: "success", confirmLabel: "Valider" },
    "admin.approveProfilePhoto": { title: "Valider la photo",           message: "La photo de profil sera approuvée et rendue visible.",                            variant: "success", confirmLabel: "Valider" },
    "admin.rejectProfilePhoto":  { title: "Refuser la photo",           message: "La photo de profil sera rejetée.",                                                variant: "warning", confirmLabel: "Refuser" },
    "admin.approveMovieDelete":  { title: "Confirmer la suppression",   message: "La demande de suppression sera approuvée. Le film sera définitivement supprimé.", variant: "danger",  confirmLabel: "Supprimer" },
    "admin.rejectMovieDelete":   { title: "Rejeter la demande",         message: "La demande de suppression du film sera refusée.",                                 variant: "warning", confirmLabel: "Rejeter" },
    "admin.approveNoticeDelete": { title: "Confirmer la suppression",   message: "La demande de suppression sera approuvée. L'avis sera définitivement supprimé.",  variant: "danger",  confirmLabel: "Supprimer" },
    "admin.rejectNoticeDelete":  { title: "Rejeter la demande",         message: "La demande de suppression de l'avis sera refusée.",                               variant: "warning", confirmLabel: "Rejeter" },
    "admin.approveMovieEdit":    { title: "Valider la modification",    message: "Les modifications proposées pour ce film seront appliquées.",                     variant: "success", confirmLabel: "Valider" },
    "admin.rejectMovieEdit":     { title: "Refuser la modification",    message: "Les modifications proposées pour ce film seront rejetées.",                       variant: "warning", confirmLabel: "Refuser" },
    "admin.approveRecipeEdit":   { title: "Valider la modification",    message: "Les modifications proposées pour cette recette seront appliquées.",               variant: "success", confirmLabel: "Valider" },
    "admin.rejectRecipeEdit":    { title: "Refuser la modification",    message: "Les modifications proposées pour cette recette seront rejetées.",                 variant: "warning", confirmLabel: "Refuser" },
    "admin.approveNoticeEdit":   { title: "Valider la modification",    message: "Les modifications proposées pour cet avis seront appliquées.",                    variant: "success", confirmLabel: "Valider" },
    "admin.rejectNoticeEdit":    { title: "Refuser la modification",    message: "Les modifications proposées pour cet avis seront rejetées.",                      variant: "warning", confirmLabel: "Refuser" },
    "admin.directDeleteMovie":   { title: "Supprimer le film",          message: "Le film sera définitivement supprimé. Cette action est irréversible.",            variant: "danger",  confirmLabel: "Supprimer" },
    "admin.directDeleteRecipe":  { title: "Supprimer la recette",       message: "La recette sera définitivement supprimée. Cette action est irréversible.",        variant: "danger",  confirmLabel: "Supprimer" },
    "admin.directDeleteNotice":  { title: "Supprimer l'avis",           message: "L'avis sera définitivement supprimé. Cette action est irréversible.",             variant: "danger",  confirmLabel: "Supprimer" },
  };

  window.getConfirmConfig = function (actionKey) {
    return CONFIGS[actionKey] || {};
  };

  // ── Modal singleton ──────────────────────────────────────────────────────────
  let _modal = null;

  function buildModal() {
    const el = document.createElement("div");
    el.id = "confirm-modal";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "confirm-modal-title");
    el.innerHTML = `
      <div class="confirm-modal__backdrop"></div>
      <div class="confirm-modal__box">
        <h3 class="confirm-modal__title" id="confirm-modal-title"></h3>
        <p  class="confirm-modal__msg"></p>
        <div class="confirm-modal__foot">
          <button type="button" class="confirm-modal__cancel">Annuler</button>
          <button type="button" class="confirm-modal__ok"></button>
        </div>
      </div>`;

    const style = document.createElement("style");
    style.textContent = `
      #confirm-modal {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none;
        transition: opacity .18s ease;
      }
      #confirm-modal.is-open { opacity: 1; pointer-events: all; }
      .confirm-modal__backdrop {
        position: absolute; inset: 0;
        background: rgba(0,0,0,.6); backdrop-filter: blur(3px);
      }
      .confirm-modal__box {
        position: relative; z-index: 1;
        background: #0d1b2e;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 12px;
        padding: 28px 28px 22px;
        min-width: 320px; max-width: 420px; width: 90%;
        box-shadow: 0 24px 60px rgba(0,0,0,.6);
        transform: translateY(10px);
        transition: transform .18s ease;
      }
      #confirm-modal.is-open .confirm-modal__box { transform: translateY(0); }
      .confirm-modal__title {
        margin: 0 0 10px;
        font-family: var(--f-title, sans-serif);
        font-size: .85rem; font-weight: 700; letter-spacing: .06em;
        text-transform: uppercase; color: #e8e8e8;
      }
      .confirm-modal__msg {
        margin: 0 0 22px;
        font-size: .78rem; color: rgba(232,232,232,.65); line-height: 1.5;
      }
      .confirm-modal__foot {
        display: flex; justify-content: flex-end; gap: 10px;
      }
      .confirm-modal__cancel {
        padding: 0 16px; height: 34px;
        background: transparent;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 8px; cursor: pointer;
        font-size: .7rem; font-weight: 600; letter-spacing: .05em;
        color: rgba(232,232,232,.55);
        transition: border-color .15s, color .15s;
      }
      .confirm-modal__cancel:hover { border-color: rgba(255,255,255,.28); color: #e8e8e8; }
      .confirm-modal__ok {
        padding: 0 16px; height: 34px;
        border: none; border-radius: 8px; cursor: pointer;
        font-family: var(--f-title, sans-serif);
        font-size: .7rem; font-weight: 700; letter-spacing: .07em;
        text-transform: uppercase;
        transition: opacity .15s, filter .15s;
      }
      .confirm-modal__ok:hover { opacity: .88; filter: brightness(1.08); }
      .confirm-modal__ok.variant-danger   { background: rgba(220,50,50,.85);  color: #fff; }
      .confirm-modal__ok.variant-warning  { background: rgba(200,130,20,.85); color: #fff; }
      .confirm-modal__ok.variant-success  { background: rgba(40,160,80,.85);  color: #fff; }
      .confirm-modal__ok.variant-default  { background: rgba(196,160,82,.85); color: #0a111c; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(el);
    return el;
  }

  function getModal() {
    if (!_modal) _modal = buildModal();
    return _modal;
  }

  // ── window.confirmAction ─────────────────────────────────────────────────────
  window.confirmAction = function ({ title, message, variant = "default", confirmLabel = "Confirmer" } = {}) {
    return new Promise((resolve) => {
      const modal   = getModal();
      const titleEl = modal.querySelector(".confirm-modal__title");
      const msgEl   = modal.querySelector(".confirm-modal__msg");
      const okBtn   = modal.querySelector(".confirm-modal__ok");
      const cancelBtn = modal.querySelector(".confirm-modal__cancel");

      titleEl.textContent = title    || "Confirmer l'action";
      msgEl.textContent   = message  || "Voulez-vous continuer ?";
      okBtn.textContent   = confirmLabel;
      okBtn.className     = `confirm-modal__ok variant-${variant}`;

      modal.classList.add("is-open");
      okBtn.focus();

      function close(accepted) {
        modal.classList.remove("is-open");
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        backdrop.removeEventListener("click", onCancel);
        document.removeEventListener("keydown", onKeydown);
        resolve(accepted);
      }

      const onOk      = () => close(true);
      const onCancel  = () => close(false);
      const backdrop  = modal.querySelector(".confirm-modal__backdrop");
      const onKeydown = (e) => { if (e.key === "Escape") close(false); };

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      backdrop.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKeydown);
    });
  };

})();
