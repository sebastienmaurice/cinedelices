# Docs pédagogiques complètes — Modals & Toasts (Ciné Délices)

## 🎯 Objectif

Documenter l’uniformisation des **confirmations critiques** et des **toasts** sur tout le site.
Cette logique renforce la **sécurité**, la **cohérence UX** et la **traçabilité**.

---

## 1) Pourquoi cette refonte ?

### Problèmes initiaux

- `confirm()` natif : UX incohérente, non brandée.
- Messages et styles de toasts hétérogènes.
- Pas de logique centralisée → maintenance difficile.

### Objectifs UX/CMS

- Un **design unifié** (modal Ciné Délices).
- Des confirmations claires par type d’action.
- Une logique “critique” claire : **irréversible vs sensible**.

---

## 2) Modal Ciné Délices centralisée

### Principe

Une **seule modal** utilisée partout via `window.confirmAction()`.

### Points clés

- Texte contextuel par action.
- **Variants** : `standard`, `warning`, `danger`.
- Icône warning affichée en `warning` / `danger`.

### Fichiers (Modal)

- `app/views/partials/footer.ejs` (injection globale)
- `app/public/js/confirm-modal.js`
- `app/public/css/base.css`

---

## 3) Mapping des actions critiques

### Source unique

`app/public/js/confirm-actions.data.js`

### Exemples

- `admin.rejectMovie` → warning  
- `admin.approveMovieDelete` → danger  
- `account.deleteAccount` → danger  

### Audit automatique

Script CLI :

```shell
npm run docs:confirm-actions
```

Génère :

`docs/SEB le Fourbe/09-DOCS-PEDAGOGIQUES-2026-01/10-ACTIONS_CRITIQUES_AUDIT.md`

---

## 4) Uniformisation des toasts

### Règles globales

#### Admin

- validation → `success`
- refus → `warning`
- suppression → `error`
- approvals → `success`

#### Mon Compte

- suppression en cours → `warning`
- demande envoyée → `warning`
- suppression effectuée → `success`
- aucune modif → `warning`
- modifs infos/préférences → `success`

### Icônes + titres

| Type | Icône | Titre |
| --- | --- | --- |
| success | ✅ doré | “Succès : ” |
| warning | ⚠️ orange | “Attention : ” |
| error | ⚠️ rouge | “Erreur : ” |

### Fichiers (Toasts)

- `app/public/js/admin-dashboard.js`
- `app/public/js/account.js`
- `app/public/css/admin-dashboard.css`
- `app/public/css/user-profile.css`

---

## 7) Recherche, filtres & pagination (Contenus validés)

### Recherche locale + Clear
- Chaque type (films, recettes, avis) possède un champ dédié.
- Un bouton **Clear** réinitialise instantanément la recherche.
- La pagination reste cohérente après le clear.

### Compteur global + Reset
- Compteur global dynamique : “X résultats affichés sur Y”.
- Bouton **Reset global** pour réinitialiser tous les filtres en une fois.

### Total filtré
- Affichage dynamique : “X éléments affichés sur Y”.
- Mise à jour en temps réel à chaque saisie.

### Total filtré par type (dans le titre)
- Chaque bloc affiche : “Films validés (12/34)”, etc.
- Mise à jour dynamique selon la recherche et la pagination.

### Recherche globale (multi‑type)
- Champ global en haut de l’onglet.
- Filtre simultanément films + recettes + avis.
- Pagination autonome conservée par type.

### Messages “No results”
- Affichage d’un message clair par type si aucun résultat.
- Les listes restent visibles dès que des éléments correspondent.

### Message “Aucun résultat global”
- Si aucun type ne matche, message unique : “Aucun résultat trouvé pour tous les contenus validés”.
- Les sections restent visibles si au moins un type a des résultats.
- Icône “loupe barrée” ajoutée pour renforcer la lecture visuelle.

### Badge “0 résultat” (sous-titre onglet)
- Pastille discrète affichée sous “Contenus validés” si aucun contenu n’est visible.
- S’active uniquement quand le total filtré global est à 0.

### Harmonisation des boutons
- Les boutons **Clear / Reset / pagination** utilisent désormais les styles globaux (`btn--sm`, `btn--ghost`) depuis `base.css`.
- Cohérence visuelle assurée avec le reste du site (couleurs, hover, typo).
- Les boutons des modals ConfirmAction suivent les mêmes styles (taille + typographies cohérentes).
- **Valider / Approuver** → `btn--gold`
- **Refuser / Supprimer** → `btn--red`

### Fichiers
- `app/views/admin-dashboard.ejs`
- `app/public/js/admin-dashboard.js`
- `app/public/css/admin-dashboard.css`

---

## 5) Suppression admin directe (contenus validés)

### Pourquoi ?

Dans un CMS pro, l’admin doit pouvoir **supprimer immédiatement** un contenu validé
si celui‑ci devient problématique (droit d’auteur, contenu illicite, doublon).

### Comment ?

- Bouton **Supprimer** dédié dans la section admin “contenus validés”.
- Confirmation **danger** obligatoire via la modal.
- Toast **success** en cas de suppression.

### Endpoints

- `POST /admin/movies/:id/delete/direct`
- `POST /admin/recipes/:id/delete/direct`
- `POST /admin/notices/:id/delete/direct`

### BDD (intégrité)

- Film → supprime recettes + avis associés
- Recette → supprime avis associés
- Avis → suppression directe

---

## 6) Pourquoi c’est “pro” (logique CMS)

- Les actions critiques sont **traçables**.
- L’admin garde le **contrôle final**.
- L’UX informe clairement l’utilisateur sur la criticité.

---

## 💡 Tips & Jury

Expliquez que :

1. Le mapping évite les incohérences.
2. L’audit automatique sert à la **maintenance**.
3. La logique “irréversible vs sensible” rassure l’utilisateur.

---

## 🎯 Mini‑défi

Expliquez pourquoi un système de confirmation unique réduit les risques en production.
