# Plan d'Implémentation - Recherche Avancée Films

## 📋 Vue d'Ensemble

Implémentation d'un système de recherche avancée pour les films avec :

- Fuzzy search (Levenshtein)
- Recherche phonétique (Double Metaphone FR)
- Enrichissement TMDB
- Cache LRU avec TTL
- Scoring de pertinence
- Frontend amélioré avec navigation clavier

---

## 🏗️ Architecture

### Backend

1. **Modules Utilitaires** (`app/utils/`)

   - ✅ `search-utils.js` - Fonctions de recherche (fuzzy, scoring, normalisation)
   - ✅ `search-cache.js` - Cache LRU avec TTL

2. **Controller** (`app/controllers/movies.controllers.js`)

   - Fonction `searchMoviesAdvanced()` - Recherche avancée complète
   - Enrichissement TMDB pour les résultats
   - Utilisation du cache

3. **Route** (`app/routes/movies.route.js`)
   - `GET /movies/search-advanced` - Nouvel endpoint

### Frontend

1. **Script** (`app/public/js/movie-search-advanced.js`)

   - Debounce dynamique 200-600ms
   - Dropdown avec mini-cartes
   - Navigation clavier (↑ ↓ Enter Escape)
   - Highlight des mots correspondants

2. **Styles** (`app/public/css/movies-search-advanced.css`)
   - Styles pour dropdown et mini-cartes
   - Responsive mobile

---

## 📝 Étapes d'Implémentation

### Phase 1 : Backend - Utilitaires ✅

- [x] Créer `search-utils.js` (fuzzy, scoring, normalisation)
- [x] Créer `search-cache.js` (cache LRU avec TTL)

### Phase 2 : Backend - Controller (En cours)

- [ ] Créer fonction `searchMoviesAdvanced()`
- [ ] Intégrer enrichissement TMDB
- [ ] Utiliser le cache
- [ ] Limiter à Top 5 résultats

### Phase 3 : Backend - Route

- [ ] Ajouter route `/movies/search-advanced`
- [ ] Tester l'endpoint

### Phase 4 : Frontend - Script

- [ ] Créer `movie-search-advanced.js`
- [ ] Debounce dynamique
- [ ] Dropdown avec mini-cartes
- [ ] Navigation clavier

### Phase 5 : Frontend - Styles

- [ ] Créer styles pour dropdown
- [ ] Styles pour mini-cartes
- [ ] Responsive mobile

### Phase 6 : Intégration

- [ ] Intégrer dans la vue `movies.ejs`
- [ ] Tests end-to-end

### Phase 7 : Bonus (Optionnel)

- [ ] Phonétique Double Metaphone FR
- [ ] Embeddings IA
- [ ] Recherche acteurs/réalisateurs

---

## 🔧 Dépendances

### NPM (si nécessaire)

- `double-metaphone` ou bibliothèque phonétique FR (optionnel)
- `fast-levenshtein` (optionnel, déjà implémenté manuellement)

---

## 📊 Structure des Données

### Requête

```json
{
  "query": "harry potter",
  "filters": {
    "genre": "fantastique",
    "year": 2001
  }
}
```

### Réponse

```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "title_fr": "Harry Potter",
      "title_en": "Harry Potter",
      "year": 2001,
      "genre": "fantastique",
      "note": 4.5,
      "overview": "Synopsis...",
      "poster": "/images/...",
      "score": 95,
      "tmdb_enriched": true
    }
  ],
  "hasResults": true,
  "cached": false
}
```

---

## 🎯 Fonctionnalités Clés

### Backend

1. **Fuzzy Search** : Levenshtein distance
2. **Scoring** : Combinaison exact/fuzzy/phonétique
3. **Cache** : LRU avec TTL 1h
4. **Enrichissement TMDB** : Poster, synopsis, note
5. **Top 5** : Limite des résultats

### Frontend

1. **Debounce dynamique** : 200-600ms selon vitesse
2. **Mini-cartes** : 60x90px poster, titre, année, genre, note
3. **Navigation clavier** : ↑ ↓ Enter Escape
4. **Highlight** : Mots correspondants
5. **Responsive** : Mobile-friendly

---

**Date** : Décembre 2025  
**Statut** : En cours d'implémentation
