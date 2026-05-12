# Minty - CardMarket Sales Manager (V0.9.4)

Minty est un outil de gestion centralisé pour automatiser le suivi des ventes, la préparation des commandes et l'ajustement des prix CardMarket (Pokémon & Magic).

## 🆕 Changelog V0.9.4
### 📋 Suivi
- **Alertes de stock intelligentes** : N'affiche l'alerte que pour les statuts "À préparer", "Prête" et "En cours".
- **Gestion de la corbeille** : Les cartes archivées ne sont plus comptabilisées dans le stock disponible. Une alerte s'affiche si une commande nécessite une carte qui n'est présente qu'en corbeille.
- **Édition de dates** : Les dates d'expédition (`shipped_at`) et de réception (`delivered_at`) sont désormais éditables manuellement.
- **Automatisation** : La date de réception se met à jour automatiquement lors du passage au statut "Terminé".
- **Navigation fluide** : Clic sur un article d'une commande pour ouvrir directement sa fiche détaillée dans la Collection.

### 🎴 Collection
- **Import CSV enrichi** : Stockage du champ `ProductUrl` pour un accès direct aux fiches CardMarket.
- **Visualisation rapide** : Clic sur le nom d'une carte pour ouvrir sa vue détaillée.
- **Historique lié** : Dans l'historique d'une carte, clic sur une commande pour l'ouvrir directement dans le module Suivi.
- **Mise à jour ciblée des prix** : Nouveau bouton d'actualisation individuelle dans la fiche carte et options d'actualisation groupée (Toutes, Affichées, Sélectionnées).
- **Correction API** : Amélioration de la fiabilité de la récupération des prix Trend.

### 🔔 Alertes
- **Module Stock** : Intégration des alertes de rupture de stock dans le tableau de bord des alertes.

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
Vercel génère des URLs dynamiques (ex: `minty-green.vercel.app`). Supabase est très strict sur les redirections.
1. Allez dans **Authentication > URL Configuration**.
2. Dans **Site URL**, mettez l'URL principale : `https://minty-green.vercel.app`.
3. Dans **Redirect URLs**, ajoutez **obligatoirement** les deux types suivants :
   - L'URL exacte : `https://minty-green.vercel.app/api/auth/callback`
   - Un wildcard pour supporter les déploiements Vercel : `https://*-green.vercel.app/**` (en remplaçant `green` par votre suffixe) ou plus simplement `https://*.vercel.app/**` pour les tests.
4. **Attention :** Si l'URL dans la barre de votre navigateur ne correspond pas EXACTEMENT (caractère par caractère) à une URL autorisée dans Supabase, l'erreur "Invalid path specified" apparaîtra.

### 4. Optimisation (Optionnel)
- Pour des performances optimales avec Supabase, il est recommandé d'activer le **Connection Pooling** (via PgBouncer) dans les paramètres de base de données si vous prévoyez un trafic important.
- L'application utilise `npm run build` qui exécute `next build` pour générer un build de production optimisé.

### 🛠 Dépannage (Vercel)
- **Erreur 500 (MIDDLEWARE_INVOCATION_FAILED) :** Vérifiez vos variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`) dans Vercel. Redéployez après correction.
- **Erreur Inscription (Invalid path specified...) :** Vérifiez que l'URL `https://votre-app.vercel.app/api/auth/callback` est bien présente dans la liste des **Redirect URLs** de votre projet Supabase (Authentication > URL Configuration).
