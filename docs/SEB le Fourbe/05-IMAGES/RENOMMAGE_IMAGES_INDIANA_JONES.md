# Renommage des images Indiana Jones

**Date** : 18 décembre 2025  
**Raison** : Correction des noms de fichiers pour correspondre au slug généré par la fonction `slugifyTitle`.

## Images renommées

Les images d'Indiana Jones ont été renommées pour correspondre au slug généré actuellement :

### Avant

- `banner-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`
- `card-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`
- `original-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`

### Après

- `banner-indiana-jones-et-les-aventuriers-de-larche-perdue.jpg` ✅
- `card-indiana-jones-et-les-aventuriers-de-larche-perdue.jpg` ✅
- `original-indiana-jones-et-les-aventuriers-de-larche-perdue.jpg` ✅

## Notes

- Le slug généré par `slugifyTitle()` produit `indiana-jones-et-les-aventuriers-de-larche-perdue` (sans tiret entre "l" et "arche").
- Les fichiers ont été renommés pour correspondre exactement à ce slug.
- Les chemins d'accès aux images sont maintenant cohérents avec ce qui est généré par le helper `movie-image-helper.js`.
