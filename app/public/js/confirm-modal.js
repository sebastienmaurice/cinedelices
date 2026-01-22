(() => {
  const modal = document.querySelector("[data-confirm-modal]");
  if (!modal) return;

  const messageEl = modal.querySelector(".confirm-modal__message");
  const titleEl = modal.querySelector(".confirm-modal__title-text");
  const acceptBtn = modal.querySelector("[data-confirm-accept]");
  const cancelBtn = modal.querySelector("[data-confirm-cancel]");
  const closeBtn = modal.querySelector("[data-confirm-close]");

  let resolver = null;

  const CONFIRM_ACTIONS = window.CINE_CONFIRM_ACTIONS || {};

  const close = (result) => {
    modal.classList.remove("is-visible");
    modal.classList.remove("confirm-modal--danger", "confirm-modal--warning");
    modal.setAttribute("aria-hidden", "true");
    if (resolver) {
      resolver(result);
      resolver = null;
    }
  };

  const open = ({ title, message, confirmLabel, cancelLabel, variant } = {}) => {
    if (titleEl) titleEl.textContent = title || "Confirmer l'action";
    if (messageEl) messageEl.textContent = message || "Confirmez-vous cette action ?";
    if (acceptBtn) acceptBtn.textContent = confirmLabel || "Confirmer";
    if (cancelBtn) cancelBtn.textContent = cancelLabel || "Annuler";
    if (acceptBtn) {
      acceptBtn.classList.remove("btn--red", "btn--gold", "btn--warning");
      if (variant === "danger") {
        acceptBtn.classList.add("btn--red");
      } else if (variant === "warning") {
        acceptBtn.classList.add("btn--warning");
      } else {
        acceptBtn.classList.add("btn--gold");
      }
    }
    modal.classList.toggle("confirm-modal--danger", variant === "danger");
    modal.classList.toggle("confirm-modal--warning", variant === "warning");

    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
    cancelBtn?.focus();

    return new Promise((resolve) => {
      resolver = resolve;
    });
  };

  acceptBtn?.addEventListener("click", () => close(true));
  cancelBtn?.addEventListener("click", () => close(false));
  closeBtn?.addEventListener("click", () => close(false));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      close(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-visible")) {
      close(false);
    }
  });

  window.confirmAction = open;
  if (!window.getConfirmConfig) {
    window.getConfirmConfig = (key) => CONFIRM_ACTIONS[key];
  }
})();
