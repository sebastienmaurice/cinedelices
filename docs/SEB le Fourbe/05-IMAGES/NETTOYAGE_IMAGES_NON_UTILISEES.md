# Nettoyage des images non utilisées

**Date** : 18 décembre 2025  
**Objectif** : Supprimer les images qui ne sont pas référencées dans le code ou la base de données.

## Images supprimées

### 1. Dossier `/assets/` (supprimé complètement)

**Raison** : Aucune référence trouvée dans le code. Ces images étaient probablement des tests ou des assets temporaires.

**Fichiers supprimés** (11 fichiers) :

- `111-bdb209c5-3310-4bc1-989b-8ae260c5e4cd.png`
- `aeaze-2f3e0bd1-1d44-4d63-874f-ddc616e684b5.png`
- `aff-b11ccc95-796a-4ad0-9898-1ab5b33fb7f9.png`
- `erreur-306972eb-8ea3-4fb3-ba5a-455373645253.png`
- `image-6c3c4cb8-763a-4604-beb7-ec48527d1109.png`
- `image-795663cd-8cd8-4b26-b934-5b95fb073ab7.png`
- `image-b972b9e0-22ad-49e9-981e-2272d21f6cf2.png`
- `image-da5357b7-f76f-44db-bbee-c5948f5c5354.png`
- `image-f6970bfd-e19d-4be6-afdf-fb7147d49c9f.png`
- `pulp-99c25743-9088-4d6f-8c62-c29daf800b72.png`
- `ret-b4749793-aa9a-417c-9275-58ee4b0fb40b.png`

### 2. Anciennes images de films avec timestamp dans `/app/public/images/movies/`

**Raison** : Ces images ne sont plus utilisées pour l'affichage. Le système utilise maintenant :

- Les images originales dans `/app/public/images/movies/originals/`
- Les images traitées (banners) dans `/app/public/images/movies/banners/`
- Les images traitées (cards) dans `/app/public/images/movies/cards/`

Ces anciennes images avec timestamp étaient référencées dans la BDD mais ne sont plus nécessaires car on utilise maintenant les chemins générés automatiquement via `bannerPath` et `cardPath`.

**Fichiers supprimés** (5 fichiers) :

- `movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg`
- `movie-american_pie-1764103560707-335098533.png`
- `movie-bienvenue_chtis-1764103577240-542365048.png`
- `movie-harry_potter-1763858232674-340071843.png`
- `movie-Le-silence-des-agneaux-1764145159444-648907832.png`

### 3. Doublons d'images de recettes

**Raison** : Plusieurs versions avec différents timestamps pour la même recette. Seule la version la plus récente a été conservée.

**Fichiers supprimés** (2 fichiers) :

- `recipe-brownies_willy_le_borgne-1764262264623-479036853.png` (doublon)
- `recipe-brownies_willy_le_borgne-1764262864848-347538936.png` (doublon)
- ✅ Conservé : `recipe-brownies_willy_le_borgne-1764516016644-983232884.png` (version la plus récente)

## Images conservées

### Images utilisées dans les vues

Toutes les images suivantes sont référencées dans le code et sont conservées :

**Images générales** :

- `logo-cine-delices-2025.png` (header, footer)
- `favicon.png`, `favicon-centered.png`
- `background-comments-popcorn.png`, `background-page.jpg`
- `image-banner-movies.jpg`, `image-contact-cinema.jpg`
- `image-default-movie.jpg`, `image-default-profile.jpg`
- `image-default-recipe.jpg`, `image-default-recipe-1.jpg`, `image-default-recipe-2.jpg`
- `image-home-marty-doc.png`, `image-home-dessert-backtothefuture.jpg`

**Images de films** :

- Toutes les images dans `/banners/` (utilisées via `movie.bannerPath`)
- Toutes les images dans `/cards/` (utilisées via `movie.cardPath`)
- Toutes les images dans `/originals/` (références originales)

**Images de recettes** :

- Toutes les images dans `/recipes/` (utilisées via `recipe.picture` dans la BDD)

**Images de profil** :

- Toutes les images dans `/profil-contact/` (utilisées dans contact-about.ejs)

**Images événement** :

- Toutes les images dans `/event/` (utilisées dans home.ejs)

## Note importante

⚠️ **Les anciennes images de films avec timestamp étaient encore référencées dans la BDD** (`create_db.sql`), mais comme le système utilise maintenant les chemins générés automatiquement (`bannerPath`, `cardPath`), ces fichiers n'étaient plus nécessaires sur le disque.

Si vous réinitialisez la BDD avec `create_db.sql`, les chemins dans la BDD pointeront vers ces fichiers, mais le système les ignorera car il utilise les chemins générés. Les images originales dans `/originals/` sont suffisantes pour reconstruire les banners et cards si nécessaire.
