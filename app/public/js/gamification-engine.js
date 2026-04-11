/**
 * gamification-engine.js — Ciné Délices
 * Animations canvas pour les cadres de gamification (260×260)
 * Usage : new window.BadgeEngine(containerEl, frameCode, photoSrc)
 */

/* ═══════════════════════════════════════════════════════════════
   CONFIGS — chemins locaux des frames PNG
═══════════════════════════════════════════════════════════════ */
const BADGE_CONFIGS = {

  harry: {
    theme: 'harry-potter',
    badge:  { width: 260, height: 260 },
    frame:  { src: '/images/cadres-gamification/Harry Potter/img/cadre-harry-potter-260x260.png' },
    photo:  { size: 150, left: 56, top: 56, centerX: 131, centerY: 131 },
    ring:   { cx: 131, cy: 131, r: 75 },
    palette: {
      primary:   [120, 190, 255],
      secondary: [200, 235, 255],
      glow:      [80,  150, 255],
    },
    effectTypes: {
      effect_1: { name: 'Sort baguette',     behavior: 'spell' },
      effect_2: { name: 'Étincelles arc',    behavior: 'spark' },
      effect_3: { name: 'Poussière chapeau', behavior: 'dust'  },
    },
    effects: [
      { type: 'effect_1', x: 250, y: 159 },
      { type: 'effect_2', x: 54,  y: 120 },
      { type: 'effect_2', x: 176, y: 70  },
      { type: 'effect_2', x: 30,  y: 88  },
      { type: 'effect_2', x: 222, y: 149 },
      { type: 'effect_3', x: 95,  y: 38  },
      { type: 'effect_3', x: 116, y: 44  },
      { type: 'effect_3', x: 140, y: 46  },
      { type: 'effect_2', x: 101, y: 202 },
      { type: 'effect_2', x: 77,  y: 219 },
      { type: 'effect_2', x: 32,  y: 152 },
    ],
  },

  matrix: {
    badge: { width: 260, height: 260 },
    frame: { src: '/images/cadres-gamification/Matrix/img/cadre-matrix-260x260.png' },
    photo: { size: 150, left: 56, top: 54 },
    ring:  { cx: 131, cy: 129, r: 75 },
    eyes:  [{ x: 55, y: 177 }, { x: 78, y: 177 }],
    codePts: [
      { x: 67, y: 71 }, { x: 83, y: 59 }, { x: 91,  y: 54  },
      { x: 197, y: 79 }, { x: 190, y: 70 }, { x: 117, y: 45 },
      { x: 204, y: 90 }, { x: 168, y: 54 }, { x: 158, y: 50 }, { x: 133, y: 44 },
    ],
    sparkPts: [
      { x: 80, y: 29  }, { x: 55, y: 201 }, { x: 66,  y: 198 },
      { x: 214, y: 150 }, { x: 217, y: 125 }, { x: 40, y: 67 },
      { x: 138, y: 210 }, { x: 31, y: 163 },
    ],
  },

  indiana: {
    badge: { width: 260, height: 260 },
    frame: { src: '/images/cadres-gamification/Indiana Jones/img/cadre-indiana-jones-260x260.png' },
    photo: { size: 152, left: 53, top: 49 },
    ring:  { cx: 129, cy: 125, r: 76 },
    pal: {
      primary:   [200, 135, 15],
      secondary: [255, 210, 80],
      glow:      [255, 160, 30],
      lamp:      [255, 140, 20],
      lampCore:  [255, 220, 120],
      dust:      [220, 170, 60],
    },
    lampPts:    [{ x: 24, y: 102 }, { x: 30, y: 99 }, { x: 30, y: 105 }],
    glintPts:   [{ x: 89.2, y: 29.2 }, { x: 41.2, y: 152.2 }, { x: 221.2, y: 109.2 }, { x: 113.2, y: 220.2 }, { x: 159.2, y: 21.2 }],
    ringPts:    [{ x: 121.2, y: 43.2 }, { x: 162.2, y: 51.2 }, { x: 189.2, y: 70.2 }, { x: 205.2, y: 95.2 }, { x: 211.2, y: 122.2 }, { x: 57.2, y: 166.2 }, { x: 75.2, y: 187.2 }, { x: 106.2, y: 203.2 }, { x: 77.2, y: 60.2 }],
    leatherPts: [{ x: 170.2, y: 186.2 }, { x: 217.2, y: 154.2 }, { x: 172.2, y: 235.2 }],
  },

  sherlock: {
    badge: { width: 260, height: 260 },
    frame: { src: '/images/cadres-gamification/Sherlock Holmes/img/cadre-sherlock-holmes-1440.png' },
    photo: { size: 150, left: 56, top: 56 },
    ring:  { cx: 130, cy: 130, r: 75 },
    pal: {
      primary:   [188, 148, 78],
      secondary: [215, 178, 55],
      glow:      [168, 132, 42],
      fog:       [200, 190, 170],
      amber:     [220, 150, 40],
    },
    fogPts: [
      { x: 30, y: 200 }, { x: 60, y: 210 }, { x: 100, y: 220 },
      { x: 160, y: 215 }, { x: 200, y: 205 }, { x: 230, y: 195 },
    ],
    sparkPts: [
      { x: 45,  y: 45  }, { x: 215, y: 45  },
      { x: 30,  y: 130 }, { x: 230, y: 130 },
      { x: 45,  y: 215 }, { x: 215, y: 215 },
    ],
    pipePt: { x: 210, y: 190 },
  },
};

/* ═══════════════════════════════════════════════════════════════
   HARRY POTTER — BadgeEngine
═══════════════════════════════════════════════════════════════ */
class HarryBadge {
  constructor(el, cfg, photoSrc) {
    this.cfg = cfg;
    this.BW = cfg.badge.width; this.BH = cfg.badge.height;
    this.ring = cfg.ring; this.pal = cfg.palette;
    this.pts = cfg.effects.map(e => {
      const eType = cfg.effectTypes[e.type] || { behavior: e.type };
      return { ...e, behavior: eType.behavior };
    });
    this.OX = 40; this.OY = 40;
    this.CVW = this.BW + 80; this.CVH = this.BH + 80;
    this.RCX = this.ring.cx + this.OX; this.RCY = this.ring.cy + this.OY;
    this._buildDOM(el, photoSrc);
    this.particles = []; this.bolts = [];
    this.hovered = false; this.phase = Math.random() * Math.PI * 2;
    this.frame = 0; this.boltTimer = 0;
    el.addEventListener('mouseenter', () => this.hovered = true);
    el.addEventListener('mouseleave', () => this.hovered = false);
    this._tick = this._tick.bind(this);
    this._animId = requestAnimationFrame(this._tick);
  }
  _buildDOM(el, photoSrc) {
    const c = this.cfg;
    el.style.width = this.BW + 'px'; el.style.height = this.BH + 'px';
    const img = document.createElement('img');
    img.className = 'badge__photo'; img.src = photoSrc; img.alt = '';
    img.style.cssText = `width:${c.photo.size}px;height:${c.photo.size}px;left:${c.photo.left}px;top:${c.photo.top}px;position:absolute;border-radius:50%;object-fit:cover;z-index:10;`;
    el.appendChild(img);
    const fr = document.createElement('img');
    fr.className = 'badge__frame'; fr.src = c.frame.src;
    fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:20;pointer-events:none;';
    el.appendChild(fr);
    const cv = document.createElement('canvas');
    cv.width = this.CVW; cv.height = this.CVH;
    cv.style.cssText = `position:absolute;width:${this.CVW}px;height:${this.CVH}px;top:${-this.OY}px;left:${-this.OX}px;z-index:30;pointer-events:none;`;
    el.appendChild(cv);
    this.cv = cv; this.ctx = cv.getContext('2d');
  }
  _c(key, a) {
    const c = this.pal[key] || this.pal.primary;
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }
  _spawn(pt) {
    const b = pt.behavior;
    const cx = pt.x + this.OX, cy = pt.y + this.OY;
    switch (b) {
      case 'spell': {
        this.particles.push({ b:'spell_core', x:cx, y:cy, life:0, max:22+Math.floor(Math.random()*16), sz:2.5+Math.random()*3 });
        const nRays = 4 + Math.floor(Math.random()*4);
        for (let r = 0; r < nRays; r++) {
          const angle = (r/nRays)*Math.PI*2 + (Math.random()-.5)*.8;
          const spd = 1.0 + Math.random()*1.6;
          this.particles.push({ b:'spell_ray', x:cx, y:cy, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd, life:0, max:14+Math.floor(Math.random()*12), sz:.9+Math.random()*1.2, tail:[{x:cx,y:cy}], hot:Math.random()>.3 });
        }
        for (let s = 0; s < 3+Math.floor(Math.random()*4); s++) {
          const angle = Math.random()*Math.PI*2;
          this.particles.push({ b:'spell_spark', x:cx+(Math.random()-.5)*5, y:cy+(Math.random()-.5)*5, vx:Math.cos(angle)*(0.5+Math.random()*1.2), vy:Math.sin(angle)*(0.5+Math.random()*1.2), life:0, max:10+Math.floor(Math.random()*12), sz:.6+Math.random() });
        }
        break;
      }
      case 'spark': this.particles.push({ b:'spark', x:cx+(Math.random()-.5)*6, y:cy+(Math.random()-.5)*6, vx:(Math.random()-.5)*1.4, vy:-(0.4+Math.random()*.9), life:0, max:10+Math.floor(Math.random()*14), sz:.8+Math.random()*1.8 }); break;
      case 'dust':  this.particles.push({ b:'dust',  x:cx+(Math.random()-.5)*18, y:cy+(Math.random()-.5)*10, vx:(Math.random()-.5)*.3, vy:-(0.07+Math.random()*.2), life:0, max:55+Math.floor(Math.random()*55), sz:.7+Math.random()*1.3 }); break;
    }
  }
  _spawnBolt() {
    const angle = Math.random()*Math.PI*2, len = 6+Math.random()*18;
    const dir = Math.random()>.3?1:-1;
    const dX = Math.cos(angle)*dir, dY = Math.sin(angle)*dir;
    const pX = -Math.sin(angle), pY = Math.cos(angle);
    const ox = this.RCX+Math.cos(angle)*this.ring.r, oy = this.RCY+Math.sin(angle)*this.ring.r;
    const steps = 3+Math.floor(Math.random()*4), pts = [{x:ox,y:oy}];
    for (let i = 1; i <= steps; i++) { const t=i/steps,j=(Math.random()-.5)*5; pts.push({x:ox+dX*len*t+pX*j,y:oy+dY*len*t+pY*j}); }
    this.bolts.push({ pts, life:0, maxLife:8+Math.floor(Math.random()*14), alpha:.7+Math.random()*.3, w:.5+Math.random() });
  }
  _tick() {
    this.frame++; this.phase += 0.013;
    const ctx = this.ctx, h = this.hovered, inten = h?1.8:1;
    ctx.clearRect(0, 0, this.CVW, this.CVH);
    this.pts.forEach(pt => {
      const b = pt.behavior;
      let rate, prob;
      if (b==='spell')     { rate=h?4:9;  prob=h?.75:.40; }
      else if (b==='spark'){ rate=h?1:3;  prob=h?.60:.30; }
      else if (b==='dust') { rate=h?3:8;  prob=h?.60:.28; }
      else                 { rate=10; prob=0; }
      if (b!=='glow' && this.frame%rate===0 && Math.random()<prob) this._spawn(pt);
    });
    this.boltTimer++;
    if (this.boltTimer >= (h?1:4)) {
      this.boltTimer = 0;
      if (Math.random() < (h?.95:.55)) { this._spawnBolt(); if(h&&Math.random()<.6) this._spawnBolt(); }
    }
    const nF = h?5:3;
    for (let i = 0; i < nF; i++) {
      const angle = (i/nF)*Math.PI*2+this.phase*.28, fl = Math.max(0,Math.sin(this.phase*2.2+i*2));
      if (fl<.2) continue;
      const x = this.RCX+Math.cos(angle)*this.ring.r, y = this.RCY+Math.sin(angle)*this.ring.r;
      const gf = ctx.createRadialGradient(x,y,0,x,y,8);
      gf.addColorStop(0, `rgba(255,255,255,${fl*inten*.88})`);
      gf.addColorStop(.35, this._c('secondary',fl*inten*.58));
      gf.addColorStop(1, this._c('glow',0));
      ctx.beginPath(); ctx.arc(x,y,8,0,Math.PI*2); ctx.fillStyle=gf; ctx.fill();
    }
    for (let i = this.bolts.length-1; i >= 0; i--) {
      const b = this.bolts[i], t = b.life/b.maxLife, a = b.alpha*(1-t)*Math.min(1,t*5);
      if (a>.02) {
        ctx.save(); ctx.shadowColor=this._c('primary',a*.7); ctx.shadowBlur=5;
        ctx.strokeStyle=this._c('secondary',a); ctx.lineWidth=b.w*(1-t*.4); ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(b.pts[0].x,b.pts[0].y);
        for (let j=1; j<b.pts.length; j++) ctx.lineTo(b.pts[j].x,b.pts[j].y);
        ctx.stroke(); ctx.restore();
      }
      b.life++; if (b.life>b.maxLife) this.bolts.splice(i,1);
    }
    for (let i = this.particles.length-1; i >= 0; i--) {
      const p = this.particles[i], t = p.life/p.max;
      switch (p.b) {
        case 'spell_core': {
          const fi=Math.min(1,t/.12),fo=t>.3?1-(t-.3)/.7:1,a=fi*fo*(h?.95:.80),r=p.sz*(1+t*.8);
          const gc=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*2.5);
          gc.addColorStop(0,`rgba(255,255,255,${a})`); gc.addColorStop(.15,`rgba(255,240,200,${a*.92})`); gc.addColorStop(.4,`rgba(255,160,40,${a*.65})`); gc.addColorStop(1,`rgba(200,60,0,0)`);
          ctx.save(); ctx.shadowColor=`rgba(255,180,60,${a*.8})`; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(p.x,p.y,r*2.5,0,Math.PI*2); ctx.fillStyle=gc; ctx.fill(); ctx.restore(); break;
        }
        case 'spell_ray': {
          const a=(1-t)*Math.min(1,t*4)*(h?.95:.78);
          if (a<.02) { p.life++; if(p.life>=p.max) this.particles.splice(i,1); continue; }
          p.tail.push({x:p.x,y:p.y}); if(p.tail.length>8) p.tail.shift();
          if (p.tail.length>1) {
            for (let k=1;k<p.tail.length;k++) {
              const ta=a*(k/p.tail.length)*.75, tw=p.sz*(k/p.tail.length)*1.6;
              ctx.save();
              if(p.hot){ctx.strokeStyle=`rgba(255,${Math.round(160+80*(k/p.tail.length))},${Math.round(40*k/p.tail.length)},${ta})`;ctx.shadowColor=`rgba(255,140,20,${ta*.6})`;}
              else{ctx.strokeStyle=this._c('secondary',ta);ctx.shadowColor=this._c('primary',ta*.6);}
              ctx.shadowBlur=4; ctx.lineWidth=tw; ctx.lineCap='round';
              ctx.beginPath(); ctx.moveTo(p.tail[k-1].x,p.tail[k-1].y); ctx.lineTo(p.tail[k].x,p.tail[k].y); ctx.stroke(); ctx.restore();
            }
          }
          ctx.save();
          if(p.hot){ctx.shadowColor=`rgba(255,200,80,${a})`;ctx.fillStyle=`rgba(255,255,220,${a})`;}
          else{ctx.shadowColor=this._c('secondary',a);ctx.fillStyle=`rgba(240,250,255,${a})`;}
          ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*(1-t*.5),0,Math.PI*2); ctx.fill(); ctx.restore();
          p.vx*=.96; p.vy*=.96; break;
        }
        case 'spell_spark': {
          const a=(1-t)*Math.min(1,t*5)*(h?.9:.72);
          ctx.save(); ctx.shadowColor=`rgba(255,160,40,${a})`; ctx.shadowBlur=5; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*(1-t*.8),0,Math.PI*2); ctx.fillStyle=`rgba(255,220,120,${a})`; ctx.fill(); ctx.restore();
          p.vy-=.01; p.vx*=.95; break;
        }
        case 'spark': {
          const a=(1-t)*Math.min(1,t*6)*(h?.95:.70);
          ctx.save(); ctx.shadowColor=this._c('secondary',a); ctx.shadowBlur=6; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*(1-t*.7),0,Math.PI*2); ctx.fillStyle=`rgba(240,250,255,${a})`; ctx.fill(); ctx.restore();
          p.vy-=.012; p.vx*=.96; break;
        }
        case 'dust': {
          const a=(1-t)*Math.min(1,t*4)*(h?.55:.22);
          ctx.save(); ctx.shadowColor=this._c('primary',a); ctx.shadowBlur=3; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*(1-t*.4),0,Math.PI*2); ctx.fillStyle=this._c('secondary',a); ctx.fill(); ctx.restore();
          p.vy-=.004; break;
        }
      }
      p.x+=p.vx||0; p.y+=p.vy||0;
      p.life++; if (p.life>=p.max) this.particles.splice(i,1);
    }
    this._animId = requestAnimationFrame(this._tick);
  }
  destroy() { cancelAnimationFrame(this._animId); }
}

/* ═══════════════════════════════════════════════════════════════
   MATRIX
═══════════════════════════════════════════════════════════════ */
const _MX_GLYPHS = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:."=*+-<>';
const _mxRg = () => _MX_GLYPHS[Math.floor(Math.random() * _MX_GLYPHS.length)];

class MatrixBadge {
  constructor(el, cfg, photoSrc) {
    this.cfg = cfg;
    this.OX = 40; this.OY = 40;
    this.CVW = cfg.badge.width + 80; this.CVH = cfg.badge.height + 80;
    this.RCX = cfg.ring.cx + this.OX; this.RCY = cfg.ring.cy + this.OY;
    this._buildDOM(el, photoSrc);
    this.drops = []; this.particles = [];
    this.hovered = false; this.frame = 0; this.phase = 0;
    for (let i = 0; i < 4; i++) this._spawnDrop(true);
    el.addEventListener('mouseenter', () => this.hovered = true);
    el.addEventListener('mouseleave', () => this.hovered = false);
    this._tick = this._tick.bind(this);
    this._animId = requestAnimationFrame(this._tick);
  }
  _buildDOM(el, photoSrc) {
    const c = this.cfg;
    el.style.width = c.badge.width + 'px'; el.style.height = c.badge.height + 'px';
    const img = document.createElement('img');
    img.className = 'badge__photo'; img.src = photoSrc; img.alt = '';
    img.style.cssText = `width:${c.photo.size}px;height:${c.photo.size}px;left:${c.photo.left}px;top:${c.photo.top}px;position:absolute;border-radius:50%;object-fit:cover;z-index:10;`;
    el.appendChild(img);
    const fr = document.createElement('img');
    fr.className = 'badge__frame'; fr.src = c.frame.src;
    fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:20;pointer-events:none;';
    el.appendChild(fr);
    const cvB = document.createElement('canvas');
    cvB.width = this.CVW; cvB.height = this.CVH;
    cvB.style.cssText = `position:absolute;width:${this.CVW}px;height:${this.CVH}px;top:-${this.OY}px;left:-${this.OX}px;z-index:30;pointer-events:none;`;
    el.appendChild(cvB); this.ctxB = cvB.getContext('2d');
    const cvF = document.createElement('canvas');
    cvF.width = this.CVW; cvF.height = this.CVH;
    cvF.style.cssText = `position:absolute;width:${this.CVW}px;height:${this.CVH}px;top:-${this.OY}px;left:-${this.OX}px;z-index:40;pointer-events:none;`;
    el.appendChild(cvF); this.ctxF = cvF.getContext('2d');
  }
  _spawnDrop(init=false, pt=null) {
    let x, y;
    if (pt) { x=pt.x+this.OX+(Math.random()-.5)*5; y=pt.y+this.OY; }
    else {
      const angle=Math.random()*Math.PI*2, r=Math.random()*.65*(this.cfg.ring.r-8);
      x=this.cfg.ring.cx+Math.cos(angle)*r+this.OX;
      y=init ? this.cfg.ring.cy-this.cfg.ring.r+Math.random()*this.cfg.ring.r*2+this.OY : this.cfg.ring.cy-this.cfg.ring.r+this.OY+2;
    }
    const len=4+Math.floor(Math.random()*7);
    this.drops.push({ x, y, spd:.3+Math.random()*.7, len, chars:Array.from({length:len+5},_mxRg), mutTimer:0, mutRate:5+Math.floor(Math.random()*8), alpha:.35+Math.random()*.35, fs:8+Math.floor(Math.random()*3), delay:Math.floor(Math.random()*30), life:0 });
  }
  _tick() {
    this.frame++; this.phase += 0.013;
    const h = this.hovered;
    this.ctxB.clearRect(0, 0, this.CVW, this.CVH);
    this.ctxF.clearRect(0, 0, this.CVW, this.CVH);
    const ctx = this.ctxB;
    ctx.save();
    ctx.beginPath(); ctx.arc(this.RCX, this.RCY, this.cfg.ring.r-2, 0, Math.PI*2); ctx.clip();
    this.cfg.codePts.forEach(pt => {
      if (this.frame%8===0 && Math.random()<(h?.55:.28)) this._spawnDrop(false,pt);
    });
    if (this.frame%12===0 && Math.random()<(h?.40:.18)) this._spawnDrop();
    for (let i = this.drops.length-1; i >= 0; i--) {
      const d = this.drops[i]; d.life++;
      if (d.life<d.delay) continue;
      d.mutTimer++; if(d.mutTimer>=d.mutRate){d.mutTimer=0;d.chars[Math.floor(Math.random()*d.chars.length)]=_mxRg();}
      ctx.font=`bold ${d.fs}px 'Courier New',monospace`;
      for (let j=0; j<d.len; j++) {
        const cy2=d.y-j*(d.fs+1), isTip=j===0;
        const a=isTip?Math.min(.85,d.alpha*3.5*(h?1.4:1)):d.alpha*(1-j/d.len)*(h?1.2:1);
        if(a<.02) continue;
        if(isTip){ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.shadowColor='rgba(0,255,65,1)';ctx.shadowBlur=10;}
        else{ctx.fillStyle=`rgba(0,255,65,${Math.min(.95,a*1.8)})`;ctx.shadowColor='rgba(0,255,65,.6)';ctx.shadowBlur=5;}
        ctx.fillText(d.chars[j],d.x-d.fs*.5,cy2);
      }
      ctx.shadowBlur=0; d.y+=d.spd*(h?1.5:1);
      const dist=Math.sqrt((d.x-this.RCX)**2+(d.y-this.RCY)**2);
      if(d.y-this.RCY>this.cfg.ring.r+15||dist>this.cfg.ring.r+8) this.drops.splice(i,1);
    }
    ctx.restore();
    this.cfg.sparkPts.forEach(pt => {
      if(Math.random()<(h?.06:.018)){
        const cx=pt.x+this.OX,cy=pt.y+this.OY;
        this.particles.push({b:'spark',x:cx+(Math.random()-.5)*4,y:cy+(Math.random()-.5)*4,vx:(Math.random()-.5)*1.5,vy:-(0.2+Math.random()*1.0),life:0,max:10+Math.floor(Math.random()*10),sz:.8+Math.random()*1.6});
      }
    });
    for(let i=0;i<(h?3:1);i++){
      const angle=(i/(h?3:1))*Math.PI*2+this.phase*.25,fl=Math.max(0,Math.sin(this.phase*1.8+i*2.1));
      if(fl<.3) continue;
      const x=this.RCX+Math.cos(angle)*this.cfg.ring.r,y=this.RCY+Math.sin(angle)*this.cfg.ring.r;
      const gf=ctx.createRadialGradient(x,y,0,x,y,6);
      gf.addColorStop(0,`rgba(255,255,255,${fl*.7})`);gf.addColorStop(.4,`rgba(0,255,65,${fl*.4})`);gf.addColorStop(1,`rgba(0,180,40,0)`);
      ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle=gf;ctx.fill();
    }
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i],t=p.life/p.max;
      const a=(1-t)*Math.min(1,t*4)*.80;
      ctx.save();ctx.shadowColor=`rgba(0,255,65,${a})`;ctx.shadowBlur=5;
      ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(1-t*.7),0,Math.PI*2);ctx.fillStyle=`rgba(160,255,160,${a})`;ctx.fill();ctx.restore();
      p.vy-=.01;p.vx*=.96;p.x+=p.vx;p.y+=p.vy;p.life++;if(p.life>=p.max)this.particles.splice(i,1);
    }
    const ctxF=this.ctxF;
    this.cfg.eyes.forEach(eye=>{
      const ex=eye.x+this.OX,ey=eye.y+this.OY,pulse=0.55+Math.sin(this.phase*2.6+eye.x*.09)*0.38,inten=h?2.2:1.0;
      const g=ctxF.createRadialGradient(ex,ey,0,ex,ey,13);
      g.addColorStop(0,`rgba(255,255,210,${pulse*inten*.95})`);g.addColorStop(.12,`rgba(255,80,0,${pulse*inten*.90})`);g.addColorStop(.38,`rgba(255,15,0,${pulse*inten*.55})`);g.addColorStop(.72,`rgba(180,0,0,${pulse*inten*.18})`);g.addColorStop(1,`rgba(100,0,0,0)`);
      ctxF.save();ctxF.shadowColor=`rgba(255,30,0,${pulse*inten*.65})`;ctxF.shadowBlur=12;ctxF.beginPath();ctxF.arc(ex,ey,13,0,Math.PI*2);ctxF.fillStyle=g;ctxF.fill();ctxF.restore();
    });
    this._animId = requestAnimationFrame(this._tick);
  }
  destroy() { cancelAnimationFrame(this._animId); }
}

/* ═══════════════════════════════════════════════════════════════
   INDIANA JONES
═══════════════════════════════════════════════════════════════ */
class IndiaBadge {
  constructor(el, cfg, photoSrc) {
    this.cfg=cfg; this.OX=40; this.OY=40;
    this.CVW=cfg.badge.width+80; this.CVH=cfg.badge.height+80;
    this.RCX=cfg.ring.cx+this.OX; this.RCY=cfg.ring.cy+this.OY;
    this._buildDOM(el,photoSrc);
    this.particles=[]; this.hovered=false; this.frame=0; this.phase=0;
    this.lampPhase=0; this.lampFlicker=0;
    el.addEventListener('mouseenter',()=>this.hovered=true);
    el.addEventListener('mouseleave',()=>this.hovered=false);
    this._tick=this._tick.bind(this);
    this._animId=requestAnimationFrame(this._tick);
  }
  _buildDOM(el,photoSrc){
    const c=this.cfg;
    el.style.width=c.badge.width+'px';el.style.height=c.badge.height+'px';
    const img=document.createElement('img');img.className='badge__photo';img.src=photoSrc;img.alt='';
    img.style.cssText=`width:${c.photo.size}px;height:${c.photo.size}px;left:${c.photo.left}px;top:${c.photo.top}px;position:absolute;border-radius:50%;object-fit:cover;z-index:10;`;
    el.appendChild(img);
    const fr=document.createElement('img');fr.className='badge__frame';fr.src=c.frame.src;
    fr.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:20;pointer-events:none;';
    el.appendChild(fr);
    const cv=document.createElement('canvas');cv.width=this.CVW;cv.height=this.CVH;
    cv.style.cssText=`position:absolute;width:${this.CVW}px;height:${this.CVH}px;top:-${this.OY}px;left:-${this.OX}px;z-index:30;pointer-events:none;`;
    el.appendChild(cv);this.ctx=cv.getContext('2d');
  }
  _c(key,a){const c=this.cfg.pal[key];return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}
  _spawnEmber(angle){
    const r=this.cfg.ring.r,x=this.cfg.ring.cx+Math.cos(angle)*r+this.OX,y=this.cfg.ring.cy+Math.sin(angle)*r+this.OY;
    this.particles.push({b:'ember',x:x+(Math.random()-.5)*6,y:y+(Math.random()-.5)*4,vx:(Math.random()-.5)*.6,vy:-(0.4+Math.random()*.9),life:0,max:35+Math.floor(Math.random()*40),sz:1.2+Math.random()*2.2,wobble:Math.random()*Math.PI*2,hot:Math.random()>.4});
  }
  _spawnLampFire(){
    const lx=this.cfg.lampPts[0].x+this.OX,ly=this.cfg.lampPts[0].y+this.OY-6;
    this.particles.push({b:'lampfire',x:lx+(Math.random()-.5)*7,y:ly,vx:(Math.random()-.5)*.5,vy:-(0.5+Math.random()*.8),life:0,max:18+Math.floor(Math.random()*18),sz:2+Math.random()*3.5,swell:.6+Math.random()*.5});
  }
  _spawnDust(pt){
    const cx=pt.x+this.OX,cy=pt.y+this.OY;
    this.particles.push({b:'dust',x:cx+(Math.random()-.5)*5,y:cy+(Math.random()-.5)*5,vx:(Math.random()-.5)*.5,vy:-(0.1+Math.random()*.35),life:0,max:50+Math.floor(Math.random()*60),sz:.8+Math.random()*1.8});
  }
  _spawnLeather(pt){
    const cx=pt.x+this.OX,cy=pt.y+this.OY;
    this.particles.push({b:'leather',x:cx+(Math.random()-.5)*8,y:cy+(Math.random()-.5)*8,vx:(Math.random()-.5)*.8,vy:-(0.2+Math.random()*.6),life:0,max:14+Math.floor(Math.random()*14),sz:.7+Math.random()*1.4});
  }
  _spawnLampSmoke(){
    const cx=this.cfg.lampPts[0].x+this.OX,cy=this.cfg.lampPts[0].y+this.OY-8;
    this.particles.push({b:'lampsmoke',x:cx+(Math.random()-.5)*5,y:cy,vx:(Math.random()-.5)*.3,vy:-(0.12+Math.random()*.18),life:0,max:60+Math.floor(Math.random()*50),sz:4+Math.random()*6,swell:1.2+Math.random()*.8});
  }
  _tick(){
    this.frame++;this.phase+=0.012;
    this.lampPhase+=0.04+Math.random()*.02;
    this.lampFlicker=0.7+Math.sin(this.lampPhase*2.3)*.18+Math.sin(this.lampPhase*5.7)*.08;
    const h=this.hovered,ctx=this.ctx;
    ctx.clearRect(0,0,this.CVW,this.CVH);
    const lx=this.cfg.lampPts[0].x+this.OX,ly=this.cfg.lampPts[0].y+this.OY,lf=this.lampFlicker*(h?1.5:1);
    const gLamp=ctx.createRadialGradient(lx,ly,0,lx,ly,55);
    gLamp.addColorStop(0,this._c('lampCore',lf*.85));gLamp.addColorStop(.2,this._c('lamp',lf*.70));gLamp.addColorStop(.5,this._c('primary',lf*.38));gLamp.addColorStop(.8,this._c('primary',lf*.12));gLamp.addColorStop(1,this._c('primary',0));
    ctx.beginPath();ctx.arc(lx,ly,55,0,Math.PI*2);ctx.fillStyle=gLamp;ctx.fill();
    const gCore=ctx.createRadialGradient(lx,ly,0,lx,ly,14);
    gCore.addColorStop(0,`rgba(255,255,230,${lf*.98})`);gCore.addColorStop(.25,this._c('lampCore',lf*.92));gCore.addColorStop(.6,this._c('lamp',lf*.70));gCore.addColorStop(1,this._c('lamp',0));
    ctx.save();ctx.shadowColor=this._c('lamp',lf*.95);ctx.shadowBlur=22;ctx.beginPath();ctx.arc(lx,ly,14,0,Math.PI*2);ctx.fillStyle=gCore;ctx.fill();ctx.restore();
    if(this.frame%8===0&&Math.random()<.6)this._spawnLampSmoke();
    const rPulse=0.5+Math.sin(this.phase*.9)*.25,rInten=h?1.6:1;
    const arcSkipStart=15.4*Math.PI/180,arcSkipEnd=84.9*Math.PI/180;
    ctx.save();
    ctx.beginPath();ctx.arc(this.RCX,this.RCY,this.cfg.ring.r+6,arcSkipEnd,arcSkipStart+Math.PI*2);ctx.arc(this.RCX,this.RCY,this.cfg.ring.r-14,arcSkipStart+Math.PI*2,arcSkipEnd,true);ctx.closePath();ctx.clip();
    const gRing=ctx.createRadialGradient(this.RCX,this.RCY,this.cfg.ring.r-14,this.RCX,this.RCY,this.cfg.ring.r+4);
    gRing.addColorStop(0,this._c('primary',0));gRing.addColorStop(.4,this._c('primary',rPulse*rInten*.28));gRing.addColorStop(.72,this._c('secondary',rPulse*rInten*.50));gRing.addColorStop(1,this._c('secondary',rPulse*rInten*.62));
    ctx.beginPath();ctx.arc(this.RCX,this.RCY,this.cfg.ring.r+4,0,Math.PI*2);ctx.arc(this.RCX,this.RCY,this.cfg.ring.r-14,0,Math.PI*2,true);ctx.fillStyle=gRing;ctx.fill();ctx.restore();
    this.cfg.ringPts.forEach((pt,i)=>{
      const ptAngle=Math.atan2(pt.y-this.cfg.ring.cy,pt.x-this.cfg.ring.cx)*180/Math.PI;
      if(ptAngle>15.4&&ptAngle<84.9)return;
      const fl=Math.max(0,Math.sin(this.phase*1.6+i*.7));if(fl<.25)return;
      const x=pt.x+this.OX,y=pt.y+this.OY;
      const gf=ctx.createRadialGradient(x,y,0,x,y,7);
      gf.addColorStop(0,`rgba(255,255,200,${fl*rInten*.80})`);gf.addColorStop(.4,this._c('secondary',fl*rInten*.50));gf.addColorStop(1,this._c('primary',0));
      ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fillStyle=gf;ctx.fill();
    });
    this.cfg.glintPts.forEach((pt,i)=>{
      const localPhase=this.phase*.55+i*(Math.PI*2/this.cfg.glintPts.length);
      const raw=Math.sin(localPhase),fl=Math.max(0,raw*raw*raw*raw*raw);if(fl<.04)return;
      const x=pt.x+this.OX,y=pt.y+this.OY,inten=h?1.3:1,size=fl*14*inten;
      const gOuter=ctx.createRadialGradient(x,y,0,x,y,size*1.8);
      gOuter.addColorStop(0,`rgba(255,240,160,${fl*inten*.60})`);gOuter.addColorStop(.4,`rgba(220,170,40,${fl*inten*.35})`);gOuter.addColorStop(1,`rgba(150,90,0,0)`);
      ctx.beginPath();ctx.arc(x,y,size*1.8,0,Math.PI*2);ctx.fillStyle=gOuter;ctx.fill();
      const gCore2=ctx.createRadialGradient(x,y,0,x,y,size*.5);
      gCore2.addColorStop(0,`rgba(255,255,255,${fl*inten*.98})`);gCore2.addColorStop(.3,`rgba(255,248,200,${fl*inten*.85})`);gCore2.addColorStop(1,`rgba(220,160,20,0)`);
      ctx.save();ctx.shadowColor=`rgba(255,230,100,${fl*inten*.9})`;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(x,y,size*.5,0,Math.PI*2);ctx.fillStyle=gCore2;ctx.fill();ctx.restore();
    });
    const compX=54+this.OX,compY=43+this.OY,needleLen=10;
    const wobble=Math.sin(this.phase*.5)*.45+Math.sin(this.phase*1.3)*.15;
    const needleAngle=-0.8+wobble;
    ctx.save();ctx.translate(compX,compY);ctx.rotate(needleAngle);
    ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-needleLen);ctx.lineTo(1.5,-needleLen*.3);ctx.fillStyle=`rgba(220,40,20,.85)`;ctx.fill();
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,needleLen);ctx.lineTo(-1.5,needleLen*.3);ctx.fillStyle='rgba(240,210,100,.80)';ctx.fill();
    ctx.shadowBlur=0;ctx.beginPath();ctx.arc(0,0,2,0,Math.PI*2);ctx.fillStyle='rgba(255,235,150,.95)';ctx.fill();ctx.restore();
    if(Math.random()<(h?.18:.08))this._spawnEmber((90+Math.random()*90)*Math.PI/180);
    if(Math.random()<(h?.10:.04))this._spawnEmber((185+Math.random()*160)*Math.PI/180);
    if(this.frame%3===0&&Math.random()<(h?.85:.65))this._spawnLampFire();
    this.cfg.ringPts.forEach(pt=>{if(Math.random()<(h?.05:.018))this._spawnDust(pt);});
    this.cfg.leatherPts.forEach(pt=>{if(Math.random()<(h?.08:.025))this._spawnLeather(pt);});
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i],t=p.life/p.max;
      if(p.b==='dust'){
        const a=(1-t)*Math.min(1,t*4)*(h?.65:.40);
        ctx.save();ctx.shadowColor=this._c('dust',a);ctx.shadowBlur=4;ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(1-t*.4),0,Math.PI*2);ctx.fillStyle=this._c('secondary',a);ctx.fill();ctx.restore();
        p.vy-=.003;p.vx*=.98;
      }else if(p.b==='leather'){
        const a=(1-t)*Math.min(1,t*5)*(h?.80:.55);
        ctx.save();ctx.shadowColor=this._c('glow',a);ctx.shadowBlur=6;ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(1-t*.6),0,Math.PI*2);ctx.fillStyle=`rgba(255,210,80,${a})`;ctx.fill();ctx.restore();
        p.vy-=.008;p.vx*=.96;
      }else if(p.b==='ember'){
        const a=(1-t)*Math.min(1,t*3)*(h?.90:.70);
        p.wobble+=.06;p.vx+=Math.sin(p.wobble)*.04;
        const g2=p.hot?Math.round(200-t*160):Math.round(180-t*120),b2=p.hot?Math.round(80-t*80):20;
        ctx.save();ctx.shadowColor=`rgba(255,${g2},0,${a*.8})`;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(1-t*.5),0,Math.PI*2);ctx.fillStyle=`rgba(255,${g2},${b2},${a})`;ctx.fill();ctx.restore();
        p.vy-=.012;p.vx*=.97;
      }else if(p.b==='lampfire'){
        const fi=Math.min(1,t/.08),fo=t>.5?1-(t-.5)/.5:1,a=fi*fo*(h?.90:.75)*this.lampFlicker;
        const r2=p.sz*(1+t*p.swell);
        const fg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r2);
        fg.addColorStop(0,`rgba(255,255,200,${a*.95})`);fg.addColorStop(.2,`rgba(255,200,60,${a*.85})`);fg.addColorStop(.5,`rgba(255,120,10,${a*.55})`);fg.addColorStop(1,`rgba(150,30,0,0)`);
        ctx.beginPath();ctx.arc(p.x,p.y,r2,0,Math.PI*2);ctx.fillStyle=fg;ctx.fill();
        p.vx*=.97;p.vy*=.98;
      }else if(p.b==='lampsmoke'){
        const fi=Math.min(1,t/.12),fo=t>.65?1-(t-.65)/.35:1,a=fi*fo*(h?.35:.22)*this.lampFlicker;
        const r2=p.sz*(1+t*p.swell);
        const ms=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r2);
        ms.addColorStop(0,this._c('lampCore',a*.70));ms.addColorStop(.4,this._c('lamp',a*.40));ms.addColorStop(1,this._c('primary',0));
        ctx.beginPath();ctx.arc(p.x,p.y,r2,0,Math.PI*2);ctx.fillStyle=ms;ctx.fill();
        p.vx*=.996;p.vy*=.998;
      }
      p.x+=p.vx||0;p.y+=p.vy||0;p.life++;if(p.life>=p.max)this.particles.splice(i,1);
    }
    this._animId=requestAnimationFrame(this._tick);
  }
  destroy(){cancelAnimationFrame(this._animId);}
}

/* ═══════════════════════════════════════════════════════════════
   SHERLOCK HOLMES — brouillard + étincelles ambrées (260px)
═══════════════════════════════════════════════════════════════ */
class SherlockBadge {
  constructor(el, cfg, photoSrc) {
    this.cfg=cfg; this.OX=40; this.OY=40;
    this.CVW=cfg.badge.width+80; this.CVH=cfg.badge.height+80;
    this.RCX=cfg.ring.cx+this.OX; this.RCY=cfg.ring.cy+this.OY;
    this._buildDOM(el,photoSrc);
    this.particles=[]; this.hovered=false; this.frame=0; this.phase=0;
    el.addEventListener('mouseenter',()=>this.hovered=true);
    el.addEventListener('mouseleave',()=>this.hovered=false);
    this._tick=this._tick.bind(this);
    this._animId=requestAnimationFrame(this._tick);
  }
  _buildDOM(el,photoSrc){
    const c=this.cfg;
    el.style.width=c.badge.width+'px';el.style.height=c.badge.height+'px';
    const img=document.createElement('img');img.className='badge__photo';img.src=photoSrc;img.alt='';
    img.style.cssText=`width:${c.photo.size}px;height:${c.photo.size}px;left:${c.photo.left}px;top:${c.photo.top}px;position:absolute;border-radius:50%;object-fit:cover;z-index:10;`;
    el.appendChild(img);
    const fr=document.createElement('img');fr.className='badge__frame';fr.src=c.frame.src;
    // La frame Sherlock est 1440px → on la scale via CSS
    fr.style.cssText=`position:absolute;top:0;left:0;width:${c.badge.width*5.538}px;height:${c.badge.height*5.538}px;transform:scale(${1/5.538});transform-origin:top left;z-index:20;pointer-events:none;`;
    el.appendChild(fr);
    const cv=document.createElement('canvas');cv.width=this.CVW;cv.height=this.CVH;
    cv.style.cssText=`position:absolute;width:${this.CVW}px;height:${this.CVH}px;top:-${this.OY}px;left:-${this.OX}px;z-index:30;pointer-events:none;`;
    el.appendChild(cv);this.ctx=cv.getContext('2d');
  }
  _c(key,a){const c=this.cfg.pal[key]||this.cfg.pal.primary;return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}
  _spawnFog(pt){
    const cx=pt.x+this.OX,cy=pt.y+this.OY;
    this.particles.push({b:'fog',x:cx+(Math.random()-.5)*20,y:cy+(Math.random()-.5)*8,vx:(Math.random()-.5)*.4,vy:-(0.05+Math.random()*.15),life:0,max:90+Math.floor(Math.random()*80),sz:8+Math.random()*10,swell:1.4+Math.random()*1.2});
  }
  _spawnSpark(pt){
    const cx=pt.x+this.OX,cy=pt.y+this.OY;
    this.particles.push({b:'spark',x:cx+(Math.random()-.5)*6,y:cy+(Math.random()-.5)*6,vx:(Math.random()-.5)*.9,vy:-(0.3+Math.random()*.7),life:0,max:12+Math.floor(Math.random()*14),sz:.8+Math.random()*1.6});
  }
  _tick(){
    this.frame++;this.phase+=0.011;
    const h=this.hovered,ctx=this.ctx;
    ctx.clearRect(0,0,this.CVW,this.CVH);
    // Pulsation ring ambrée
    const rPulse=0.4+Math.sin(this.phase*.8)*.22;
    const gRing=ctx.createRadialGradient(this.RCX,this.RCY,this.cfg.ring.r-12,this.RCX,this.RCY,this.cfg.ring.r+6);
    gRing.addColorStop(0,this._c('primary',0));gRing.addColorStop(.5,this._c('primary',rPulse*(h?1.6:1)*.30));gRing.addColorStop(1,this._c('secondary',rPulse*(h?1.6:1)*.45));
    ctx.beginPath();ctx.arc(this.RCX,this.RCY,this.cfg.ring.r+6,0,Math.PI*2);ctx.arc(this.RCX,this.RCY,this.cfg.ring.r-12,0,Math.PI*2,true);ctx.fillStyle=gRing;ctx.fill();
    // Spawn brouillard
    this.cfg.fogPts.forEach(pt=>{if(Math.random()<(h?.12:.05))this._spawnFog(pt);});
    // Spawn étincelles
    this.cfg.sparkPts.forEach(pt=>{if(Math.random()<(h?.04:.015))this._spawnSpark(pt);});
    // Lueur pipe ambre
    const px=this.cfg.pipePt.x+this.OX,py=this.cfg.pipePt.y+this.OY;
    const pFlick=0.6+Math.sin(this.phase*3.1)*.3+Math.sin(this.phase*7.2)*.1;
    const gPipe=ctx.createRadialGradient(px,py,0,px,py,20);
    gPipe.addColorStop(0,this._c('amber',pFlick*(h?1.4:1)*.75));gPipe.addColorStop(.4,this._c('primary',pFlick*(h?1.4:1)*.35));gPipe.addColorStop(1,this._c('primary',0));
    ctx.beginPath();ctx.arc(px,py,20,0,Math.PI*2);ctx.fillStyle=gPipe;ctx.fill();
    // Éclats ring
    for(let i=0;i<(h?4:2);i++){
      const angle=(i/(h?4:2))*Math.PI*2+this.phase*.2,fl=Math.max(0,Math.sin(this.phase*1.6+i*1.8));
      if(fl<.28)continue;
      const x=this.RCX+Math.cos(angle)*this.cfg.ring.r,y=this.RCY+Math.sin(angle)*this.cfg.ring.r;
      const gf=ctx.createRadialGradient(x,y,0,x,y,7);
      gf.addColorStop(0,`rgba(255,240,180,${fl*(h?1.3:1)*.75})`);gf.addColorStop(1,this._c('primary',0));
      ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fillStyle=gf;ctx.fill();
    }
    // Draw particules
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i],t=p.life/p.max;
      if(p.b==='fog'){
        const fi=Math.min(1,t/.18),fo=t>.65?1-(t-.65)/.35:1,a=fi*fo*(h?.50:.30);
        const r2=p.sz*(1+t*p.swell);
        const mg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r2);
        mg.addColorStop(0,this._c('fog',a*.80));mg.addColorStop(.5,this._c('glow',a*.35));mg.addColorStop(1,this._c('glow',0));
        ctx.beginPath();ctx.arc(p.x,p.y,r2,0,Math.PI*2);ctx.fillStyle=mg;ctx.fill();
        p.vx*=.997;p.vy*=.999;
      }else if(p.b==='spark'){
        const a=(1-t)*Math.min(1,t*5)*(h?.90:.65);
        ctx.save();ctx.shadowColor=this._c('secondary',a);ctx.shadowBlur=6;ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(1-t*.7),0,Math.PI*2);ctx.fillStyle=this._c('secondary',a);ctx.fill();ctx.restore();
        p.vy-=.01;p.vx*=.96;
      }
      p.x+=p.vx||0;p.y+=p.vy||0;p.life++;if(p.life>=p.max)this.particles.splice(i,1);
    }
    this._animId=requestAnimationFrame(this._tick);
  }
  destroy(){cancelAnimationFrame(this._animId);}
}

/* ═══════════════════════════════════════════════════════════════
   DISPATCHER — window.BadgeEngine
   Usage : new BadgeEngine(containerEl, frameCode, photoSrc)
═══════════════════════════════════════════════════════════════ */
const _BADGE_CLASSES = {
  harry:    HarryBadge,
  matrix:   MatrixBadge,
  indiana:  IndiaBadge,
  sherlock: window.SherlockBadge || SherlockBadge,
};

class BadgeEngine {
  constructor(container, frameCode, photoSrc = '') {
    this._instance = null;
    const Cls = _BADGE_CLASSES[frameCode];
    const cfg = BADGE_CONFIGS[frameCode];
    if (!Cls || !cfg) return;
    this._instance = new Cls(container, cfg, photoSrc);
  }
  destroy() {
    if (this._instance) this._instance.destroy();
  }
}

window.BadgeEngine = BadgeEngine;
