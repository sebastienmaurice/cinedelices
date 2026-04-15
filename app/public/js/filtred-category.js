/**
 * Filtrage des recettes par catégorie — dropdown custom
 * Redirige vers la page recipes-movie filtrée selon la catégorie sélectionnée.
 */
(function () {
  const wrap    = document.getElementById('ddFhCatWrap');
  const trigger = document.getElementById('ddFhCatTrigger');
  const panel   = document.getElementById('ddFhCatPanel');
  const labelEl = document.getElementById('ddFhCatLabel');
  const movieEl = document.getElementById('movie');
  const movieId = movieEl?.dataset.id;

  if (!wrap || !trigger || !panel || !movieId) return;

  function open()  { wrap.classList.add('is-open'); trigger.classList.add('is-open'); trigger.setAttribute('aria-expanded','true'); panel.setAttribute('aria-hidden','false'); }
  function close() { wrap.classList.remove('is-open'); trigger.classList.remove('is-open'); trigger.setAttribute('aria-expanded','false'); panel.setAttribute('aria-hidden','true'); }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    wrap.classList.contains('is-open') ? close() : open();
  });

  panel.querySelectorAll('.dropdown__item[data-value]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (labelEl) labelEl.textContent = btn.textContent.trim();
      panel.querySelectorAll('.dropdown__item').forEach(function (b) { b.classList.remove('dropdown__item--active'); });
      btn.classList.add('dropdown__item--active');
      close();
      window.location.href = '/recipes-movie/category/' + movieId + '/' + btn.dataset.value;
    });
  });

  document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
