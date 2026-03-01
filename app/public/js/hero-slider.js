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
  function goTo(idx) {
    if (isTransitioning) return; isTransitioning = true;
    const prev = current;
    current = ((idx % slides.length) + slides.length) % slides.length;
    slides[prev].classList.remove('active'); dots[prev].classList.remove('active');
    const pFg = document.getElementById('fg-' + prev);
    if (pFg) { pFg.style.transition = ''; pFg.style.transform = ''; }
    slides[current].classList.add('active'); dots[current].classList.add('active');
    const cSlide = document.getElementById('slide-' + current);
    if (cSlide) { cSlide._entryDone = false; setTimeout(() => { cSlide._entryDone = true; }, 1800); }
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
  setTimeout(() => { const s = document.getElementById('slide-0'); if (s) s._entryDone = true; }, 1800);
  /* Parallaxe souris */
  let mX = .5, mY = .5, lX = .5, lY = .5, rafId = null;
  hero.addEventListener('mousemove', e => {
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
    if (bg) bg.style.transform = `scale(1.0) translate(${dx * -22}px,${dy * -14}px)`;
    const fg = document.getElementById('fg-' + current);
    const sl = document.getElementById('slide-' + current);
    if (fg && sl && sl._entryDone) {
      fg.style.transition = 'transform .1s ease-out,bottom 1.6s cubic-bezier(.22,1,.36,1) .25s,opacity 1.4s cubic-bezier(.22,1,.36,1) .25s';
      fg.style.transform = `scale(1.0) translate(${dx * 32}px,${dy * 16}px)`;
    }
    if (Math.abs(mX - lX) > .001 || Math.abs(mY - lY) > .001) rafId = requestAnimationFrame(applyParallax);
  }
})();
