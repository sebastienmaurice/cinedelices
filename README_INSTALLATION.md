# Guide d'Installation - Ciné Délices

**Pour l'équipe de développement**

---

## 📦 Installation des dépendances

### Commande unique

```bash
npm install
```

Cette commande installera automatiquement toutes les dépendances nécessaires.

---

## 📋 Dépendances installées

### Core Backend

- **express** ^5.1.0 - Framework web
- **sequelize** ^6.37.7 - ORM pour PostgreSQL
- **pg** ^8.16.3 - Client PostgreSQL

### Authentification & Sécurité

- **argon2** ^0.44.0 - Hash de mots de passe
- **jsonwebtoken** ^9.0.2 - JWT pour authentification
- **express-xss-sanitizer** ^2.0.1 - Protection XSS

### Templates & Frontend

- **ejs** ^3.1.10 - Moteur de templates
- **cookie-parser** ^1.4.7 - Gestion des cookies

### Upload & Images

- **multer** ^2.0.2 - Upload de fichiers
- **sharp** ^0.33.5 - ⭐ **NOUVEAU** - Traitement et optimisation d'images

### Utilitaires

- **dotenv** ^17.2.3 - Variables d'environnement
- **joi** ^17.13.3 - Validation de données
- **http-status-codes** ^2.3.0 - Constantes HTTP

---

## 🚀 Étapes d'installation complète

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd dwwm-cinedelices
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Créez un fichier `.env` à la racine avec :

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cinedelices
DB_USER=cinedelices
DB_PASSWORD=votre_mot_de_passe

TMDB_API_KEY=votre_clé_api_tmdb
TMDB_API_URL=https://api.themoviedb.org/3

JWT_SECRET=votre_secret_jwt
```

### 4. Initialiser la base de données

```bash
npm run db:init
```

### 5. Lancer le serveur

```bash
npm run dev
```

---

## ⚠️ Dépendance critique : Sharp

**Sharp** est nécessaire pour le traitement d'images (crop, resize, optimize).

Si l'installation échoue :

```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# Puis réinstaller
npm rebuild sharp
```

---

## 📝 Commandes disponibles

- `npm run dev` - Lancer le serveur en mode développement
- `npm run db:init` - Initialiser la base de données
- `npm run db:migrate-type` - Ajouter la colonne `type` aux films

---

**Pour plus de détails :** Voir `INSTALLATION_DEPENDANCES.md`
