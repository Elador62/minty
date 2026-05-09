# Spécifications de l'Application : CardMarket Sales Manager

Ce document sert de guide de référence pour le développement de l'application de gestion de ventes CardMarket (Pokémon & Magic).

## 1. Vision du Projet
Créer un outil centralisé pour automatiser le suivi des ventes, la préparation des commandes et l'ajustement des prix de la collection.

## 2. Sources de Données (Data Ingestion)
L'application doit supporter deux modes d'entrée :

### A. API CardMarket (OAuth 1.0a)
* **Récupération des commandes :** Synchronisation automatique des statuts (Paid, Received, etc.).
* **Price Guide :** Récupération des prix 'Trend' et 'Avg Sell' pour le stock.
* **Stock :** Lecture de la liste des articles en vente.

### B. Parser d'Emails (Fallback & Rapidité)
Un module permettant de copier-coller le contenu brut des emails automatiques CardMarket.
* **Logique de Parsing :** Extraction via Regex des champs suivants :
    * ID de commande (ex: `20231024-123456`).
    * Nom/Pseudo de l'acheteur.
    * Liste des cartes (Quantité, Nom, Édition, État, Prix).
    * Mode de livraison (Standard vs Trust Service).
    * Adresse de destination complète.

## 3. Gestion des Commandes & UI
L'interface doit proposer trois modes de visualisation :
1.  **Vue Liste :** Tableau compact et triable.
2.  **Vue Cartes (Galerie) :** Affichage avec les visuels des cartes pour faciliter l'identification visuelle.
3.  **Vue Kanban :** Colonnes dynamiques :
    * `À Préparer` (Payé)
    * `En cours d'envoi` (Préparé/Étiqueté)
    * `Expédié`
    * `Reçu / Terminé`

## 4. Module d'Expédition (Picking List)
Fonctionnalité cruciale de génération de rapport (PDF ou vue imprimable) :
* **Contenu du rapport :** Liste des commandes "À envoyer".
* **Détails par commande :** Nom acheteur, adresse, mode d'envoi.
* **Identification visuelle :** Miniature de l'illustration de chaque carte.
* **Alerte "TRUST SERVICE" :** Si le mode d'envoi est le Tiers de Confiance (suivi obligatoire), afficher un badge **ROUGE CLIGNOTANT** ou une bordure de section très épaisse pour éviter toute erreur d'affranchissement.

## 5. Dashboard & Statistiques
* Chiffre d'affaires (Hebdomadaire / Mensuel).
* Volume de ventes Pokémon vs Magic.
* Top 5 des cartes les plus vendues.
* **Suivi de Collection :** Comparaison entre le prix de vente actuel et le 'Trend Price' du marché avec indicateur de rentabilité (alerte si le prix du marché augmente de +10% par rapport au prix listé).

## 6. Stack Technique Recommandée
* **Frontend :** Next.js / React (pour la réactivité du Kanban).
* **Style :** Tailwind CSS (pour les alertes visuelles et le responsive).
* **Base de données :** Supabase ou SQLite (pour conserver l'historique au-delà de 90 jours).
* **PDF :** react-pdf ou impression CSS native via `@media print`.
