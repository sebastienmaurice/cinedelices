# 03 - Design & Front-End

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Maquettes et UX](#maquettes-et-ux)
3. [Intégration Front](#intégration-front)
4. [Logique Front-End](#logique-frontend)

---

## Vue d'ensemble

Le **front-end** est la partie visible du site web. C'est ce que l'utilisateur voit et utilise dans son navigateur.

### Technologies utilisées

- **HTML5** : Structure des pages
- **CSS3** : Styles et animations
- **JavaScript (ES6+)** : Interactivité
- **EJS** : Templates côté serveur (génération HTML)

### Organisation des fichiers

```
app/
├── views/          # Templates EJS (pages HTML)
└── public/         # Fichiers statiques
    ├── css/        # Styles CSS
    ├── js/         # JavaScript côté client
    └── images/     # Images
```

---

## Maquettes et UX

### Concept visuel

Le site **Ciné Délices** adopte un style **cinématographique** :

- 🎬 Couleurs : Rouge, or, bleu nuit (référence au cinéma)
- 🎬 Typographie : Élégante et lisible
- 🎬 Animations : Fluides et cinématographiques
- 🎬 Images : Grandes images de films et recettes

### Parcours utilisateur

1. **Page d'accueil** → Découverte du concept
2. **Page Films** → Recherche et exploration
3. **Page Film détail** → Recettes associées
4. **Ajout Film/Recette** → Contribution
5. **Profil** → Gestion personnelle

---

## Intégration Front

### Structure HTML (EJS)

Les pages sont générées avec **EJS** (Embedded JavaScript) :

```ejs
<!-- app/views/home.ejs -->
<!DOCTYPE html>
<html lang="fr">
  <head>
    <title>Ciné Délices</title>
    <link rel="stylesheet" href="/css/home.css" />
  </head>
  <body>
    <%- include("partials/header") %>
    
    <main>
      <section class="hero-slider">
        <!-- Contenu dynamique -->
      </section>
    </main>
    
    <%- include("partials/footer") %>
  </body>
</html>
```

### Styles CSS

**Organisation** :
- `base.css` : Variables CSS, styles de base
- `home.css` : Styles spécifiques à la page d'accueil
- `movies.css` : Styles spécifiques à la page films

**Variables CSS** :
```css
:root {
  --rouge-cine: #d32f2f;
  --or-cine: #ffb300;
  --bleu-nuit: #1a237e;
}
```

### Responsive Design

Le site s'adapte à tous les écrans :

- 📱 **Mobile** : Menu hamburger, cartes empilées
- 💻 **Tablette** : Grille adaptative
- 🖥️ **Desktop** : Mise en page complète

---

## Logique Front-End

### JavaScript côté client

**Rôle** : Rendre la page interactive

**Exemples** :
- Recherche en temps réel
- Animations du slider
- Gestion des modales
- Filtrage dynamique

### Communication avec le back-end

**Méthodes** :
1. **Chargement de page** : HTML généré côté serveur
2. **AJAX** : Requêtes asynchrones (recherche, etc.)

---

## 📖 Pour aller plus loin

→ **[Découvrir le Back-End](./../04-BACKEND/README.md)**

---

**Retour à l'[index principal](./../README.md)**
