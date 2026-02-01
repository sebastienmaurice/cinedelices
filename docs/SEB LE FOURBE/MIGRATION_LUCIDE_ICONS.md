# 📋 Migration Font Awesome → Lucide Icons

## ✅ État de la migration

### 🎯 Objectif
Remplacer **100%** des icônes Font Awesome par des icônes Lucide SVG inline pour une identité visuelle cohérente et moderne.

---

## ✅ Complété (Infrastructure & Composants critiques)

### 1. Infrastructure globale
- ✅ **Suppression de Font Awesome CDN** (`head-resources.ejs`)
- ✅ **Création de `lucide-icons.js`** - Helper centralisé pour générer des SVG Lucide
- ✅ **Import global du helper** dans `head-resources.ejs`

### 2. Navigation & Header
- ✅ **Header desktop** - Toutes les icônes (utilisateur, favoris, dropdowns)
- ✅ **Menu burger mobile** - Toutes les icônes
- ✅ **Dropdowns** - Connexion, inscription, compte, déconnexion

### 3. Footer & Modales
- ✅ **Footer** - Icônes réseaux sociaux (Facebook, Instagram)
- ✅ **Modale de confirmation** - Icône d'alerte

### 4. Fichiers JavaScript
- ✅ **favorites.js** - Système de favoris avec icônes dynamiques
- ✅ **Création du helper `LucideIcons`** avec méthodes `.create()` et `.replace()`

---

## ⏳ Reste à migrer (11 fichiers)

### Fichiers JavaScript (5)
1. `public/js/movie-autocomplete-form.js`
2. `public/js/movie-search-advanced.js`
3. `public/js/movie-search.js`
4. `public/js/movies-favorites.js`
5. `public/js/recipe-detail.js`

### Fichiers EJS (6)
1. `views/add-recipes-movies.ejs`
2. `views/admin-dashboard.ejs`
3. `views/movies.ejs`
4. `views/recipe-detail.ejs`
5. `views/recipes-movie.ejs`
6. `views/user-profile.ejs`

**Total : ~67 occurrences de Font Awesome restantes**

---

## 🛠️ Guide de migration

### A. Dans les fichiers EJS

#### Remplacement simple d'icône

**Avant (Font Awesome) :**
```html
<i class="fa-solid fa-heart"></i>
```

**Après (Lucide) :**
```html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
</svg>
```

#### Table de correspondance rapide

| Font Awesome | Lucide | Usage |
|-------------|--------|-------|
| `fa-heart` | `heart` | Favoris |
| `fa-star` | `star` | Notation |
| `fa-search` / `fa-magnifying-glass` | `search` | Recherche |
| `fa-film` | `film` | Films |
| `fa-user` | `user` | Compte |
| `fa-upload` | `upload` | Upload |
| `fa-check-circle` | `check-circle` | Succès |
| `fa-exclamation-circle` / `fa-alert-circle` | `alert-circle` | Erreur |
| `fa-info-circle` | `info` | Info |
| `fa-spinner` | `loader` | Chargement |
| `fa-plus` | `plus` | Ajouter |
| `fa-arrow-right` | `arrow-right` | Navigation |
| `fa-clock` | `clock` | Temps |

### B. Dans les fichiers JavaScript

#### Méthode 1 : Utiliser `LucideIcons.create()`

**Avant :**
```javascript
element.innerHTML = '<i class="fa-solid fa-heart"></i>';
```

**Après :**
```javascript
element.innerHTML = window.LucideIcons.create('heart', { filled: true });
```

#### Méthode 2 : Utiliser `LucideIcons.replace()`

**Avant :**
```javascript
const icon = btn.querySelector('i');
icon.className = isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
```

**Après :**
```javascript
window.LucideIcons.replace(btn, 'heart', { filled: isFavorite });
```

#### Options disponibles

```javascript
LucideIcons.create('iconName', {
  filled: false,      // Pour icônes remplies (heart, star)
  size: 24,          // Taille en pixels
  className: ''      // Classes CSS additionnelles
});
```

### C. Icônes avec état (filled/outline)

Certaines icônes ont deux états :

**Cœur :**
- Non rempli (outline) : `LucideIcons.create('heart', { filled: false })`
- Rempli : `LucideIcons.create('heart', { filled: true })`

**Étoile :**
- Non remplie : `LucideIcons.create('star', { filled: false })`
- Remplie : `LucideIcons.create('star', { filled: true })`

---

## 📚 Référence complète des icônes disponibles

Voir le fichier `public/js/lucide-icons.js` pour la liste complète.

Icônes actuellement implémentées :
- `heart` (filled/outline)
- `star` (filled/outline)
- `check-circle`
- `alert-circle`
- `alert-triangle`
- `info`
- `search`
- `arrow-right`
- `chevron-right`
- `film`
- `clapperboard`
- `loader` (avec animation spin)
- `upload`
- `plus`
- `flame`
- `clock`

**Pour ajouter une nouvelle icône :**
1. Aller sur [lucide.dev](https://lucide.dev)
2. Copier le code SVG de l'icône
3. L'ajouter dans `lucide-icons.js` dans l'objet `icons`

---

## 🎨 Styles CSS

Les icônes Lucide héritent automatiquement de la couleur via `currentColor` :

```css
.lucide-icon {
  width: 1.1rem;
  height: 1.1rem;
  display: inline-block;
  vertical-align: middle;
  stroke: currentColor;
  flex-shrink: 0;
}
```

Pour changer la couleur, modifiez simplement la couleur du parent :

```css
.btn-favorite {
  color: var(--rouge-projecteur);
}

.btn-favorite .lucide-icon {
  /* Héritera automatiquement de la couleur rouge */
}
```

---

## ✅ Checklist finale

Une fois tous les fichiers migrés :

- [ ] Vérifier qu'aucune référence Font Awesome ne reste :
  ```bash
  grep -r "fa-solid\|fa-regular\|fa-brands" app/views app/public/js
  ```

- [ ] Tester toutes les fonctionnalités avec icônes :
  - [ ] Favoris (toggle filled/outline)
  - [ ] Notation (étoiles)
  - [ ] Recherche de films
  - [ ] Upload d'images
  - [ ] Notifications
  - [ ] Dropdowns
  - [ ] Menu burger

- [ ] Vérifier le rendu visuel sur :
  - [ ] Desktop
  - [ ] Mobile
  - [ ] Différents navigateurs

---

## 📖 Exemple complet : Migration d'un fichier

### Avant (`movies.ejs`)
```html
<button class="btn-favorite" data-movie-id="123">
  <i class="fa-regular fa-heart"></i>
  <span>Ajouter aux favoris</span>
</button>

<div class="movie-info">
  <i class="fa-solid fa-film"></i>
  <span>Film d'action</span>
</div>
```

### Après (`movies.ejs`)
```html
<button class="btn-favorite" data-movie-id="123">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
  <span>Ajouter aux favoris</span>
</button>

<div class="movie-info">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <rect width="18" height="18" x="3" y="3" rx="2"/>
    <path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>
  </svg>
  <span>Film d'action</span>
</div>
```

---

## 🎯 Résultat attendu

À la fin de la migration :
- ✅ **0 dépendance Font Awesome**
- ✅ **100% Lucide Icons**
- ✅ **Cohérence visuelle parfaite**
- ✅ **Performance améliorée** (pas de CDN externe)
- ✅ **Flexibilité CSS maximale** (currentColor)
- ✅ **Code moderne et maintenable**

---

## 💡 Aide

En cas de doute sur une icône :
1. Consulter [lucide.dev](https://lucide.dev)
2. Vérifier `lucide-icons.js` pour voir si l'icône existe déjà
3. Si besoin, ajouter la nouvelle icône dans le helper

**Happy migrating! 🚀**
