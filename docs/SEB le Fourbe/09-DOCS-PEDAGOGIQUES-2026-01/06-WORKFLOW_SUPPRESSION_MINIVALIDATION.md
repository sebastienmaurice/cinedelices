# Fiche pédagogique — Suppression & mini‑validation

## 🎯 Objectif
Permettre aux utilisateurs de modifier/supprimer leurs contenus **sans casser les données partagées**.

## ✅ Changements effectués
- **Soft‑delete** des films validés (demande admin).
- **Suppression d’avis** validés via demande admin.
- **Mini‑validation** : toute modification post‑validation passe en “pending”.
- Ajout de colonnes `edit_status`, `pending_*`, `delete_request_*`.

## 🧩 Fichiers modifiés (ou clés)
- `app/data/migration_add_pending_edits.sql`
- `app/models/movie.model.js`
- `app/models/recipe.model.js`
- `app/models/notice.model.js`
- `app/controllers/auth.controller.js`
- `app/controllers/admin.controllers.js`

## 👀 Résultat attendu / impact UX
- Les contenus validés restent **stables** pour la communauté.
- Les utilisateurs gardent un **contrôle** via demandes.
- L’admin a le dernier mot sur les contenus publics.

## 🧠 Logique & décisions techniques
- On **conserve** l’ancienne valeur tant que l’admin n’a pas validé.
- Les champs `pending_*` évitent d’écraser les données publiques.
- La suppression directe est réservée aux contenus **non validés**.

## 🧰 Tips & Ressources
- Vérifier l’état `edit_status` avant d’autoriser une nouvelle modification.
- Utiliser des badges “en attente” pour éviter la confusion.

## 🎯 Mini‑défi
Donnez un exemple concret où une suppression directe casserait l’intégrité du site.
