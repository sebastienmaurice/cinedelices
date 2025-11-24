// Navigation entre les sections Contact et À propos
document.addEventListener("DOMContentLoaded", function () {
  const navButtons = document.querySelectorAll(".banner__nav-btn");
  const aboutSection = document.getElementById("about");
  const cineDelicesAboutSection = document.getElementById("cine-delices-about");
  // La section contact n'existe plus, utiliser aboutSection à la place
  const contactSection = aboutSection;

  // Variables globales pour les fonctions de navigation des cartes
  let showMemberProfileFunc,
    showContactFormFunc,
    sideCardsGlobal,
    updateCenterCardFunc;

  // Gestion du scroll smooth et de l'état actif
  navButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();

      const targetSection = this.getAttribute("data-section");

      // Mise à jour de l'état actif
      navButtons.forEach((b) => b.classList.remove("banner__nav-btn--active"));
      this.classList.add("banner__nav-btn--active");

      // Attendre que les fonctions soient définies
      setTimeout(() => {
        if (targetSection === "about") {
          // Activer la première carte de la team (Sébastien)
          const firstTeamCard = document.querySelector(
            '[data-member="sebastien"]'
          );
          if (firstTeamCard && showMemberProfileFunc) {
            const allSideCards = document.querySelectorAll(
              ".team-pirate-card-side"
            );
            allSideCards.forEach((c) => c.classList.remove("active"));
            firstTeamCard.classList.add("active");
            showMemberProfileFunc("sebastien");
          }
        } else if (targetSection === "contact") {
          // Afficher le formulaire de contact directement
          if (showContactFormFunc) {
            const allSideCards = document.querySelectorAll(
              ".team-pirate-card-side"
            );
            allSideCards.forEach((c) => c.classList.remove("active"));
            showContactFormFunc();
          }
        } else if (targetSection === "cine-delices-about") {
          // Scroll vers la section "À propos de Ciné Délices"
          if (cineDelicesAboutSection) {
            const offsetTop = cineDelicesAboutSection.offsetTop - 100;
            window.scrollTo({
              top: offsetTop,
              behavior: "smooth",
            });
            return;
          }
        }

        // Scroll smooth vers la section
        const targetElement =
          targetSection === "contact" ? contactSection : aboutSection;

        // Si c'est "about", scroller vers .team-section
        if (targetSection === "about" && targetElement) {
          const teamSection = targetElement.querySelector(".team-section");
          if (teamSection) {
            const offsetTop = teamSection.offsetTop - 100;
            window.scrollTo({
              top: offsetTop,
              behavior: "smooth",
            });
            return;
          }
          // Fallback vers le container si team-section n'existe pas
          const container = targetElement.querySelector(
            ".about-section__container"
          );
          if (container) {
            const offsetTop = container.offsetTop - 100;
            window.scrollTo({
              top: offsetTop,
              behavior: "smooth",
            });
            return;
          }
        }
        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 100;
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      }, 150);
    });
  });

  // Mise à jour de l'état actif au scroll
  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0,
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        navButtons.forEach((btn) => {
          btn.classList.remove("banner__nav-btn--active");
          if (btn.getAttribute("data-section") === sectionId) {
            btn.classList.add("banner__nav-btn--active");
          }
        });
      }
    });
  }, observerOptions);

  if (contactSection) observer.observe(contactSection);
  if (aboutSection) observer.observe(aboutSection);
  if (cineDelicesAboutSection) observer.observe(cineDelicesAboutSection);

  // Gestion des ancres dans l'URL
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const targetBtn = document.querySelector(
      `.banner__nav-btn[data-section="${hash}"]`
    );
    if (targetBtn) {
      // Petit délai pour s'assurer que tout est chargé
      setTimeout(() => {
        targetBtn.click();
      }, 100);
    }
  }

  // ======================================================
  // GESTION DES CARTES PIRATES - ÉQUIPE
  // ======================================================
  // Liste complète de toutes les technologies disponibles
  const allTechs = [
    "HTML5",
    "CSS3",
    "JavaScript",
    "Svelte",
    "Node.js",
    "Express",
    "PostgreSQL",
    "Git",
    "GitHub",
    "Figma",
    "Illustrator",
    "Photoshop",
    "InDesign",
    "API REST",
  ];

  // Technologies front-end et back-end - constantes globales
  const frontEndTechs = [
    "javascript",
    "js",
    "css3",
    "css",
    "html5",
    "html",
    "svelte",
    "figma",
    "illustrator",
    "photoshop",
    "indesign",
    "github",
    "git",
  ];

  const backEndTechs = [
    "node-js",
    "nodejs",
    "express",
    "postgresql",
    "postgres",
    "api-rest",
    "rest",
    "api",
  ];

  // Mapping des technologies vers les noms de fichiers SVG - constantes globales
  const techIconMapDirect = {
    HTML5: "html5-icon",
    CSS3: "css3-icon",
    JavaScript: "javascript-icon",
    Svelte: "svelte-icon",
    "Node.js": "nodejs-icon",
    Express: "expressjs-icon",
    PostgreSQL: "postgresql-icon",
    Git: "git-icon",
    GitHub: "github-icon",
    Figma: "figma-icon",
    Illustrator: "adobe-illustrator-icon",
    Photoshop: "Adobe-Photoshop-icon",
    InDesign: "adobe-Indesign-icon",
    "API REST": "rest-api-icon",
  };

  const techIconMap = {
    html5: "html5-icon",
    html: "html5-icon",
    css3: "css3-icon",
    css: "css3-icon",
    javascript: "javascript-icon",
    js: "javascript-icon",
    svelte: "svelte-icon",
    "node.js": "nodejs-icon",
    "node-js": "nodejs-icon",
    nodejs: "nodejs-icon",
    express: "expressjs-icon",
    postgresql: "postgresql-icon",
    postgres: "postgresql-icon",
    git: "git-icon",
    github: "github-icon",
    figma: "figma-icon",
    illustrator: "adobe-illustrator-icon",
    photoshop: "Adobe-Photoshop-icon",
    indesign: "adobe-Indesign-icon",
    "api-rest": "rest-api-icon",
    apirest: "rest-api-icon",
    rest: "rest-api-icon",
    api: "rest-api-icon",
    "rest-api": "rest-api-icon",
  };

  const techFullNames = {
    html5: "HTML5",
    html: "HTML5",
    css3: "CSS3",
    css: "CSS3",
    javascript: "JavaScript",
    js: "JavaScript",
    svelte: "Svelte",
    "node.js": "Node.js",
    "node-js": "Node.js",
    nodejs: "Node.js",
    express: "Express",
    postgresql: "PostgreSQL",
    postgres: "PostgreSQL",
    git: "Git",
    github: "GitHub",
    figma: "Figma",
    illustrator: "Adobe Illustrator",
    photoshop: "Adobe Photoshop",
    indesign: "Adobe InDesign",
    "api-rest": "REST API",
    apirest: "REST API",
    rest: "REST API",
    api: "REST API",
    "rest-api": "REST API",
  };

  // Mode debug (désactiver en production)
  const DEBUG_MODE = false;

  // Fonction réutilisable pour créer les gestionnaires de tooltip
  function createTooltipHandlers(buttonElement, tooltipText) {
    let tooltipElement = null;
    let tooltipTimeout = null;

    const showTooltip = function () {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement.parentNode.removeChild(tooltipElement);
      }

      tooltipElement = document.createElement("div");
      tooltipElement.className = "tech-tooltip";
      tooltipElement.textContent = tooltipText;
      document.body.appendChild(tooltipElement);

      const rect = buttonElement.getBoundingClientRect();
      tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
      tooltipElement.style.top = `${rect.top - 10}px`;

      requestAnimationFrame(() => {
        if (tooltipElement) {
          tooltipElement.classList.add("visible");
        }
      });
    };

    const hideTooltip = function () {
      if (tooltipElement) {
        tooltipElement.classList.remove("visible");
        tooltipTimeout = setTimeout(() => {
          if (tooltipElement && tooltipElement.parentNode) {
            tooltipElement.parentNode.removeChild(tooltipElement);
          }
          tooltipElement = null;
          tooltipTimeout = null;
        }, 300);
      }
    };

    buttonElement.addEventListener("mouseenter", showTooltip);
    buttonElement.addEventListener("mouseleave", hideTooltip);
    buttonElement.addEventListener("focus", showTooltip);
    buttonElement.addEventListener("blur", hideTooltip);
  }

  // Fonction réutilisable pour créer un bouton tech
  function createTechButton(iconName, fullName, techKey) {
    const button = document.createElement("button");
    button.className = "tech-circle-button";
    button.setAttribute("data-tech", techKey);
    button.setAttribute("aria-label", fullName);
    button.setAttribute("data-tooltip", fullName);
    button.setAttribute("role", "button");
    button.type = "button";

    const img = document.createElement("img");
    const iconPath = `/images/tech-icons/${iconName}.svg`;
    img.src = iconPath;
    img.alt = fullName;
    img.width = 20;
    img.height = 20;
    img.loading = "lazy";
    img.style.display = "block";
    img.style.objectFit = "contain";

    // Gestion d'erreur si l'image n'existe pas
    img.onerror = function () {
      if (DEBUG_MODE) {
        console.error(`[Tech Icon] ❌ Image not found: ${iconPath}`);
        console.error(`[Tech Icon] Full path attempted:`, this.src);
      }
      this.style.display = "none";
      button.style.border = "2px dashed var(--rouge-projecteur)";
      button.title = `Icone manquante: ${iconName}.svg`;
    };

    // Log de succès pour debug
    if (DEBUG_MODE) {
      img.onload = function () {
        console.log(`[Tech Icon] ✅ Image loaded: ${iconPath}`);
      };
    }

    button.appendChild(img);
    createTooltipHandlers(button, fullName);

    return button;
  }

  const teamMembers = {
    sebastien: {
      name: "Seb le Fourbe",
      image: "/images/profil-contact/profil-sebastien.jpg",
      bio: "Graphiste imaginatif, webdesigner affûté et développeur full-stack orienté front, Seb le Fourbe façonne l'identité visuelle de Ciné Délices.\n\nIl mêle univers pirate et esthétique cinématographique pour donner vie aux recettes et aux interfaces.\n\nPolyvalent, il conçoit autant l'apparence que l'expérience, du design jusqu'au code.\n\nSa précision et son œil créatif transforment chaque idée en moment fort digne du grand écran.",
      tags: ["Développeur full stack", "Front-end"],
      tech: [...allTechs],
      favorites: [
        "Retour vers le futur",
        "Le seigneur des anneaux",
        "Interstellar",
        "Forrest Gump",
        "Star Wars",
        "Le Dernier Samourai",
      ],
    },
    ludovic: {
      name: "Ludo la Lame Sombre",
      image: "/images/profil-contact/profil-ludovic.jpg",
      bio: "Passionné de cinéma et de cuisine, Ludovic a créé Ciné Délices pour partager sa passion des recettes inspirées des films cultes. Fondateur visionnaire, il guide l'équipe vers de nouveaux horizons culinaires.",
      tags: ["Développeur full stack", "Back-end"],
      tech: [...allTechs],
      favorites: [
        "Harry Potter",
        "Pirates des Caraïbes",
        "300",
        "V pour vendetta",
      ],
    },
    denis: {
      name: "Denis l'Oeil-Maudit",
      image: "/images/profil-contact/profil-denis.jpg",
      bio: "Développeur full-stack, Denis transforme les idées en expériences web interactives pour partager les recettes avec la communauté. Maître des technologies, il forge les outils qui font vivre Ciné Délices.",
      tags: ["Développeur full stack", "Back-end"],
      tech: [...allTechs],
      favorites: ["John Wick", "Matrix", "Le Parrain"],
    },
    richard: {
      name: "Richard Main-de-Brume",
      image: "/images/profil-contact/profil-richard.jpg",
      bio: "Journaliste gastronomique et grande cinéphile, Richard rédige les recettes et les articles qui font le lien entre cinéma et cuisine. Sa plume agile navigue entre les saveurs et les émotions cinématographiques.",
      tags: ["Développeur full stack", "Back-end"],
      tech: [...allTechs],
      favorites: [
        "Ratatouille",
        "Amélie Poulain",
        "Le Dîner de Cons",
        "Tatanique",
      ],
    },
  };

  const sideCards = document.querySelectorAll(".team-pirate-card-side");
  const centerCard = document.getElementById("team-pirate-card-center");
  const contactCard = document.getElementById("team-pirate-card-contact");
  const closeBtns = document.querySelectorAll(
    ".team-pirate-card-center__close"
  );
  let currentMember = "sebastien"; // Par défaut, j'ai affiché mon nom, m'en veuillez pas :)

  // Fonction pour mettre à jour la carte centrale
  function updateCenterCard(memberKey) {
    const member = teamMembers[memberKey];
    if (!member) return;

    currentMember = memberKey;

    // Mise à jour de l'image
    const centerImg = document.getElementById("team-pirate-center-img");
    centerImg.src = member.image;
    centerImg.alt = `Portrait ${member.name}`;

    // Mise à jour des tags
    const tag1 = document.getElementById("team-pirate-center-tag-1");
    const tag2 = document.getElementById("team-pirate-center-tag-2");
    if (tag1) tag1.textContent = member.tags[0] || "";
    if (tag2) tag2.textContent = member.tags[1] || "";

    // Mise à jour du nom
    const nameEl = document.getElementById("team-pirate-center-name");
    if (nameEl) nameEl.textContent = member.name;

    // Mise à jour de la bio
    const bioEl = document.getElementById("team-pirate-center-bio");
    if (bioEl) bioEl.textContent = member.bio;

    // Mise à jour des technologies - Regroupées par catégorie
    const techList = document.getElementById("team-pirate-center-tech");
    const techListMobile = document.getElementById(
      "team-pirate-center-tech-mobile"
    );
    if ((techList || techListMobile) && member.tech) {
      if (techList) techList.innerHTML = "";
      if (techListMobile) techListMobile.innerHTML = "";

      // Séparer les technologies
      const frontEnd = [];
      const backEnd = [];

      member.tech.forEach((tech) => {
        const techKey = tech.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const normalizedKey = techKey.replace(/-/g, "");

        // Vérifier si c'est une tech front-end ou back-end
        const isFrontEnd = frontEndTechs.some(
          (ft) => normalizedKey.includes(ft.replace(/-/g, "")) || techKey === ft
        );
        const isBackEnd = backEndTechs.some(
          (bt) => normalizedKey.includes(bt.replace(/-/g, "")) || techKey === bt
        );

        if (isFrontEnd) {
          frontEnd.push(tech);
        } else if (isBackEnd) {
          backEnd.push(tech);
        } else {
          // Par défaut, considérer comme front-end
          frontEnd.push(tech);
        }
      });

      // Debug : afficher les technologies trouvées
      if (DEBUG_MODE) {
        console.log(`[Tech] Front-end techs:`, frontEnd);
        console.log(`[Tech] Back-end techs:`, backEnd);
      }

      // Afficher d'abord les front-end, puis les back-end
      const allTechsToDisplay = [...frontEnd, ...backEnd];
      if (DEBUG_MODE) {
        console.log(
          `[Tech] All techs to display for ${member.name}:`,
          allTechsToDisplay
        );
      }

      allTechsToDisplay.forEach((tech) => {
        // Normaliser le nom de la technologie - plusieurs tentatives
        const techLower = tech.toLowerCase().trim();
        let techKey = techLower.replace(/[^a-z0-9]/g, "-");

        // Gérer les cas spéciaux
        if (techKey.includes("node")) {
          techKey = "node-js";
        }
        // Gérer les cas API REST
        if (techKey.includes("api") || techKey.includes("rest")) {
          if (techKey.includes("api") && techKey.includes("rest")) {
            techKey = "api-rest";
          } else if (techKey.includes("rest")) {
            techKey = "rest";
          } else if (techKey.includes("api")) {
            techKey = "api";
          }
        }
        const normalizedKey = techKey.replace(/-/g, "");

        // Trouver le nom du fichier SVG - essayer d'abord le mapping direct, puis les variantes normalisées
        let iconName =
          techIconMapDirect[tech] || // Mapping direct depuis le nom exact
          techIconMap[techKey] ||
          techIconMap[normalizedKey] ||
          techIconMap[techLower] ||
          techIconMap[techLower.replace(/\s+/g, "-")] ||
          techIconMap[techLower.replace(/\s+/g, "")] ||
          techIconMap[techLower.replace(/\./g, "")] ||
          techIconMap[techLower.replace(/\./g, "-")];

        // Debug détaillé pour identifier le problème
        if (!iconName) {
          if (DEBUG_MODE) {
            console.error(
              `[Tech Icon] ❌ Tech: "${tech}" → techKey: "${techKey}" → normalizedKey: "${normalizedKey}" → NOT FOUND`
            );
            console.error(
              `[Tech Icon] Direct map check for "${tech}":`,
              techIconMapDirect[tech]
            );
            console.error(
              `[Tech Icon] Normalized map check:`,
              techIconMap[techKey],
              techIconMap[normalizedKey]
            );
            console.error(
              `[Tech Icon] Available direct keys:`,
              Object.keys(techIconMapDirect)
            );
          }
          // Fallback : utiliser le techKey directement
          iconName = techKey;
        } else if (DEBUG_MODE) {
          console.log(
            `[Tech Icon] ✓ "${tech}" → "${iconName}.svg" (from ${
              techIconMapDirect[tech] ? "direct" : "normalized"
            } map)`
          );
        }

        // Nom complet pour le tooltip
        const fullName =
          techFullNames[techKey] || techFullNames[normalizedKey] || tech;

        // Créer et ajouter le bouton desktop
        if (techList) {
          const button = createTechButton(iconName, fullName, techKey);
          techList.appendChild(button);
        }

        // Créer et ajouter le bouton mobile
        if (techListMobile) {
          const buttonMobile = createTechButton(iconName, fullName, techKey);
          techListMobile.appendChild(buttonMobile);
        }
      });
    }

    // Mise à jour des films favoris
    const favoritesList = document.getElementById(
      "team-pirate-center-favorites"
    );
    if (favoritesList) {
      favoritesList.innerHTML = "";
      member.favorites.forEach((film) => {
        const item = document.createElement("span");
        item.className = "team-pirate-card-center__favorite-item";
        item.textContent = film;
        favoritesList.appendChild(item);
      });
    }

    // Animation de la carte
    centerCard.style.animation = "none";
    setTimeout(() => {
      centerCard.style.animation =
        "pirateCardAppear 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    }, 10);
  }

  // Fonction pour afficher le formulaire de contact
  function showContactForm() {
    // Masquer la carte profil
    centerCard.classList.add("hidden");

    // Afficher le formulaire de contact
    if (contactCard) {
      contactCard.classList.add("active");
    }
  }

  // Fonction pour afficher le profil d'un membre
  function showMemberProfile(memberKey) {
    // Masquer le formulaire de contact
    if (contactCard) {
      contactCard.classList.remove("active");
    }

    // Afficher la carte profil
    centerCard.classList.remove("hidden");

    // Mettre à jour la carte centrale
    updateCenterCard(memberKey);
  }

  // Assigner les fonctions aux variables globales pour l'utilisation dans les boutons de navigation
  showMemberProfileFunc = showMemberProfile;
  showContactFormFunc = showContactForm;

  // Gestion des clics sur les cartes latérales
  sideCards.forEach((card) => {
    card.addEventListener("click", function () {
      const memberKey = this.getAttribute("data-member");

      // Animation cinématographique au clic
      this.classList.remove("cinema-click");
      // Force le reflow pour réinitialiser l'animation
      void this.offsetWidth;
      this.classList.add("cinema-click");

      // Retirer l'animation après qu'elle soit terminée
      setTimeout(() => {
        this.classList.remove("cinema-click");
      }, 500);

      // Retirer l'état actif de toutes les cartes
      sideCards.forEach((c) => c.classList.remove("active"));

      // Ajouter l'état actif à la carte cliquée
      this.classList.add("active");

      // Afficher le profil du membre
      showMemberProfile(memberKey);
    });

    // Effet hover pour prévisualiser
    card.addEventListener("mouseenter", function () {
      if (!this.classList.contains("active")) {
        const memberKey = this.getAttribute("data-member");
        // Optionnel : prévisualisation au hover (désactivé pour l'instant)
      }
    });
  });

  // Note: Le bouton fermer a été supprimé, les réseaux sociaux sont maintenant en overlay

  // Initialisation : afficher Sébastien par défaut
  const defaultCard = document.querySelector('[data-member="sebastien"]');
  if (defaultCard) {
    defaultCard.classList.add("active");
    showMemberProfile("sebastien");
  }
});
