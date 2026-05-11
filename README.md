# Minty - CardMarket Sales Manager

Minty est un outil de gestion centralisé pour automatiser le suivi des ventes, la préparation des commandes et l'ajustement des prix CardMarket (Pokémon & Magic).

## 🚀 Installation locale

Suivez ces étapes pour faire tourner l'application sur votre machine :

### 1. Prérequis
- Node.js (version 18 ou supérieure recommandée)
- Un compte [Supabase](https://supabase.com/) (gratuit)

### 2. Installation des dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
Copiez le fichier `.env.example` en `.env.local` :
```bash
cp .env.example .env.local
```
Remplissez les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` avec vos identifiants disponibles dans les paramètres de votre projet Supabase (API settings).

### 4. Base de données
Exécutez le script SQL situé dans `supabase/migrations/20240509_initial_schema.sql` dans l'éditeur SQL de votre tableau de bord Supabase. Ce script est **idempotent** : vous pouvez le relancer plusieurs fois pour mettre à jour votre structure sans perdre de données.

### 5. Lancement
```bash
npm run dev
```
L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

## 📦 Sprint 1 : Module d'Importation
Importez vos commandes CardMarket via le parser d'emails.
Rendez-vous sur : `/import`

1. Copiez le contenu d'un email CardMarket.
2. Collez-le dans la zone de texte.
3. Cliquez sur **Analyser l'email** puis **Enregistrer**.

## 📊 Sprint 2 : Dashboard & Kanban
Suivez votre activité en temps réel.
- **Dashboard :** Visualisez votre CA total, la répartition Pokémon/Magic et vos meilleures ventes.
- **Kanban :** Gérez le cycle de vie de vos commandes (Déplacement libre, modification manuelle, expand/collapse des articles).
- **Gestion Manuelle :** Créez ou modifiez vos commandes et articles via une interface dédiée.

## 🚢 Sprint 3 : Expédition & Visuels
Optimisez la préparation de vos colis.
- **Picking List :** Générez une liste de préparation prête à imprimer.
- **Identification Visuelle :** Miniatures automatiques des cartes (via APIs Scryfall & PokémonTCG).
- **Sécurité Trust Service :** Alerte rouge clignotante et contrôle manuel.
- **Impression Optimisée :** Mise en page picking-list (1 page/commande) allégée (sans photos) avec lignes compactes.
- **Persistence du Picking :** Chaque carte cochée est sauvegardée en temps réel.
- **Vérification Visuelle :** En-tête vert dès qu'une commande est entièrement préparée.

## 🛠 Stack Technique
- **Framework :** Next.js 14 (App Router)
- **Style :** Tailwind CSS + Shadcn UI
- **Base de données :** Supabase (PostgreSQL + RLS)
- **Icônes :** Lucide React

## 🚀 Déploiement sur Vercel

Suivez cette procédure détaillée pour mettre votre application en production sur Vercel.

### 1. Préparation de la Base de données (Supabase)
Avant de déployer le code, assurez-vous que votre instance Supabase de production est prête :
1. Créez un nouveau projet sur [Supabase](https://supabase.com/).
2. Allez dans l'**éditeur SQL** (SQL Editor) de votre tableau de bord Supabase.
3. Exécutez l'intégralité des scripts SQL situés dans le dossier `supabase/migrations/` dans l'ordre chronologique (du plus ancien au plus récent). Cela créera les tables, les politiques RLS et les paramètres nécessaires.

### 2. Déploiement sur Vercel
1. Connectez-vous à [Vercel](https://vercel.com/) et cliquez sur **"New Project"**.
2. Importez votre dépôt GitHub/GitLab/Bitbucket.
3. Dans la section **Environment Variables**, ajoutez les variables suivantes :
   - `NEXT_PUBLIC_SUPABASE_URL` : L'URL de votre projet Supabase (trouvable dans *Project Settings > API*).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` : La clé "anon" (public) de votre projet Supabase (trouvable dans *Project Settings > API*).
4. Cliquez sur **Deploy**.

### 3. Configuration de l'Authentification
Vercel génère une URL de production (ex: `https://votre-app.vercel.app`). Vous devez autoriser cette URL dans Supabase :
1. Allez dans **Authentication > URL Configuration**.
2. Dans **Site URL**, mettez l'URL principale de votre application Vercel.
3. Dans **Redirect URLs**, ajoutez `https://votre-app.vercel.app/**` pour autoriser toutes les redirections après connexion.

### 4. Optimisation (Optionnel)
- Pour des performances optimales avec Supabase, il est recommandé d'activer le **Connection Pooling** (via PgBouncer) dans les paramètres de base de données si vous prévoyez un trafic important.
- L'application utilise `npm run build` qui exécute `next build` pour générer un build de production optimisé.

### 🛠 Dépannage (Vercel)
Si vous obtenez une erreur **500: INTERNAL_SERVER_ERROR (MIDDLEWARE_INVOCATION_FAILED)** :
1. Vérifiez que vos variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`) sont correctement saisies dans Vercel.
2. Assurez-vous qu'il n'y a pas d'espace avant ou après les valeurs des clés.
3. Redéployez votre application après avoir vérifié les variables.
