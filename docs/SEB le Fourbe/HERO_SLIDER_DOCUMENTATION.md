# Documentation du Hero Slider - Page d'accueil

## Vue d'ensemble

Le hero slider est un carrousel cinématographique situé en haut de la page d'accueil (`/`). Il présente 4 slides avec des animations sophistiquées, une parallaxe dynamique et une navigation intuitive.

---

## 📁 Fichiers utilisés

### HTML
- **Fichier** : `app/views/home.ejs`
- **Lignes** : 27-173
- **Structure** : Section `<section class="hero-slider">` contenant les slides et la pagination

### CSS
- **Fichier** : `app/public/css/home.css`
- **Lignes** : 17-690
- **Section** : `/* ================== HERO SLIDER ==================== */`
- **Dépendances** : `base.css` (pour les variables CSS et styles de base)

### JavaScript
- **Fichier** : `app/public/js/hero-slider.js`
- **Lignes** : 1-446
- **Chargement** : Script chargé avec `defer` dans `home.ejs` (ligne 431)

### Images utilisées

#### Slide 1 - Ciné Délices
- **Background** : `/images/event/hero-slide-01-bg-1.jpg`
- **Foreground** : `/images/event/hero-slide-01-foreground-2.png` (popcorn cinéma)

#### Slide 2 - Noël / Événement
- **Background** : `/images/image-home-dessert-backtothefuture.jpg`
- **Foreground** : `/images/event/santa-1.png`

#### Slide 3 - Recettes cultes
- **Background** : `/images/image-default-recipe-1.jpg`
- **Foreground** : `/images/event/santa-1.png`

#### Slide 4 - Communauté
- **Background** : `/images/image-home-marty-doc.png`
- **Couleur de fond** : `var(--bleu-nuit)` (fallback)
- **Foreground** : `/images/event/santa-1.png`

---

## 🎬 Détail des slides

### Slide 1 : Ciné Délices

**Personnage/Image principale** : Popcorn cinéma (`hero-slide-01-foreground-2.png`)

**Animations appliquées** :

1. **Background (Ken Burns)**
   - **Effet** : Dézoom progressif de `scale(1.1)` → `scale(1)` sur 7 secondes
   - **Animation CSS** : `backgroundKenBurns` (linéaire)
   - **Timing** : Démarre automatiquement avec la classe `--active`

2. **Foreground (PNG popcorn)**
   - **Positionnement** : Décalé vers la droite (+20%) et vers le bas (+10%)
   - **Animation d'entrée** : `foregroundSlideIn01`
     - Fade-in + translation depuis le bas (120px → 0) + scale (0.98 → 1)
     - Durée : 1s avec easing `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
   - **Animation de sortie** : `foregroundSlideOut01`
     - Fade-out + translation vers le bas (0 → 80px) + scale (1 → 0.98)
     - Durée : 0.6s
   - **Zoom progressif** (géré par JS) :
     - Scale : 1 → 1.08 sur 7 secondes
     - TranslateY : 0 → 25px sur 7 secondes
   - **Parallaxe intelligente** : Réaction au mouvement de la souris avec inertie

3. **Contenu textuel** (ordre d'apparition) :
   - **Titre H1** ("Ciné Délices")
     - Animation : `titleCinematicReveal` (1.2s, délai 0s)
     - Effet : Fade-in + translation X (-50px → 0) + scale (0.9 → 1) + blur (10px → 0)
   - **Sous-titre** ("Découvrez des recettes cultes...")
     - Animation : `subtitleCinematicReveal` (1s, délai 0.8s)
     - Effet : Fade-in + translation Y (20px → 0) + blur (5px → 0)
   - **Bouton CTA** ("Découvrir les films")
     - Animation : `buttonCinematicReveal` (0.9s, délai 1.6s)
     - Effet : Fade-in + translation Y (30px → 0) + scale (0.8 → 1) + glow progressif

4. **Effets visuels** :
   - **Overlay** : Dégradé plus subtil (0.7 → 0) pour préserver le rendu cinématographique
   - **Light leak** : Particules lumineuses animées (pseudo-élément `::before`)
   - **Glow H1** : Lueur rouge-or animée (pseudo-élément `::after`)

**Lien CTA** : `/movies`

---

### Slide 2 : Noël / Événement

**Personnage/Image principale** : Père Noël (`santa-1.png`)

**Animations appliquées** :

1. **Background (Ken Burns)**
   - Dézoom progressif identique au slide 1

2. **Foreground (PNG santa)**
   - **Positionnement** : Centré horizontalement
   - **Animation d'entrée** : `foregroundSlideIn`
     - Fade-in + scale (1.05 → 1)
     - Durée : 0.8s avec easing `cubic-bezier(0.4, 0, 0.2, 1)`
   - **Animation de sortie** : `foregroundSlideOutDefault`
     - Fade-out + scale (1 → 0.95)
     - Durée : 0.5s
   - **Parallaxe intelligente** : Réaction au mouvement de la souris

3. **Contenu textuel** (ordre d'apparition) :
   - **Titre H1** ("Noël / Événement") : 0s
   - **Sous-titre** : 0.3s
   - **Bouton CTA** ("Voir les recettes de Noël") : 0.6s

**Lien CTA** : `/recipes-movie`

---

### Slide 3 : Recettes cultes

**Personnage/Image principale** : Père Noël (`santa-1.png`)

**Animations appliquées** :

Identiques au slide 2 :
- Background Ken Burns
- Foreground avec animations `foregroundSlideIn` / `foregroundSlideOutDefault`
- Parallaxe intelligente
- Contenu textuel avec animations séquentielles (0s, 0.3s, 0.6s)

**Lien CTA** : `/recipes-movie`

---

### Slide 4 : Communauté

**Personnage/Image principale** : Père Noël (`santa-1.png`)

**Animations appliquées** :

1. **Background**
   - Image : `image-home-marty-doc.png`
   - Couleur de fond : `var(--bleu-nuit)` (fallback)
   - Ken Burns identique

2. **Overlay spécifique**
   - Dégradé vertical (0.2 → 0.8) au lieu du dégradé horizontal standard

3. **Foreground et contenu**
   - Identiques aux slides 2 et 3

**Lien CTA** : `/auth/register`

---

## ⚙️ Fonctionnement global

### Système de changement de slides

#### Autoplay
- **Intervalle** : 7 secondes (`AUTO_PLAY_INTERVAL = 7000ms`)
- **Démarrage** : Automatique au chargement de la page
- **Pause** : 
  - Au survol de la souris (`mouseenter`)
  - Au touch sur mobile (`touchstart`)
- **Reprise** : 
  - À la sortie de la souris (`mouseleave`)
  - Après 3 secondes sur mobile (`touchend`)

#### Navigation manuelle
- **Pagination verticale** : Clic sur les numéros (01, 02, 03, 04) à droite
- **Clavier** : 
  - Flèche gauche : Slide précédent
  - Flèche droite : Slide suivant
- **Redémarrage autoplay** : Après toute navigation manuelle

### Transitions entre slides

#### Processus de transition (fonction `showSlide()`)

1. **Sortie de l'ancien slide** :
   - Ajout de la classe `slide-out` au foreground
   - Animation CSS déclenchée (fade-out + scale)
   - Retrait de la classe `hero-slider__slide--active`

2. **Entrée du nouveau slide** :
   - Ajout de la classe `hero-slider__slide--active`
   - Réinitialisation de l'animation Ken Burns du background
   - Réinitialisation du transform du foreground selon le slide
   - Délai de 50ms puis ajout de la classe `slide-in` au foreground
   - Animation CSS déclenchée (fade-in + scale + translation)

3. **Mise à jour de la pagination** :
   - Retrait de `--active` sur tous les numéros
   - Ajout de `--active` sur le numéro correspondant
   - Mise à jour des attributs ARIA (`aria-selected`)

#### Durées de transition
- **Fade slide** : 0.8s (`cubic-bezier(0.4, 0, 0.2, 1)`)
- **Foreground slide-in** : 0.8s à 1s selon le slide
- **Foreground slide-out** : 0.5s à 0.6s selon le slide

### Animations déclenchées

#### Par classes CSS

**Classe `hero-slider__slide--active`** :
- Active l'opacité et la visibilité du slide
- Déclenche l'animation Ken Burns du background
- Déclenche les animations du contenu textuel (titre, sous-titre, bouton)
- Active les effets visuels (light leak, glow)

**Classe `slide-in`** (foreground) :
- Déclenche l'animation d'entrée du PNG
- Retirée automatiquement à la fin de l'animation (via `animationend`)

**Classe `slide-out`** (foreground) :
- Déclenche l'animation de sortie du PNG
- Ajoutée avant le changement de slide

#### Par JavaScript

**Fonction `updateParallax()`** :
- Gère la parallaxe avec inertie via `requestAnimationFrame`
- Combine zoom progressif et parallaxe intelligente pour le slide 01
- Applique les transformations en temps réel

**Fonction `calculateProgressiveZoom()`** :
- Calcule le zoom progressif pour le slide 01 uniquement
- Basé sur le temps écoulé depuis l'activation (`dataset.activationTime`)
- Interpolation linéaire sur 7 secondes

### Parallaxe intelligente

#### Principe
- **Réaction à la souris** : Le foreground suit le mouvement de la souris avec un effet d'inertie
- **Calcul** : Offset relatif au centre du slider (-1 à 1) multiplié par les constantes
  - `PARALLAX_MAX_X = 20px`
  - `PARALLAX_MAX_Y = 15px`
- **Inertie** : Facteur d'easing `PARALLAX_EASE = 0.12` pour un mouvement fluide

#### Désactivation
- Sur mobile (`max-width: 768px`)
- Si `prefers-reduced-motion: reduce` est activé

#### Slide 01 spécial
- Combine parallaxe intelligente + zoom progressif
- Animation continue en boucle via `requestAnimationFrame`
- Transform calculé dynamiquement : `translate(calc(-50% + Xpx), Ypx) scale(Z)`

### Classes CSS principales

#### Structure
- `.hero-slider` : Conteneur principal
- `.hero-slider__container` : Conteneur des slides
- `.hero-slider__slide` : Slide individuel
- `.hero-slider__slide--active` : Slide actuellement visible

#### Éléments
- `.hero-slider__bg` : Image de fond
- `.hero-slider__overlay` : Overlay sombre
- `.hero-slider__foreground` : PNG au premier plan
- `.hero-slider__content` : Contenu textuel (titre, sous-titre, bouton)
- `.hero-slider__pagination-vertical` : Conteneur de pagination
- `.hero-slider__pagination-number` : Numéro de pagination
- `.hero-slider__pagination-number--active` : Numéro actif

#### États d'animation
- `.slide-in` : Animation d'entrée du foreground
- `.slide-out` : Animation de sortie du foreground

### Fonctions JavaScript principales

#### `showSlide(index)`
- Affiche un slide spécifique
- Gère les transitions d'entrée/sortie
- Réinitialise les animations
- Met à jour la pagination

#### `nextSlide()` / `prevSlide()`
- Navigation vers le slide suivant/précédent
- Gestion du cycle (retour au début/fin)

#### `startAutoplay()` / `stopAutoplay()`
- Démarre/arrête l'autoplay
- Utilise `setInterval` avec `AUTO_PLAY_INTERVAL`

#### `handleMouseMove(e)`
- Calcule la position de la souris
- Met à jour `targetParallaxX` et `targetParallaxY`
- Déclenche `updateParallax()` si nécessaire

#### `updateParallax()`
- Applique la parallaxe avec inertie
- Combine zoom progressif pour le slide 01
- Utilise `requestAnimationFrame` pour fluidité

#### `resetParallax()`
- Réinitialise la parallaxe au centre
- Appelé au `mouseleave`

#### `calculateProgressiveZoom()`
- Calcule le zoom progressif pour le slide 01
- Retourne `{ scale, translateY }` basé sur le temps écoulé

---

## 🎨 Animations CSS détaillées

### Background Ken Burns
```css
@keyframes backgroundKenBurns {
  0% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```
- **Durée** : 7s
- **Easing** : `linear`
- **Application** : `.hero-slider__slide--active .hero-slider__bg`

### Foreground Slide In (slides 2-4)
```css
@keyframes foregroundSlideIn {
  0% { opacity: 0; transform: translateX(-50%) scale(1.05); }
  100% { opacity: 1; transform: translateX(-50%) scale(1); }
}
```
- **Durée** : 0.8s
- **Easing** : `cubic-bezier(0.4, 0, 0.2, 1)`

### Foreground Slide In 01 (slide 1)
```css
@keyframes foregroundSlideIn01 {
  0% { opacity: 0; transform: translate(-50%, 120px) scale(0.98); }
  100% { opacity: 1; transform: translate(-50%, 0%) scale(1); }
}
```
- **Durée** : 1s
- **Easing** : `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Foreground Slide Out (slides 2-4)
```css
@keyframes foregroundSlideOutDefault {
  0% { opacity: 1; transform: translateX(-50%) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) scale(0.95); }
}
```
- **Durée** : 0.5s
- **Easing** : `ease-out`

### Foreground Slide Out 01 (slide 1)
```css
@keyframes foregroundSlideOut01 {
  0% { opacity: 1; transform: translate(-50%, 0%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, 80px) scale(0.98); }
}
```
- **Durée** : 0.6s
- **Easing** : `ease-out`

### Titre Cinematic Reveal
```css
@keyframes titleCinematicReveal {
  0% { opacity: 0; transform: translateX(-50px) scale(0.9); filter: blur(10px); }
  60% { opacity: 0.8; transform: translateX(5px) scale(1.02); filter: blur(3px); }
  100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
}
```
- **Durée** : 1.2s
- **Easing** : `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Sous-titre Cinematic Reveal
```css
@keyframes subtitleCinematicReveal {
  0% { opacity: 0; transform: translateY(20px); filter: blur(5px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}
```
- **Durée** : 1s
- **Easing** : `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Bouton Cinematic Reveal
```css
@keyframes buttonCinematicReveal {
  0% { opacity: 0; transform: translateY(30px) scale(0.8); filter: blur(3px); }
  60% { opacity: 0.9; transform: translateY(-5px) scale(1.05); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
```
- **Durée** : 0.9s
- **Easing** : `cubic-bezier(0.34, 1.56, 0.64, 1)` (effet bounce)

### Light Leak
```css
@keyframes lightLeak {
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  50% { opacity: 0.6; transform: translateY(-10px); }
}
```
- **Durée** : 4s
- **Easing** : `ease-in-out`
- **Répétition** : `infinite`
- **Délai** : 1s

### Pulse Glow (H1)
```css
@keyframes pulseGlow {
  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.1); }
}
```
- **Durée** : 3s
- **Easing** : `ease-in-out`
- **Répétition** : `infinite`
- **Délai** : 0.5s

---

## 📱 Responsive

### Tablette (max-width: 1200px)
- Contenu textuel : `max-width: 450px`, `left: 60px`
- Pagination : `right: 30px`, `gap: 1.25rem`
- Numéros : Taille réduite (1.1rem / 1.8rem actif)

### Mobile (max-width: 768px)
- **Slider masqué** : `display: none`
- Parallaxe désactivée automatiquement

---

## ♿ Accessibilité

### Attributs ARIA
- `aria-label="Carrousel principal"` sur la section
- `role="tablist"` sur la pagination
- `role="tab"` sur chaque numéro
- `aria-selected` mis à jour dynamiquement
- `aria-label` sur chaque bouton de pagination

### Navigation clavier
- Slider focusable avec `tabindex="0"`
- Flèches gauche/droite pour navigation
- Tabulation pour accéder aux boutons de pagination

### Respect des préférences utilisateur
- Désactivation de la parallaxe si `prefers-reduced-motion: reduce`
- Animations CSS respectent les préférences système

---

## 🔧 Configuration et personnalisation

### Constantes JavaScript (dans `hero-slider.js`)

```javascript
const AUTO_PLAY_INTERVAL = 7000;      // Intervalle autoplay (ms)
const PARALLAX_MAX_X = 20;            // Amplitude parallaxe X (px)
const PARALLAX_MAX_Y = 15;            // Amplitude parallaxe Y (px)
const PARALLAX_EASE = 0.12;           // Facteur d'inertie (0-1)
```

### Variables CSS (dans `base.css`)

Les couleurs et polices utilisées sont définies dans `base.css` :
- `--dore-popcorn` : Couleur dorée du titre
- `--argent-ecran` : Couleur argentée du sous-titre
- `--bleu-nuit` : Couleur de fond (slide 4)
- `--bleu-intermediaire` : Bordure du slider
- `--font-h1` : Police "Fascinate Inline" pour le titre
- `--font-body` : Police "Lato" pour le sous-titre

---

## 📝 Notes pour les développeurs

### Ajouter un nouveau slide

1. **Dans `home.ejs`** :
   - Ajouter un `<div class="hero-slider__slide" data-slide="N">` dans le conteneur
   - Inclure les éléments : `hero-slider__bg`, `hero-slider__overlay`, `hero-slider__foreground`, `hero-slider__content`
   - Ajouter un bouton de pagination dans `hero-slider__pagination-vertical`

2. **Dans `home.css`** (optionnel) :
   - Ajouter des styles spécifiques si nécessaire (overlay, positionnement foreground)

3. **Dans `hero-slider.js`** :
   - Aucune modification nécessaire si le slide suit le comportement standard
   - Pour un comportement spécial (comme le slide 01), ajouter une condition dans `updateParallax()` et `calculateProgressiveZoom()`

### Modifier le timing

- **Autoplay** : Modifier `AUTO_PLAY_INTERVAL` dans `hero-slider.js`
- **Animations** : Modifier les durées dans les `@keyframes` de `home.css`
- **Délais séquentiels** : Modifier les `animation-delay` dans les sélecteurs CSS

### Désactiver la parallaxe

La parallaxe se désactive automatiquement sur mobile et si `prefers-reduced-motion` est activé. Pour la désactiver complètement :

```javascript
isParallaxEnabled = false;
```

---

## 🐛 Dépannage

### Le slider ne s'affiche pas
- Vérifier que `home.css` est chargé
- Vérifier que `hero-slider.js` est chargé avec `defer`
- Vérifier la console pour les erreurs JavaScript

### Les animations ne fonctionnent pas
- Vérifier que la classe `hero-slider__slide--active` est présente
- Vérifier que les images sont chargées
- Vérifier la console pour les erreurs

### La parallaxe ne fonctionne pas
- Vérifier que la souris est bien sur le slider
- Vérifier que `isParallaxEnabled` est `true`
- Vérifier que `prefers-reduced-motion` n'est pas activé

### Le slide 01 a un comportement étrange
- Le slide 01 combine zoom progressif + parallaxe intelligente
- Vérifier que `dataset.activationTime` est défini
- Vérifier que `updateParallax()` est appelé en boucle pour ce slide

---

## 📚 Références

- **Fichier HTML** : `app/views/home.ejs` (lignes 27-173)
- **Fichier CSS** : `app/public/css/home.css` (lignes 17-690)
- **Fichier JS** : `app/public/js/hero-slider.js` (lignes 1-446)
- **CSS de base** : `app/public/css/base.css` (variables et styles communs)

---

*Documentation créée le : 2024*
*Dernière mise à jour : 2024*
