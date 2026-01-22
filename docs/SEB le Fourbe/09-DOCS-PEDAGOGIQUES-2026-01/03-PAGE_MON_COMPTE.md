# Fiche pédagogique — Mon compte (/auth/profil)

## 🎯 Objectif
Permettre aux utilisateurs de gérer leurs contenus **après validation** sans casser l’intégrité du site, grâce à une **mini‑validation admin**.

## ✅ Changements effectués
- Ajout d’un **workflow d’édition** post‑validation pour :
  - Films (titre, année, genre)
  - Recettes (édition complète + image si autorisée)
  - Avis (édition + suppression)
- Ajout de **badges de statut** (modif en attente / refusée).
- Suppressions “douces” avec **demande admin** pour les contenus validés.
- Liste d’avis enrichie : date, recette/film associé, actions dédiées.

## 🧩 Fichiers modifiés (ou clés)
- `app/views/user-profile.ejs`
- `app/public/js/account.js`
- `app/public/css/user-profile.css`
- `app/controllers/auth.controller.js`
- `app/routes/auth.route.js`

## 👀 Résultat attendu / impact UX
- L’utilisateur voit immédiatement si une modif est **en attente**.
- Les boutons sont **bloqués** pendant une modif en attente.
- Les contenus validés ne sont **jamais modifiés directement**.

## 🧠 Logique & décisions techniques
- **Sécurité** : seuls le propriétaire ou l’admin peuvent modifier.
- **Intégrité** : on stocke les changements dans des champs `pending_*`.
- **Transparence UX** : badges + toasts + texte explicatif.

## 🧰 Tips & Ressources
- Pour tester : modifiez un film validé, puis vérifiez l’admin.
- Vérifiez les champs `edit_status` et `pending_*` en BDD.

## 🎯 Mini‑défi
Expliquez pourquoi on **ne modifie pas** un film validé directement en BDD.
