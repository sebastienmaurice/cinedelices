# Mapping des Variables CSS - base.css

**Date :** 20/11/2025  
**Développeur :** Seb

---

## 📋 Vue d'ensemble

Ce document liste le mapping entre les anciennes variables CSS et les nouvelles variables hiérarchisées pour faciliter la migration et la maintenance.

---

## 🎨 Variables Dorées - Nouvelle Hiérarchie

### Nouvelles Variables (Recommandées)

| Variable | Valeur | Description | Usage Recommandé |
|----------|--------|-------------|------------------|
| `--or-100` | `#c6a664` | Clair, lumineux | Éléments principaux, accents lumineux |
| `--or-200` | `#a5833d` | Médium, équilibré | États hover, bordures, ombres |
| `--or-300` | `#7a5c24` | Foncé, profond | Textes sur fond clair, contrastes forts |

### Variables de Compatibilité (Conservées)

| Ancienne Variable | Nouvelle Variable | Valeur | Statut |
|-------------------|-------------------|--------|--------|
| `--dore-popcorn` | `var(--or-100)` | `#c6a664` | ✅ Mappée vers `--or-100` |
| `--dore-fonce` | `var(--or-200)` | `#a5833d` | ✅ Mappée vers `--or-200` |
| `--dore-clair` | - | `#d2b16e` | ✅ Conservée (variante supplémentaire) |
| `--jaune-blond` | - | `#ebd47a` | ✅ Conservée (variante jaune doré) |

---

## 🔵 Variables Bleues - Palette Principale

| Variable | Valeur | Description | Usage |
|----------|--------|-------------|-------|
| `--bleu-nuit` | `#0d1b2a` | Fond principal, texte doré | Backgrounds, textes sur fond doré |
| `--bleu-intermediaire` | `#1b263b` | Fond secondaire | Cards, sections, modals |
| `--bleu-clair` | `#415a77` | Accent clair | Bordures, hover states |
| `--bleu-secondaire` | `#5a7391` | Accent secondaire | Textes, labels |
| `--bleu-fond` | `#162233` | Fond alternatif | Backgrounds alternatifs |
| `--bleu-titre-section` | `#0d1b2a` | Titres de section | Identique à `--bleu-nuit` |

---

## 🔴 Variables Accent - Autres Couleurs

| Variable | Valeur | Description | Usage |
|----------|--------|-------------|-------|
| `--rouge-projecteur` | `#d72638` | Rouge accent | Boutons, liens hover, erreurs |
| `--argent-ecran` | `#e8e8e8` | Gris clair | Textes principaux, bordures |
| `--beige-icecream` | `#f5ead1` | Beige crème | Backgrounds alternatifs |

---

## 🌑 Ombres et Effets

| Variable | Valeur | Description | Usage |
|----------|--------|-------------|-------|
| `--ombre-bleue` | `rgba(28, 37, 65, 0.4)` | Ombre bleue standard | Box-shadows générales |
| `--ombre-bleue-foncee` | `rgba(13, 27, 42, 0.8)` | Ombre bleue foncée | Overlays, modals |
| `--ombre-intermediaire` | `rgba(27, 38, 59, 0.35)` | Ombre intermédiaire | Ombres textuelles |
| `--ombre-intermediaire-strong` | `rgba(27, 38, 59, 0.45)` | Ombre intermédiaire forte | Ombres textuelles accentuées |

---

## ✅ Boutons Validation

| Variable | Valeur | Description | Usage |
|----------|--------|-------------|-------|
| `--vert-valid` | `#28a745` | Vert validation | Boutons de succès |
| `--vert-valid-hover` | `#218838` | Vert validation hover | État hover |
| `--rouge-refus` | `#dc3545` | Rouge refus | Boutons d'erreur |
| `--rouge-refus-hover` | `#c82333` | Rouge refus hover | État hover |

---

## ✨ Effets Glowy / Glassmorphism

| Variable | Valeur | Description | Usage |
|----------|--------|-------------|-------|
| `--gold-popcorn` | `#f7c948` | Or popcorn (glow) | Effets lumineux dorés |
| `--blond` | `#ffe066` | Blond (glow) | Effets lumineux jaunes |
| `--red-cine` | `#d72638` | Rouge cinéma | Identique à `--rouge-projecteur` |
| `--silver-screen` | `#c0c0c0` | Argent écran | Effets métalliques |
| `--input-bg` | `rgba(255, 255, 255, 0.1)` | Background input | Inputs glassmorphism |
| `--glass-bg` | `rgba(13, 27, 42, 0.4)` | Background glass | Effets glassmorphism |
| `--glass-border` | `rgba(211, 162, 97, 0.2)` | Bordure glass | Bordures glassmorphism |
| `--glass-shadow` | `rgba(0, 0, 0, 0.3)` | Ombre glass | Ombres glassmorphism |

---

## 📝 Typographies

| Variable | Valeur | Description | Usage |
|----------|--------|-------------|-------|
| `--font-h1` | `"Fascinate Inline", cursive` | Police titre principal | H1 uniquement |
| `--font-h2-h6` | `"Limelight", cursive` | Police titres secondaires | H2 à H6 |
| `--font-body` | `"Lato", sans-serif` | Police corps de texte | Body, paragraphes, inputs |

---

## 📏 Tailles et Espacements

| Variable | Valeur | Description | Usage |
|----------|--------|-------------|-------|
| `--gap` | `2rem` | Espacement standard | Gaps entre éléments |
| `--max-width` | `1440px` | Largeur maximale | Container principal |

---

## ⚡ Transitions

| Variable | Valeur | Description | Usage |
|----------|--------|-------------|-------|
| `--transition` | `0.3s ease` | Transition standard | Toutes les transitions |

---

## 🔄 Guide de Migration

### Pour utiliser les nouvelles variables dorées :

**Avant :**
```css
.element {
  background-color: var(--dore-popcorn);
  border-color: var(--dore-fonce);
}
```

**Après (recommandé) :**
```css
.element {
  background-color: var(--or-100); /* Plus sémantique */
  border-color: var(--or-200);
}
```

**Ou (compatibilité) :**
```css
.element {
  background-color: var(--dore-popcorn); /* Fonctionne toujours */
  border-color: var(--dore-fonce);
}
```

### Exemples d'utilisation des nouvelles variables :

```css
/* Élément principal avec accent lumineux */
.btn-primary {
  background-color: var(--or-100);
  color: var(--bleu-nuit);
}

/* Hover avec ton médium */
.btn-primary:hover {
  background-color: var(--or-200);
  box-shadow: 0 4px 12px rgba(198, 166, 100, 0.4);
}

/* Texte sur fond clair avec ton foncé */
.text-on-light {
  color: var(--or-300);
}
```

---

## ✅ Compatibilité

**Toutes les anciennes variables sont conservées et fonctionnent toujours.**

- ✅ `--dore-popcorn` → mappée vers `--or-100`
- ✅ `--dore-fonce` → mappée vers `--or-200`
- ✅ Toutes les autres variables restent inchangées

**Aucune modification nécessaire dans les fichiers existants.**

---

## 📚 Notes

1. **Nouvelles variables recommandées** : Utilisez `--or-100`, `--or-200`, `--or-300` pour les nouveaux développements
2. **Compatibilité garantie** : Les anciennes variables continuent de fonctionner
3. **Migration progressive** : Vous pouvez migrer progressivement vers les nouvelles variables
4. **Documentation** : Ce mapping est disponible dans `/docs/mapping-variables-css.md`

---

**Fin du document**

