# Structure des Partials EJS - Ciné Délices

## 📋 Vue d'ensemble

Tous les partials ont été restructurés et standardisés pour assurer une cohérence maximale à travers toutes les pages du site.

## 🗂️ Partials disponibles

### 1. `partials/head-resources.ejs`
**Ressources globales chargées dans le `<head>`**

Contient :
- Meta tags (charset, viewport)
- Google Fonts (Fascinate Inline, Limelight, Lato)
- CSS communs (base.css, burger-menu.css)
- Préchargement d'images
- Placeholders pour CSS/JS spécifiques à la page
- Script burger-menu.js

**Utilisation :**
```ejs
<%- include("partials/head-resources") %>
```

### 2. `partials/header.ejs`
**Header principal avec navigation**

Contient :
- Logo/titre du site
- Navigation principale
- Boutons connexion/inscription (conditionnels selon `user`)
- Burger menu pour mobile

**Logique conditionnelle :**
- Si `!user` : affiche bouton "Connexion / S'enregistrer"
- Si `user` : affiche "Mon compte" et "Déconnexion"

**Utilisation :**
```ejs
<%- include("partials/header") %>
```

### 3. `partials/footer.ejs`
**Footer global du site**

Contient :
- Logo et slogan
- Menu de navigation
- Réseaux sociaux
- Copyright

**Utilisation :**
```ejs
<%- include("partials/footer") %>
```

### 4. `partials/popup-connexion.ejs`
**Modal de connexion/inscription**

Contient :
- Modal avec overlay
- Formulaire de connexion
- Formulaire d'inscription
- Boutons de basculement entre les deux

**Utilisation conditionnelle :**
```ejs
<% if (!user && (typeof showLoginPopup === 'undefined' || showLoginPopup)) { %>
  <%- include("partials/popup-connexion") %>
<% } %>
```

## 📄 Structure standardisée des pages

### Pages publiques (avec popup conditionnel)

**home.ejs, movies.ejs, recipes-movie.ejs**

```ejs
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta name="description" content="..." />
    <title>...</title>
    
    <%- include("partials/head-resources") %>
    <link rel="stylesheet" href="/css/[page-specific].css" />
  </head>

  <body>
    <%- include("partials/header") %>
    
    <main>
      <!-- Contenu spécifique à la page -->
    </main>
    
    <%- include("partials/footer") %>
    
    <!-- Scripts JS spécifiques -->
    <script src="/js/popup-connexion.js" defer></script>
    <script src="/js/[page-specific].js" defer></script>
    
    <!-- Popup connexion conditionnel -->
    <% if (!user && (typeof showLoginPopup === 'undefined' || showLoginPopup)) { %>
      <%- include("partials/popup-connexion") %>
    <% } %>
  </body>
</html>
```

### Pages authentifiées (sans popup)

**user-profile.ejs, admin-dashboard.ejs**

```ejs
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta name="description" content="..." />
    <title>...</title>
    
    <%- include("partials/head-resources") %>
    <link rel="stylesheet" href="/css/[page-specific].css" />
  </head>

  <body>
    <%- include("partials/header") %>
    
    <main>
      <!-- Contenu spécifique à la page -->
    </main>
    
    <%- include("partials/footer") %>
    
    <!-- Scripts JS spécifiques -->
    <script src="/js/[page-specific].js" defer></script>
    
    <!-- Pas de popup connexion (utilisateur doit être connecté) -->
  </body>
</html>
```

## 🔧 Variables à passer aux vues

### Variables requises

1. **`user`** (optionnel)
   - Objet utilisateur si connecté
   - `undefined` ou `null` si non connecté
   - Utilisé pour :
     - Afficher/masquer le popup
     - Afficher les boutons appropriés dans le header

2. **`showLoginPopup`** (optionnel)
   - `true` : affiche le popup (par défaut sur pages publiques)
   - `false` : masque le popup (pages connexion, inscription, contact, etc.)
   - `undefined` : utilise le comportement par défaut (affiche si `!user`)

### Exemple dans un contrôleur

```javascript
// Page publique avec popup
home(req, res) {
  res.render("home", { 
    user: req.user || null,
    showLoginPopup: true  // optionnel, true par défaut
  });
}

// Page authentifiée (pas de popup)
profil(req, res) {
  res.render("user-profile", { 
    user: req.user  // requis pour cette page
  });
}

// Page publique sans popup (ex: page connexion)
login(req, res) {
  res.render("login", { 
    user: null,
    showLoginPopup: false  // masque le popup
  });
}
```

## ✅ Pages standardisées

### ✅ Pages publiques (avec popup)
- ✅ `home.ejs` - Page d'accueil
- ✅ `movies.ejs` - Liste des films
- ✅ `recipes-movie.ejs` - Recettes d'un film

### ✅ Pages authentifiées (sans popup)
- ✅ `user-profile.ejs` - Profil utilisateur
- ✅ `admin-dashboard.ejs` - Dashboard admin

### ⚠️ Pages à créer/standardiser
- ⚠️ `connexion.ejs` - Page de connexion (showLoginPopup: false)
- ⚠️ `inscription.ejs` - Page d'inscription (showLoginPopup: false)
- ⚠️ `contact.ejs` - Page contact (showLoginPopup: false)
- ⚠️ `a-propos.ejs` - Page à propos (showLoginPopup: false)
- ⚠️ `ficheRecette.ejs` - Détail d'une recette (showLoginPopup: true)
- ⚠️ `ficheFilm.ejs` - Détail d'un film (showLoginPopup: true)

## 🧹 Nettoyages effectués

1. ✅ **header.ejs** : Retrait du popup intégré (maintenant dans popup-connexion.ejs)
2. ✅ **head-resources.ejs** : Ajout du script burger-menu.js
3. ✅ **Toutes les pages** : Suppression des duplications de meta tags
4. ✅ **Toutes les pages** : Suppression des duplications de scripts
5. ✅ **Toutes les pages** : Structure HTML cohérente
6. ✅ **Toutes les pages** : Utilisation systématique des partials

## 📝 Notes importantes

1. **Script popup-connexion.js** : Doit être chargé sur toutes les pages publiques où le popup peut apparaître
2. **Script burger-menu.js** : Chargé automatiquement via head-resources.ejs
3. **Variables conditionnelles** : Le popup s'affiche uniquement si `!user && showLoginPopup !== false`
4. **Header conditionnel** : Les boutons du header changent selon la présence de `user`

## 🚀 Prochaines étapes

1. Modifier les contrôleurs pour passer les variables `user` et `showLoginPopup`
2. Créer/standardiser les pages manquantes (connexion, inscription, contact, etc.)
3. Tester le popup sur toutes les pages publiques
4. Vérifier que le header affiche correctement les boutons selon l'état de connexion

