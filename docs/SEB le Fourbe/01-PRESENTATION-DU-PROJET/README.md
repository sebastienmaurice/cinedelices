# 01 - Présentation du Projet

## 📚 Table des matières

1. [Contexte de la formation](#contexte-de-la-formation)
2. [Concept du site Ciné Délices](#concept-du-site-ciné-délices)
3. [Objectifs du projet](#objectifs-du-projet)
4. [Fonctionnalités principales](#fonctionnalités-principales)
5. [Contraintes techniques et pédagogiques](#contraintes-techniques-et-pédagogiques)

---

## Contexte de la formation

### Qu'est-ce que la formation DWWM ?

**DWWM** signifie **Développeur Web et Web Mobile**. C'est une formation professionnalisante qui forme des développeurs capables de créer des sites web et applications mobiles.

### Pourquoi ce projet ?

Le projet **Ciné Délices** est un **projet de fin de formation** qui permet de :

- ✅ Mettre en pratique toutes les compétences acquises
- ✅ Créer un projet complet de A à Z
- ✅ Démontrer sa capacité à développer une application web
- ✅ Travailler en équipe (plusieurs développeurs sur le même projet)

### Niveau attendu

À la fin de la formation, un développeur DWWM doit être capable de :
- Créer une application web complète
- Utiliser des technologies modernes (Node.js, Express, PostgreSQL)
- Comprendre l'architecture d'un projet
- Gérer une base de données
- Créer une interface utilisateur

---

## Concept du site Ciné Délices

### L'idée de base

**Ciné Délices** est un site web qui associe deux passions : **le cinéma** et **la cuisine**.

### Le concept

Le site permet aux utilisateurs de :

1. **Découvrir des recettes** inspirées de films et séries cultes
2. **Partager leurs propres recettes** liées au cinéma
3. **Commenter et noter** les recettes des autres
4. **Explorer une filmothèque** de films et séries avec leurs recettes associées

### Exemples concrets

- 🎬 **Harry Potter** → Recette de la bièraubeurre (butterbeer)
- 🎬 **Ratatouille** → Recette de ratatouille
- 🎬 **Breaking Bad** → Recettes de plats mexicains
- 🎬 **Le Silence des Agneaux** → Recettes de plats raffinés

### Public cible

- Les **cinéphiles** qui aiment cuisiner
- Les **cuisiniers** qui aiment le cinéma
- Les **curieux** qui veulent découvrir de nouvelles recettes originales

---

## Objectifs du projet

### Objectifs pédagogiques

Ce projet permet d'apprendre et de pratiquer :

1. **Architecture web** : Comprendre comment fonctionne un site web
2. **Base de données** : Stocker et récupérer des données
3. **Authentification** : Gérer les comptes utilisateurs
4. **Upload de fichiers** : Gérer les images (films, recettes)
5. **Intégration API** : Utiliser l'API TMDB pour enrichir les données
6. **Recherche avancée** : Implémenter un système de recherche intelligent
7. **Interface utilisateur** : Créer une interface moderne et responsive

### Objectifs techniques

- ✅ Utiliser **Node.js** et **Express.js** pour le back-end
- ✅ Utiliser **PostgreSQL** pour la base de données
- ✅ Utiliser **EJS** pour générer les pages HTML
- ✅ Utiliser **Sequelize** pour gérer la base de données
- ✅ Intégrer une **API externe** (TMDB)
- ✅ Gérer l'**authentification** avec JWT
- ✅ Créer une **interface responsive**

---

## Fonctionnalités principales

### 1. Page d'accueil

**Ce que l'utilisateur voit** :
- Un **hero slider** avec 4 slides animés
- La **recette du jour** mise en avant
- Les **top 3 recettes** les plus appréciées
- Une sélection de **films cultes**

**Ce que ça apprend** :
- Comment créer un slider animé
- Comment afficher des données dynamiques
- Comment structurer une page d'accueil

### 2. Recherche de films

**Ce que l'utilisateur voit** :
- Une barre de recherche avec autocomplétion
- Des résultats en temps réel (films locaux + TMDB)
- Des mini-cartes avec posters

**Ce que ça apprend** :
- Comment faire des appels API
- Comment gérer l'autocomplétion
- Comment combiner données locales et externes

### 3. Ajout de film et recette

**Ce que l'utilisateur voit** :
- Un formulaire pour ajouter un film
- Pré-remplissage automatique via TMDB
- Un formulaire pour ajouter une recette liée au film
- Upload d'images

**Ce que ça apprend** :
- Comment créer des formulaires complexes
- Comment intégrer une API externe
- Comment gérer l'upload de fichiers
- Comment valider les données

### 4. Authentification

**Ce que l'utilisateur voit** :
- Formulaire de connexion
- Formulaire d'inscription
- Gestion de session (rester connecté)

**Ce que ça apprend** :
- Comment sécuriser les mots de passe (hachage)
- Comment gérer les sessions (JWT)
- Comment protéger les routes

### 5. Administration

**Ce que l'utilisateur voit** (admin uniquement) :
- Tableau de bord avec statistiques
- Liste des films à valider
- Liste des recettes à valider
- Gestion des utilisateurs

**Ce que ça apprend** :
- Comment créer un système de rôles
- Comment gérer la modération
- Comment créer une interface d'administration

### 6. Profil utilisateur

**Ce que l'utilisateur voit** :
- Ses recettes favorites
- Ses recettes créées
- Ses commentaires

**Ce que ça apprend** :
- Comment gérer les relations entre utilisateurs et recettes
- Comment créer un profil utilisateur

---

## Contraintes techniques et pédagogiques

### Contraintes techniques

#### Technologies imposées

- **Back-end** : Node.js avec Express.js
- **Base de données** : PostgreSQL
- **Templates** : EJS (Embedded JavaScript)
- **ORM** : Sequelize

#### Pourquoi ces technologies ?

- **Node.js** : Permet d'utiliser JavaScript côté serveur (cohérence avec le front-end)
- **PostgreSQL** : Base de données relationnelle robuste et gratuite
- **EJS** : Simple à apprendre, permet de générer du HTML dynamique
- **Sequelize** : Facilite l'accès à la base de données (pas besoin d'écrire du SQL brut)

### Contraintes pédagogiques

#### Ce qui est attendu

1. **Code propre et commenté** : Le code doit être lisible et compréhensible
2. **Architecture claire** : Séparation Front/Back, organisation MVC
3. **Sécurité basique** : Protection contre les injections SQL, XSS, etc.
4. **Interface utilisable** : Le site doit être fonctionnel et agréable

#### Ce qui n'est pas attendu (mais peut être fait)

- Application mobile native
- Système de paiement
- Chat en temps réel
- Système de notifications push

### Contraintes de temps

Ce projet est généralement réalisé sur **plusieurs semaines**, avec :
- Phase de conception
- Phase de développement
- Phase de tests
- Phase de finalisation

---

## 🎯 Ce que vous allez apprendre

En étudiant ce projet, vous allez comprendre :

1. **Comment fonctionne un site web** de bout en bout
2. **Comment organiser un projet** de manière professionnelle
3. **Comment communiquer** entre front-end et back-end
4. **Comment gérer une base de données** relationnelle
5. **Comment sécuriser** une application web
6. **Comment intégrer** des APIs externes
7. **Comment créer** une interface utilisateur moderne

---

## 📖 Prochaines étapes

Maintenant que vous comprenez le contexte et les objectifs du projet, vous pouvez :

→ **[Découvrir l'organisation générale du projet](./../02-ORGANISATION-GENERALE/README.md)**

---

**Retour à l'[index principal](./../README.md)**
