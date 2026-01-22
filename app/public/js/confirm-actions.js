import { CONFIRM_ACTIONS } from "./confirm-actions.data.js";

window.CINE_CONFIRM_ACTIONS = CONFIRM_ACTIONS;
window.getConfirmConfig = (key) => CONFIRM_ACTIONS[key];
