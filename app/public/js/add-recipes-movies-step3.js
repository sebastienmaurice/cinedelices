/**
 * add-recipes-movies-step3.js
 * Étape 03 "Ingrédients & préparation" — refonte "Velours & Projecteur".
 * Réimplémente la logique du prototype de référence (Ingredients Preparation
 * v3.dc.html) en JS vanilla, sur le contrat de soumission existant :
 * - #ingredients / #preparation (textarea JSON, format inchangé)
 * - stepPicture1..8 / stepNumber1..8 (inputs fixes, pilotés dynamiquement)
 */
(function () {
  "use strict";

  var ingList = document.getElementById("dcIngList");
  if (!ingList) return; // page sans étape 03 (garde-fou)

  function uid() { return "r" + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function escHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function iconUrl(name) { return "https://unpkg.com/lucide-static/icons/" + name + ".svg"; }

  /* ══════════════════════════════════════════════════════
     Réordonnancement générique — drag armé au mousedown sur
     la poignée uniquement (ne casse pas la sélection de texte)
  ══════════════════════════════════════════════════════ */
  function wireDrag(el, handle, getArr, onReordered) {
    handle.addEventListener("mousedown", function () { el.draggable = true; });
    // Désarme si le mousedown sur la poignée n'aboutit finalement pas à un
    // vrai glisser-déposer (simple clic, ou relâchement hors de la poignée) —
    // sans ce filet, la ligne restait "draggable" en permanence et Chrome se
    // mettait alors à intercepter les clics sur les champs qu'elle contient
    // (impossible de focaliser le textarea de description en dessous).
    document.addEventListener("mouseup", function () { el.draggable = false; });
    el.addEventListener("dragend", function () { el.draggable = false; el.classList.remove("is-dragging"); });
    el.addEventListener("dragstart", function (e) {
      e.stopPropagation();
      el.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.id);
    });
    el.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add("is-drag-over");
    });
    el.addEventListener("dragleave", function () { el.classList.remove("is-drag-over"); });
    el.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove("is-drag-over");
      var srcId = e.dataTransfer.getData("text/plain");
      var targetId = el.dataset.id;
      if (srcId === targetId) return;
      var arr = getArr();
      var srcIdx = -1, tgtIdx = -1;
      arr.forEach(function (x, i) { if (x.id === srcId) srcIdx = i; if (x.id === targetId) tgtIdx = i; });
      if (srcIdx < 0 || tgtIdx < 0) return;
      var moved = arr.splice(srcIdx, 1)[0];
      arr.splice(tgtIdx, 0, moved);
      onReordered();
    });
  }

  /* ══════════════════════════════════════════════════════
     1 · INGRÉDIENTS — liste à plat + titre de groupe optionnel
  ══════════════════════════════════════════════════════ */
  var ING_ICONS = [
    ["carrot", "Carotte"], ["wheat", "Farine · Blé"], ["milk", "Lait"], ["egg", "Œuf"], ["egg-fried", "Œuf au plat"],
    ["beef", "Bœuf"], ["ham", "Jambon"], ["drumstick", "Volaille"], ["fish", "Poisson"], ["shell", "Fruits de mer"],
    ["apple", "Pomme"], ["banana", "Banane"], ["cherry", "Cerise"], ["grape", "Raisin"], ["citrus", "Agrume"],
    ["salad", "Salade"], ["leafy-green", "Légume vert"], ["bean", "Haricot"], ["nut-off", "Fruit à coque"], ["sprout", "Végétal"],
    ["croissant", "Beurre · Viennoiserie"], ["cookie", "Biscuit"], ["cake-slice", "Gâteau"], ["candy", "Bonbon"], ["ice-cream-cone", "Dessert glacé"],
    ["coffee", "Café"], ["wine", "Vin"], ["beer", "Bière"], ["cup-soda", "Boisson"], ["soup", "Bouillon"],
    ["cooking-pot", "Cuisson"], ["utensils", "Ustensile"], ["pizza", "Pizza"], ["sandwich", "Sandwich"], ["popcorn", "Pop-corn"],
    ["flame", "Épices · Piment"], ["droplet", "Huile · Liquide"], ["droplets", "Eau"], ["snowflake", "Surgelé"],
    ["circle-dot", "Pincée"], ["scale", "Poids"], ["sparkles", "Sucre · Vanille"], ["package", "Autre"],
  ];
  var ING_UNITS = ["g", "kg", "mg", "ml", "cl", "l", "c. à café", "c. à soupe", "pincée", "pièce", "gousse", "botte", "tranche", "sachet", "au goût"];
  var UNIT_PLURALS = { "pincée": "pincées", "pièce": "pièces", "gousse": "gousses", "botte": "bottes", "tranche": "tranches", "sachet": "sachets" };

  var ingGroupTitleEl = document.getElementById("dcIngGroupTitle");
  var ingAddBtn = document.getElementById("dcIngAddBtn");
  var ingFooter = document.getElementById("dcIngFooter");

  function newIngredient() { return { id: uid(), icon: "utensils", name: "", qty: "", unit: "g" }; }
  var ingredientsState = [newIngredient()];
  var iconPickerFor = null; // id of the ingredient currently showing its picker
  var iconQuery = "";

  function buildIngredientString(ing) {
    var name = (ing.name || "").trim();
    if (!name) return "";
    var qty = (ing.qty || "").trim();
    var unit = ing.unit || "";
    var unitLabel = unit;
    if (unit && UNIT_PLURALS[unit]) {
      var n = parseFloat(qty.replace(",", "."));
      if (!isNaN(n) && n > 1) unitLabel = UNIT_PLURALS[unit];
    }
    var head = [qty, unit === "au goût" ? "" : unitLabel].filter(Boolean).join(" ");
    var line = head ? head + " " + name : name;
    if (unit === "au goût") line = name + " (au goût)";
    return line;
  }

  function serializeIngredients() {
    var groupTitle = (ingGroupTitleEl.value || "").trim();
    var itemStrings = ingredientsState.map(buildIngredientString).filter(Boolean);
    var arr = [];
    if (groupTitle && itemStrings.length) arr.push('<h3 class="rd-ing-group-title">' + escHtml(groupTitle) + "</h3>");
    itemStrings.forEach(function (s) { arr.push(s); });
    var ta = document.getElementById("ingredients");
    if (ta) ta.value = JSON.stringify(arr);
    if (ingFooter) ingFooter.textContent = itemStrings.length + " ingrédient(s) dans la liste";
    window.armIngredientsCount = itemStrings.length;
    updateBandCounters();
    if (window.checkS3) window.checkS3();
    return arr;
  }
  if (ingGroupTitleEl) ingGroupTitleEl.addEventListener("input", serializeIngredients);

  function closeIconPicker() {
    var open = document.querySelector(".dc-icon-picker");
    if (open) open.remove();
    iconPickerFor = null;
    document.removeEventListener("mousedown", onDocClickClosePicker, true);
  }
  function onDocClickClosePicker(e) {
    var picker = document.querySelector(".dc-icon-picker");
    if (picker && !picker.contains(e.target) && !e.target.closest(".dc-ing-icon-btn")) closeIconPicker();
  }
  function openIconPicker(anchorBtn, ing) {
    closeIconPicker();
    iconPickerFor = ing.id;
    iconQuery = "";
    var pop = document.createElement("div");
    pop.className = "dc-icon-picker";
    pop.innerHTML =
      '<div class="dc-icon-picker__search"><i data-lucide="search" width="14" height="14" stroke-width="2"></i>' +
      '<input type="text" placeholder="Rechercher (carotte, farine, sel…)" /></div>' +
      '<div class="dc-icon-picker__grid"></div>';
    document.body.appendChild(pop);
    var rect = anchorBtn.getBoundingClientRect();
    pop.style.top = window.scrollY + rect.bottom + 6 + "px";
    pop.style.left = window.scrollX + rect.left + "px";

    var searchInput = pop.querySelector("input");
    var grid = pop.querySelector(".dc-icon-picker__grid");
    function renderGrid() {
      var q = iconQuery.trim().toLowerCase();
      var opts = ING_ICONS.filter(function (o) { return !q || o[0].includes(q) || o[1].toLowerCase().includes(q); });
      grid.innerHTML = opts.map(function (o) {
        return '<button type="button" class="dc-icon-picker__opt' + (o[0] === ing.icon ? " is-selected" : "") + '" title="' + escHtml(o[1]) + '" data-icon="' + o[0] + '">' +
          '<i data-lucide="' + o[0] + '" width="17" height="17" stroke-width="1.8"></i></button>';
      }).join("");
      if (window.lucide) lucide.createIcons();
      grid.querySelectorAll("[data-icon]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          ing.icon = btn.dataset.icon;
          closeIconPicker();
          renderIngredients();
        });
      });
    }
    searchInput.addEventListener("input", function () { iconQuery = searchInput.value; renderGrid(); });
    renderGrid();
    searchInput.focus();
    if (window.lucide) lucide.createIcons();
    setTimeout(function () { document.addEventListener("mousedown", onDocClickClosePicker, true); }, 0);
  }

  function buildIngredientRow(ing) {
    var row = document.createElement("div");
    row.className = "dc-ing-row";
    row.dataset.id = ing.id;

    var drag = document.createElement("button");
    drag.type = "button"; drag.className = "dc-drag-handle"; drag.setAttribute("aria-label", "Réorganiser");
    drag.innerHTML = '<i data-lucide="grip-vertical" width="15" height="15" stroke-width="2"></i>';

    var iconBtn = document.createElement("button");
    iconBtn.type = "button"; iconBtn.className = "dc-ing-icon-btn"; iconBtn.setAttribute("aria-label", "Choisir une icône");
    iconBtn.innerHTML = '<i data-lucide="' + ing.icon + '" width="19" height="19" stroke-width="1.8"></i><span class="dc-ing-icon-chevron"><i data-lucide="chevron-down" width="8" height="8" stroke-width="3"></i></span>';
    iconBtn.addEventListener("click", function (e) { e.stopPropagation(); openIconPicker(iconBtn, ing); });

    var nameInput = document.createElement("input");
    nameInput.type = "text"; nameInput.className = "dc-ing-name"; nameInput.placeholder = "Nom de l’ingrédient";
    nameInput.value = ing.name;
    nameInput.addEventListener("input", function () { ing.name = nameInput.value; serializeIngredients(); });
    nameInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addIngredient(); } });

    var qtyUnit = document.createElement("div");
    qtyUnit.className = "dc-ing-qtyunit";
    var qtyInput = document.createElement("input");
    qtyInput.type = "text"; qtyInput.className = "dc-ing-qty"; qtyInput.placeholder = "0"; qtyInput.inputMode = "decimal";
    qtyInput.value = ing.qty;
    qtyInput.addEventListener("input", function () { ing.qty = qtyInput.value; serializeIngredients(); });
    qtyInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addIngredient(); } });
    var sep = document.createElement("span"); sep.className = "dc-ing-sep";
    var unitSelect = document.createElement("select");
    unitSelect.className = "dc-ing-unit";
    ING_UNITS.forEach(function (u) {
      var o = document.createElement("option"); o.value = u; o.textContent = u;
      unitSelect.appendChild(o);
    });
    unitSelect.value = ing.unit;
    unitSelect.addEventListener("change", function () { ing.unit = unitSelect.value; serializeIngredients(); });
    qtyUnit.appendChild(qtyInput);
    qtyUnit.appendChild(sep);
    qtyUnit.appendChild(unitSelect);

    var delBtn = document.createElement("button");
    delBtn.type = "button"; delBtn.className = "dc-del-btn"; delBtn.setAttribute("aria-label", "Supprimer cet ingrédient");
    delBtn.innerHTML = '<i data-lucide="trash-2" width="16" height="16" stroke-width="2"></i>';
    delBtn.addEventListener("click", function () {
      ingredientsState = ingredientsState.length > 1 ? ingredientsState.filter(function (x) { return x.id !== ing.id; }) : [newIngredient()];
      closeIconPicker();
      renderIngredients();
    });

    row.appendChild(drag);
    row.appendChild(iconBtn);
    row.appendChild(nameInput);
    row.appendChild(qtyUnit);
    row.appendChild(delBtn);

    wireDrag(row, drag, function () { return ingredientsState; }, renderIngredients);
    return row;
  }

  function renderIngredients() {
    ingList.innerHTML = "";
    ingredientsState.forEach(function (ing) { ingList.appendChild(buildIngredientRow(ing)); });
    if (window.lucide) lucide.createIcons();
    serializeIngredients();
  }
  function addIngredient() {
    ingredientsState.push(newIngredient());
    renderIngredients();
    var inputs = ingList.querySelectorAll(".dc-ing-name");
    var last = inputs[inputs.length - 1];
    if (last) last.focus();
  }
  if (ingAddBtn) ingAddBtn.addEventListener("click", addIngredient);
  renderIngredients();

  /* ══════════════════════════════════════════════════════
     2 · PHOTOS — array dynamique, projeté sur les 8 slots fixes
  ══════════════════════════════════════════════════════ */
  var PHOTO_MAX = 8;
  var photoList = document.getElementById("dcPhotoList");
  var photoAddBtn = document.getElementById("dcPhotoAddBtn");
  var photoFooter = document.getElementById("dcPhotoFooter");

  function newPhoto(stepNum) { return { id: uid(), step: String(stepNum), file: null, previewUrl: null }; }
  var photosState = [newPhoto(1), newPhoto(2)];

  function slotInputs(n) {
    return {
      file: document.getElementById("stepPictureInput" + n),
      step: document.getElementById("stepNumber" + n),
    };
  }
  /* Projette photosState[0..7] sur les 8 <input> fixes stepPictureN/stepNumberN */
  function syncPhotoSlots() {
    for (var i = 1; i <= PHOTO_MAX; i++) {
      var slot = slotInputs(i);
      if (!slot.file) continue;
      var ph = photosState[i - 1];
      if (ph && ph.file) {
        var dt = new DataTransfer();
        dt.items.add(ph.file);
        slot.file.files = dt.files;
        slot.step.value = ph.step || i;
      } else {
        slot.file.value = "";
        slot.step.value = i;
      }
    }
    var filled = photosState.filter(function (p) { return !!p.file; }).length;
    if (photoFooter) photoFooter.textContent = photosState.length + " / " + PHOTO_MAX + " emplacements";
    window.armPhotosCount = filled;
    window.armPhotosMax = PHOTO_MAX;
    updateBandCounters();
  }

  function buildPhotoRow(ph, idx) {
    var row = document.createElement("div");
    row.className = "dc-photo-row";
    row.dataset.id = ph.id;

    var head = document.createElement("div");
    head.className = "dc-photo-row__head";
    var drag = document.createElement("button");
    drag.type = "button"; drag.className = "dc-drag-handle dc-drag-handle--sm"; drag.setAttribute("aria-label", "Réorganiser");
    drag.innerHTML = '<i data-lucide="grip-vertical" width="14" height="14" stroke-width="2"></i>';
    var pos = document.createElement("span");
    pos.className = "dc-photo-pos";
    pos.textContent = String(idx + 1).padStart(2, "0");
    var spacer = document.createElement("div");
    spacer.style.flex = "1";
    var stepPill = document.createElement("div");
    stepPill.className = "dc-photo-step-pill";
    stepPill.innerHTML = '<span>Étape</span>';
    var stepInput = document.createElement("input");
    stepInput.type = "number"; stepInput.className = "dc-photo-step-input"; stepInput.placeholder = "—";
    stepInput.value = ph.step;
    stepInput.addEventListener("click", function (e) { e.stopPropagation(); });
    stepInput.addEventListener("input", function () { ph.step = stepInput.value; syncPhotoSlots(); });
    stepPill.appendChild(stepInput);
    var removeBtn = document.createElement("button");
    removeBtn.type = "button"; removeBtn.className = "dc-photo-remove"; removeBtn.setAttribute("aria-label", "Retirer");
    removeBtn.innerHTML = '<i data-lucide="x" width="13" height="13" stroke-width="2.2"></i>';
    removeBtn.addEventListener("click", function () {
      photosState = photosState.filter(function (x) { return x.id !== ph.id; });
      if (photosState.length < 2) photosState.push(newPhoto(photosState.length + 1));
      renderPhotos();
    });
    head.appendChild(drag);
    head.appendChild(pos);
    head.appendChild(spacer);
    head.appendChild(stepPill);
    head.appendChild(removeBtn);

    var drop = document.createElement("label");
    drop.className = "dc-photo-drop";
    if (ph.previewUrl) {
      drop.classList.add("has-image");
      drop.innerHTML = '<img src="' + ph.previewUrl + '" alt="" />';
    } else {
      drop.innerHTML =
        '<i data-lucide="image-plus" width="24" height="24" stroke-width="1.4"></i>' +
        '<span>Glisser ou choisir</span>';
    }
    var fileInput = document.createElement("input");
    fileInput.type = "file"; fileInput.accept = "image/jpeg,image/jpg,image/png,image/webp";
    fileInput.addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var ok = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!ok.includes(f.type)) { alert("Format non supporté. Utilisez JPG, PNG ou WEBP."); fileInput.value = ""; return; }
      if (f.size > 8 * 1024 * 1024) { alert("Fichier trop volumineux (max 8 Mo par photo)."); fileInput.value = ""; return; }
      ph.file = f;
      var reader = new FileReader();
      reader.onload = function (ev) { ph.previewUrl = ev.target.result; renderPhotos(); };
      reader.readAsDataURL(f);
    });
    drop.appendChild(fileInput);

    row.appendChild(head);
    row.appendChild(drop);
    wireDrag(row, drag, function () { return photosState; }, renderPhotos);
    return row;
  }

  function renderPhotos() {
    photoList.innerHTML = "";
    photosState.forEach(function (ph, i) { photoList.appendChild(buildPhotoRow(ph, i)); });
    if (window.lucide) lucide.createIcons();
    if (photoAddBtn) photoAddBtn.style.display = photosState.length >= PHOTO_MAX ? "none" : "";
    syncPhotoSlots();
  }
  if (photoAddBtn) {
    photoAddBtn.addEventListener("click", function () {
      if (photosState.length >= PHOTO_MAX) return;
      photosState.push(newPhoto(photosState.length + 1));
      renderPhotos();
    });
  }
  renderPhotos();

  /* ══════════════════════════════════════════════════════
     3 · PRÉPARATION — étapes + descriptions multiples
  ══════════════════════════════════════════════════════ */
  var STEP_TYPES = ["Préparation", "Cuisson", "Repos", "Dressage", "Service"];
  var stepList = document.getElementById("dcStepList");
  var stepAddBtn = document.getElementById("dcStepAddBtn");
  var prepLineCountEl = document.getElementById("dcPrepLineCount");
  var prepFooterLeft = document.getElementById("dcPrepFooterLeft");
  var prepFooterRight = document.getElementById("dcPrepFooterRight");

  function newLine() { return { id: uid(), text: "" }; }
  function newStep() { return { id: uid(), title: "", type: "Préparation", min: "", lines: [newLine()] }; }
  var preparationState = [newStep()];

  function buildStepString(step) {
    var title = (step.title || "").trim();
    var type = step.type && step.type !== "Préparation" ? step.type.toLowerCase() : (step.type ? "preparation" : "");
    // Normalise le type vers les valeurs déjà utilisées côté affichage (recipe-detail.ejs)
    var typeMap = { "préparation": "preparation", "cuisson": "cuisson", "repos": "repos", "dressage": "dressage", "service": "service" };
    var typeVal = typeMap[(step.type || "").toLowerCase()] || "";
    var duration = (step.min || "").toString().trim();
    var bodyLines = step.lines.map(function (l) { return escHtml((l.text || "").trim()); }).filter(Boolean);
    var body = bodyLines.join("<br>");
    if (!title && !typeVal && !duration && !body) return "";
    var needsStrong = title || typeVal || duration;
    if (!needsStrong) return body;
    var attrs = [];
    if (typeVal) attrs.push('data-type="' + typeVal + '"');
    if (duration) attrs.push('data-duration="' + duration + '"');
    return "<strong" + (attrs.length ? " " + attrs.join(" ") : "") + ">" + escHtml(title) + "</strong>" + (body ? "<br>" + body : "");
  }

  function serializePreparation() {
    var arr = preparationState.map(buildStepString).filter(Boolean);
    var ta = document.getElementById("preparation");
    if (ta) ta.value = JSON.stringify(arr);
    var lineCount = preparationState.reduce(function (n, s) { return n + s.lines.length; }, 0);
    var totalMin = preparationState.reduce(function (n, s) { return n + (parseInt(s.min, 10) || 0); }, 0);
    if (prepLineCountEl) prepLineCountEl.textContent = lineCount + " description(s)";
    if (prepFooterLeft) prepFooterLeft.textContent = preparationState.length + " étape(s) · " + lineCount + " description(s)";
    if (prepFooterRight) prepFooterRight.textContent = "Temps total " + totalMin + " min";
    window.armPreparationCount = arr.length;
    window.armPreparationTotalMin = totalMin;
    updateBandCounters();
    if (window.checkS3) window.checkS3();
    return arr;
  }

  function buildLineRow(step, line, stepIdx, lineIdx) {
    var row = document.createElement("div");
    row.className = "dc-step-line";
    row.dataset.id = line.id;

    var drag = document.createElement("button");
    drag.type = "button"; drag.className = "dc-drag-handle dc-drag-handle--sm"; drag.setAttribute("aria-label", "Réorganiser cette description");
    drag.innerHTML = '<i data-lucide="grip-vertical" width="13" height="13" stroke-width="2"></i>';

    var box = document.createElement("div");
    box.className = "dc-step-line__box";
    var num = document.createElement("span");
    num.className = "dc-step-line__num";
    num.textContent = (stepIdx + 1) + "." + (lineIdx + 1);
    var textarea = document.createElement("textarea");
    textarea.className = "dc-step-line__text";
    textarea.placeholder = "Décrivez cette partie de l’étape…";
    textarea.rows = 2;
    textarea.value = line.text;
    function autoGrow() { textarea.style.height = "auto"; textarea.style.height = (textarea.scrollHeight + 2) + "px"; }
    textarea.addEventListener("input", function () { line.text = textarea.value; autoGrow(); serializePreparation(); });
    box.appendChild(num);
    box.appendChild(textarea);

    var delBtn = document.createElement("button");
    delBtn.type = "button"; delBtn.className = "dc-del-btn dc-del-btn--sm"; delBtn.setAttribute("aria-label", "Supprimer cette description");
    delBtn.innerHTML = '<i data-lucide="x" width="13" height="13" stroke-width="2.2"></i>';
    delBtn.addEventListener("click", function () {
      step.lines = step.lines.length > 1 ? step.lines.filter(function (l) { return l.id !== line.id; }) : [newLine()];
      renderPreparation();
    });

    row.appendChild(drag);
    row.appendChild(box);
    row.appendChild(delBtn);
    setTimeout(autoGrow, 0);
    wireDrag(row, drag, function () { return step.lines; }, renderPreparation);
    return row;
  }

  function buildStepCard(step, idx) {
    var card = document.createElement("div");
    card.className = "dc-step-card";
    card.dataset.id = step.id;

    var head = document.createElement("div");
    head.className = "dc-step-card__head";

    var drag = document.createElement("button");
    drag.type = "button"; drag.className = "dc-drag-handle"; drag.setAttribute("aria-label", "Réorganiser cette étape");
    drag.innerHTML = '<i data-lucide="grip-vertical" width="15" height="15" stroke-width="2"></i>';

    var bubble = document.createElement("div");
    bubble.className = "dc-step-card__num";
    bubble.textContent = String(idx + 1).padStart(2, "0");

    var titleInput = document.createElement("input");
    titleInput.type = "text"; titleInput.className = "dc-step-card__title";
    titleInput.placeholder = "Titre de l’étape (ex. Préparer la pâte)";
    titleInput.value = step.title;
    titleInput.addEventListener("input", function () { step.title = titleInput.value; serializePreparation(); });

    var typeSelect = document.createElement("select");
    typeSelect.className = "dc-step-card__type";
    STEP_TYPES.forEach(function (t) {
      var o = document.createElement("option"); o.value = t; o.textContent = t;
      typeSelect.appendChild(o);
    });
    typeSelect.value = step.type;
    typeSelect.addEventListener("change", function () { step.type = typeSelect.value; serializePreparation(); });

    var timing = document.createElement("div");
    timing.className = "dc-step-card__timing";
    timing.innerHTML = '<i data-lucide="clock" width="13" height="13" stroke-width="1.8"></i>';
    var minInput = document.createElement("input");
    minInput.type = "text"; minInput.inputMode = "numeric"; minInput.placeholder = "0";
    minInput.value = step.min;
    minInput.addEventListener("input", function () { step.min = minInput.value.replace(/[^0-9]/g, ""); minInput.value = step.min; serializePreparation(); });
    var minLabel = document.createElement("span"); minLabel.textContent = "min";
    timing.appendChild(minInput);
    timing.appendChild(minLabel);

    var delBtn = document.createElement("button");
    delBtn.type = "button"; delBtn.className = "dc-del-btn dc-del-btn--outline"; delBtn.setAttribute("aria-label", "Supprimer l’étape");
    delBtn.innerHTML = '<i data-lucide="trash-2" width="15" height="15" stroke-width="2"></i>';
    delBtn.addEventListener("click", function () {
      preparationState = preparationState.length > 1 ? preparationState.filter(function (s) { return s.id !== step.id; }) : [newStep()];
      renderPreparation();
    });

    head.appendChild(drag);
    head.appendChild(bubble);
    head.appendChild(titleInput);
    head.appendChild(typeSelect);
    head.appendChild(timing);
    head.appendChild(delBtn);

    var linesWrap = document.createElement("div");
    linesWrap.className = "dc-step-lines";
    step.lines.forEach(function (line, li) { linesWrap.appendChild(buildLineRow(step, line, idx, li)); });

    var addLineBtn = document.createElement("button");
    addLineBtn.type = "button"; addLineBtn.className = "dc-add-btn dc-add-btn--gold dc-add-btn--sm";
    addLineBtn.innerHTML = '<i data-lucide="plus" width="13" height="13" stroke-width="2.2"></i>Ajouter une description';
    addLineBtn.addEventListener("click", function () {
      step.lines.push(newLine());
      renderPreparation();
      var textareas = card.querySelectorAll(".dc-step-line__text");
      var last = textareas[textareas.length - 1];
      if (last) last.focus();
    });
    linesWrap.appendChild(addLineBtn);

    card.appendChild(head);
    card.appendChild(linesWrap);
    wireDrag(card, drag, function () { return preparationState; }, renderPreparation);
    return card;
  }

  function renderPreparation() {
    stepList.innerHTML = "";
    preparationState.forEach(function (step, i) { stepList.appendChild(buildStepCard(step, i)); });
    if (window.lucide) lucide.createIcons();
    serializePreparation();
  }
  if (stepAddBtn) {
    stepAddBtn.addEventListener("click", function () {
      preparationState.push(newStep());
      renderPreparation();
      var titleInputs = stepList.querySelectorAll(".dc-step-card__title");
      var last = titleInputs[titleInputs.length - 1];
      if (last) last.focus();
    });
  }
  renderPreparation();

  /* ══════════════════════════════════════════════════════
     Compteurs du bandeau (visibles à l'étape 03 uniquement)
  ══════════════════════════════════════════════════════ */
  function updateBandCounters() {
    var ing = document.getElementById("dcCountIng");
    var photos = document.getElementById("dcCountPhotos");
    var steps = document.getElementById("dcCountSteps");
    var mins = document.getElementById("dcCountMin");
    if (ing) ing.textContent = window.armIngredientsCount || 0;
    if (photos) photos.textContent = (window.armPhotosCount || 0) + "/" + (window.armPhotosMax || 8);
    if (steps) steps.textContent = (typeof preparationState !== "undefined" && preparationState) ? preparationState.length : 0;
    if (mins) mins.textContent = window.armPreparationTotalMin || 0;
  }
  updateBandCounters();
})();
