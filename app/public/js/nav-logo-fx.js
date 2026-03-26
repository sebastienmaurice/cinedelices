/**
 * nav-logo-fx.js — Animation canvas du logo Ciné Délices (navbar + footer)
 * Système de coordonnées normalisées : référence 500×287, mise à l'échelle
 * dynamique via (sx, sy) calculés depuis data-w / data-h de chaque scène.
 */
(function () {
  'use strict';

  const REF_W = 500, REF_H = 287;

  /* ── Coordonnées de référence (espace 500×287) ── */
  const rawZones = [
    [{x:91.3,y:60.3},{x:74.3,y:55.3},{x:58.3,y:57.3},{x:45.3,y:64.3},{x:35.3,y:74.3},{x:29.3,y:88.3},{x:27.3,y:102.3},{x:29.3,y:115.3},{x:34.3,y:126.3},{x:41.3,y:136.3},{x:51.3,y:143.3},{x:61.3,y:146.3},{x:73.3,y:146.3},{x:82.3,y:145.3},{x:90.3,y:142.3}],
    [{x:126.3,y:56.3},{x:127.3,y:67.3},{x:127.3,y:79.3},{x:127.3,y:90.3},{x:127.3,y:100.3},{x:127.3,y:111.3},{x:127.3,y:122.3},{x:127.3,y:134.3},{x:127.3,y:146.3}],
    [{x:169.3,y:148.3},{x:169.3,y:133.3},{x:168.3,y:117.3},{x:167.3,y:104.3},{x:167.3,y:89.3},{x:169.3,y:72.3},{x:169.3,y:60.3},{x:179.3,y:61.3},{x:186.3,y:72.3},{x:193.3,y:80.3},{x:199.3,y:92.3},{x:205.3,y:103.3},{x:211.3,y:112.3},{x:217.3,y:122.3},{x:226.3,y:132.3},{x:233.3,y:142.3},{x:239.3,y:143.3},{x:238.3,y:133.3},{x:238.3,y:120.3},{x:237.3,y:107.3},{x:239.3,y:94.3},{x:239.3,y:82.3},{x:238.3,y:71.3},{x:238.3,y:58.3}],
    [{x:329.3,y:58.3},{x:317.3,y:58.3},{x:303.3,y:58.3},{x:292.3,y:58.3},{x:279.3,y:58.3},{x:279.3,y:70.3},{x:279.3,y:84.3},{x:279.3,y:94.3},{x:280.3,y:108.3},{x:281.3,y:121.3},{x:281.3,y:132.3},{x:280.3,y:145.3},{x:293.3,y:145.3},{x:309.3,y:146.3},{x:318.3,y:145.3},{x:328.3,y:145.3},{x:321.3,y:99.3},{x:310.3,y:99.3},{x:298.3,y:99.3},{x:287.3,y:99.3},{x:311.3,y:21.3},{x:303.3,y:29.3}]
  ];
  const goldStarDefs  = [{x:373.3,y:165.3},{x:180.3,y:183.3},{x:288.3,y:228.3},{x:433.3,y:231.3}];
  const whiteStarDefs = [{x:289.3,y:36.3},{x:119.3,y:98.3},{x:288.3,y:127.3}];
  const metalShinePoints = [
    {x:58,y:52},{x:74,y:50},{x:91,y:55},{x:122,y:52},{x:132,y:52},{x:165,y:56},{x:175,y:57},{x:235,y:54},
    {x:280,y:53},{x:295,y:53},{x:312,y:53},{x:327,y:53},{x:55,y:150},{x:127,y:151},{x:170,y:152},
    {x:240,y:148},{x:280,y:150},{x:295,y:150},{x:315,y:150},{x:330,y:150},
    {x:373,y:161},{x:180,y:179},{x:288,y:224},{x:433,y:227}
  ];

  function sc(v, factor) { return v * factor; }

  /* ── Classe LogoScene ── */
  class LogoScene {
    constructor(sceneId, underCanvasId, overCanvasId, imgId) {
      const scene = document.getElementById(sceneId);
      if (!scene) return;

      this.W  = +scene.dataset.w;
      this.H  = +scene.dataset.h;
      this.sx = this.W / REF_W;
      this.sy = this.H / REF_H;
      this.s  = Math.min(this.sx, this.sy); // facteur uniforme pour les tailles

      this.canvasU = document.getElementById(underCanvasId);
      this.canvasO = document.getElementById(overCanvasId);
      this.logoImg = document.getElementById(imgId);
      if (!this.canvasU || !this.canvasO || !this.logoImg) return;

      this.ctxU = this.canvasU.getContext('2d');
      this.ctxO = this.canvasO.getContext('2d');

      /* Coordonnées pré-scalées */
      const sp = (p) => ({ x: p.x * this.sx, y: p.y * this.sy });
      this.zones     = rawZones.map(pts => pts.map(sp));
      this.metalPts  = metalShinePoints.map(sp);
      this.gStarDefs = goldStarDefs.map(sp);
      this.wStarDefs = whiteStarDefs.map(sp);

      /* État néon */
      this.neonPhases = rawZones.map(() => Math.random() * Math.PI * 2);
      this.neonSpeeds = rawZones.map(() => 0.004 + Math.random() * 0.005);

      /* Particules et étoiles */
      this.metalShines  = this.metalPts.map(p => this._makeMetalShine(p));
      this.goldStars    = this._makeStars(this.gStarDefs, 220, 600);
      this.whiteStars   = this._makeStars(this.wStarDefs, 180, 500);
      this.embers       = [];
      this.shootingStars = [];
      this.shootTimer   = 200 + Math.random() * 200;

      this.t = 0;
      this.isHovered = false;
      this.hoverIntensity = 0;

      scene.addEventListener('mouseenter', () => this.isHovered = true);
      scene.addEventListener('mouseleave', () => this.isHovered = false);

      this.valid = true;
    }

    _makeMetalShine(p) {
      return {
        x: p.x, y: p.y, alpha: 0, targetAlpha: 0,
        timer: Math.floor(Math.random() * 120),
        // plancher en px pour rester visible même à petite taille
        size: Math.max(4, sc(12 + Math.random() * 14, this.s)),
        active: false
      };
    }

    _makeStars(defs, minD, maxD) {
      return defs.map(p => ({ x: p.x, y: p.y, state: 'idle', alpha: 0, scale: 0,
                              timer: minD + Math.random() * (maxD - minD) }));
    }

    getNeonI(zi) {
      const breathe = 0.10 * Math.sin(this.t * this.neonSpeeds[zi] + this.neonPhases[zi]);
      return Math.min(1, 0.65 + breathe + this.hoverIntensity * 0.35);
    }

    drawNeon() {
      const ctxU = this.ctxU, s = this.s, hI = this.hoverIntensity;
      this.zones.forEach((pts, zi) => {
        const f = this.getNeonI(zi);
        pts.forEach(p => {
          const glowR = sc(16 + hI * 12, s);
          const g = ctxU.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          g.addColorStop(0,   `rgba(255,60,20,${0.38*f})`);
          g.addColorStop(0.4, `rgba(255,30,10,${0.16*f})`);
          g.addColorStop(1,   'rgba(0,0,0,0)');
          ctxU.fillStyle = g;
          ctxU.beginPath(); ctxU.arc(p.x, p.y, glowR, 0, Math.PI*2); ctxU.fill();

          const cR = sc(3.5 + hI * 2, s);
          const gc = ctxU.createRadialGradient(p.x, p.y, 0, p.x, p.y, cR);
          gc.addColorStop(0,   `rgba(255,210,150,${0.65*f})`);
          gc.addColorStop(0.5, `rgba(255,90,40,${0.28*f})`);
          gc.addColorStop(1,   'rgba(0,0,0,0)');
          ctxU.fillStyle = gc;
          ctxU.beginPath(); ctxU.arc(p.x, p.y, cR, 0, Math.PI*2); ctxU.fill();
        });
      });
    }

    _updateMetalShine(ms, nI) {
      ms.timer--;
      if (ms.timer <= 0) {
        if (!ms.active) {
          if (nI > 0.30 && Math.random() < 0.62) {
            ms.active = true; ms.targetAlpha = 0.38 + Math.random() * 0.42; // 0.38-0.80
            ms.timer = Math.floor(Math.random() * 55 + 20);
          } else { ms.timer = Math.floor(Math.random() * 55 + 15); }
        } else {
          ms.active = false; ms.targetAlpha = 0;
          ms.timer = Math.floor(Math.random() * 80 + 25);
        }
      }
      ms.alpha += (ms.targetAlpha - ms.alpha) * 0.10;
    }

    drawMetalShines() {
      const ctxU = this.ctxU, s = this.s;
      const avgI = this.zones.reduce((acc, _, i) => acc + this.getNeonI(i), 0) / this.zones.length;
      this.metalShines.forEach(ms => {
        this._updateMetalShine(ms, avgI);
        if (ms.alpha < 0.005) return;

        // ── Halo doré elliptique (reflet métal) ──
        const g = ctxU.createRadialGradient(ms.x, ms.y, 0, ms.x, ms.y, ms.size);
        g.addColorStop(0,   `rgba(255,240,180,${ms.alpha})`);
        g.addColorStop(0.3, `rgba(255,210,110,${ms.alpha*0.55})`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctxU.fillStyle = g;
        ctxU.save(); ctxU.translate(ms.x, ms.y); ctxU.scale(1, 0.55);
        ctxU.beginPath(); ctxU.arc(0, 0, ms.size, 0, Math.PI*2); ctxU.fill(); ctxU.restore();

        // ── Cœur brillant blanc (point spéculaire) ──
        const coreR = Math.max(1.5, sc(3, s));
        const gc = ctxU.createRadialGradient(ms.x, ms.y, 0, ms.x, ms.y, coreR);
        gc.addColorStop(0,   `rgba(255,255,255,${ms.alpha * 1.0})`);
        gc.addColorStop(0.4, `rgba(255,248,210,${ms.alpha * 0.7})`);
        gc.addColorStop(1,   'rgba(0,0,0,0)');
        ctxU.fillStyle = gc; ctxU.beginPath(); ctxU.arc(ms.x, ms.y, coreR, 0, Math.PI*2); ctxU.fill();

      });
    }

    spawnEmber(pts) {
      if (this.embers.length > 60) return;
      const src = pts[Math.floor(Math.random() * pts.length)];
      this.embers.push({
        x: src.x + (Math.random()-0.5) * sc(5, this.s),
        y: src.y + (Math.random()-0.5) * sc(5, this.s),
        vx: (Math.random()-0.5) * 0.6 * this.sx,
        vy: -(Math.random() * 0.8 + 0.15) * this.sy,
        life: 1, decay: 0.016 + Math.random() * 0.018,
        size: sc(Math.random() * 1.4 + 0.3, this.s)
      });
    }

    drawEmbers() {
      const ctxU = this.ctxU;
      for (let i = this.embers.length - 1; i >= 0; i--) {
        const e = this.embers[i];
        e.x += e.vx; e.y += e.vy; e.vy += 0.022 * this.sy; e.vx *= 0.99; e.life -= e.decay;
        if (e.life <= 0) { this.embers.splice(i, 1); continue; }
        ctxU.globalAlpha = e.life * 0.7;
        ctxU.fillStyle = `rgb(255,${Math.floor(80 + e.life * 130)},30)`;
        ctxU.beginPath(); ctxU.arc(e.x, e.y, e.size * e.life, 0, Math.PI*2); ctxU.fill();
      }
      ctxU.globalAlpha = 1;
    }

    spawnShootingStar() {
      const hI = this.hoverIntensity, s = this.s;
      const big = Math.random() < 0.4 || hI > 0.5;
      this.shootingStars.push({
        x:     sc(-20 + Math.random() * 80,  this.sx),
        y:     sc(-10 + Math.random() * 70,  this.sy),
        vx:    (4.5 + Math.random() * 3.5) * this.sx,
        vy:    (1.2 + Math.random() * 1.8) * this.sy,
        len:   sc(big ? 110 + Math.random()*90 : 65 + Math.random()*55, s),
        width: sc(big ? 2.4 : 1.5, s),
        life:  1, decay: 0.018 + Math.random() * 0.012,
        glow:  sc(big ? 10 : 5, s)
      });
    }

    drawShootingStars() {
      const ctxO = this.ctxO;
      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const s = this.shootingStars[i];
        s.x += s.vx; s.y += s.vy; s.life -= s.decay;
        if (s.life <= 0 || s.x > this.W + 60 || s.y > this.H + 30) {
          this.shootingStars.splice(i, 1); continue;
        }
        const angle = Math.atan2(s.vy, s.vx);
        const tx = s.x - Math.cos(angle) * s.len, ty = s.y - Math.sin(angle) * s.len;

        const glowGrad = ctxO.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.glow * 2.8);
        glowGrad.addColorStop(0,   `rgba(255,248,210,${s.life*0.55})`);
        glowGrad.addColorStop(0.5, `rgba(255,220,130,${s.life*0.22})`);
        glowGrad.addColorStop(1,   'rgba(0,0,0,0)');
        ctxO.fillStyle = glowGrad;
        ctxO.beginPath(); ctxO.arc(s.x, s.y, s.glow * 2.8, 0, Math.PI*2); ctxO.fill();

        const grad = ctxO.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0,    'rgba(255,255,255,0)');
        grad.addColorStop(0.55, `rgba(255,245,200,${s.life*0.42})`);
        grad.addColorStop(1,    `rgba(255,255,255,${s.life*0.95})`);
        ctxO.strokeStyle = grad; ctxO.lineWidth = s.width; ctxO.lineCap = 'round';
        ctxO.beginPath(); ctxO.moveTo(tx, ty); ctxO.lineTo(s.x, s.y); ctxO.stroke();

        const hg = ctxO.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.glow);
        hg.addColorStop(0,   `rgba(255,255,255,${s.life*0.92})`);
        hg.addColorStop(0.5, `rgba(255,240,170,${s.life*0.5})`);
        hg.addColorStop(1,   'rgba(0,0,0,0)');
        ctxO.fillStyle = hg; ctxO.beginPath(); ctxO.arc(s.x, s.y, s.glow, 0, Math.PI*2); ctxO.fill();
      }
    }

    updateStars(stars, minD, maxD) {
      const hI = this.hoverIntensity;
      stars.forEach(s => {
        if (s.state === 'idle') {
          s.timer -= (1 + hI * 2.5);
          if (s.timer <= 0) { s.state = 'rising'; s.alpha = 0; s.scale = 0.2; }
        } else if (s.state === 'rising') {
          s.alpha += 0.045; s.scale += 0.05;
          if (s.alpha >= 0.85) { s.alpha = 0.85; s.scale = 1; s.state = 'hold'; s.timer = 8 + Math.floor(Math.random()*12); }
        } else if (s.state === 'hold') {
          s.alpha = 0.85 + 0.13 * Math.sin(Date.now() * 0.004 + s.x);
          s.timer--;
          if (s.timer <= 0) s.state = 'falling';
        } else if (s.state === 'falling') {
          s.alpha -= 0.03; s.scale += 0.015;
          if (s.alpha <= 0) { s.alpha = 0; s.scale = 0; s.state = 'idle'; s.timer = minD + Math.random() * (maxD - minD); }
        }
      });
    }

    drawStar4(x, y, alpha, scale, isGold) {
      if (alpha < 0.005) return;
      const ctxO = this.ctxO, s = this.s;
      ctxO.save(); ctxO.translate(x, y);
      // planchers min pour rester visibles à petite taille
      const long   = Math.max(9,   sc(20,  s)) * scale;
      const short_ = Math.max(3.5, sc(6,   s)) * scale;
      const thick  = Math.max(0.6, sc(1.3, s)) * scale * alpha;
      [[0, long], [Math.PI/2, long], [Math.PI/4, short_], [-Math.PI/4, short_]].forEach(([angle, len], i) => {
        ctxO.save(); ctxO.rotate(angle);
        const gP = ctxO.createLinearGradient(0, -len, 0, len);
        if (isGold) {
          gP.addColorStop(0, 'rgba(255,255,200,0)'); gP.addColorStop(0.35, `rgba(255,235,140,${alpha*0.55})`);
          gP.addColorStop(0.5, `rgba(255,255,255,${alpha*0.9})`); gP.addColorStop(0.65, `rgba(255,235,140,${alpha*0.55})`);
          gP.addColorStop(1, 'rgba(255,255,200,0)');
        } else {
          gP.addColorStop(0, 'rgba(255,255,255,0)'); gP.addColorStop(0.35, `rgba(210,228,255,${alpha*0.5})`);
          gP.addColorStop(0.5, `rgba(255,255,255,${alpha*0.9})`); gP.addColorStop(0.65, `rgba(210,228,255,${alpha*0.5})`);
          gP.addColorStop(1, 'rgba(255,255,255,0)');
        }
        const w = thick * (i < 2 ? 1 : 0.65);
        ctxO.beginPath(); ctxO.moveTo(0, -len); ctxO.quadraticCurveTo(w, 0, 0, len);
        ctxO.quadraticCurveTo(-w, 0, 0, -len);
        ctxO.fillStyle = gP; ctxO.fill(); ctxO.restore();
      });
      const sr = Math.max(2.5, sc(4.5, s));
      const sp = ctxO.createRadialGradient(0, 0, 0, 0, 0, sr);
      if (isGold) {
        sp.addColorStop(0, `rgba(255,255,255,${alpha*0.95})`);
        sp.addColorStop(0.4, `rgba(255,235,120,${alpha*0.7})`);
        sp.addColorStop(1, 'rgba(255,200,50,0)');
      } else {
        sp.addColorStop(0, `rgba(255,255,255,${alpha*0.95})`);
        sp.addColorStop(0.4, `rgba(190,215,255,${alpha*0.6})`);
        sp.addColorStop(1, 'rgba(170,205,255,0)');
      }
      ctxO.fillStyle = sp; ctxO.beginPath(); ctxO.arc(0, 0, sr, 0, Math.PI*2); ctxO.fill();
      ctxO.restore();
    }

    updateHoverGlow() {
      const h = this.hoverIntensity, s = this.s;
      if (h > 0.04) {
        this.logoImg.style.filter = `drop-shadow(0 0 ${sc(8+18*h,s).toFixed(1)}px rgba(255,55,20,${(0.22+0.30*h).toFixed(2)})) drop-shadow(0 0 ${sc(22+32*h,s).toFixed(1)}px rgba(255,70,20,${(0.08+0.14*h).toFixed(2)})) brightness(${(1+0.20*h).toFixed(2)})`;
      } else {
        this.logoImg.style.filter = `drop-shadow(0 0 ${sc(6,s).toFixed(1)}px rgba(255,45,15,0.10)) brightness(1)`;
      }
    }

    tick() {
      if (!this.valid) return;
      this.ctxU.clearRect(0, 0, this.W, this.H);
      this.ctxO.clearRect(0, 0, this.W, this.H);
      this.hoverIntensity += ((this.isHovered ? 1 : 0) - this.hoverIntensity) * 0.07;

      this.drawNeon();
      this.drawMetalShines();
      this.drawEmbers();

      this.zones.forEach(pts => {
        if (Math.random() < 0.025 + this.hoverIntensity * 0.10) this.spawnEmber(pts);
      });

      this.shootTimer--;
      if (this.shootTimer <= 0) {
        this.shootTimer = Math.floor((this.isHovered ? 80 : 160) + Math.random() * 180);
        this.spawnShootingStar();
      }

      this.updateStars(this.goldStars, 220, 600);
      this.updateStars(this.whiteStars, 180, 500);
      this.drawShootingStars();
      this.goldStars.forEach(s  => this.drawStar4(s.x, s.y, s.alpha, s.scale, true));
      this.whiteStars.forEach(s => this.drawStar4(s.x, s.y, s.alpha, s.scale, false));

      this.updateHoverGlow();
      this.t++;
    }
  }

  /* ── Instanciation des deux logos ── */
  const scenes = [
    new LogoScene('navLogoScene', 'navLogoFxUnder', 'navLogoFxOver', 'navLogoImg'),
    new LogoScene('ftLogoScene',  'ftLogoFxUnder',  'ftLogoFxOver',  'ftLogoImg'),
  ].filter(s => s.valid);

  function loop() {
    scenes.forEach(s => s.tick());
    requestAnimationFrame(loop);
  }
  if (scenes.length) loop();

})();
