/**
 * gamification-sherlock.js — Ciné Délices
 * Animation Sherlock Holmes complète — portée depuis cadre-gamification-sherlock-holme.html
 * Tourne à 1440×1440 natif, scalée CSS à 260×260 (ou autre taille via cfg.badge.width)
 *
 * Usage : new window.SherlockBadge(containerEl, cfg, photoSrc)
 */
(function () {

/* ─── Utilitaires ─── */
function sR(v,m=0.5){ const n=+v; return(isFinite(n)&&n>0)?Math.max(m,n):m; }
function sN(v,f=0)  { const n=+v; return isFinite(n)?n:f; }

/* ─── Constantes ─── */
const NATIVE = 1440;
const MAX_P  = 120;
const MAX_TH = 2;

const THOUGHT_CHAINS = {
  idle:[
    [{w:'Quelque chose m\'échappe.',r:110}],
    [{w:'Hmm…',r:45},{w:'Hmm… pas encore.',r:100}],
    [{w:'Curieux détail.',r:80}],
    [{w:'Ciné…',r:45},{w:'Ciné… Hmm ?!',r:105}],
    [{w:'Délices !?',r:80}],
    [{w:'Le silence parle.',r:80}],
  ],
  notes:[
    [{w:'Cette encre est récente.',r:110}],
    [{w:'Indice.',r:45},{w:'Indice. À relier.',r:95}],
    [{w:'Lire entre les lignes.',r:100}],
  ],
  loupe:[
    [{w:'Invisible à l\'œil nu.',r:95}],
    [{w:'La vérité se révèle.',r:95}],
    [{w:'Voir ce que d\'autres ignorent.',r:125}],
  ],
  connection:[
    [{w:'Tout se relie.',r:75}],
    [{w:'Déduit.',r:45},{w:'Déduit. Élémentaire.',r:100}],
  ],
  final:[
    [{w:'Ciné…',r:60},{w:'Ciné Délices.',r:110}],
  ],
};
const THOUGHT_COLORS = {
  idle      : 'rgba(220,210,188,',
  notes     : 'rgba(188,212,232,',
  loupe     : 'rgba(195,228,208,',
  connection: 'rgba(235,205,152,',
  final     : 'rgba(242,202,88,',
};
const RARE_THOUGHTS = [
  [{w:'Élémentaire.',r:65}],
  [{w:'Mon cher Watson…',r:95}],
];

/* ─── Classe ─── */
class SherlockBadge {
  constructor(el, cfg, photoSrc) {
    const D = cfg.badge.width;   // 260
    this.S   = D / NATIVE;       // CSS scale
    this.INV = NATIVE / D;       // mouse factor

    /* État */
    this.particles = []; this.thoughts = [];
    this.hovered = false;
    this.mouseX = 718; this.mouseY = 670;
    this.phase = Math.random() * Math.PI * 2;
    this.frameN = 0; this.state = 1;
    this._lastChain = null; this.thTimer = 0;

    /* Flamme */
    this.fp1 = Math.random()*Math.PI*2; this.fp2 = Math.random()*Math.PI*2;
    this.fp3 = Math.random()*Math.PI*2; this.fp4 = Math.random()*Math.PI*2;
    this.lf = 1.0;

    /* Métal */
    this.metalFlash = [
      {val:0,decay:0,gx:0,gy:0,rc:252,gc:230,bc:132},
      {val:0,decay:0,gx:0,gy:0,rc:252,gc:230,bc:132},
      {val:0,decay:0,gx:0,gy:0,rc:252,gc:230,bc:132},
    ];

    /* Halo ring */
    this.ringHaloPhase = 0;

    /* Temps */
    const h = new Date().getHours();
    const isNight   = h>=21||h<7;
    const isEvening = h>=18&&h<21;
    this.TM = {
      flameIntens: isNight?1.35:isEvening?1.15:0.85,
      thoughtFreq: isNight?0.65:isEvening?0.82:1.0,
      metalFreq  : isNight?0.018:isEvening?0.012:0.007,
      ringGlow   : isNight?1.55:isEvening?1.25:0.80,
      bgTint     : isNight?'rgba(8,4,14,.28)':isEvening?'rgba(18,8,2,.18)':null,
    };
    this.thInterval = this._nextThInt();

    /* Loupe */
    this.LOUPE = {r:90, mag:2.2, rimW:3.5};

    /* CFG natif 1440px */
    this.C = {
      flame     : {x:196, y:673.8},
      flameTop  : 565.8,
      ring      : {cx:718, cy:670, r:400},
      thoughtCX : 718, thoughtCY: 670,
      metalPts  : [{x:715.3,y:128.2},{x:1197.1,y:474.4},{x:227.9,y:792.8}],
      revealAssets: [
        {id:'ra-1',url:'/images/cadres-gamification/Sherlock Holmes/img/empreinte-mirror-sherlock-3.png',x:426.5,y:443.1,w:145,h:168,blend:'multiply'},
        {id:'ra-2',url:'/images/cadres-gamification/Sherlock Holmes/img/letters-sherlock-3.png',x:581.5,y:1158.5,w:144,h:151,blend:'overlay'},
        {id:'ra-3',url:'/images/cadres-gamification/Sherlock Holmes/img/message-sherlock-3.png',x:931,y:1200.2,w:143,h:71,blend:'multiply'},
        {id:'ra-4',url:'/images/cadres-gamification/Sherlock Holmes/img/empreinte-sherlock-3.png',x:657.1,y:1086.4,w:38,h:60,blend:'multiply'},
      ],
      hiddenClues:[
        {type:'text',text:'C_NÉ',x:598,y:338,fs:14,rot:-.08,alpha:.72},
        {type:'text',text:'D_L_C_S',x:720,y:328,fs:12,rot:.04,alpha:.65},
        {type:'fingerprint',x:860,y:390,r:22,alpha:.55},
        {type:'text',text:'1895',x:480,y:420,fs:11,rot:-.12,alpha:.60},
        {type:'text',text:'S.H.',x:550,y:520,fs:16,rot:-.05,alpha:.70},
        {type:'cross',x:670,y:460,size:12,alpha:.50},
      ],
    };

    /* Images reveal */
    this.revealImgs = {};
    this.discovered = new Set();
    this.C.revealAssets.forEach(a => {
      const img = new Image(); img.crossOrigin = 'anonymous'; img.src = a.url;
      this.revealImgs[a.id] = img;
    });

    this._buildDOM(el, photoSrc);
    this._bindEvents(el);
    this._tick = this._tick.bind(this);
    this._animId = requestAnimationFrame(this._tick);
  }

  /* ── DOM ── */
  _buildDOM(el, photoSrc) {
    const S = this.S, N = NATIVE;
    el.style.cssText = 'position:absolute;top:0;left:0;width:260px;height:260px;overflow:visible;cursor:none;';

    /* Zone clippée */
    const clip = document.createElement('div');
    clip.style.cssText = 'position:absolute;top:0;left:0;width:260px;height:260px;pointer-events:none;overflow:hidden;';

    const inner = document.createElement('div');
    inner.style.cssText = `width:${N}px;height:${N}px;transform:scale(${S});transform-origin:top left;position:relative;`;

    const photo = document.createElement('img');
    photo.src = photoSrc; photo.alt = '';
    photo.style.cssText = 'position:absolute;left:317px;top:270px;width:800px;height:800px;border-radius:50%;object-fit:cover;object-position:center top;z-index:10;pointer-events:none;';
    this.profileImg = photo; inner.appendChild(photo);

    const frame = document.createElement('img');
    frame.src = '/images/cadres-gamification/Sherlock Holmes/img/cadre-sherlock-holmes-1440.png'; frame.alt = '';
    frame.style.cssText = `position:absolute;top:0;left:0;width:${N}px;height:${N}px;z-index:20;pointer-events:none;`;
    this.frameImg = frame; inner.appendChild(frame);

    const cvFX = document.createElement('canvas');
    cvFX.width = N; cvFX.height = N;
    cvFX.style.cssText = `position:absolute;top:0;left:0;width:${N}px;height:${N}px;z-index:30;pointer-events:none;`;
    this.ctxFX = cvFX.getContext('2d'); inner.appendChild(cvFX);

    const cvL = document.createElement('canvas');
    cvL.width = N; cvL.height = N;
    cvL.style.cssText = `position:absolute;top:0;left:0;width:${N}px;height:${N}px;z-index:40;pointer-events:none;`;
    this.ctxL = cvL.getContext('2d'); inner.appendChild(cvL);

    clip.appendChild(inner); el.appendChild(clip);

    /* Pensées — hors clip, scalées */
    const cvTh = document.createElement('canvas');
    cvTh.width = N; cvTh.height = N;
    cvTh.style.cssText = `position:absolute;top:0;left:0;width:${N}px;height:${N}px;transform:scale(${S});transform-origin:top left;z-index:100;pointer-events:none;`;
    this.ctxTh = cvTh.getContext('2d'); el.appendChild(cvTh);
  }

  _bindEvents(el) {
    el.addEventListener('mouseenter', () => { this.hovered = true; });
    el.addEventListener('mouseleave', () => {
      this.hovered = false;
      this.ctxL.clearRect(0, 0, NATIVE, NATIVE);
    });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * this.INV;
      this.mouseY = (e.clientY - r.top)  * this.INV;
    });
    el.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0], r = el.getBoundingClientRect();
      this.mouseX = (t.clientX - r.left) * this.INV;
      this.mouseY = (t.clientY - r.top)  * this.INV;
      this.hovered = true;
    }, {passive:false});
    el.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0], r = el.getBoundingClientRect();
      this.mouseX = (t.clientX - r.left) * this.INV;
      this.mouseY = (t.clientY - r.top)  * this.INV;
    }, {passive:false});
    el.addEventListener('touchend', () => {
      this.hovered = false; this.ctxL.clearRect(0, 0, NATIVE, NATIVE);
    });
  }

  /* ─── Helpers ─── */
  _nextThInt() {
    return Math.round(((this.state===1?220:80) + Math.floor(Math.random()*160)) * this.TM.thoughtFreq);
  }

  /* ─── Tint jour/nuit ─── */
  _drawTimeTint() {
    if (!this.TM.bgTint) return;
    this.ctxFX.fillStyle = this.TM.bgTint;
    this.ctxFX.fillRect(0, 0, NATIVE, NATIVE);
  }

  /* ─── Halo ambre ring ─── */
  _drawRingHalo() {
    this.ringHaloPhase += .012 + Math.sin(this.phase*.42)*.003;
    const pulse = .5 + Math.sin(this.ringHaloPhase)*.28 + Math.sin(this.ringHaloPhase*2.3+.8)*.12
                     + Math.sin(this.ringHaloPhase*.55+1.6)*.08;
    const {r,cx,cy} = this.C.ring;
    const glowW = this.hovered ? 20 : 12;
    const rm    = this.TM.ringGlow;
    const ctx   = this.ctxFX;
    const g = ctx.createRadialGradient(cx,cy,r-glowW,cx,cy,r+8);
    g.addColorStop(0,'rgba(180,128,28,0)');
    g.addColorStop(.35,`rgba(188,138,32,${pulse*.042*(this.hovered?1.6:1)*rm})`);
    g.addColorStop(.65,`rgba(165,118,18,${pulse*.025*(this.hovered?1.6:1)*rm})`);
    g.addColorStop(1,'rgba(135,92,8,0)');
    ctx.beginPath(); ctx.arc(cx,cy,r+8,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
  }

  /* ─── Flamme ─── */
  _drawFlameGlow() {
    this.fp1+=.041+Math.random()*.018; this.fp2+=.027+Math.random()*.012;
    this.fp3+=.073+Math.random()*.022; this.fp4+=.015+Math.random()*.008;
    const fv = .72+Math.sin(this.fp1*2.8)*.14+Math.sin(this.fp2*1.4)*.09
                  +Math.sin(this.fp3*5.2)*.05+Math.sin(this.fp4*.9)*.04;
    this.lf = Math.max(.45,Math.min(1.18,fv)) * (this.hovered?1.18:1) * this.TM.flameIntens;
    const fx=this.C.flame.x, fy=this.C.flame.y-12;
    const cx=this.C.ring.cx, cy=this.C.ring.cy;
    const tx=fx+(cx-fx)*.45, ty=fy+(cy-fy)*.35;
    const ctx=this.ctxFX;
    const gA=ctx.createRadialGradient(fx,fy,0,tx,ty,260);
    gA.addColorStop(0,  `rgba(255,248,220,${this.lf*.70})`);
    gA.addColorStop(.15,`rgba(255,230,165,${this.lf*.52})`);
    gA.addColorStop(.38,`rgba(255,195,85, ${this.lf*.30})`);
    gA.addColorStop(.60,`rgba(235,130,22, ${this.lf*.14})`);
    gA.addColorStop(.80,`rgba(195,72,4,   ${this.lf*.05})`);
    gA.addColorStop(1,  `rgba(145,35,0,   0)`);
    ctx.beginPath(); ctx.arc(tx,ty,260,0,Math.PI*2); ctx.fillStyle=gA; ctx.fill();
    const gC=ctx.createRadialGradient(fx,fy-12,0,fx,fy,20);
    gC.addColorStop(0,  `rgba(255,255,255,${this.lf*.98})`);
    gC.addColorStop(.18,`rgba(255,255,240,${this.lf*.92})`);
    gC.addColorStop(.45,`rgba(255,248,195,${this.lf*.70})`);
    gC.addColorStop(.75,`rgba(255,225,105,${this.lf*.40})`);
    gC.addColorStop(1,  `rgba(245,165,28,0)`);
    ctx.beginPath(); ctx.arc(fx,fy,20,0,Math.PI*2); ctx.fillStyle=gC; ctx.fill();
  }

  _spawnFlame() {
    if (this.particles.length >= MAX_P) return;
    const fy=this.C.flame.y-30, fx=this.C.flame.x;
    const flameH=(this.C.flame.y-30-this.C.flameTop)*1.6;
    const count=Math.random()<.6?4:3;
    for (let k=0;k<count;k++) {
      const lb=Math.sin(this.fp1*1.3+this.fp2*.7)*.10;
      const vy0=2.8+Math.random()*3.2;
      const mf=Math.round((flameH/vy0)*1.12);
      this.particles.push({b:'flame',x:fx+(Math.random()-.5)*14+lb*4,y:fy-Math.random()*6,
        vx:(Math.random()-.5)*.14+lb*.08,vy:-vy0,life:0,max:Math.max(24,Math.min(100,mf)),
        wStart:16+Math.random()*14,wEnd:.2+Math.random()*.5,
        hStart:22+Math.random()*18,hEnd:1.0+Math.random()*1.5,
        hot:Math.random()>.22,twist:(Math.random()-.5)*.006,rot:(Math.random()-.5)*.10});
    }
  }

  _spawnEmber() {
    if (this.particles.length >= MAX_P) return;
    const fx=this.C.flame.x, fy=this.C.flame.y-30;
    const pH=(fy-150)*3.5;
    const count=Math.random()<.5?2:1;
    for (let k=0;k<count;k++) {
      const vy0=1.8+Math.random()*2.8;
      const mf=Math.round((pH/vy0)*1.08);
      this.particles.push({b:'ember',x:fx+(Math.random()-.5)*8,y:fy+(Math.random()-.5)*4,
        vx:(Math.random()-.5)*.18,vy:-vy0,life:0,max:Math.max(40,Math.min(200,mf)),
        sz:1.5+Math.random()*2.5,wobble:Math.random()*Math.PI*2,wobbleSpd:.03+Math.random()*.03,
        hot:Math.random()>.20});
    }
  }

  _spawnHeatHaze() {
    if (this.particles.length >= MAX_P) return;
    const fx=this.C.flame.x, fy=this.C.flame.y-20;
    this.particles.push({b:'haze',x:fx+(Math.random()-.5)*12,y:fy,
      vx:(Math.random()-.5)*.18,vy:-(0.35+Math.random()*.28),life:0,
      max:55+Math.floor(Math.random()*40),sz:8+Math.random()*12});
  }

  /* ─── Métal ─── */
  _drawMetal() {
    const ctx=this.ctxFX;
    this.C.metalPts.forEach((pt,i) => {
      const f=this.metalFlash[i];
      if (f.val<.04 && Math.random()<(this.hovered?this.TM.metalFreq*1.5:this.TM.metalFreq)) {
        f.val=.75+Math.random()*.25; f.decay=.14+Math.random()*.20;
        f.gx=(Math.random()-.5)*6; f.gy=(Math.random()-.5)*5;
        const ws=Math.random()*.6+.4;
        f.rc=Math.round(252+ws*3); f.gc=Math.round(234-ws*12); f.bc=Math.round(138-ws*20);
      }
      f.val*=(1-f.decay);
      if (f.val<.025){f.val=0;return;}
      const fl=f.val, x=pt.x+f.gx, y=pt.y+f.gy, sz=fl*34;
      const rc=f.rc||252, gc=f.gc||230, bc=f.bc||132;
      const gO=ctx.createRadialGradient(x,y,0,x,y,sR(sz*2.4));
      gO.addColorStop(0,  `rgba(${rc},${gc},${bc},${fl*.78})`);
      gO.addColorStop(.45,`rgba(218,170,35,${fl*.40})`);
      gO.addColorStop(1,  `rgba(168,110,6,0)`);
      ctx.save(); ctx.scale(1,.58);
      ctx.beginPath(); ctx.arc(x,y/.58,sz*2.4,0,Math.PI*2); ctx.fillStyle=gO; ctx.fill();
      ctx.restore();
      const gC=ctx.createRadialGradient(x-.5,y-.5,0,x,y,sR(sz*.55));
      gC.addColorStop(0,  `rgba(255,255,255,${fl*.99})`);
      gC.addColorStop(.22,`rgba(255,252,218,${fl*.92})`);
      gC.addColorStop(.58,`rgba(250,234,175,${fl*.65})`);
      gC.addColorStop(1,  `rgba(212,160,20,0)`);
      ctx.save(); ctx.shadowColor=`rgba(255,242,115,${fl*.85})`; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(x,y,sz*.55,0,Math.PI*2); ctx.fillStyle=gC; ctx.fill();
      ctx.restore();
      if (fl>.40) {
        [[1,0],[0,1]].forEach(([dx,dy]) => {
          const rLen=sz*3.2;
          const gr=ctx.createLinearGradient(x-dx*rLen,y-dy*rLen,x+dx*rLen,y+dy*rLen);
          gr.addColorStop(0,`rgba(255,252,200,0)`);
          gr.addColorStop(.5,`rgba(255,252,200,${fl*.85})`);
          gr.addColorStop(1,`rgba(255,252,200,0)`);
          ctx.save(); ctx.globalCompositeOperation='lighter';
          ctx.beginPath(); ctx.rect(x-dx*rLen-dy,y-dy*rLen-dx,dx*rLen*2+dy*2,dy*rLen*2+dx*2);
          ctx.fillStyle=gr; ctx.fill();
          ctx.globalCompositeOperation='source-over'; ctx.restore();
        });
      }
    });
  }

  /* ─── Loupe ─── */
  _drawLoupe() {
    const ctx=this.ctxL;
    ctx.clearRect(0,0,NATIVE,NATIVE);
    if (!this.hovered) return;
    const lx=this.mouseX, ly=this.mouseY;
    const lr=this.LOUPE.r, mag=this.LOUPE.mag;

    /* 1. Grossissement */
    ctx.save();
    ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.clip();
    ctx.translate(lx,ly); ctx.scale(mag,mag); ctx.translate(-lx,-ly);
    if (this.profileImg.complete && this.profileImg.naturalWidth) {
      ctx.save(); ctx.beginPath(); ctx.arc(317+400,270+400,400,0,Math.PI*2); ctx.clip();
      ctx.drawImage(this.profileImg,317,270,800,800); ctx.restore();
    }
    if (this.frameImg.complete && this.frameImg.naturalWidth)
      ctx.drawImage(this.frameImg,0,0,NATIVE,NATIVE);
    /* Révéler les assets */
    this.C.revealAssets.forEach(a => {
      const img=this.revealImgs[a.id];
      if (!img||!img.complete||!img.naturalWidth) return;
      const aCx=a.x+a.w/2, aCy=a.y+a.h/2;
      const dx=aCx-lx, dy=aCy-ly, thr=lr/mag+Math.max(a.w,a.h)/2;
      if (dx*dx+dy*dy <= thr*thr) {
        this.discovered.add(a.id);
        ctx.save();
        ctx.globalCompositeOperation = a.blend==='overlay' ? 'screen' : 'multiply';
        ctx.globalAlpha = 0.85; ctx.drawImage(img,a.x,a.y,a.w,a.h); ctx.restore();
      }
    });
    /* Indices cachés */
    this.C.hiddenClues.forEach(c => {
      const dx=c.x-lx, dy=c.y-ly, vis=(lr/mag+80)*(lr/mag+80);
      if (dx*dx+dy*dy > vis) return;
      ctx.save(); ctx.translate(c.x,c.y); if(c.rot) ctx.rotate(c.rot);
      if (c.type==='text') {
        ctx.font=`italic bold ${c.fs}px 'Georgia',serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle=`rgba(255,255,255,${c.alpha*.70})`; ctx.fillText(c.text,0,0);
      } else if (c.type==='fingerprint') {
        for(let ri=1;ri<=10;ri++){
          const rx=ri*c.r/10,ry=rx*.68,rF=1-ri/10,ra=c.alpha*.70*rF*rF;
          if(ra<.02) continue;
          ctx.strokeStyle=`rgba(255,255,255,${ra})`; ctx.lineWidth=.6;
          ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.stroke();
        }
      } else if (c.type==='cross') {
        ctx.strokeStyle=`rgba(255,255,255,${c.alpha*.70})`; ctx.lineWidth=.9;
        ctx.beginPath(); ctx.moveTo(-c.size,0); ctx.lineTo(c.size,0);
        ctx.moveTo(0,-c.size); ctx.lineTo(0,c.size); ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();

    /* 2. Teinte verre */
    ctx.save(); ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.clip();
    const lrS=sR(lr);
    const gV=ctx.createRadialGradient(lx,ly,0,lx,ly,lrS);
    gV.addColorStop(0,'rgba(205,222,190,.06)'); gV.addColorStop(.7,'rgba(190,208,175,.03)');
    gV.addColorStop(1,'rgba(155,170,132,.01)');
    ctx.fillStyle=gV; ctx.beginPath(); ctx.arc(lx,ly,lrS,0,Math.PI*2); ctx.fill();
    const spA=.15+Math.sin(this.phase*2.2)*.08, spR=sR(lrS*.44);
    const gSp=ctx.createRadialGradient(lx-lrS*.38,ly-lrS*.34,0,lx-lrS*.38,ly-lrS*.34,spR);
    gSp.addColorStop(0,`rgba(255,255,255,${spA})`); gSp.addColorStop(.38,`rgba(240,248,222,${spA*.28})`);
    gSp.addColorStop(1,'rgba(192,205,170,0)');
    ctx.fillStyle=gSp; ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.fill();
    ctx.restore();

    /* 3. Contour laiton */
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.38)'; ctx.shadowBlur=8;
    ctx.shadowOffsetX=1; ctx.shadowOffsetY=1;
    ctx.strokeStyle='rgba(32,22,6,.70)'; ctx.lineWidth=this.LOUPE.rimW+2;
    ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
    const rimA=.22+Math.sin(this.phase*1.85)*.07;
    ctx.strokeStyle=`rgba(188,152,48,${rimA+.14})`; ctx.lineWidth=this.LOUPE.rimW;
    ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.stroke();
    const rimG=.48+Math.sin(this.phase*2.4+.4)*.32;
    if (rimG>.46) {
      ctx.strokeStyle=`rgba(255,238,158,${(rimG-.46)*2.0})`; ctx.lineWidth=1.6; ctx.lineCap='round';
      const ga=this.phase*.16;
      ctx.beginPath(); ctx.arc(lx,ly,lr,ga,ga+Math.PI*.28); ctx.stroke();
    }
    /* Rivets cardinaux */
    [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach(a => {
      const rX=lx+Math.cos(a)*(lr+this.LOUPE.rimW*.5), rY=ly+Math.sin(a)*(lr+this.LOUPE.rimW*.5);
      const gRv=ctx.createRadialGradient(rX-.5,rY-.5,0,rX,rY,3.5);
      gRv.addColorStop(0,`rgba(248,218,110,${rimA*.9})`); gRv.addColorStop(.5,`rgba(188,148,45,${rimA*.7})`);
      gRv.addColorStop(1,'rgba(120,90,18,0)');
      ctx.beginPath(); ctx.arc(rX,rY,3.5,0,Math.PI*2); ctx.fillStyle=gRv; ctx.fill();
    });
    /* Poignée */
    const hA=Math.PI*.78;
    const hx1=lx+Math.cos(hA)*lr, hy1=ly+Math.sin(hA)*lr;
    const hx2=lx+Math.cos(hA)*(lr+48), hy2=ly+Math.sin(hA)*(lr+48);
    const hGr=ctx.createLinearGradient(hx1,hy1,hx2,hy2);
    hGr.addColorStop(0,'rgba(38,28,8,.95)'); hGr.addColorStop(.15,'rgba(168,132,42,.90)');
    hGr.addColorStop(.5,'rgba(205,162,52,.82)'); hGr.addColorStop(.85,'rgba(148,112,30,.72)');
    hGr.addColorStop(1,'rgba(80,58,14,.50)');
    ctx.shadowColor='rgba(0,0,0,.55)'; ctx.shadowBlur=6;
    ctx.strokeStyle=hGr; ctx.lineWidth=10; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(hx1,hy1); ctx.lineTo(hx2,hy2); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.strokeStyle=`rgba(252,222,118,${.38+Math.sin(this.phase*1.6)*.12})`;
    ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(hx1+1.2,hy1-.6); ctx.lineTo(hx2+1,hy2-.5); ctx.stroke();
    ctx.restore();
  }

  /* ─── Pensées ─── */
  _thoughtCat(chain) {
    for (const [k,pool] of Object.entries(THOUGHT_CHAINS)) { if (pool.includes(chain)) return k; }
    return RARE_THOUGHTS.includes(chain) ? 'rare' : 'idle';
  }

  _pickChain() {
    if (this.state===5) return THOUGHT_CHAINS.final[0];
    if (Math.random()<.04) return RARE_THOUGHTS[Math.floor(Math.random()*RARE_THOUGHTS.length)];
    const ctxKey = this.state===1?'idle': this.state===2?'notes': this.state===3?'loupe':'connection';
    const pool = THOUGHT_CHAINS[ctxKey]||THOUGHT_CHAINS.idle;
    let chain = pool[Math.floor(Math.random()*pool.length)];
    if (chain===this._lastChain && pool.length>1) chain=pool[(pool.indexOf(chain)+1)%pool.length];
    this._lastChain = chain; return chain;
  }

  _spawnThought() {
    let cnt=0; this.thoughts.forEach(p=>{ if(p.b==='t') cnt++; });
    if (cnt>=MAX_TH) return;
    const chain=this._pickChain(), cat=this._thoughtCat(chain);
    const bA=Math.random()*Math.PI*2, bR=20+Math.random()*60;
    const ox=this.C.thoughtCX+Math.cos(bA)*bR, oy=this.C.thoughtCY+Math.sin(bA)*bR;
    const outA=Math.atan2(oy-this.C.thoughtCY,ox-this.C.thoughtCX)+(Math.random()-.5)*.55;
    const perpA=outA+Math.PI/2, curvStr=(Math.random()-.5)*.0016;
    const spd=.05+Math.random()*.05;
    this.thoughts.push({b:'t',chain,cat,
      color:THOUGHT_COLORS[cat]||THOUGHT_COLORS.idle,
      chainIdx:0,revealProg:0,displayText:'',
      x:ox,y:oy,vx:Math.cos(outA)*spd,vy:Math.sin(outA)*spd,
      accel:1.008+Math.random()*.004,
      perpX:Math.cos(perpA)*curvStr,perpY:Math.sin(perpA)*curvStr,
      life:0,max:260+Math.floor(Math.random()*120),alpha:0,
      fsStart:20+Math.random()*8,fsGrow:2.2+Math.random()*1.0,
      rot:(Math.random()-.5)*.04,rotSpd:(Math.random()-.5)*.0006,
      tp:Math.random()*Math.PI*2,ts:.035+Math.random()*.025,
      fadeStartR:this.C.ring.r*.55,fadeEndR:this.C.ring.r*.82,
      cx:this.C.thoughtCX,cy:this.C.thoughtCY,
    });
  }

  _drawThoughts() {
    const ctx=this.ctxTh;
    ctx.clearRect(0,0,NATIVE,NATIVE);
    for (let i=this.thoughts.length-1;i>=0;i--) {
      const p=this.thoughts[i], t=p.life/p.max;
      p.vx*=p.accel; p.vy*=p.accel; p.vx+=p.perpX; p.vy+=p.perpY; p.rot+=p.rotSpd; p.tp+=p.ts;
      const tx=Math.sin(p.tp*1.8)*.35, ty=Math.cos(p.tp*2.5)*.28;
      const fs=p.fsStart*(1+t*p.fsGrow);
      const cur=p.chain[p.chainIdx], slotR=Math.max(1,cur.r);
      p.revealProg+=1/slotR;
      if (p.revealProg>=1) {
        p.revealProg=1;
        if (!p._hold) p._hold=0; p._hold++;
        if (p._hold>35&&p.chainIdx<p.chain.length-1){ p.chainIdx++; p.revealProg=0; p._hold=0; }
      }
      const vis=Math.floor(p.revealProg*cur.w.length);
      p.displayText = vis>=cur.w.length ? cur.w : cur.w.slice(0,Math.max(0,vis))+'…';
      if (p.alpha<.85) p.alpha=Math.min(.85,p.alpha+.022);
      const ddx=p.x-p.cx, ddy=p.y-p.cy, dist=Math.sqrt(ddx*ddx+ddy*ddy);
      const fr=p.fadeEndR-p.fadeStartR;
      const spatF=dist<=p.fadeStartR?1:dist>=p.fadeEndR?0:1-(dist-p.fadeStartR)/fr;
      const timeF=t>.60?Math.pow(1-(t-.60)/.40,1.2):1;
      const a=p.alpha*Math.min(spatF,timeF);
      if (a>.012) {
        ctx.save(); ctx.translate(p.x+tx,p.y+ty); ctx.rotate(p.rot); ctx.globalAlpha=a;
        ctx.font=`italic bold ${fs}px 'Courier New',monospace`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        const col=p.color;
        ctx.shadowColor=`${col}${a*.45})`; ctx.shadowBlur=3.5;
        ctx.fillStyle=`${col}${a*.88})`; ctx.fillText(p.displayText,0,0);
        ctx.restore();
      }
      p.x+=p.vx; p.y+=p.vy; p.life++;
      if (p.life>=p.max) this.thoughts.splice(i,1);
    }
  }

  /* ─── Tick principal ─── */
  _tick() {
    this.frameN++; this.phase+=.009;
    this.ctxFX.clearRect(0,0,NATIVE,NATIVE);
    this._drawTimeTint();
    this._drawRingHalo();
    this._drawFlameGlow();
    this._drawMetal();
    this._drawLoupe();

    /* Spawns */
    if (this.frameN%2===0) this._spawnFlame();
    if (this.frameN%3===0 && Math.random()<(this.hovered?.72:.45)) this._spawnEmber();
    if (this.frameN%6===0 && Math.random()<.55) this._spawnHeatHaze();

    /* Pensées */
    this.thTimer++;
    if (this.thTimer>=this.thInterval) {
      this._spawnThought(); this.thTimer=0; this.thInterval=this._nextThInt();
    }

    /* Particules */
    for (let i=this.particles.length-1;i>=0;i--) {
      const p=this.particles[i], t=p.life/p.max, ctx=this.ctxFX;
      if (p.b==='flame') {
        p.vx*=.982; p.vy*=.975; p.rot+=p.twist;
        p.vx+=Math.sin(this.fp1*1.2+p.rot*2)*.010;
        const w=Math.max(0.5,p.wStart+(p.wEnd-p.wStart)*t);
        const h=Math.max(0.5,p.hStart+(p.hEnd-p.hStart)*t);
        if (!isFinite(w)||!isFinite(h)){p.life=p.max;continue;}
        const fi=Math.min(1,t/.04), fo=t>.18?Math.pow(1-(t-.18)/.82,1.0):1;
        const a=fi*fo*Math.max(.38,this.lf)*(this.hovered?.82:.68);
        if (a>.005) {
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
          const gO=ctx.createRadialGradient(0,0,0,0,0,sR(w*2.2));
          gO.addColorStop(0,`rgba(255,255,252,${a*.62})`); gO.addColorStop(.22,`rgba(255,255,228,${a*.44})`);
          gO.addColorStop(.50,`rgba(255,240,165,${a*.22})`); gO.addColorStop(.78,`rgba(255,195,55,${a*.08})`);
          gO.addColorStop(1,'rgba(230,110,5,0)');
          ctx.beginPath(); ctx.ellipse(0,0,sR(w*1.8),sR(h*1.3),0,0,Math.PI*2); ctx.fillStyle=gO; ctx.fill();
          const cR=sR(Math.max(w,h)*.82);
          const gC=ctx.createRadialGradient(0,sN(-h*.12),0,0,0,cR);
          gC.addColorStop(0,`rgba(255,255,255,${a*.99})`); gC.addColorStop(.22,`rgba(255,255,245,${a*.92})`);
          gC.addColorStop(.42,`rgba(255,255,218,${a*.78})`); gC.addColorStop(.62,`rgba(255,248,170,${a*.52})`);
          gC.addColorStop(.82,`rgba(255,215,80,${a*.22})`); gC.addColorStop(1,'rgba(248,140,15,0)');
          ctx.beginPath(); ctx.ellipse(0,sN(-h*.04),sR(w),sR(h),0,0,Math.PI*2); ctx.fillStyle=gC; ctx.fill();
          ctx.restore();
        }
      } else if (p.b==='haze') {
        p.vx*=.994; p.vy*=.996;
        const fi=Math.min(1,t/.12), fo=t>.5?1-(t-.5)/.5:1, a=fi*fo*.045;
        if (a>.002) {
          const hS=Math.max(0.5,p.sz);
          const gh=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,hS);
          gh.addColorStop(0,`rgba(235,205,145,${a})`); gh.addColorStop(.5,`rgba(215,180,110,${a*.5})`);
          gh.addColorStop(1,'rgba(190,155,80,0)');
          ctx.beginPath(); ctx.arc(p.x,p.y,hS,0,Math.PI*2); ctx.fillStyle=gh; ctx.fill();
        }
      } else if (p.b==='ember') {
        p.wobble+=p.wobbleSpd; p.vx+=Math.sin(p.wobble)*.008; p.vx*=.97; p.vy*=.982;
        const fi=Math.min(1,t*6), fo=Math.pow(1-t,1.8), a=fi*fo*(this.hovered?.88:.65);
        if (a>.008) {
          const sz=Math.max(0.5,p.sz*(1-t*.35)), szH=sR(sz*3.5);
          const gG=p.hot?Math.round(255-t*55):Math.round(245-t*65);
          const gB=p.hot?Math.round(245-t*245):Math.round(155-t*155);
          ctx.save(); ctx.shadowColor=`rgba(255,${Math.round(gG*.75)},${Math.round(gB*.5)},${a*.70})`; ctx.shadowBlur=sz*2.8;
          ctx.beginPath(); ctx.arc(p.x,p.y,sz,0,Math.PI*2); ctx.fillStyle=`rgba(255,${gG},${gB},${a})`; ctx.fill();
          const gE=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,szH);
          gE.addColorStop(0,`rgba(255,${gG},50,${a*.28})`); gE.addColorStop(1,'rgba(220,100,0,0)');
          ctx.beginPath(); ctx.arc(p.x,p.y,szH,0,Math.PI*2); ctx.fillStyle=gE; ctx.fill(); ctx.restore();
        }
      }
      p.x+=p.vx||0; p.y+=p.vy||0; p.life++;
      if (p.life>=p.max) this.particles.splice(i,1);
    }

    this._drawThoughts();
    this._animId = requestAnimationFrame(this._tick);
  }

  destroy() { cancelAnimationFrame(this._animId); }
}

window.SherlockBadge = SherlockBadge;

})();
