## 1. ID et mot de passe seb le fourbe

```bash
Seb le Fourbe
overseb75@gmail.com
# Mot de passe : Seb@2025
```

## 2. ID et mot de passe Semauri

```bash
Semauri
# Mot de passe : Seb@2025
```

-- autre mdp sans utilisateur : +:hhpdHNhyKyf}3

# Créer un admin via la BDD

## A. Mot de passe admin

```bash
# Mot de passe : js4life
```

## A1. Connexion à la base **ou**

```bash
psql -U cinedelices -d cinedelices
# Mot de passe : cinedelices
```

## Promouvoir user en admin

```sql
UPDATE users SET role = 'admin' WHERE pseudo = 'Semauri';
```

## Vérifier si user en admin

```sql
SELECT id, pseudo, email, role FROM users;
```

## B. Recréer une BDD

```bash
psql -U cinedelices -d cinedelices -f ./app/data/create_db.sql
# Mot de passe : cinedelices
```

## C. Recréer une BDD depuis Nov 2025

```bash
npm run db:init
# Mot de passe : cinedelices
```

## D. Récupérer la bdd dans sauvegarde.sql

```bash
pg_dump -U cinedelices -d cinedelices \
  --clean \
  --inserts \
  --column-inserts \
  -f "/var/www/html/SB09/Ciné Délices/dwwm-cinedelices/sauvegarde.sql"

# Mot de passe : cinedelices
```

# Connexion Ciné Délices / PostgreSQL

## 1️⃣ Aller dans le dossier projet

```bash
cd /var/www/html/SB09/Ciné\ Délices/dwwm-cinedelices
```

## 2️⃣ Vérifier PostgreSQL

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

## 3️⃣ Connexion à la base **ou**

```bash
psql -U cinedelices -d cinedelices
# Mot de passe : cinedelices
```

## 3️⃣ Recréer une BDD

```bash
psql -U cinedelices -d cinedelices -f ./app/data/create_db.sql
# Mot de passe : cinedelices
```

## 4️⃣ Vérifier les tables

```sql
\dt
# Tables : movies, users, recipes, notices, users_recipes
```

## 5️⃣ Lancer le serveur Node

```bash
npm install
npm run dev
```

## 6️⃣ Accéder au site

```
http://localhost:3000/
```

## Tips

- Assure toi que tes images sont dans `app/public/images/
- Utilise les commandes `\q` pour quitter PostgreSQL.
- Si Node indique un port occupé, vérifie avec `lsof -i :3000` et tue le processus si nécessaire.
