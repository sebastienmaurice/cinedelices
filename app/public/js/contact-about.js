/**
 * contact-about.js — Refonte v2 (moodboard mars 2026)
 * Gère : team cards, member card, contact form, hero tabs, scroll-top
 */
(function () {
  'use strict';

  /* ─── TEAM DATA ──────────────────────────────────────────────────── */
  var TEAM = {
    sebastien: {
      img:   '/images/profil-contact/profil-sebastien.jpg',
      name:  'Seb le Fourbe',
      role:  'Développeur Front-End UI · Intégrateur Web · UI Designer',
      tag1:  'Développeur Full Stack',
      tag2:  'Front-end',
      bio:   "Avec 15 ans à sculpter des interfaces, Seb le Fourbe traduit chaque maquette Figma en code pixel-perfect, du premier trait au dernier commit. Graphiste de formation, développeur front-end et UI designer de métier, il maîtrise l'intégration responsive et l'accessibilité autant que la typographie et la direction artistique. Sur Ciné Délices, il orchestre l'expérience visuelle de la charte graphique aux animations canvas, avec une obsession simple : que chaque page soit aussi immersive qu'un générique de film.",
      portfolio: 'https://sebastienmaurice.github.io/',
      tech:  [
        { n: 'HTML5',      f: true  },
        { n: 'CSS3',       f: true  },
        { n: 'JavaScript', f: true  },
        { n: 'Svelte',     f: true  },
        { n: 'Figma',      f: true  },
        { n: 'Responsive', f: true  },
        { n: 'Git',        f: true  },
        { n: 'Node.js',    f: false },
      ],
      films: ['Retour vers le futur', 'Le Seigneur des Anneaux', 'Interstellar', 'Forrest Gump', 'Star Wars'],
      li:    'https://www.linkedin.com/in/sebastien-maurice',
      gh:    'https://github.com/sebastienmaurice',
    },
    ludovic: {
      img:   '/images/profil-contact/profil-ludovic.jpg',
      name:  'Ludo la Lame Sombre',
      role:  'Capitaine du back-end',
      tag1:  'Développeur Full Stack',
      tag2:  'Back-end',
      bio:   "Architecte silencieux de Ciné Délices, Ludo la Lame Sombre conçoit les routes, les API et les schémas de base de données qui font tourner la machine. Node.js dans une main, PostgreSQL dans l'autre, il traque les bugs avec une précision chirurgicale et s'assure que chaque requête arrive à bon port, même par gros temps.",
      tech:  [
        { n: 'Node.js',    f: false },
        { n: 'Express',    f: false },
        { n: 'PostgreSQL', f: false },
        { n: 'API REST',   f: false },
        { n: 'JavaScript', f: true  },
        { n: 'Git',        f: true  },
      ],
      films: ['Harry Potter', 'Pirates des Caraïbes', '300', 'V pour Vendetta'],
      li:    'https://www.linkedin.com/in/ludovictrichereaupsp/',
      gh:    'https://github.com/TRICHEREAUludovic',
    },
    richard: {
      img:   '/images/profil-contact/profil-richard.jpg',
      name:  'Richard Main-de-Brume',
      role:  'Navigateur des mers culinaires',
      tag1:  'Développeur Full Stack',
      tag2:  'Back-end',
      bio:   "Entre deux commits, Richard Main-de-Brume tisse le fil entre cinéma et gastronomie. Développeur back-end à l'instinct narratif, il modélise les données, structure les recettes et construit les ponts API qui relient chaque film à une expérience culinaire. Son code a le goût des choses bien faites.",
      tech:  [
        { n: 'Node.js',    f: false },
        { n: 'Express',    f: false },
        { n: 'PostgreSQL', f: false },
        { n: 'JavaScript', f: true  },
        { n: 'API REST',   f: false },
        { n: 'Git',        f: true  },
      ],
      films: ['Ratatouille', 'Amélie Poulain', 'Le Dîner de Cons', 'Titanic'],
      li:    'https://www.linkedin.com/in/richard-francois-6b5a80235/',
      gh:    'https://github.com/Richard-Francois-3842',
    },
  };

  /* ─── HELPERS ────────────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  /* ─── RENDER MEMBER ─────────────────────────────────────────────── */
  function renderMember(key) {
    var d = TEAM[key];
    if (!d) return;

    $('caMImg').src    = d.img;
    $('caMImg').alt    = d.name;
    $('caMName').textContent = d.name;
    $('caMRole').textContent = d.role;
    $('caMTag1').textContent = d.tag1;
    $('caMTag2').textContent = d.tag2;
    $('caMMBio').textContent = d.bio;
    $('caMLI').href = d.li;
    $('caMGH').href = d.gh;

    /* Portfolio — visible uniquement si le membre en a un */
    var portEl = $('caMPort');
    if (portEl) {
      if (d.portfolio) {
        portEl.href = d.portfolio;
        portEl.style.display = '';
      } else {
        portEl.style.display = 'none';
      }
    }

    $('caMPills').innerHTML = d.tech.map(function (t) {
      return '<span class="ca-pill"><span class="ca-pill__dot ' + (t.f ? 'ca-dot-fe' : 'ca-dot-be') + '"></span>' + t.n + '</span>';
    }).join('');

    $('caMFilms').innerHTML = d.films.map(function (f) {
      return '<a class="ca-film-tag" href="https://www.themoviedb.org/search?query=' + encodeURIComponent(f) + '&language=fr" target="_blank" rel="noopener noreferrer">' + f + '</a>';
    }).join('');

    /* Ré-animation */
    var card = $('caMemberCard');
    card.style.animation = 'none';
    void card.offsetWidth; /* reflow */
    card.style.animation = 'ca-cardIn .45s cubic-bezier(.22,1,.36,1) both';
  }

  /* ─── SHOW MEMBER / SHOW FORM ───────────────────────────────────── */
  function showMember(key) {
    $('caMemberCard').style.display = '';
    $('caContactCard').classList.remove('is-on');
    renderMember(key);
  }

  function showForm() {
    $('caMemberCard').style.display = 'none';
    var cf = $('caContactCard');
    cf.style.animation = 'none';
    void cf.offsetWidth;
    cf.style.animation = 'ca-cardIn .45s cubic-bezier(.22,1,.36,1) both';
    cf.classList.add('is-on');
  }

  /* ─── TEAM CARD CLICKS ───────────────────────────────────────────── */
  function selectCard(activeCard) {
    document.querySelectorAll('.ca-portrait').forEach(function (c) {
      c.classList.remove('is-on');
      c.setAttribute('aria-pressed', 'false');
    });
    activeCard.classList.add('is-on');
    activeCard.setAttribute('aria-pressed', 'true');
  }

  document.querySelectorAll('.ca-portrait[data-member]').forEach(function (card) {
    function go() {
      selectCard(card);
      showMember(card.dataset.member);
    }
    card.addEventListener('click', go);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  /* Contact tcard */
  var tcContact = $('caTcardContact');
  function goContact() {
    selectCard(tcContact);
    showForm();
  }
  tcContact.addEventListener('click', goContact);
  tcContact.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goContact(); }
  });

  /* ─── HERO TABS NAVIGATION ───────────────────────────────────────── */
  function activateHeroTab(target) {
    document.querySelectorAll('.ca-hero__tab').forEach(function (t) {
      t.classList.toggle('is-active', t.dataset.target === target);
    });

    if (target === 'team') {
      var first = document.querySelector('.ca-portrait[data-member]');
      if (first) {
        selectCard(first);
        showMember(first.dataset.member);
      }
      $('section-team').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (target === 'about') {
      $('section-about').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (target === 'contact') {
      selectCard(tcContact);
      showForm();
      $('section-team').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  document.querySelectorAll('.ca-hero__tab').forEach(function (tab) {
    tab.addEventListener('click', function () { activateHeroTab(tab.dataset.target); });
  });

  /* ─── FORM VALIDATION + SUBMIT ───────────────────────────────────── */
  $('caContactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;
    var fields = [
      { el: $('caFn'), test: function (v) { return v.trim().length >= 2; } },
      { el: $('caFp'), test: function (v) { return v.trim().length >= 2; } },
      { el: $('caFe'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); } },
      { el: $('caFm'), test: function (v) { return v.trim().length >= 10; } },
    ];

    fields.forEach(function (f) {
      var ok = f.test(f.el.value);
      f.el.classList.toggle('is-err', !ok);
      f.el.classList.toggle('is-ok',  ok);
      if (!ok) valid = false;
    });

    if (!valid) return;

    var btn  = $('caBtnSend');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    /* Soumettre via fetch pour rester sur la page */
    var form = $('caContactForm');
    var data = new URLSearchParams(new FormData(form));
    fetch(form.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data,
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json.success) {
          btn.classList.add('is-sent');
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Message envoyé !';
          setTimeout(function() {
            form.style.display = 'none';
            $('caFormSuccess').classList.add('is-on');
          }, 800);
        } else {
          btn.disabled = false;
          btn.textContent = 'Envoyer le message';
        }
      })
      .catch(function () {
        /* En cas d'erreur réseau, fallback : soumettre normalement */
        form.submit();
      });
  });

  /* Retirer is-err au focus */
  document.querySelectorAll('.ca-fi').forEach(function (fi) {
    fi.addEventListener('input', function () {
      fi.classList.remove('is-err');
    });
  });

  /* ─── SCROLL-TOP ─────────────────────────────────────────────────── */
  var scrollBtn = $('caScrollTop');
  window.addEventListener('scroll', function () {
    scrollBtn.classList.toggle('is-on', window.scrollY > 400);
  }, { passive: true });
  scrollBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ─── INIT : afficher Sébastien par défaut ───────────────────────── */
  renderMember('sebastien');

})();
