/**
 * hero-slider.js — Hero slider home (classes hero__*)
 * Extrait du script inline de home.ejs
 */
(function(){
  const slides = document.querySelectorAll('.hero__slide');
  const dots   = document.querySelectorAll('.hero__dot');
  const hero   = document.getElementById('hero');
  if (!hero || !slides.length) return;
  let current = 0, timer = null, isTransitioning = false;
  const counterCur = document.getElementById('heroCounterCur');
  const counterTot = document.getElementById('heroCounterTot');
  if (counterTot) counterTot.textContent = String(slides.length).padStart(2, '0');

  /* Force dezoom sur un BG : met scale à 1.18 via inline, puis laisse le CSS prendre
     la main au frame suivant pour déclencher la transition */
  function triggerBgDezoom(bgEl) {
    if (!bgEl) return;
    bgEl.style.scale = '1.18';
    requestAnimationFrame(() => requestAnimationFrame(() => { bgEl.style.scale = ''; }));
  }

  function goTo(idx) {
    if (isTransitioning) return; isTransitioning = true;
    const prev = current;
    current = ((idx % slides.length) + slides.length) % slides.length;
    slides[prev].classList.remove('active'); dots[prev].classList.remove('active');
    /* Reset FG sortant */
    const pFg = document.getElementById('fg-' + prev);
    if (pFg) { pFg.style.transition = ''; pFg.style.transform = ''; }
    /* Reset BG sortant à 1.18 immédiatement (prêt pour prochain passage) */
    const pBg = document.getElementById('bg-' + prev);
    if (pBg) { pBg.style.scale = '1.18'; requestAnimationFrame(() => { if (pBg) pBg.style.scale = ''; }); }
    slides[current].classList.add('active'); dots[current].classList.add('active');
    dots.forEach((d, i) => d.setAttribute('aria-current', i === current ? 'true' : 'false'));
    if (counterCur) counterCur.textContent = String(current + 1).padStart(2, '0');
    /* Flash cinéma — bref éclat doré au moment de la coupe */
    const flash = document.querySelector('.hero__cut-flash');
    if (flash) { flash.classList.remove('flash'); void flash.offsetWidth; flash.classList.add('flash'); }
    /* Déclenche le dezoom du BG entrant */
    triggerBgDezoom(document.getElementById('bg-' + current));
    const cSlide = document.getElementById('slide-' + current);
    if (cSlide) {
      cSlide._entryDone = false;
      /* Passeport : retire le float, le remet après la fin de la transition d'entrée */
      setTimeout(() => { cSlide._entryDone = true; }, 1800);
    }
    setTimeout(() => isTransitioning = false, 950);
    resetTimer();
  }
  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 6000);
  }
  document.getElementById('heroNext')?.addEventListener('click', () => goTo(current + 1));
  document.getElementById('heroPrev')?.addEventListener('click', () => goTo(current - 1));
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.slide)));

  /* Navigation clavier (WCAG 2.1 SC 2.1.1) */
  hero.setAttribute('tabindex', '0');
  hero.setAttribute('role', 'region');
  hero.setAttribute('aria-label', 'Carrousel de slides — utilisez les touches fléchées');
  hero.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
  });

  /* aria-live sur le compteur (annonce le changement de slide) */
  if (counterCur) {
    counterCur.setAttribute('aria-live', 'polite');
    counterCur.setAttribute('aria-atomic', 'true');
  }

  /* aria-current initial */
  dots.forEach((d, i) => d.setAttribute('aria-current', i === 0 ? 'true' : 'false'));

  resetTimer();
  /* Initialisation slide-0 : JS ajoute active après un frame → transitions CSS naturelles */
  requestAnimationFrame(() => {
    slides[0].classList.add('active');
    dots[0].classList.add('active');
    setTimeout(() => { const s = document.getElementById('slide-0'); if (s) s._entryDone = true; }, 1800);
  });

  /* Parallaxe souris — désactivé si prefers-reduced-motion */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let mX = .5, mY = .5, lX = .5, lY = .5, rafId = null;
  hero.addEventListener('mousemove', e => {
    if (prefersReduced) return;
    const r = hero.getBoundingClientRect();
    mX = (e.clientX - r.left) / r.width;
    mY = (e.clientY - r.top) / r.height;
    if (!rafId) rafId = requestAnimationFrame(applyParallax);
  }, { passive: true });
  hero.addEventListener('mouseleave', () => {
    mX = .5; mY = .5;
    if (!rafId) rafId = requestAnimationFrame(applyParallax);
  }, { passive: true });
  function applyParallax() {
    rafId = null;
    const k = .07; lX += (mX - lX) * k; lY += (mY - lY) * k;
    const dx = lX - .5, dy = lY - .5;
    const bg = document.getElementById('bg-' + current);
    /* Translate uniquement — le scale reste géré par CSS (pas d'écrasement de transition) */
    if (bg) bg.style.translate = `${dx * -22}px ${dy * -14}px`;
    const fg = document.getElementById('fg-' + current);
    const sl = document.getElementById('slide-' + current);
    if (fg && sl && sl._entryDone) {
      fg.style.transition = 'transform .08s ease-out';
      fg.style.transform = `scale(1.08) translate(${dx * 35}px,${dy * 20}px)`;
    }
    if (Math.abs(mX - lX) > .001 || Math.abs(mY - lY) > .001) rafId = requestAnimationFrame(applyParallax);
  }
})();
