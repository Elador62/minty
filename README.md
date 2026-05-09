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
Exécutez le script SQL situé dans `supabase/migrations/20240509_initial_schema.sql` dans l'éditeur SQL de votre tableau de bord Supabase pour créer les tables nécessaires.

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
- **Kanban :** Gérez le cycle de vie de vos commandes (À Préparer -> En cours -> Expédié -> Terminé) par simple clic.

## 🚢 Sprint 3 : Expédition & Visuels
Optimisez la préparation de vos colis.
- **Picking List :** Générez une liste de préparation prête à imprimer.
- **Identification Visuelle :** Miniatures automatiques des cartes (via APIs Scryfall & PokémonTCG).
- **Sécurité Trust Service :** Alerte rouge clignotante pour les commandes "Tiers de Confiance" afin d'éviter les erreurs d'affranchissement.

## 🛠 Stack Technique
- **Framework :** Next.js 14 (App Router)
- **Style :** Tailwind CSS + Shadcn UI
- **Base de données :** Supabase (PostgreSQL + RLS)
- **Icônes :** Lucide React
