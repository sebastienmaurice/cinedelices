/**
 * rte-mini.js
 * Éditeur riche léger (contenteditable) partagé — modal admin et profil utilisateur.
 * Exposition globale : window.RteMini
 */
(function (global) {
  'use strict';

  /* ── Extraction du titre d'une étape (client-side mirror du helper serveur) ── */
  function extractStepTitle(html) {
    var m = html.match(/^<strong>([\s\S]*?)<\/strong>([\s\S]*)$/i);
    if (!m) return { title: '', body: html };
    var title = m[1].replace(/^\d+[\s.]*[-–—]?\s*/, '').trim();
    var body = m[2]
      .replace(/^(<br\s*\/?>\s*)+/i, '')
      .replace(/^\s*[-–—]\s*/, '')
      .trim();
    return { title: title, body: body || m[2].trim() };
  }

  /* ── Sérialisation (contenteditable → tableau JSON) ──────────────────
     mode 'ingredients' : chaque bloc de haut niveau → 1 item
                          <h3> → item titre de groupe
     mode 'preparation' : blocs entre séparateurs .rte-mini-sep → 1 item (jointure <br>)
                          Le titre saisi dans chaque séparateur est préfixé en <strong>
                          <ul>/<ol> → outerHTML conservé pour le rendu côté template
  ─────────────────────────────────────────────────────────────────────── */
  function rteToJson(rte, mode) {
    var items = [];
    var group = [];
    var pendingTitle = '';

    function flushGroup() {
      var cleaned = group.filter(function (s) {
        return s.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim().length > 0;
      });
      var t = cleaned.join('<br>').replace(/(<br>\s*)+$/, '').trim();
      if (t || pendingTitle) {
        var item = pendingTitle
          ? '<strong>' + pendingTitle + '</strong>' + (t ? '<br>' + t : '')
          : t;
        if (item) items.push(item);
        pendingTitle = '';
      }
      group = [];
    }

    [].slice.call(rte.childNodes).forEach(function (node) {
      // Séparateur d'étape → délimite le groupe préparation en cours + capture le titre
      if (node.nodeType === 1 && node.classList && node.classList.contains('rte-mini-sep')) {
        if (mode === 'preparation') {
          flushGroup();
          var titleInput = node.querySelector('.rte-mini-sep__title');
          pendingTitle = titleInput ? titleInput.value.trim() : '';
        }
        return;
      }
      // Éléments non-éditables → ignorer
      if (node.nodeType === 1 && node.getAttribute('contenteditable') === 'false') return;

      var tag = (node.tagName || '').toLowerCase();
      var html = (node.innerHTML !== undefined ? node.innerHTML : node.textContent || '').trim();
      var textContent = (node.textContent || '').trim();

      // Blocs visuellement vides → ignorer
      if (!textContent) return;

      // Titre <h3>
      if (tag === 'h3') {
        if (mode === 'ingredients') items.push('<h3 class="rd-ing-group-title">' + textContent + '</h3>');
        // En préparation, le h3 est rare, on le traite comme un bloc texte
        else group.push('<strong>' + textContent + '</strong>');
        return;
      }

      // Listes <ul>/<ol>
      if (tag === 'ul' || tag === 'ol') {
        if (mode === 'ingredients') {
          // Chaque <li> → un ingrédient distinct
          [].slice.call(node.children).forEach(function (li) {
            var liHtml = li.innerHTML.trim();
            var liText = (li.textContent || '').trim();
            if (liText) items.push(liHtml);
          });
        } else {
          // Préparation : conserver la liste entière pour le rendu HTML
          group.push(node.outerHTML);
        }
        return;
      }

      // Bloc normal (p, div…) : HTML inline conservé
      if (mode === 'ingredients') items.push(html);
      else group.push(html);
    });

    if (mode === 'preparation') flushGroup();
    return items;
  }

  /* ── Désérialisation (tableau JSON → contenteditable) ────────────── */
  function loadIntoRte(rte, items, mode) {
    rte.innerHTML = '';

    function emptyP() {
      var p = document.createElement('p');
      p.appendChild(document.createElement('br'));
      return p;
    }

    if (!items || !items.length) {
      rte.appendChild(emptyP());
      return;
    }

    if (mode === 'ingredients') {
      items.forEach(function (item) {
        var s = String(item);
        var titleMatch = s.match(/^<h3[^>]*>(.*?)<\/h3>$/i);
        if (titleMatch) {
          var h3 = document.createElement('h3');
          h3.textContent = titleMatch[1];
          rte.appendChild(h3);
        } else {
          var tmp = document.createElement('div');
          tmp.innerHTML = s;
          // Contenu inline uniquement → enrober dans <p>
          if (!tmp.querySelector('ul,ol,h3,p,div')) {
            var p = document.createElement('p');
            p.innerHTML = s || '<br>';
            rte.appendChild(p);
          } else {
            while (tmp.firstChild) rte.appendChild(tmp.firstChild);
          }
        }
      });
    } else {
      // Préparation : chaque item = 1 étape, séparé par un séparateur visuel
      items.forEach(function (step, idx) {
        var s = String(step);
        var extracted = extractStepTitle(s);
        // Séparateur AVANT chaque étape sauf la première, avec son titre extrait
        if (idx > 0) {
          rte.appendChild(makeSepEl(idx + 1, extracted.title));
        }
        var stepHtml = extracted.body || s;
        var tmp = document.createElement('div');
        var html = stepHtml.replace(/<br\s*\/?>/gi, '</p><p>');
        tmp.innerHTML = '<p>' + html + '</p>';
        [].slice.call(tmp.querySelectorAll('p')).forEach(function (p) {
          if (!p.textContent.trim() && !p.querySelector('ul,ol')) p.remove();
        });
        if (!tmp.childNodes.length) tmp.appendChild(emptyP());
        while (tmp.firstChild) rte.appendChild(tmp.firstChild);
      });
      // Paragraphe vide final pour le curseur
      rte.appendChild(emptyP());
    }
  }

  /* ── Séparateur d'étape ──────────────────────────────────────────── */
  function makeSepEl(num, title) {
    var sep = document.createElement('div');
    sep.className = 'rte-mini-sep';
    sep.setAttribute('contenteditable', 'false');

    var label = document.createElement('span');
    label.className = 'rte-mini-sep__label';
    label.textContent = 'Étape ' + num + ' —';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'rte-mini-sep__title';
    input.placeholder = 'titre de l\'étape (optionnel)';
    if (title) input.value = title;

    var del = document.createElement('button');
    del.className = 'rte-mini-sep__del';
    del.type = 'button';
    del.setAttribute('aria-label', 'Supprimer ce séparateur');
    del.innerHTML = '&#x2715;';

    sep.appendChild(label);
    sep.appendChild(input);
    sep.appendChild(del);
    return sep;
  }

  function renumberStepSeps(rte) {
    [].slice.call(rte.querySelectorAll('.rte-mini-sep')).forEach(function (sep, idx) {
      var lbl = sep.querySelector('.rte-mini-sep__label');
      if (lbl) lbl.textContent = 'Étape ' + (idx + 2) + ' —';
    });
  }

  function insertSeparator(rte) {
    var stepNum = rte.querySelectorAll('.rte-mini-sep').length + 2;
    var sep = makeSepEl(stepNum);

    var sel = window.getSelection();
    var anchor = null;
    if (sel && sel.rangeCount) {
      var node = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node.parentNode !== rte) node = node.parentNode;
      if (node && node.parentNode === rte) anchor = node;
    }

    rte.insertBefore(sep, anchor ? anchor.nextSibling : null);

    var newP = document.createElement('p');
    newP.appendChild(document.createElement('br'));
    rte.insertBefore(newP, sep.nextSibling);

    var range = document.createRange();
    range.setStart(newP, 0);
    range.collapse(true);
    sel.removeAllRanges();
    try { sel.addRange(range); } catch (_) {}
  }

  /* ── Sync état actif des boutons toolbar ─────────────────────────── */
  function syncActive(tb) {
    [].slice.call(tb.querySelectorAll('[data-cmd]')).forEach(function (btn) {
      var cmd = btn.dataset.cmd;
      var active = false;
      try {
        if      (cmd === 'bold')       active = document.queryCommandState('bold');
        else if (cmd === 'italic')     active = document.queryCommandState('italic');
        else if (cmd === 'heading')    active = document.queryCommandValue('formatBlock').toLowerCase() === 'h3';
        else if (cmd === 'bulletList') active = document.queryCommandState('insertUnorderedList');
      } catch (_) {}
      btn.classList.toggle('is-active', active);
    });
  }

  /* ── initEditor : câble toolbar + events sur un éditeur ─────────── */
  // cfg : { rteEl, tbEl, mode, onUpdate? }
  function initEditor(cfg) {
    var rte = cfg.rteEl;
    var tb  = cfg.tbEl;
    var mode = cfg.mode;
    var onUpdate = cfg.onUpdate || function () {};

    function refresh() {
      if (mode === 'preparation') renumberStepSeps(rte);
      syncActive(tb);
      onUpdate(rteToJson(rte, mode));
    }

    // Suppression d'un séparateur via le bouton ✕
    rte.addEventListener('click', function (e) {
      var delBtn = e.target.closest('.rte-mini-sep__del');
      if (!delBtn) return;
      var sep = delBtn.closest('.rte-mini-sep');
      if (sep) { sep.remove(); renumberStepSeps(rte); refresh(); }
    });

    // Coller en texte brut uniquement
    rte.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (!text) return;
      document.execCommand('insertText', false, text);
      refresh();
    });

    rte.addEventListener('input',   refresh);
    rte.addEventListener('keyup',   function () { syncActive(tb); });
    rte.addEventListener('mouseup', function () { syncActive(tb); });

    // Ctrl+Enter (préparation) → insérer séparateur d'étape
    if (mode === 'preparation') {
      rte.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          insertSeparator(rte);
          refresh();
        }
      });
    }

    // Toolbar — mousedown pour ne pas perdre le focus de l'éditeur
    tb.addEventListener('mousedown', function (e) {
      e.preventDefault();
      var btn = e.target.closest('[data-cmd]');
      if (!btn) return;
      var cmd = btn.dataset.cmd;
      rte.focus();
      if      (cmd === 'bold')       document.execCommand('bold');
      else if (cmd === 'italic')     document.execCommand('italic');
      else if (cmd === 'heading') {
        var cur = document.queryCommandValue('formatBlock').toLowerCase();
        document.execCommand('formatBlock', false, cur === 'h3' ? 'p' : 'h3');
      }
      else if (cmd === 'bulletList') document.execCommand('insertUnorderedList');
      else if (cmd === 'separator')  { insertSeparator(rte); }
      refresh();
    });
  }

  /* ── API publique ─────────────────────────────────────────────────── */
  global.RteMini = {
    rteToJson:         rteToJson,
    loadIntoRte:       loadIntoRte,
    makeSepEl:         makeSepEl,
    renumberStepSeps:  renumberStepSeps,
    insertSeparator:   insertSeparator,
    syncActive:        syncActive,
    initEditor:        initEditor,
  };

})(window);
