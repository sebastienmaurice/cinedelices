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
      if (current === 0) {
        const fg0 = document.getElementById('fg-0');
        if (fg0) fg0.classList.remove('passport-floating');
        setTimeout(() => { if (fg0) fg0.classList.add('passport-floating'); cSlide._entryDone = true; }, 2000);
      } else {
        setTimeout(() => { cSlide._entryDone = true; }, 1800);
      }
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
  resetTimer();
  /* Initialisation slide-0 : JS ajoute active après un frame → toutes les transitions CSS se déclenchent */
  requestAnimationFrame(() => {
    slides[0].classList.add('active');
    dots[0].classList.add('active');
    setTimeout(() => {
      const s   = document.getElementById('slide-0'); if (s) s._entryDone = true;
      const fg0 = document.getElementById('fg-0');   if (fg0) fg0.classList.add('passport-floating');
    }, 2200);
  });

  /* Parallaxe souris — BG : translate seul (scale géré par CSS)
                       FG : transform complet après entry */
  let mX = .5, mY = .5, lX = .5, lY = .5, rafId = null;
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    mX = (e.clientX - r.left) / r.width;
    mY = (e.clientY - r.top) / r.height;
    if (!rafId) rafId = requestAnimationFrame(applyParallax);
  }, { passive: true });
  hero.addEventListener('mouseleave', () => {
    mX = .5; mY = .5;
    /* Remet le float du passeport quand la souris sort */
    if (current === 0) {
      const fg0 = document.getElementById('fg-0');
      if (fg0) { fg0.style.transform = ''; fg0.classList.add('passport-floating'); }
    }
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
      if (current === 0) {
        /* Passeport : stoppe le float CSS, applique la rotation 3D */
        fg.classList.remove('passport-floating');
        fg.style.transition = 'transform .12s ease-out';
        fg.style.transform = `translateY(-50%) scale(0.82) rotateY(${dx * -22}deg) rotateX(${dy * 14}deg) translate(${dx * 18}px,${dy * 10}px)`;
      } else {
        fg.style.transition = 'transform .08s ease-out,bottom 2.0s cubic-bezier(.22,1,.36,1) .20s,opacity 1.4s cubic-bezier(.22,1,.36,1) .20s';
        fg.style.transform = `scale(1.18) translate(${dx * 52}px,${dy * 28}px)`;
      }
    }
    if (Math.abs(mX - lX) > .001 || Math.abs(mY - lY) > .001) rafId = requestAnimationFrame(applyParallax);
  }
})();
