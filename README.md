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
La fonctionnalité actuelle permet d'importer des commandes via le parser d'emails.
Rendez-vous sur : [http://localhost:3000/import](http://localhost:3000/import)

1. Copiez le contenu d'un email CardMarket (Payé, Vendu, ou Livré).
2. Collez-le dans la zone de texte.
3. Cliquez sur **Analyser l'email** pour voir le résultat.

## 🛠 Stack Technique
- **Framework :** Next.js 14 (App Router)
- **Style :** Tailwind CSS + Shadcn UI
- **Base de données :** Supabase (PostgreSQL + RLS)
- **Icônes :** Lucide React
