# Audit — Actions critiques & confirmations (Ciné Délices)

> Document auto-généré. Ne pas éditer manuellement.
> Source : `app/public/js/confirm-actions.data.js`
> Dernière génération : 2026-01-20T14:03:10.777Z

## 📌 Liste centralisée

| Clé | Message | Variant | Tag |
| --- | --- | --- | --- |
| account.deleteAccount | Voulez-vous vraiment supprimer votre compte ? | danger | ⚠️ action irréversible |
| account.deleteNotice | Voulez-vous vraiment supprimer cet avis ? | danger | ⚠️ action irréversible |
| account.deleteRecipe | Voulez-vous vraiment supprimer cette recette ? | danger | ⚠️ action irréversible |
| admin.approveMovieDelete | Confirmer la suppression du film ? | danger | ⚠️ action irréversible |
| admin.approveMovieEdit | Confirmer l'approbation de cette modification de film ? | standard |  |
| admin.approveNoticeDelete | Confirmer la suppression de cet avis ? | danger | ⚠️ action irréversible |
| admin.approveNoticeEdit | Confirmer l'approbation de cette modification d'avis ? | standard |  |
| admin.approveProfilePhoto | Confirmer l'approbation de cette photo de profil ? | standard |  |
| admin.approveRecipeEdit | Confirmer l'approbation de cette modification de recette ? | standard |  |
| admin.deleteUser | Voulez-vous vraiment supprimer cet utilisateur ? | danger | ⚠️ action irréversible |
| admin.directDeleteMovie | Supprimer définitivement ce film ? | danger | ⚠️ action irréversible |
| admin.directDeleteNotice | Supprimer définitivement cet avis ? | danger | ⚠️ action irréversible |
| admin.directDeleteRecipe | Supprimer définitivement cette recette ? | danger | ⚠️ action irréversible |
| admin.rejectMovie | Voulez-vous refuser et supprimer ce film ? | warning | ⚠️ action sensible |
| admin.rejectMovieDelete | Refuser la suppression de ce film ? | warning | ⚠️ action sensible |
| admin.rejectMovieEdit | Refuser cette modification de film ? | warning | ⚠️ action sensible |
| admin.rejectNotice | Voulez-vous refuser cet avis ? | warning | ⚠️ action sensible |
| admin.rejectNoticeDelete | Refuser la suppression de cet avis ? | warning | ⚠️ action sensible |
| admin.rejectNoticeEdit | Refuser cette modification d'avis ? | warning | ⚠️ action sensible |
| admin.rejectProfilePhoto | Voulez-vous refuser cette photo de profil ? | warning | ⚠️ action sensible |
| admin.rejectRecipe | Voulez-vous refuser et supprimer cette recette ? | warning | ⚠️ action sensible |
| admin.rejectRecipeEdit | Refuser cette modification de recette ? | warning | ⚠️ action sensible |
| admin.validateMovie | Confirmer la validation de ce film ? | standard |  |
| admin.validateNotice | Confirmer la validation de cet avis ? | standard |  |
| admin.validateRecipe | Confirmer la validation de cette recette ? | standard |  |

## 🔎 Notes
- `variant: danger` → action irréversible (suppression/refus).
- `variant: warning` → action sensible mais non destructrice.
- `Tag` : indique le niveau de criticité UX.
- `variant: standard` → confirmation normale.

## ✅ Bonnes pratiques
- Toute action critique doit référencer une clé dans `CINE_CONFIRM_ACTIONS`.
- Les messages doivent rester courts, explicites et cohérents.
