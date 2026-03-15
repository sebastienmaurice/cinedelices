/**
 * badges.js — Moteur unique de tous les badges Signature
 * ======================================================
 *
 * Auto-init au chargement :
 *   document.querySelectorAll("[data-badge]") → BadgeRegistry.create(type, el).init()
 *
 * Badges CSS-only (coût JS = 0%) :
 *   strange, harry-potter, indiana-jones, freddy, ready-player
 *
 * Badges Canvas/RAF :
 *   matrix (~3% CPU, 0% si hors écran via IntersectionObserver)
 *
 * Architecture :
 *   BadgeBase         → classe mère (IntersectionObserver, pause/resume)
 *   BadgeStrange      → Doctor Strange CSS-only
 *   BadgeHarryPotter  → Harry Potter CSS-only
 *   MatrixRain        → moteur de pluie Matrix (Canvas RAF)
 *   BadgeMatrix       → wrapper BadgeBase → MatrixRain
 *   BadgeRegistry     → factory {type → class}
 */

'use strict';

/* ======================================================
   BADGE BASE — gestion cycle de vie + IntersectionObserver
====================================================== */
class BadgeBase {
  constructor(el) {
    this.el      = el;
    this.wrap    = el.closest('.badge-wrap') || el;
    this._active = false;
    this._obs    = null;
  }

  init() {
    this._setupObserver();
    this._buildDOM();
    this._bindEvents();
    return this;
  }

  _setupObserver() {
    this._obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) this.resume();
        else this.pause();
      });
    }, { threshold: 0.1 });
    this._obs.observe(this.wrap);
  }

  /** Surcharger dans les sous-classes si nécessaire */
  _buildDOM()   {}
  _bindEvents() {}
  resume()      { this._active = true; }
  pause()       { this._active = false; }
  destroy()     { if (this._obs) this._obs.disconnect(); }
}

/* ======================================================
   BADGE STRANGE — Doctor Strange (CSS-only)
   Vert mystique #3fe0a1 → orange #fd6b04 au hover
====================================================== */
class BadgeStrange extends BadgeBase {
  _buildDOM() {
    /* DOM rendu statiquement par _badge-strange.ejs — rien à construire ici */
    this.el.classList.add('badge--strange');
  }
}

/* ======================================================
   BADGE HARRY POTTER — Patronus (CSS-only)
   Bleu #7BD3FF → blanc pur au hover
====================================================== */
class BadgeHarryPotter extends BadgeBase {
  _buildDOM() {
    this.el.classList.add('badge--harry-potter');
  }
}

/* ======================================================
   MATRIX RAIN — moteur Canvas RAF
   Normal  : pluie 2 plans (clair/sombre) + intermittence
             ~20% colonnes avant passent SUR la photo
   Hover   : corruption rouge par vagues + éclair + parasites
   Locked  : pluie ralentie, pas de hover/éclair/shake
====================================================== */
const GLYPHS =
  'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' +
  '0123456789:・."=*+-<>';
const rg = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
const BG = [20, 34, 52]; // #142234

class MatrixRain {
  constructor(canvasBack, canvasOver, photoEl, opts = {}) {
    this.cvB    = canvasBack;
    this.cvO    = canvasOver;
    this.ctxB   = canvasBack.getContext('2d');
    this.ctxO   = canvasOver ? canvasOver.getContext('2d') : null;
    this.photo  = photoEl;
    this.photoRing = photoEl
      ? photoEl.closest('.badge')?.querySelector('.badge__photo-ring')
      : null;
    this.w      = canvasBack.width;
    this.h      = canvasBack.height;
    this.fs     = opts.fontSize || 12;
    this.spd    = opts.speed    || 0.85;
    this.locked = !!opts.locked;

    this._photoSize = () => {
      const ow = this.photo
        ? this.photo.offsetWidth || this.photo.naturalWidth
        : 0;
      return ow > 0 ? ow : Math.round(this.w * 0.49);
    };

    this.hovered    = false;
    this.hoverT     = 0;
    this.frame      = 0;
    this.raf        = null;

    this.corruptWave  = 0;
    this.flashAlpha   = 0;
    this.bolt         = null;
    this.boltLife     = 0;
    this.boltTimer    = 0;
    this.impacting    = false;
    this.tearPath     = null;

    this.shakeTimer = 60 + Math.floor(Math.random() * 120);
    this.shaking    = false;

    const nc = Math.floor(this.w / this.fs);
    this.drops = Array.from({ length: nc }, () => {
      const plan     = Math.random() < 0.35 ? 1 : 0;
      const overPhoto = plan === 1 && Math.random() < 0.2;
      return {
        y:        -Math.random() * this.h * 2.5,
        speed:    plan === 1
          ? (0.75 + Math.random() * 0.8)  * this.fs
          : (0.4  + Math.random() * 0.55) * this.fs,
        tailLen:  plan === 1
          ? 16 + Math.floor(Math.random() * 22)
          : 10 + Math.floor(Math.random() * 16),
        chars:    Array.from({ length: 55 }, rg),
        mutT:     0,
        mutRate:  plan === 1
          ? 3 + Math.floor(Math.random() * 5)
          : 6 + Math.floor(Math.random() * 8),
        plan,
        overPhoto,
        active:   false,
        sleepT:   Math.floor(Math.random() * 220),
        activeT:  0,
        bright:   plan === 1
          ? 0.75 + Math.random() * 0.25
          : 0.2  + Math.random() * 0.4,
      };
    });

    this._tick = this._tick.bind(this);

    this._visible = true;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        this._visible = e.isIntersecting;
        if (this._visible && !this.raf) {
          this.raf = requestAnimationFrame(this._tick);
        }
      });
    }, { threshold: 0 });
    obs.observe(this.cvB);

    this.raf = requestAnimationFrame(this._tick);
  }

  setHover(v) {
    if (this.locked) return;
    this.hovered = v;
    if (v) {
      this.boltTimer = 40;
      this.bolt = null;
    }
    if (!v && this.ctxO) this.ctxO.clearRect(0, 0, this.w, this.h);
  }

  _newBolt() {
    const w = this.w, h = this.h;
    const dir = Math.random() > 0.5 ? 1 : -1;
    const x0  = dir > 0 ? w * 0.06 : w * 0.94;
    const y0  = h * (0.04 + Math.random() * 0.2);
    const x1  = dir > 0 ? w * 0.94 : w * 0.06;
    const y1  = h * (0.72 + Math.random() * 0.22);
    const steps = 5 + Math.floor(Math.random() * 5);
    const pts = [{ x: x0, y: y0 }];
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      pts.push({
        x: x0 + (x1 - x0) * t + (Math.random() - 0.5) * w * 0.22,
        y: y0 + (y1 - y0) * t + (Math.random() - 0.5) * h * 0.09,
      });
    }
    pts.push({ x: x1, y: y1 });
    this.bolt     = pts;
    this.boltLife = 0;
    this.impacting = false;

    const angle     = Math.atan2(y1 - y0, x1 - x0);
    const tearSteps = 28 + Math.floor(Math.random() * 14);
    const tearPts   = [];
    const cx = w / 2, cy = h / 2;
    const maxJag = 9 + Math.random() * 8;
    for (let i = 0; i <= tearSteps; i++) {
      const t   = i / tearSteps;
      const bx  = t * w;
      const baseY = cy + Math.tan(angle) * (bx - cx);
      const jag   =
        (Math.random() - 0.5) * 2 * maxJag +
        Math.sin(i * 2.3) * maxJag * 0.4 +
        Math.sin(i * 5.7 + 1.1) * maxJag * 0.25;
      tearPts.push({ x: bx, y: baseY + jag });
    }
    this.tearPath = tearPts;
  }

  _drawBolt(ht) {
    const ctx = this.ctxO;
    if (!ctx || ht < 0.1) return;

    if (!this.bolt) {
      this.boltTimer--;
      if (this.boltTimer <= 0 && this.hovered) {
        this._newBolt();
        this.boltTimer = 80 + Math.floor(Math.random() * 80);
      }
      return;
    }

    this.boltLife++;
    if (this.boltLife > 45) { this.bolt = null; this.tearPath = null; return; }

    const f1      = Math.sin(this.boltLife * 0.8);
    const f2      = Math.sin(this.boltLife * 1.9);
    const flicker = f1 * f2;
    const visible = flicker > -0.2;

    if (this.boltLife === 1) {
      this.flashAlpha = 0.55;
      if (this.photoRing) {
        this.photoRing.classList.remove('badge__photo-ring--impact');
        void this.photoRing.offsetWidth;
        this.photoRing.classList.add('badge__photo-ring--impact');
        setTimeout(() => {
          if (this.photoRing) this.photoRing.classList.remove('badge__photo-ring--impact');
        }, 380);
      }
    }

    if (!visible) return;

    const pts       = this.bolt;
    const isImpact  = this.boltLife < 10;
    const intensity = ht * (0.6 + Math.abs(flicker) * 0.4);
    const impactMult = isImpact ? 4.0 : 1.0;

    if (this.photo && this.photo.complete) {
      const pw  = this._photoSize();
      const cr  = pw / 2;
      const cx2 = this.w / 2;
      const cy2 = this.h / 2;
      const px  = cx2 - cr;
      const py  = cy2 - cr;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx2, cy2, cr, 0, Math.PI * 2);
      ctx.clip();

      const nbStries = Math.floor((20 + intensity * 40) * impactMult);
      for (let s = 0; s < nbStries; s++) {
        const sy  = py + Math.random() * pw;
        const sw2 = pw * (0.3 + Math.random() * 0.8);
        const sx  = px + Math.random() * pw * 0.4;
        const sa  = Math.min(0.98, (0.28 + Math.random() * 0.6) * intensity * (isImpact ? 1.8 : 1));
        ctx.fillStyle = Math.random() > 0.35 ? `rgba(255,255,255,${sa})` : `rgba(230,15,0,${sa})`;
        ctx.fillRect(sx, sy, sw2, isImpact ? 2 + Math.floor(Math.random() * 6) : 1 + Math.floor(Math.random() * 4));
      }

      const nbBlocs = Math.floor((10 + intensity * 18) * impactMult);
      for (let b = 0; b < nbBlocs; b++) {
        const bx  = px + Math.random() * pw;
        const by  = py + Math.random() * pw;
        const bw2 = isImpact ? 8 + Math.random() * 50 : 4 + Math.random() * 30;
        const bh2 = isImpact ? 3 + Math.random() * 16 : 2 + Math.random() * 8;
        const ba  = Math.min(0.95, (0.32 + Math.random() * 0.55) * intensity * (isImpact ? 1.6 : 1));
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(0,255,65,${ba})` : `rgba(210,0,0,${ba})`;
        ctx.fillRect(bx, by, bw2, bh2);
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx2, cy2, cr, 0, Math.PI * 2);
      ctx.clip();
      const voileBase = isImpact ? 0.96 : 0.55;
      const voileA    = intensity * voileBase * (isImpact ? 1 : Math.abs(flicker));
      if (voileA > 0.04) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(0.92, voileA * 0.85)})`;
        ctx.fillRect(px, py, pw, pw);
        if (!isImpact) {
          ctx.globalAlpha = Math.max(0, 1 - voileA);
          ctx.drawImage(this.photo, px + (Math.random() - 0.5) * 8, py, pw, pw);
          ctx.globalAlpha = 1;
        }
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(${isImpact ? 180 : 120},${isImpact ? 0 : 30},0,${isImpact ? 0.6 : 0.35})`;
        ctx.beginPath();
        ctx.arc(cx2, cy2, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      ctx.restore();
    }

    const angle = Math.atan2(pts[pts.length - 1].y - pts[0].y, pts[pts.length - 1].x - pts[0].x);
    const cx    = this.w / 2, cy = this.h / 2;

    ctx.save();

    if (this.photo && this.photo.complete && this.tearPath && (this.boltLife < 10 || Math.abs(flicker) > 0.45)) {
      const shift = 8 + Math.floor(intensity * 12);
      const pw    = this._photoSize();
      const ppx   = (this.w - pw) / 2;
      const ppy   = (this.h - pw) / 2;
      const cr    = pw / 2;
      const tear  = this.tearPath;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = `rgb(${BG[0]},${BG[1]},${BG[2]})`;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(this.w + 10, -10);
      ctx.lineTo(tear[tear.length - 1].x, tear[tear.length - 1].y);
      for (let i = tear.length - 2; i >= 0; i--) ctx.lineTo(tear[i].x, tear[i].y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(this.photo, ppx - shift, ppy, pw, pw);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tear[0].x, tear[0].y);
      for (let i = 1; i < tear.length; i++) ctx.lineTo(tear[i].x, tear[i].y);
      ctx.lineTo(this.w + 10, this.h + 10);
      ctx.lineTo(-10, this.h + 10);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(this.photo, ppx + shift, ppy, pw, pw);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha    = intensity * 0.55;
      ctx.strokeStyle    = this.corruptWave > 0.4 ? 'rgba(220,30,0,0.9)' : 'rgba(0,220,60,0.8)';
      ctx.lineWidth      = 1.2;
      ctx.shadowBlur     = 6;
      ctx.shadowColor    = this.corruptWave > 0.4 ? '#ff2200' : '#00ff41';
      ctx.beginPath();
      ctx.moveTo(tear[0].x, tear[0].y);
      for (let i = 1; i < tear.length; i++) ctx.lineTo(tear[i].x, tear[i].y);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    ctx.globalAlpha = intensity * 0.4;
    ctx.strokeStyle = '#ff3300';
    ctx.lineWidth   = 14;
    ctx.shadowBlur  = 32;
    ctx.shadowColor = '#cc1100';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    ctx.globalAlpha = intensity * 0.95;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#ffdd66';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    ctx.globalAlpha = intensity * 0.18;
    ctx.fillStyle   = '#ffee88';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillRect(-this.w, -3, this.w * 2, 6);
    ctx.restore();

    ctx.restore();
  }

  _drawNoise(ht) {
    if (ht < 0.05 || !this.photo || !this.photo.complete) return;
    const ctx = this.ctxB;
    const { w, h } = this;
    const pw  = this._photoSize();
    const px  = (w - pw) / 2;
    const py  = (h - pw) / 2;
    const cr  = pw / 2;
    const cx  = w / 2, cy = h / 2;

    const hasBolt  = !!this.bolt;
    const paraLevel = hasBolt ? 0 : ht * 0.45;
    if (paraLevel < 0.02) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.clip();

    const ns = Math.floor(paraLevel * 60 * (0.4 + Math.random() * 0.6));
    for (let s = 0; s < ns; s++) {
      const sy  = py + Math.random() * pw;
      const sw2 = pw * (0.3 + Math.random() * 0.8);
      const sx  = px + Math.random() * pw * 0.4;
      const sa  = (0.2 + Math.random() * 0.5) * paraLevel;
      ctx.fillStyle = Math.random() > 0.38 ? `rgba(255,255,255,${sa})` : `rgba(210,15,0,${sa})`;
      ctx.fillRect(sx, sy, sw2, 1 + Math.floor(Math.random() * 4));
    }

    const nb = Math.floor(paraLevel * 18 * (0.3 + Math.random() * 0.7));
    for (let b = 0; b < nb; b++) {
      const bx  = px + Math.random() * pw;
      const by  = py + Math.random() * pw;
      const bw2 = 3 + Math.random() * 24;
      const bh2 = 2 + Math.random() * 7;
      const ba  = (0.18 + Math.random() * 0.42) * paraLevel;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(0,200,50,${ba})` : `rgba(190,0,0,${ba})`;
      ctx.fillRect(bx, by, bw2, bh2);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = `rgba(0,0,0,${paraLevel * 0.35})`;
    ctx.fillRect(px, py, pw, pw);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(160,10,0,${paraLevel * 0.3})`;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    ctx.restore();
  }

  _drawFlash() {
    if (this.flashAlpha <= 0) return;
    const ctx = this.ctxO;
    if (!ctx) { this.flashAlpha = 0; return; }
    const pw = this._photoSize();
    const cx = this.w / 2, cy = this.h / 2, cr = pw / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = this.flashAlpha * 0.6;
    ctx.fillStyle   = '#ffffff';
    ctx.fillRect(cx - cr, cy - cr, pw, pw);
    ctx.restore();
    this.flashAlpha = Math.max(0, this.flashAlpha - 0.12);
  }

  _updateShake() {
    if (!this.photo) return;
    if (!this.hovered &&
        !this.photo.classList.contains('badge__photo--vibrate') &&
        !this.photo.classList.contains('badge__photo--shake')) {
      this.photo.classList.add('badge__photo--vibrate');
    }
    if (this.hovered) {
      this.photo.classList.remove('badge__photo--vibrate', 'badge__photo--shake', 'badge__photo--blur');
      return;
    }
    if (this.shaking) return;
    this.shakeTimer--;
    if (this.shakeTimer <= 0) {
      this.shaking = true;
      const type = Math.random() < 0.55 ? 'shake' : 'blur';
      this.photo.classList.remove('badge__photo--vibrate');
      this.photo.classList.add(`badge__photo--${type}`);
      const dur = type === 'shake' ? 500 : 600;
      setTimeout(() => {
        if (this.photo) {
          this.photo.classList.remove(`badge__photo--${type}`);
          this.photo.classList.add('badge__photo--vibrate');
        }
        this.shaking    = false;
        this.shakeTimer = 60 + Math.floor(Math.random() * 120);
      }, dur);
    }
  }

  _drawColumn(ctx, d, col, ht, corruptWave) {
    const { fs, h } = this;
    const x       = col * fs + fs / 2;
    const headRow = Math.floor(d.y / fs);

    for (let j = 0; j < d.tailLen; j++) {
      const row = headRow - j;
      if (row < 0 || row * fs > h) continue;
      const py    = row * fs;
      const glyph = d.chars[row % d.chars.length];
      const ratio = 1 - j / d.tailLen;

      const colCorrupt = ht * corruptWave * (0.6 + d.bright * 0.4);

      if (j === 0) {
        const rh = Math.round(210 + colCorrupt * 45);
        const gh = Math.round(255 * (1 - colCorrupt * 0.82));
        const bh = Math.round(190 * (1 - colCorrupt * 0.95));
        ctx.fillStyle  = `rgba(${rh},${gh},${bh},0.95)`;
        const isOver   = ctx === this.ctxO;
        ctx.shadowBlur = isOver
          ? 14
          : ht < 0.05 ? (d.plan === 1 ? 10 : 5) : 0;
        ctx.shadowColor = colCorrupt > 0.4 ? '#ff2200' : '#00ff41';
      } else {
        const isOver = ctx === this.ctxO;
        const base   = d.plan === 1
          ? Math.round(65 + ratio * 190 * d.bright)
          : Math.round(25 + ratio * 110 * d.bright);
        const rH = Math.round(ratio * 200 * colCorrupt);
        const gH = Math.round(base * (1 - colCorrupt * 0.9));
        const bH = Math.round(base * 0.18 * (1 - colCorrupt));
        const a  = ratio * (isOver
          ? d.plan === 1 ? 0.92 : 0.6
          : d.plan === 1 ? 0.75 : 0.4);
        ctx.fillStyle  = `rgba(${rH},${gH},${bH},${a})`;
        ctx.shadowBlur = 0;
      }
      ctx.fillText(glyph, x, py);
    }
    ctx.shadowBlur = 0;
  }

  _tick() {
    if (!this._visible) { this.raf = null; return; }
    const { ctxB: ctx, ctxO, w, h, fs } = this;
    this.frame++;

    this.hoverT += ((this.hovered ? 1 : 0) - this.hoverT) * 0.055;
    const ht = this.hoverT;

    if (ht > 0.05) {
      const base = 0.55 * ht;
      this.corruptWave =
        base +
        0.35 * Math.sin(this.frame * 0.04) +
        0.2  * Math.sin(this.frame * 0.09 + 1.2) +
        0.12 * Math.sin(this.frame * 0.15 + 2.5);
      this.corruptWave = Math.max(0, Math.min(1, this.corruptWave));
    } else {
      this.corruptWave = 0;
    }

    ctx.fillStyle = `rgba(${BG[0]},${BG[1]},${BG[2]},0.13)`;
    ctx.fillRect(0, 0, w, h);

    if (ctxO) {
      ctxO.save();
      ctxO.globalCompositeOperation = 'destination-out';
      ctxO.fillStyle = 'rgba(0,0,0,0.18)';
      ctxO.fillRect(0, 0, w, h);
      ctxO.restore();
    }

    ctx.font      = `bold ${fs}px "Courier New", monospace`;
    ctx.textAlign = 'center';

    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];

      if (!d.active) {
        d.sleepT--;
        if (d.sleepT <= 0) {
          d.active  = true;
          d.activeT = 80 + Math.floor(Math.random() * 200);
          d.y       = -(d.tailLen * fs) - Math.random() * h * 0.3;
          d.speed   = d.plan === 1
            ? (0.75 + Math.random() * 0.8)  * fs
            : (0.4  + Math.random() * 0.55) * fs;
          d.tailLen = d.plan === 1
            ? 16 + Math.floor(Math.random() * 22)
            : 10 + Math.floor(Math.random() * 16);
        }
        continue;
      }
      d.activeT--;
      if (d.activeT <= 0) {
        d.active  = false;
        d.sleepT  = d.plan === 1
          ? 50  + Math.floor(Math.random() * 150)
          : 80  + Math.floor(Math.random() * 200);
        continue;
      }

      d.mutT++;
      if (d.mutT >= d.mutRate) {
        d.mutT = 0;
        d.chars[Math.floor(Math.random() * d.chars.length)] = rg();
      }

      const drawCtx = d.overPhoto && ctxO ? ctxO : ctx;
      if (drawCtx === ctxO) {
        const fsFG = Math.round(this.fs * 1.35);
        drawCtx.font      = `bold ${fsFG}px "Courier New", monospace`;
        drawCtx.textAlign = 'center';
      }

      this._drawColumn(drawCtx, d, i, ht, this.corruptWave);

      d.y += d.speed * 0.85;
      if (d.y - d.tailLen * fs > h) {
        d.active = false;
        d.sleepT = 30 + Math.floor(Math.random() * 100);
      }
    }

    this._drawNoise(ht);
    this._drawFlash();
    if (!this.locked) this._drawBolt(ht);
    if (!this.locked) this._updateShake();

    this.raf = requestAnimationFrame(this._tick);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

/* ======================================================
   BADGE MATRIX — wrapper BadgeBase → MatrixRain
====================================================== */
class BadgeMatrix extends BadgeBase {
  constructor(el) {
    super(el);
    this._rain = null;
  }

  /* BadgeBase observer gère CSS-only — MatrixRain a le sien */
  _setupObserver() { /* MatrixRain gère sa propre visibilité via IntersectionObserver */ }

  _buildDOM() {
    const el   = this.el;
    const wrap = this.wrap;

    const bid    = wrap.dataset.badgeId || '';
    const size   = wrap.dataset.size || 'md';
    const locked = el.classList.contains('badge--locked');

    const canvasB = bid
      ? document.getElementById('mc-' + bid)
      : el.querySelector('.badge__canvas');
    const canvasO = (bid && !locked)
      ? document.getElementById('mco-' + bid)
      : el.querySelector('.badge__canvas-over');
    const photoEl = el.querySelector('.badge__photo-wrap .badge__photo, .badge__photo');

    if (!canvasB) return;

    const fontSize = size === 'lg' ? 13 : size === 'sm' ? 6 : 10;
    const speed    = locked ? 0.3 : (size === 'lg' ? 0.9 : size === 'sm' ? 0.7 : 0.8);

    this._rain = new MatrixRain(canvasB, canvasO || null, photoEl, { fontSize, speed, locked });
  }

  _bindEvents() {
    if (!this._rain) return;
    this.el.addEventListener('mouseenter', () => this._rain.setHover(true));
    this.el.addEventListener('mouseleave', () => this._rain.setHover(false));
  }

  destroy() {
    if (this._rain) this._rain.destroy();
  }
}

/* ======================================================
   BADGE INDIANA JONES — (CSS-only, placeholder)
====================================================== */
class BadgeIndianaJones extends BadgeBase {
  _buildDOM() { this.el.classList.add('badge--indiana-jones'); }
}

/* ======================================================
   BADGE FREDDY — (CSS-only, placeholder)
====================================================== */
class BadgeFreddy extends BadgeBase {
  _buildDOM() { this.el.classList.add('badge--freddy'); }
}

/* ======================================================
   BADGE READY PLAYER ONE — (CSS-only, placeholder)
====================================================== */
class BadgeReadyPlayer extends BadgeBase {
  _buildDOM() { this.el.classList.add('badge--ready-player'); }
}

/* ======================================================
   REGISTRY — factory {type → class}
====================================================== */
const BadgeRegistry = {
  _map: {
    'strange':       BadgeStrange,
    'harry-potter':  BadgeHarryPotter,
    'matrix':        BadgeMatrix,
    'indiana-jones': BadgeIndianaJones,
    'freddy':        BadgeFreddy,
    'ready-player':  BadgeReadyPlayer,
  },

  create(type, el) {
    const Cls = this._map[type];
    if (!Cls) {
      console.warn('[BadgeRegistry] Type inconnu :', type);
      return { init: () => {} };
    }
    return new Cls(el);
  },
};

/* ======================================================
   AUTO-INIT au DOMContentLoaded
====================================================== */
function initBadges() {
  document.querySelectorAll('[data-badge]').forEach((wrap) => {
    const type    = wrap.dataset.badge;
    const badgeEl = wrap.querySelector('.badge') || wrap;
    if (badgeEl.dataset.badgeInit) return;
    badgeEl.dataset.badgeInit = '1';
    BadgeRegistry.create(type, badgeEl).init();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBadges);
} else {
  initBadges();
}

/* Export pour usage manuel */
if (typeof module !== 'undefined') module.exports = { BadgeRegistry, BadgeBase, MatrixRain };
