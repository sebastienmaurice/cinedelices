/**
 * category-badges.js — Carousel de genres cinéma V3
 * Source: docs/SEB/carousel-genres-v3.html (script extrait tel quel)
 */
(function () {

/* Guard : ne s'exécute que sur les pages ayant le carousel */
if (!document.getElementById('track')) return;

const PAD = 14;

/* ══ CINEMATIC RING — effet sobre au clic ══ */
const ringCanvas = document.getElementById('burst-canvas');
if (ringCanvas) {
  ringCanvas.width  = window.innerWidth;
  ringCanvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    ringCanvas.width  = window.innerWidth;
    ringCanvas.height = window.innerHeight;
  });
}
let rings = [];

function triggerRing(badge) {
  const rect = badge.getBoundingClientRect();
  const rgb  = badge.style.getPropertyValue('--glow-rgb').trim() || '196,160,82';
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  rings.push({ cx, cy, rgb, r: 0, maxR: Math.max(rect.width, rect.height) * 0.88, life: 1, type: 'ring' });
  rings.push({ cx, cy, rgb, r: 0, maxR: 20, life: 1, type: 'flash' });
}

function renderRings() {
  if (!ringCanvas) return;
  const ctx = ringCanvas.getContext('2d');
  if (!rings.length) { ctx.clearRect(0, 0, ringCanvas.width, ringCanvas.height); return; }
  ctx.clearRect(0, 0, ringCanvas.width, ringCanvas.height);
  rings = rings.filter(r => r.life > 0.01);
  rings.forEach(r => {
    if (r.type === 'ring') {
      r.r    = r.r + (r.maxR - r.r) * 0.12;
      r.life = r.life * 0.91;
      ctx.beginPath(); ctx.arc(r.cx, r.cy, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r.rgb}, ${(r.life * 0.58).toFixed(3)})`;
      ctx.lineWidth   = 1.5 * r.life;
      ctx.stroke();
    } else {
      r.r    = r.r + (r.maxR - r.r) * 0.18;
      r.life = r.life * 0.84;
      const g = ctx.createRadialGradient(r.cx, r.cy, 0, r.cx, r.cy, r.r);
      g.addColorStop(0,   `rgba(${r.rgb}, ${(r.life * 0.32).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(${r.rgb}, ${(r.life * 0.10).toFixed(3)})`);
      g.addColorStop(1,   `rgba(${r.rgb}, 0)`);
      ctx.beginPath(); ctx.arc(r.cx, r.cy, r.r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    }
  });
}

/* ══ LAZY LOAD ══ */
const imgObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const i = e.target;
      if (i.dataset.src) i.src = i.dataset.src;
      imgObserver.unobserve(i);
    }
  });
}, { rootMargin: '200px' });
function lazyObserve(img) {
  const s = img.getAttribute('src') || '';
  if (s) { img.dataset.src = s; img.removeAttribute('src'); }
  imgObserver.observe(img);
}
document.querySelectorAll('.badge__img').forEach(lazyObserve);

/* ══ TRACK DUPE ══ */
const track = document.getElementById('track');

/* Injecter le floor-glow dans chaque badge original AVANT le clone */
document.querySelectorAll('.badge').forEach(b => {
  const fg = document.createElement('div');
  fg.className = 'badge__floor-glow';
  b.appendChild(fg);
});

const originals = Array.from(track.children);
originals.forEach((n, i) => { n.dataset.badgeId = i; });
originals.forEach(n => {
  const c = n.cloneNode(true);
  c.querySelectorAll('.badge__img').forEach(lazyObserve);
  c.dataset.cloneOf = n.dataset.badgeId;
  const tt = c.querySelector('.tooltip'); if (tt) tt.remove();
  track.appendChild(c);
});

/* ══ CINEMATIC RING — effet sobre au clic (remplace le burst fête foraine) ══ */
/* ══ TOOLTIP GLOBAL ══ */
const globalTT = document.getElementById('global-tooltip');
let openBadge  = null;

function buildTooltipContent(badge) {
  const genre = badge.dataset.genre || '';
  const rgb   = badge.style.getPropertyValue('--glow-rgb') || '196,160,82';
  let films = [];
  try { films = JSON.parse(badge.dataset.films || '[]'); } catch(e) {}
  globalTT.style.setProperty('--tt-rgb', rgb);
  globalTT.style.borderColor = `rgba(${rgb},.28)`;
  const filmsHtml = films.length
    ? films.map(f => `<div class="tooltip__film">
        <span class="tooltip__film-title">${f.t}</span>
        <span class="tooltip__film-note">★ ${f.n} recette${f.n > 1 ? 's' : ''}</span>
      </div>`).join('')
    : '<p class="tooltip__no-films">Aucun film disponible</p>';
  globalTT.innerHTML = `
    <div class="tooltip__band"></div>
    <div class="tooltip__body">
      <div class="tooltip__genre">
        ${genre.toUpperCase()}
        <span class="tooltip__genre-badge">GENRE</span>
      </div>
      <div class="tooltip__films">${filmsHtml}</div>
      <p class="tooltip__hint">Cliquer pour explorer →</p>
    </div>`;
}

function showGlobalTooltip(badge) {
  buildTooltipContent(badge);
  const rect = badge.getBoundingClientRect();
  const ttW  = 252;
  let left = rect.left + rect.width / 2 - ttW / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - ttW - 8));
  globalTT.style.left      = left + 'px';
  globalTT.style.top       = (rect.top - 10) + 'px';
  globalTT.style.transform = 'translateY(-100%) scale(.96)';
  globalTT.classList.remove('is-open');
  void globalTT.offsetHeight; /* force reflow */
  globalTT.classList.add('is-open');
  requestAnimationFrame(() => {
    globalTT.style.transform = 'translateY(calc(-100% - 4px)) scale(1)';
  });
}

function hideGlobalTooltip() {
  globalTT.style.transform = 'translateY(-100%) scale(.96)';
  globalTT.classList.remove('is-open');
  setTimeout(() => { globalTT.style.transform = ''; }, 300);
}

/* ══ CLICK TOOLTIP + BURST ══ */
document.querySelectorAll('.badge').forEach(b => {
  b.addEventListener('click', e => {
    e.stopPropagation();
    const sourceId = b.dataset.cloneOf;
    const target   = sourceId != null ? document.querySelector(`.badge[data-badge-id="${sourceId}"]`) || b : b;
    const wasOpen  = openBadge === target;
    if (openBadge) { openBadge.classList.remove('tooltip-open'); openBadge = null; hideGlobalTooltip(); }
    if (!wasOpen) {
      target.classList.add('tooltip-open');
      openBadge = target;
      showGlobalTooltip(b);
      triggerRing(b);
    }
  });
});
document.addEventListener('click', () => {
  if (openBadge) { openBadge.classList.remove('tooltip-open'); openBadge = null; hideGlobalTooltip(); }
});

/* ══ COUNTER ANIMATION ══ */
function animateCounter(el, target) {
  if (el.dataset.animated) return;
  el.dataset.animated = '1';
  const s = performance.now();
  function step(n) {
    const p = Math.min((n - s) / 650, 1), e = 1 - Math.pow(1-p, 3);
    el.textContent = Math.round(e * target);
    if (p < 1) requestAnimationFrame(step); else el.textContent = target;
  }
  requestAnimationFrame(step);
}
/* Déclenché au spotlight (guard séparé) */
function animateSpotCounter(el, target) {
  if (el.dataset.spotAnim) return;
  el.dataset.spotAnim = '1';
  const s = performance.now();
  function step(n) {
    const p = Math.min((n - s) / 900, 1), e = 1 - Math.pow(1-p, 4);
    el.textContent = Math.round(e * target);
    if (p < 1) requestAnimationFrame(step); else el.textContent = target;
  }
  requestAnimationFrame(step);
}
document.querySelectorAll('.badge:not([data-clone-of])').forEach(b => {
  const st = b.querySelector('[data-target]');
  if (!st) return;
  b.addEventListener('mouseenter', () => animateCounter(st, parseInt(st.dataset.target)), { once: true });
});

/* ══ CAROUSEL AUTO-SCROLL ══ */
const outer = document.getElementById('carouselOuter');
const BASE_SPEED = 0.045, SLOW_SPEED = 0.008;
let txPx = 0, halfW = 0, currentSpeed = BASE_SPEED, targetSpeed = BASE_SPEED;
let mouseProx = 0, isDragging = false, touchLastX = 0, touchVel = 0;

function measureHalf() {
  const items = track.querySelectorAll('.badge');
  let w = 0; const c = items.length / 2;
  for (let i = 0; i < c; i++) w += items[i].offsetWidth + 32;
  halfW = w;
}
window.addEventListener('resize', measureHalf);
setTimeout(measureHalf, 100);

outer.addEventListener('mouseenter', () => { mouseProx = 1; });
outer.addEventListener('mouseleave', () => { mouseProx = 0; });
outer.addEventListener('touchstart', e => { touchLastX = e.touches[0].clientX; touchVel = 0; isDragging = true; }, { passive: true });
outer.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const dx = e.touches[0].clientX - touchLastX;
  touchVel = dx; txPx -= dx; touchLastX = e.touches[0].clientX;
}, { passive: true });
outer.addEventListener('touchend', () => { isDragging = false; });

/* ══ BORDER CANVAS SYSTEM ══ */
function rrp(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}
function bperim(w, h, r) { return 2*(w-2*r)+2*(h-2*r)+2*Math.PI*r; }
function ponb(t, w, h, r) {
  let d = ((t%1)+1)%1 * bperim(w, h, r);
  const S = [
    {l:w-2*r,  f:u=>({x:r+u*(w-2*r), y:0})},
    {l:Math.PI*r/2, f:u=>{const a=-Math.PI/2+u*Math.PI/2;return{x:w-r+Math.cos(a)*r,y:r+Math.sin(a)*r};}},
    {l:h-2*r,  f:u=>({x:w, y:r+u*(h-2*r)})},
    {l:Math.PI*r/2, f:u=>{const a=u*Math.PI/2;return{x:w-r+Math.cos(a)*r,y:h-r+Math.sin(a)*r};}},
    {l:w-2*r,  f:u=>({x:w-r-u*(w-2*r), y:h})},
    {l:Math.PI*r/2, f:u=>{const a=Math.PI/2+u*Math.PI/2;return{x:r+Math.cos(a)*r,y:h-r+Math.sin(a)*r};}},
    {l:h-2*r,  f:u=>({x:0, y:h-r-u*(h-2*r)})},
    {l:Math.PI*r/2, f:u=>{const a=Math.PI+u*Math.PI/2;return{x:r+Math.cos(a)*r,y:r+Math.sin(a)*r};}}
  ];
  for (const s of S) { if (d <= s.l) return s.f(d/s.l); d -= s.l; }
  return S[0].f(0);
}
function bp(t, W, H) {
  const bW = W-2*PAD, bH = H-2*PAD;
  const p = ponb(t, bW, bH, 22);
  return { x: p.x+PAD, y: p.y+PAD };
}
function h2r(hex) {
  hex = hex.trim().replace('#','');
  if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
  const n = parseInt(hex, 16);
  return [(n>>16)&255, (n>>8)&255, n&255];
}

function makeBadgeState(badge) {
  const canvas  = badge.querySelector('.badge__border-canvas');
  const imgWrap = badge.querySelector('.badge__img-wrap');
  const state = {
    badge, canvas, imgWrap,
    animType: badge.dataset.anim,
    glowColor: getComputedStyle(badge).getPropertyValue('--glow').trim(),
    accentColor: getComputedStyle(badge).getPropertyValue('--accent').trim(),
    hovered: false, t:0, fuseT:0, fuseSmoke:[], bloodDrops:[], confetti:[],
    scanGlitch:0, magicOrbs:[], strobeT:0, brushT:0, brushWobble:0,
    vfTimer:0, sirenPhase:0, torchT:0, torchEmbers:[], notesT:0, noteParticles:[],
    radarAngle:0, tearDrops:[], heartT:0, heartParticles:[], bloodT:0, tearT:0,
    glowHeadX:0.5, glowHeadY:0.5, glowLerpX:0.5, glowLerpY:0.5,
    glowIntensity:0, glowIntensityTarget:0,
    resizeCanvas() {
      const bW = badge.offsetWidth, bH = badge.offsetHeight;
      canvas.width  = bW + 2*PAD; canvas.height = bH + 2*PAD;
      canvas.style.position = 'absolute';
      canvas.style.top   = (-PAD)+'px'; canvas.style.left  = (-PAD)+'px';
      canvas.style.width = (bW+2*PAD)+'px'; canvas.style.height = (bH+2*PAD)+'px';
    }
  };
  state.resizeCanvas();
  badge.addEventListener('mouseenter', () => { state.hovered = true; state.glowIntensityTarget = 1; });
  badge.addEventListener('mouseleave', () => {
    state.hovered = false; state.glowIntensityTarget = 0;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
    state.fuseT=0; state.bloodDrops=[]; state.confetti=[]; state.fuseSmoke=[];
    state.magicOrbs=[]; state.torchEmbers=[]; state.noteParticles=[]; state.tearDrops=[]; state.heartParticles=[];
    state.scanGlitch=0;
  });
  return state;
}

function updateAmbientGlow(s, headT, dt) {
  const W=s.canvas.width, H=s.canvas.height, bW=W-2*PAD, bH=H-2*PAD;
  const raw = bp(headT, W, H); const bx=raw.x-PAD, by=raw.y-PAD;
  s.glowHeadX = (bx/bW)*100; s.glowHeadY = (by/bH)*100;
  const k = 1-Math.pow(1-0.055, dt/16);
  s.glowLerpX += (s.glowHeadX-s.glowLerpX)*k; s.glowLerpY += (s.glowHeadY-s.glowLerpY)*k;
  s.glowIntensity += (s.glowIntensityTarget-s.glowIntensity)*k*0.7;
  const st = s.badge.style;
  st.setProperty('--glow-x', s.glowLerpX.toFixed(2)+'%');
  st.setProperty('--glow-y', s.glowLerpY.toFixed(2)+'%');
  st.setProperty('--glow-intensity', s.glowIntensity.toFixed(3));
  if (s.imgWrap) {
    const iRect = s.imgWrap.getBoundingClientRect(); const bRect = s.badge.getBoundingClientRect();
    const ix = ((bx-(iRect.left-bRect.left))/iRect.width*100);
    const iy = ((by-(iRect.top-bRect.top))/iRect.height*100);
    st.setProperty('--img-glow-x', Math.max(-20,Math.min(120,ix)).toFixed(2)+'%');
    st.setProperty('--img-glow-y', Math.max(-20,Math.min(120,iy)).toFixed(2)+'%');
  }
}
function borderRect(s) { return {x:PAD,y:PAD,w:s.canvas.width-2*PAD,h:s.canvas.height-2*PAD}; }

/* ══ DRAW FUNCTIONS ══ */
function drawBlood(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.t+=dt;s.bloodT=(s.bloodT+dt*.00018)%1;const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle='rgba(160,0,0,.20)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();for(let i=1;i<=45;i++){const u=(s.bloodT-i/45*.16+1)%1;const p=bp(u,W,H);const f=1-i/45;ctx.beginPath();ctx.arc(p.x,p.y,2*f+.3,0,Math.PI*2);ctx.fillStyle=`rgba(200,0,0,${f*.65})`;ctx.fill();}const ph=bp(s.bloodT,W,H);const gh=ctx.createRadialGradient(ph.x,ph.y,0,ph.x,ph.y,14);gh.addColorStop(0,'rgba(255,60,60,1)');gh.addColorStop(.4,'rgba(180,0,0,.7)');gh.addColorStop(1,'rgba(120,0,0,0)');ctx.beginPath();ctx.arc(ph.x,ph.y,14,0,Math.PI*2);ctx.fillStyle=gh;ctx.fill();ctx.beginPath();ctx.arc(ph.x,ph.y,3.5,0,Math.PI*2);ctx.fillStyle='rgba(255,180,180,.9)';ctx.fill();if(s.bloodDrops.length<7&&Math.random()<.06){s.bloodDrops.push({x:PAD+16+Math.random()*(br.w-32),y:PAD,vy:.4+Math.random()*.5,len:0,maxLen:14+Math.random()*22,alpha:1,dripLen:0});}s.bloodDrops=s.bloodDrops.filter(d=>d.alpha>.01);s.bloodDrops.forEach(d=>{d.len=Math.min(d.len+d.vy*dt*.14,d.maxLen);if(d.len>=d.maxLen){d.dripLen+=d.vy*dt*.07;if(d.dripLen>20)d.alpha-=.013*dt;}const gr=ctx.createLinearGradient(d.x,d.y,d.x,d.y+d.len);gr.addColorStop(0,`rgba(180,0,0,${d.alpha*.9})`);gr.addColorStop(1,`rgba(90,0,0,${d.alpha*.2})`);ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x,d.y+d.len);ctx.strokeStyle=gr;ctx.lineWidth=2.5;ctx.stroke();if(d.dripLen>0){const br2=2.5+Math.min(d.dripLen,10)*.28;ctx.beginPath();ctx.arc(d.x,d.y+d.len+Math.min(d.dripLen,16),br2,0,Math.PI*2);ctx.fillStyle=`rgba(160,0,0,${d.alpha*.8})`;ctx.fill();}});}
function drawFuse(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.fuseT=(s.fuseT+dt*.00025)%1;const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle='rgba(100,60,10,.22)';ctx.lineWidth=1;ctx.stroke();ctx.restore();for(let i=0;i<60;i++){const u=((s.fuseT-i/60*.18+1)%1);const p=bp(u,W,H);const f=1-i/60;ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fillStyle=`rgba(110,70,15,${f*.5})`;ctx.fill();}const p=bp(s.fuseT,W,H);const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,18);g.addColorStop(0,'rgba(255,230,90,1)');g.addColorStop(.3,'rgba(255,130,20,.6)');g.addColorStop(1,'rgba(255,50,0,0)');ctx.beginPath();ctx.arc(p.x,p.y,18,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle='#fffde0';ctx.fill();s.fuseSmoke=s.fuseSmoke.filter(q=>q.life>0);if(Math.random()<.6){const a=Math.random()*Math.PI*2,sp=1.2+Math.random()*3.5;s.fuseSmoke.push({x:p.x,y:p.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2.2,life:.9});}s.fuseSmoke.forEach(q=>{q.x+=q.vx*dt*.06;q.y+=q.vy*dt*.06;q.vy+=.06*dt*.06;q.life-=.022*dt*.06*16;ctx.beginPath();ctx.arc(q.x,q.y,2,0,Math.PI*2);ctx.fillStyle=`rgba(255,180,40,${Math.max(0,q.life)})`;ctx.fill();});}
function drawBullet(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.fuseT=(s.fuseT+dt*.00075)%1;for(let i=1;i<=55;i++){const u=((s.fuseT-i/55*.10+1)%1);const p=bp(u,W,H);const f=1-i/55;ctx.beginPath();ctx.arc(p.x,p.y,2.8*f+.3,0,Math.PI*2);ctx.fillStyle=`rgba(255,${70+Math.floor(f*150)},0,${f*.9})`;ctx.fill();}const p=bp(s.fuseT,W,H);const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,14);g.addColorStop(0,'rgba(255,255,200,1)');g.addColorStop(.5,'rgba(255,120,0,.8)');g.addColorStop(1,'rgba(255,40,0,0)');ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();}
function drawConfetti(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.t+=dt;const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle='rgba(255,220,100,.15)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();const cols=['#FF6B6B','#FFE085','#6BFFA0','#6BCFFF','#FF9F40','#DA77FF'];if(s.confetti.length<30&&Math.random()<.30){const p=bp(Math.random(),W,H);s.confetti.push({x:p.x,y:p.y,vx:(Math.random()-.5)*4,vy:-2.2-Math.random()*2.2,rot:Math.random()*Math.PI*2,vrot:(Math.random()-.5)*.35,life:1,w:4+Math.random()*5,h:3+Math.random()*3,col:cols[Math.floor(Math.random()*cols.length)]});}s.confetti=s.confetti.filter(c=>c.life>0);s.confetti.forEach(c=>{c.x+=c.vx*dt*.05;c.y+=c.vy*dt*.05;c.vy+=.07*dt*.05;c.rot+=c.vrot*dt*.05;c.life-=.013*dt*.05*16;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot);ctx.globalAlpha=Math.max(0,c.life);ctx.fillStyle=c.col;ctx.fillRect(-c.w/2,-c.h/2,c.w,c.h);ctx.restore();});ctx.globalAlpha=1;}
function drawScan(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.fuseT=(s.fuseT+dt*.00028)%1;s.scanGlitch+=dt;const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle='rgba(0,255,136,.09)';ctx.lineWidth=1;ctx.stroke();ctx.restore();const gl=s.scanGlitch>80&&s.scanGlitch<90?Math.random()*5-2.5:0;if(s.scanGlitch>120)s.scanGlitch=Math.random()<.7?0:80;for(let i=0;i<=80;i++){const u=(s.fuseT-i/80*.22+1)%1;const p=bp(u,W,H);const f=1-i/80;ctx.beginPath();ctx.arc(p.x+(i<5?gl:0),p.y,2*f+.5,0,Math.PI*2);ctx.fillStyle=`rgba(0,255,136,${f*.85})`;ctx.fill();}const p=bp(s.fuseT,W,H);const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,15);g.addColorStop(0,'rgba(200,255,220,1)');g.addColorStop(.4,'rgba(0,255,136,.6)');g.addColorStop(1,'rgba(0,200,80,0)');ctx.beginPath();ctx.arc(p.x,p.y,15,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();if(gl!==0){ctx.fillStyle='rgba(0,255,136,.10)';ctx.fillRect(PAD,PAD+5+Math.random()*(br.h-10),br.w,1+Math.random()*2);}}
function drawMagic(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.t+=dt;if(!s.magicOrbs.length){const oc=['#C084FC','#60A5FA','#F59E0B','#34D399','#F472B6'];for(let i=0;i<5;i++)s.magicOrbs.push({t:i/5,speed:.00014+Math.random()*.00012,trail:[],col:oc[i],size:2+Math.random()*2});}const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle='rgba(160,100,220,.13)';ctx.lineWidth=1.5;ctx.shadowColor='rgba(192,132,252,.3)';ctx.shadowBlur=8;ctx.stroke();ctx.restore();s.magicOrbs.forEach(orb=>{orb.t=(orb.t+orb.speed*dt)%1;const p=bp(orb.t,W,H);orb.trail.push({x:p.x,y:p.y});if(orb.trail.length>20)orb.trail.shift();orb.trail.forEach((tp,i)=>{const f=i/orb.trail.length;const[r,g,b]=h2r(orb.col);ctx.beginPath();ctx.arc(tp.x,tp.y,orb.size*f,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${f*.7})`;ctx.fill();});const g2=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,9);const[r2,g2c,b2]=h2r(orb.col);g2.addColorStop(0,'rgba(255,255,255,.9)');g2.addColorStop(.3,`rgba(${r2},${g2c},${b2},.8)`);g2.addColorStop(1,`rgba(${r2},${g2c},${b2},0)`);ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fillStyle=g2;ctx.fill();});if(Math.random()<.018){const p=bp(Math.random(),W,H);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(a)*11,p.y+Math.sin(a)*11);ctx.strokeStyle='rgba(255,240,180,.5)';ctx.lineWidth=.8;ctx.stroke();}}}
function drawStrobe(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.strobeT+=dt*.003;s.fuseT=(s.fuseT+dt*.00011)%1;for(let i=0;i<=60;i++){const u=(s.fuseT-i/60*.30+1)%1;const p=bp(u,W,H);const f=1-i/60;ctx.beginPath();ctx.arc(p.x,p.y,1.5*f+.3,0,Math.PI*2);ctx.fillStyle=`rgba(180,200,240,${f*.45})`;ctx.fill();}const p=bp(s.fuseT,W,H);const pulse=.6+.4*Math.sin(s.strobeT*2.5);const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,17);g.addColorStop(0,`rgba(240,248,255,${pulse})`);g.addColorStop(.5,`rgba(100,140,200,${pulse*.4})`);g.addColorStop(1,'rgba(60,80,150,0)');ctx.beginPath();ctx.arc(p.x,p.y,17,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();if(Math.random()<.01){const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle=`rgba(200,220,255,${Math.random()*.5+.1})`;ctx.lineWidth=1;ctx.stroke();ctx.restore();}}
function drawBrush(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.brushT=(s.brushT+dt*.00022)%1;s.brushWobble+=dt*.01;const cols=['#FF6B6B','#FFE085','#6BFFA0','#6BCFFF','#FF9F40','#DA77FF','#F2C84B'];for(let i=0;i<=70;i++){const u=(s.brushT-i/70*.15+1)%1;const p=bp(u,W,H);const f=1-i/70;const ci=Math.floor(u*cols.length)%cols.length;const[r,g,b]=h2r(cols[ci]);const wob=1+.6*Math.sin(s.brushWobble+i*.3);ctx.beginPath();ctx.arc(p.x,p.y,(2.5+wob)*f,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${f*.85})`;ctx.fill();}const p=bp(s.brushT,W,H);ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();}
function drawViewfinder(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.fuseT=(s.fuseT+dt*.00018)%1;s.vfTimer+=dt;const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle='rgba(123,167,188,.20)';ctx.lineWidth=1;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);ctx.restore();const p=bp(s.fuseT,W,H),bs=9;ctx.strokeStyle='rgba(200,240,255,.85)';ctx.lineWidth=1.5;[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{ctx.beginPath();ctx.moveTo(p.x+sx*bs,p.y+sy*bs);ctx.lineTo(p.x+sx*(bs-4),p.y+sy*bs);ctx.moveTo(p.x+sx*bs,p.y+sy*bs);ctx.lineTo(p.x+sx*bs,p.y+sy*(bs-4));ctx.stroke();});const pulse=.5+.5*Math.sin(s.vfTimer*.008);ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fillStyle=`rgba(200,240,255,${pulse*.9})`;ctx.fill();if(Math.random()<.18){const p2=bp(Math.random(),W,H);ctx.beginPath();ctx.arc(p2.x,p2.y,.8,0,Math.PI*2);ctx.fillStyle='rgba(123,167,188,.45)';ctx.fill();}}

/* ══ SIREN amélioré — deux spots girophares bleu/rouge qui tournent autour du badge ══ */
function drawSiren(s,dt){
  const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;
  ctx.clearRect(0,0,W,H);
  s.sirenPhase+=dt*.004;
  // Ligne de balayage sur le bord
  const br=borderRect(s);
  // Deux faisceaux lumineux rotatifs, décalés de PI
  [[0,[0,100,255]],[Math.PI,[210,20,20]]].forEach(([offset,[r,g,b]])=>{
    const t=((s.sirenPhase*.28+offset/(Math.PI*2))%1);
    const pulse=.5+.5*Math.abs(Math.sin(s.sirenPhase*1.5+(offset>0?Math.PI:0)));
    // Traîné
    for(let i=0;i<=50;i++){
      const u=(t-i/50*.18+1)%1;
      const p=bp(u,W,H);
      const f=(1-i/50)*pulse;
      ctx.beginPath();ctx.arc(p.x,p.y,2.8*f+.3,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${f*.92})`;ctx.fill();
    }
    // Tête lumineuse (spot girophare)
    const p=bp(t,W,H);
    const gg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,16);
    gg.addColorStop(0,`rgba(255,255,255,${pulse*.95})`);
    gg.addColorStop(.35,`rgba(${r},${g},${b},${pulse*.75})`);
    gg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.fillStyle=gg;ctx.fill();
    // Halo externe
    const halo=ctx.createRadialGradient(p.x,p.y,8,p.x,p.y,36);
    halo.addColorStop(0,`rgba(${r},${g},${b},${pulse*.18})`);
    halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.arc(p.x,p.y,36,0,Math.PI*2);ctx.fillStyle=halo;ctx.fill();
  });
  // Bord clignotant alterné bleu/rouge
  const blinkB=.5+.5*Math.sin(s.sirenPhase*3);
  const blinkR=.5+.5*Math.sin(s.sirenPhase*3+Math.PI);
  ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);
  // Bleu
  ctx.strokeStyle=`rgba(0,100,255,${blinkB*.25})`;ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();
  ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);
  // Rouge (légèrement décalé)
  ctx.strokeStyle=`rgba(210,20,20,${blinkR*.25})`;ctx.lineWidth=1;ctx.setLineDash([6,6]);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
}

function drawTorch(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.torchT=(s.torchT+dt*.00020)%1;s.t+=dt;const fl=.7+.3*Math.sin(s.t*.04+Math.sin(s.t*.012)*4);for(let i=0;i<=55;i++){const u=(s.torchT-i/55*.18+1)%1;const p=bp(u,W,H);const f=(1-i/55)*fl;const rv=Math.floor(200+55*f),gv=Math.floor(80+100*f*f);ctx.beginPath();ctx.arc(p.x,p.y,2.2*f+.5,0,Math.PI*2);ctx.fillStyle=`rgba(${rv},${gv},10,${f*.85})`;ctx.fill();}const p=bp(s.torchT,W,H);const gg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,16*fl);gg.addColorStop(0,'rgba(255,255,180,.95)');gg.addColorStop(.3,'rgba(255,160,20,.7)');gg.addColorStop(.7,'rgba(200,60,0,.3)');gg.addColorStop(1,'rgba(100,20,0,0)');ctx.beginPath();ctx.arc(p.x,p.y,16*fl,0,Math.PI*2);ctx.fillStyle=gg;ctx.fill();s.torchEmbers=s.torchEmbers.filter(e=>e.life>0);if(Math.random()<.30)s.torchEmbers.push({x:p.x,y:p.y,vx:(Math.random()-.5)*2,vy:-2-Math.random()*1.5,life:1,col:Math.random()<.5?'#FFC040':'#FF8020'});s.torchEmbers.forEach(e=>{e.x+=e.vx*dt*.05;e.y+=e.vy*dt*.05;e.vy+=.045*dt*.05;e.life-=.018*dt*.05*16;ctx.beginPath();ctx.arc(e.x,e.y,1.5,0,Math.PI*2);ctx.fillStyle=e.col;ctx.globalAlpha=Math.max(0,e.life);ctx.fill();ctx.globalAlpha=1;});}
function drawNotes(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.notesT=(s.notesT+dt*.00022)%1;s.t+=dt;const pulse=.12+.10*Math.sin(s.t*.006);const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle=`rgba(196,160,82,${pulse})`;ctx.lineWidth=1.5;ctx.stroke();ctx.restore();const bp2val=.8+.2*Math.sin(s.t*.018);for(let i=1;i<=30;i++){const u=(s.notesT-i/30*.12+1)%1;const p=bp(u,W,H);const f=1-i/30;ctx.beginPath();ctx.arc(p.x,p.y,1.5*f,0,Math.PI*2);ctx.fillStyle=`rgba(255,224,133,${f*.6})`;ctx.fill();}const p=bp(s.notesT,W,H);const gg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,14*bp2val);gg.addColorStop(0,'rgba(255,240,160,.9)');gg.addColorStop(.4,'rgba(196,160,82,.5)');gg.addColorStop(1,'rgba(196,160,82,0)');ctx.beginPath();ctx.arc(p.x,p.y,14*bp2val,0,Math.PI*2);ctx.fillStyle=gg;ctx.fill();s.noteParticles=s.noteParticles.filter(n=>n.life>0);if(Math.random()<.07&&s.noteParticles.length<9){const p2=bp(Math.random(),W,H);s.noteParticles.push({x:p2.x,y:p2.y,vx:(Math.random()-.5)*.9,vy:-1-Math.random()*.8,life:1,sym:['♪','♫','♩','♬'][Math.floor(Math.random()*4)]});}s.noteParticles.forEach(n=>{n.x+=n.vx*dt*.05;n.y+=n.vy*dt*.05;n.life-=.012*dt*.05*16;ctx.font='11px serif';ctx.globalAlpha=Math.max(0,n.life);ctx.fillStyle='#FFE085';ctx.fillText(n.sym,n.x-5,n.y+4);ctx.globalAlpha=1;});}
function drawRadar(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.radarAngle=(s.radarAngle+dt*.0022)%(Math.PI*2);const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle='rgba(119,136,153,.25)';ctx.lineWidth=1;ctx.setLineDash([3,5]);ctx.stroke();ctx.setLineDash([]);ctx.restore();const cx=W/2,cy=H/2,sweep=Math.PI*.4;function closest(ang){let bT=0,bD=1e9;for(let j=0;j<200;j++){const t=j/200;const p=bp(t,W,H);const a=Math.atan2(p.y-cy,p.x-cx);const d=Math.abs(((a-ang+Math.PI*3)%(Math.PI*2))-Math.PI);if(d<bD){bD=d;bT=t;}}return bp(bT,W,H);}for(let i=0;i<=60;i++){const p=closest(s.radarAngle-i/60*sweep);const f=(1-i/60)*.8;ctx.beginPath();ctx.arc(p.x,p.y,2*f+.5,0,Math.PI*2);ctx.fillStyle=`rgba(100,200,100,${f*.85})`;ctx.fill();}const p=closest(s.radarAngle);const gg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,12);gg.addColorStop(0,'rgba(180,255,180,.9)');gg.addColorStop(1,'rgba(0,100,0,0)');ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fillStyle=gg;ctx.fill();}
function drawTear(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.t+=dt;s.tearT=(s.tearT+dt*.00015)%1;const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle='rgba(184,136,42,.13)';ctx.lineWidth=1;ctx.stroke();ctx.restore();for(let i=1;i<=40;i++){const u=(s.tearT-i/40*.14+1)%1;const p=bp(u,W,H);const f=1-i/40;ctx.beginPath();ctx.arc(p.x,p.y,1.8*f+.2,0,Math.PI*2);ctx.fillStyle=`rgba(180,210,255,${f*.55})`;ctx.fill();}const pt=bp(s.tearT,W,H);const gt=ctx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,12);gt.addColorStop(0,'rgba(220,240,255,1)');gt.addColorStop(.4,'rgba(140,180,240,.7)');gt.addColorStop(1,'rgba(100,150,220,0)');ctx.beginPath();ctx.arc(pt.x,pt.y,12,0,Math.PI*2);ctx.fillStyle=gt;ctx.fill();ctx.beginPath();ctx.arc(pt.x,pt.y,3,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();if(s.tearDrops.length<5&&Math.random()<.04){const left=Math.random()<.5;s.tearDrops.push({x:left?PAD:W-PAD,y:PAD+26+Math.random()*(br.h-60),vy:.28+Math.random()*.4,len:0,maxLen:14+Math.random()*20,alpha:.85,dripLen:0,prism:Math.random()>.5});}s.tearDrops=s.tearDrops.filter(d=>d.alpha>.01);s.tearDrops.forEach(d=>{d.len=Math.min(d.len+d.vy*dt*.12,d.maxLen);if(d.len>=d.maxLen){d.dripLen+=d.vy*dt*.07;if(d.dripLen>18)d.alpha-=.012*dt;}const gr=ctx.createLinearGradient(d.x,d.y,d.x,d.y+d.len);gr.addColorStop(0,`rgba(180,200,240,${d.alpha*.7})`);gr.addColorStop(1,`rgba(150,180,220,${d.alpha*.2})`);ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x,d.y+d.len);ctx.strokeStyle=gr;ctx.lineWidth=2;ctx.stroke();if(d.dripLen>0){const br2=2.5+Math.min(d.dripLen,9)*.25;if(d.prism){['rgba(255,100,100,.3)','rgba(100,255,100,.3)','rgba(100,100,255,.3)'].forEach((c,i)=>{ctx.beginPath();ctx.arc(d.x+(i-1)*2,d.y+d.len+Math.min(d.dripLen,14),br2*.7,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();});}ctx.beginPath();ctx.arc(d.x,d.y+d.len+Math.min(d.dripLen,14),br2,0,Math.PI*2);ctx.fillStyle=`rgba(180,210,250,${d.alpha*.75})`;ctx.fill();}});}
function drawHeart(s,dt){const ctx=s.canvas.getContext('2d'),W=s.canvas.width,H=s.canvas.height;ctx.clearRect(0,0,W,H);s.heartT=(s.heartT+dt*.00020)%1;s.t+=dt;const pulse=.12+.10*Math.abs(Math.sin(s.t*.008));const br=borderRect(s);ctx.save();rrp(ctx,br.x,br.y,br.w,br.h,22);ctx.strokeStyle=`rgba(255,107,138,${pulse})`;ctx.lineWidth=1.5;ctx.shadowColor='rgba(255,107,138,.4)';ctx.shadowBlur=6;ctx.stroke();ctx.restore();const bs=.9+.2*Math.abs(Math.sin(s.t*.012));for(let i=1;i<=40;i++){const u=(s.heartT-i/40*.14+1)%1;const p=bp(u,W,H);const f=1-i/40;ctx.beginPath();ctx.arc(p.x,p.y,2*f,0,Math.PI*2);ctx.fillStyle=`rgba(255,150,170,${f*.7})`;ctx.fill();}const p=bp(s.heartT,W,H);const hs=6*bs;ctx.save();ctx.translate(p.x,p.y);ctx.beginPath();ctx.moveTo(0,-hs*.4);ctx.bezierCurveTo(hs*.5,-hs,hs,-hs*.5,0,hs*.5);ctx.bezierCurveTo(-hs,-hs*.5,-hs*.5,-hs,0,-hs*.4);ctx.fillStyle='rgba(255,107,138,.92)';ctx.shadowColor='rgba(255,107,138,.8)';ctx.shadowBlur=10;ctx.fill();ctx.restore();s.heartParticles=s.heartParticles.filter(q=>q.life>0);if(Math.random()<.09&&s.heartParticles.length<14)s.heartParticles.push({x:p.x,y:p.y,vx:(Math.random()-.5)*2,vy:-1.2-Math.random()*1.6,life:1,size:1.2+Math.random()*2});s.heartParticles.forEach(q=>{q.x+=q.vx*dt*.05;q.y+=q.vy*dt*.05;q.life-=.013*dt*.05*16;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.fillStyle=`rgba(255,160,180,${Math.max(0,q.life)})`;ctx.fill();});}

const ANIM_MAP = {blood:drawBlood,fuse:drawFuse,bullet:drawBullet,confetti:drawConfetti,scan:drawScan,magic:drawMagic,strobe:drawStrobe,brush:drawBrush,viewfinder:drawViewfinder,siren:drawSiren,torch:drawTorch,notes:drawNotes,radar:drawRadar,tear:drawTear,heart:drawHeart};

function getHeadT(s){switch(s.animType){case 'fuse':case 'bullet':case 'scan':case 'strobe':case 'viewfinder':return s.fuseT;case 'brush':return s.brushT;case 'notes':return s.notesT;case 'torch':return s.torchT;case 'heart':return s.heartT;case 'blood':return s.bloodT;case 'tear':return s.tearT;case 'magic':return s.magicOrbs.length?s.magicOrbs[0].t:0;case 'siren':return(s.sirenPhase*.28)%1;default:return(s.t*0.00006)%1;}}

const genresSection = document.querySelector('.genres-section');
const badgeStates = Array.from(track.querySelectorAll('.badge')).map(makeBadgeState).filter(Boolean);

/* ══ GENRE SUBTITLES ══ */
const GENRE_SUBS = {
  'Horreur':      '45 films qui font peur dans le noir',
  'Aventure':     '78 voyages qui coupent le souffle',
  'Action':       '112 films à 200 à l\'heure',
  'Comédie':      '93 films pour rire aux larmes',
  'Sci-Fi':       '67 voyages aux confins de l\'espace',
  'Fantastique':  '54 univers impossibles à oublier',
  'Thriller':     '88 films qui vous tiennent en haleine',
  'Animation':    '41 chefs-d\'œuvre animés',
  'Documentaire': '29 réalités plus folles que la fiction',
  'Policier':     '63 enquêtes qui tiennent en éveil',
  'Historique':   '37 fresques qui font l\'histoire',
  'Drame':        '76 histoires qui marquent à jamais',
  'Romance':      '52 amours de cinéma',
  'Musical':      '28 films à fredonner',
};
const genreList = Array.from(document.querySelectorAll('.badge:not([data-clone-of])')).map(b => b.dataset.genre).filter(Boolean);
const genreTotal = genreList.length;
const filmCounterTotal = document.querySelector('.film-counter__total');
if (filmCounterTotal) filmCounterTotal.textContent = String(genreTotal).padStart(2, '0');


/* ══ BANDES PERFORÉES ══ */
['top','bot'].forEach(pos => {
  const el = document.createElement('div');
  el.className = `film-perfs film-perfs--${pos}`;
  genresSection.appendChild(el);
});

/* ══ NOW SHOWING ══ */
const nowShowing = document.createElement('div');
nowShowing.className = 'now-showing';
nowShowing.innerHTML = '<span class="now-showing__dot"></span>À L\'AFFICHE';
nowShowing.style.cssText = 'opacity:0;left:50%;top:64px;';
genresSection.appendChild(nowShowing);

/* ══ SPOTLIGHT STATE ══ */
const spotMap = new WeakMap();
let washAlpha = 0, lastDominantGenre = '', spotPauseActive = false, lastPauseTime = -9999;
const reactiveSub = document.getElementById('section-reactive-sub');
const filmCounterIdx = document.querySelector('.film-counter__idx');

/* Faisceau de projecteur */
const spotBeam = document.createElement('div');
spotBeam.className = 'spotlight-beam';
spotBeam.style.cssText = 'left:50%;opacity:0;';
if (genresSection) genresSection.appendChild(spotBeam);

/* ══ SPOTLIGHT CINÉMATOGRAPHIQUE ══ */
function applySpotlight(ts) {
  const vCX  = window.innerWidth / 2;
  const R    = 340;
  const LERP = 0.062;

  let beamX        = vCX;
  let maxSpot      = 0;
  let beamRGB      = '196,160,82';
  let dominantBadge = null;
  let dominantGenre = '';

  track.querySelectorAll('.badge').forEach(badge => {
    const rect = badge.getBoundingClientRect();
    if (!rect.width) return;
    const cx   = rect.left + rect.width / 2;
    const dist = Math.abs(cx - vCX);

    const raw    = Math.max(0, 1 - dist / R);
    const target = raw * raw * raw;
    const prev   = spotMap.has(badge) ? spotMap.get(badge) : 0;
    const sp     = prev + (target - prev) * LERP;
    spotMap.set(badge, sp);

    if (sp > maxSpot) {
      maxSpot       = sp;
      beamX         = cx;
      beamRGB       = badge.style.getPropertyValue('--glow-rgb').trim() || beamRGB;
      dominantBadge = badge;
      dominantGenre = badge.dataset.genre || '';
    }

    badge.style.setProperty('--spot', sp.toFixed(4));
    badge.style.setProperty('--tx',   (-sp * 8).toFixed(2) + 'px');
    badge.style.setProperty('--ts',   (1 + sp * 0.052).toFixed(4));

    badge.style.setProperty('--img-sat', (sp * 1.55).toFixed(3));
    badge.style.setProperty('--img-bri', (0.20 + sp * 0.95).toFixed(3));
    badge.style.setProperty('--img-con', (1.14 - sp * 0.06).toFixed(3));
    badge.style.setProperty('--img-sep', (0.50 * (1 - sp)).toFixed(3));
    badge.style.setProperty('--img-hue', (215 * (1 - sp)).toFixed(1) + 'deg');

    /* Compteur animé au spotlight (guard séparé du hover) */
    if (sp > 0.72 && !badge.dataset.cloneOf) {
      const countEl = badge.querySelector('[data-target]');
      if (countEl) animateSpotCounter(countEl, parseInt(countEl.dataset.target));
    }
  });

  /* ── Section color wash — plafonné à 0.04 max ── */
  washAlpha += (Math.min(maxSpot * 0.065, 0.040) - washAlpha) * 0.014;
  genresSection.style.setProperty('--wash-rgb',   beamRGB);
  genresSection.style.setProperty('--wash-alpha', washAlpha.toFixed(4));

  /* ── Sous-titre réactif ── */
  if (maxSpot > 0.65 && dominantGenre !== lastDominantGenre && reactiveSub) {
    reactiveSub.classList.add('fading');
    setTimeout(() => {
      reactiveSub.textContent = GENRE_SUBS[dominantGenre] || 'Le goût du cinéma se décline en mille saveurs';
      reactiveSub.classList.remove('fading');
    }, 300);
    lastDominantGenre = dominantGenre;
  }

  /* ── Film counter ── */
  if (filmCounterIdx && dominantGenre) {
    const idx = genreList.indexOf(dominantGenre);
    if (idx >= 0) filmCounterIdx.textContent = String(idx + 1).padStart(2, '0');
  }

  /* ── Now Showing label ── */
  if (dominantBadge && maxSpot > 0.55) {
    const secRect  = genresSection.getBoundingClientRect();
    const badgeRect = dominantBadge.getBoundingClientRect();
    nowShowing.style.left    = (beamX - secRect.left) + 'px';
    nowShowing.style.top     = (badgeRect.top - secRect.top - 22) + 'px';
    nowShowing.style.opacity = Math.min(1, (maxSpot - 0.55) * 2.8).toFixed(3);
  } else {
    nowShowing.style.opacity = '0';
  }

  /* ── Auto-pause spectaculaire ── */
  if (maxSpot > 0.88 && !isDragging && !spotPauseActive && ts - lastPauseTime > 2800) {
    spotPauseActive = true;
    lastPauseTime   = ts;
    setTimeout(() => { spotPauseActive = false; }, 1500);
  }

  /* ── Faisceau de projecteur ── */
  if (spotBeam && genresSection) {
    const secRect = genresSection.getBoundingClientRect();
    spotBeam.style.left    = (beamX - secRect.left) + 'px';
    spotBeam.style.opacity = (maxSpot * 0.92).toFixed(3);
    spotBeam.style.setProperty('--beam-rgb',  beamRGB);
    spotBeam.style.setProperty('--beam-dust', (maxSpot * 0.88).toFixed(3));
  }
}

/* ══ MAIN RENDER LOOP ══ */
let lastRafTs = null;
function mainRaf(ts) {
  requestAnimationFrame(mainRaf);
  const dt = lastRafTs !== null ? Math.min(ts - lastRafTs, 50) : 16;
  lastRafTs = ts;

  /* Auto-pause spotlight : ralentit quand un badge est plein centre */
  const pauseSpeed = spotPauseActive ? 0.004 : (mouseProx ? SLOW_SPEED : BASE_SPEED);
  targetSpeed = pauseSpeed;
  currentSpeed += (targetSpeed - currentSpeed) * .06;

  if (!isDragging) {
    if (Math.abs(touchVel) > .1) { txPx -= touchVel * .85; touchVel *= .88; }
    else { txPx += currentSpeed * dt; }
  }
  if (halfW > 0 && txPx >= halfW) txPx -= halfW;
  if (txPx < 0) txPx += halfW > 0 ? halfW : 0;
  track.style.transform = `translateX(${-txPx}px)`;

  applySpotlight(ts);

  badgeStates.forEach(s => {
    if (s.hovered) { const fn = ANIM_MAP[s.animType]; if (fn) fn(s, dt); updateAmbientGlow(s, getHeadT(s), dt); }
    else if (s.glowIntensity > 0.005) { updateAmbientGlow(s, getHeadT(s), dt); }
  });
  renderRings();
}
requestAnimationFrame(mainRaf);
new ResizeObserver(() => badgeStates.forEach(s => s.resizeCanvas())).observe(document.body);
})();
