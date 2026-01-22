# Idées - Fonctionnalités Bouton Robot "Recherche Boostée"

## 🤖 Objectif

Transformer le bouton robot en un véritable outil de **recherche intelligente boostée** qui améliore l'expérience utilisateur sur la page `/movies`.

---

## 💡 Idées de Fonctionnalités

### 1. **Recherche par Description / Scénario** ⭐ (Recommandé)

**Fonctionnalité :**

- L'utilisateur clique sur le robot → un modal/panneau s'ouvre
- Champ de texte : "Décris-moi le film que tu cherches..."
- Exemples :
  - "Un film avec un voyage dans le temps et une voiture"
  - "Une série sur un cuisinier qui devient pirate"
  - "Un film avec des sorciers et une école de magie"

**Implémentation :**

- Utilisation d'API IA légère (OpenAI API ou équivalent)
- Transformation de la description en mots-clés
- Recherche intelligente avec plusieurs variantes
- Retourne les films les plus pertinents avec explication

**Exemple de prompt :**

```
Utilisateur : "Un film avec un voyage dans le temps"
IA extrait : ["voyage temporel", "retour futur", "marty mcfly", "delorean"]
→ Recherche sur ces termes → trouve "Retour vers le futur"
```

---

### 2. **Suggestions Intelligentes Basées sur l'Historique**

**Fonctionnalité :**

- Analyse des films consultés par l'utilisateur (si connecté)
- Suggestions de films similaires
- "Si tu as aimé [Film X], tu pourrais aimer..."

**Implémentation :**

- Stockage de l'historique de navigation (localStorage ou BDD)
- Calcul de similarité par genre, année, acteurs
- Affichage dans un panneau déroulant

---

### 3. **Filtres Avancés Instantanés**

**Fonctionnalité :**

- Clic sur robot → panneau de filtres avancés :
  - Période (années 80, 90, 2000, etc.)
  - Note minimale (étoiles)
  - Genre multiple (cocher plusieurs)
  - Avec recettes / Sans recettes
  - Film / Série / Les deux
  - Disponible en Ciné Délices / À créer

**Implémentation :**

- Modal ou panneau latéral
- Filtres appliqués en temps réel
- Compteur de résultats

---

### 4. **Recherche par Ambiance / Émotion**

**Fonctionnalité :**

- "Je cherche un film qui me fait ressentir..."
  - Options : Rire, Pleurer, Frissonner, Rêver, Réfléchir
- Suggestions de films par émotion dominante

**Implémentation :**

- Mapping émotion → genres (ex: "Rire" → Comédie, "Frissonner" → Horreur/Thriller)
- Filtrage intelligent par tags/descriptions

---

### 5. **Recherche Vocale** 🎤

**Fonctionnalité :**

- Clic sur robot → activation du microphone
- L'utilisateur dit "Recherche Retour vers le futur"
- Transcription automatique → recherche classique

**Implémentation :**

- Web Speech API (natif navigateur)
- Pas de dépendances externes nécessaires
- Fallback si non disponible

---

### 6. **Mode "Découverte Aléatoire"**

**Fonctionnalité :**

- Clic sur robot → "Surprends-moi !"
- Affiche un film aléatoire avec ses recettes
- Idéal pour découvrir des films qu'on ne connaît pas

**Implémentation :**

- Endpoint backend `/movies/random`
- Random avec filtres optionnels (genre, période)

---

### 7. **Recherche par Similarité Visuelle (Future)**

**Fonctionnalité :**

- Upload d'une affiche de film
- "Trouve-moi des films avec un style similaire"
- Utilisation de vision IA (TensorFlow.js ou API)

**Implémentation :**

- Plus complexe, nécessite modèles IA
- Bonus futur si temps disponible

---

### 8. **Recherche Multi-Critères Intelligente**

**Fonctionnalité :**

- Clic robot → formulaire multi-champs :
  - Titre (optionnel)
  - Genre (multi-sélection)
  - Année min/max
  - Acteur principal
  - Réalisateur
- Recherche combinée intelligente

**Implémentation :**

- Modal avec formulaire
- Backend : recherche Sequelize avec conditions multiples
- Affichage des résultats avec score de correspondance

---

### 9. **Suggestions Contextuelles "Films du Moment"**

**Fonctionnalité :**

- Clic robot → suggestions basées sur :
  - Tendances actuelles
  - Films récemment ajoutés
  - Films les plus consultés
  - Films avec recettes populaires

**Implémentation :**

- Endpoint `/movies/trending`
- Calcul basé sur statistiques (vues, notes, dates)

---

### 10. **Recherche par Recette** 🍽️

**Fonctionnalité :**

- "Je cherche un film qui contient une recette de..."
  - Ex: "gâteau", "pizza", "brownies"
- Retourne les films avec recettes correspondantes

**Implémentation :**

- Recherche dans la table `recipes` par nom/ingrédients
- Jointure avec `movies`
- Affichage film + recette associée

---

## 🎯 Recommandations par Priorité

### 🥇 **Priorité 1 : Recherche Multi-Critères Intelligente (#8)**

**Pourquoi :**

- ✅ Utile immédiatement
- ✅ Pas de dépendances externes
- ✅ Simple à implémenter
- ✅ Améliore grandement l'expérience

**Interface :**

```
┌─────────────────────────────────────┐
│  🔍 Recherche Boostée              │
├─────────────────────────────────────┤
│  Titre (optionnel)                  │
│  [___________________________]      │
│                                     │
│  Genre (plusieurs possibles)        │
│  ☑ Action  ☐ Comédie  ☐ Drame      │
│                                     │
│  Année : De [____] à [____]         │
│                                     │
│  [ Rechercher ] [ Annuler ]         │
└─────────────────────────────────────┘
```

---

### 🥈 **Priorité 2 : Filtres Avancés Instantanés (#3)**

**Pourquoi :**

- ✅ Répond à un besoin réel
- ✅ Complète la recherche actuelle
- ✅ Interface simple (modal)

**Interface :**

```
┌─────────────────────────────────────┐
│  ⚙️ Filtres Avancés                │
├─────────────────────────────────────┤
│  Période :                          │
│  ◉ Années 80  ○ 90  ○ 2000  ○ 2010 │
│                                     │
│  Note minimale : ⭐⭐⭐⭐⭐           │
│                                     │
│  Type :                             │
│  ☑ Films  ☑ Séries                 │
│                                     │
│  [ Appliquer les filtres ]          │
└─────────────────────────────────────┘
```

---

### 🥉 **Priorité 3 : Mode Découverte (#6)**

**Pourquoi :**

- ✅ Simple à implémenter
- ✅ Fun et engageant
- ✅ Encourage la découverte

**Interface :**

```
Clic robot → Animation → Film aléatoire affiché en grand
avec bouton "Encore un autre !"
```

---

### 🎁 **Bonus Futur : Recherche par Description (#1)**

**Pourquoi :**

- ✅ Très innovant
- ✅ Nécessite API externe (OpenAI, etc.)
- ✅ Coûts potentiels
- ✅ À implémenter après validation des autres

---

## 🛠️ Implémentation Suggérée

### Phase 1 : Recherche Multi-Critères (Recommandé)

1. **Modal HTML/CSS**

   - Panneau qui s'ouvre au clic robot
   - Formulaire avec champs multiples
   - Design cohérent avec Ciné Délices

2. **Backend Endpoint**

   - `/movies/search-boosted`
   - Accepte : `title`, `genres[]`, `yearMin`, `yearMax`, `type`
   - Recherche Sequelize combinée

3. **Frontend JS**

   - Gestion ouverture/fermeture modal
   - Soumission formulaire
   - Affichage résultats dans dropdown existant

4. **Animation Robot**
   - Effet visuel au clic (rotation, glow)
   - Feedback utilisateur

---

## 📊 Comparaison des Options

| Fonctionnalité  | Complexité | Utilité    | Coût    | Priorité |
| --------------- | ---------- | ---------- | ------- | -------- |
| Multi-critères  | ⭐⭐       | ⭐⭐⭐⭐⭐ | Gratuit | 🥇       |
| Filtres avancés | ⭐         | ⭐⭐⭐⭐   | Gratuit | 🥈       |
| Découverte      | ⭐         | ⭐⭐⭐     | Gratuit | 🥉       |
| Par description | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | Payant  | 🎁       |
| Vocale          | ⭐⭐⭐     | ⭐⭐⭐     | Gratuit | 🎁       |
| Par recette     | ⭐⭐       | ⭐⭐⭐⭐   | Gratuit | 🎁       |

---

## 🎨 Design Modal Suggéré

### Style Modal

```css
/* Modal recherche boostée */
.search-boost-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    135deg,
    var(--bleu-nuit),
    var(--bleu-intermediaire)
  );
  border: 2px solid var(--dore-popcorn);
  border-radius: 15px;
  padding: 2rem;
  z-index: 2000;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
```

### Header Modal

```
┌─────────────────────────────────────┐
│  🤖 Recherche Boostée               │
│  Trouvez le film parfait...         │
└─────────────────────────────────────┘
```

---

## 🚀 Prochaines Étapes

1. **Valider avec l'équipe** quelle fonctionnalité prioriser
2. **Créer un prototype** du modal/fonctionnalité choisie
3. **Implémenter progressivement** en commençant par la plus simple
4. **Tester avec utilisateurs** avant déploiement

---

**Date** : Décembre 2025  
**Status** : 💡 **IDÉES - À VALIDER**
