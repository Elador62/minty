# Minty - CardMarket Sales Manager (V1.0.0)

Minty est un outil de gestion centralisé pour automatiser le suivi des ventes, la préparation des commandes et l'ajustement des prix CardMarket (Pokémon & Magic).

## 🆕 Changelog V1.0.0
### 📱 Accessibilité & Interface
- **Application Responsive** : L'interface s'adapte désormais parfaitement aux smartphones, tablettes et ordinateurs.
- **Menu Mobile** : Intégration d'un menu latéral (Sheet) pour une navigation fluide sur petits écrans.
- **Optimisation des Tableaux** : Meilleure gestion de l'affichage des colonnes et du défilement horizontal sur mobile.

### 🔔 Alertes
- **Filtrage Avancé** : Nouveaux boutons/onglets pour filtrer les alertes par type (Prix, Envoi, Réception, Stock).
- **Filtres de Prix** : Pour les alertes de prix, ajout de filtres par fourchettes (Prix min/max et Évolution % min/max).
- **Tri Personnalisé** : Possibilité de trier les alertes par Date, Sévérité, Type, Prix ou % d'Évolution.
- **Lien Direct Collection** : Le bouton "Voir la collection" ouvre désormais directement la fiche détaillée de la carte concernée via son identifiant unique.

## 🆕 Changelog V0.9.5
### 📋 Suivi
- **Date commande éditable** : La date de création de la commande (`created_at`) peut désormais être modifiée via le formulaire de commande.
- **Barre de défilement Kanban** : La barre de défilement horizontale est maintenant accessible en haut de la zone Kanban pour une navigation facilitée.

### 🎴 Collection
- **Robustesse de l'import CSV** : Amélioration de la détection de la colonne `ProductUrl` par son nom d'en-tête, garantissant son stockage correct en base de données.
- **Sécurité Corbeille** : Ajout d'une demande de confirmation avant de vider définitivement la corbeille.
- **Recherche multilingue** : Le moteur de recherche Magic (Scryfall) supporte désormais les noms de cartes dans toutes les langues (Français, Anglais, etc.).
- **Amélioration UI Ajout Carte** : Correction du champ de saisie du nom qui se réduisait anormalement lors du clic sur le bouton de recherche.
- **Fiabilité des prix** : Correction et renforcement du stockage du prix marché (`last_market_price`) après actualisation.

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

## 📊 Fonctionnalités Clés
- **Importation** : Parser d'emails et import CSV CardMarket pour synchroniser vos ventes.
- **Suivi (Kanban)** : Gestion du cycle de vie des commandes (À préparer, Prête, Expédiée, etc.).
- **Expédition** : Génération de Picking Lists optimisées pour l'impression avec visuels des cartes.
- **Collection** : Suivi de stock, actualisation automatique des prix du marché et historisation.
- **Dashboard** : Statistiques de vente, CA, répartition TCG et valorisation de collection.
- **Alertes** : Détection automatique des opportunités de prix et des retards logistiques.

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
3. Exécutez l'intégralité des scripts SQL situés dans le dossier `supabase/migrations/` dans l'ordre chronologique. Cela créera les tables, les politiques RLS et les paramètres nécessaires.

### 2. Déploiement sur Vercel
1. Connectez-vous à [Vercel](https://vercel.com/) et importez votre dépôt.
2. Ajoutez les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Cliquez sur **Deploy**.

### 3. Configuration de l'Authentification
Dans Supabase, configurez les **Redirect URLs** :
- `https://votre-app.vercel.app/api/auth/callback`
- `https://*.vercel.app/**`
