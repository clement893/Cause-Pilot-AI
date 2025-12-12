# Cause Pilot AI - Module Marketing Automation

## Corrections de bugs
- [x] Corriger erreur templates.filter sur la page templates (Array.isArray check)
- [x] Corriger erreur automations.filter sur la page automations (Array.isArray check)
- [x] Corriger erreur templates.map sur la page new automation (Array.isArray check)
- [x] Configurer connexion à la base de données PostgreSQL Railway

## Phase 3 - Interface Utilisateur Marketing
- [x] Page liste des campagnes email (existante et fonctionnelle)
- [x] Éditeur de templates email (existant avec drag & drop)
- [x] Page création campagne avec segmentation (existante)
- [x] Page statistiques des envois (page détail campagne)
- [x] Configuration des automatisations (page new automation)

## Fonctionnalités existantes
- [x] Page principale Marketing avec statistiques
- [x] Page liste des campagnes avec filtres
- [x] Page détail campagne avec statistiques
- [x] Page création nouvelle campagne (wizard multi-étapes)
- [x] Page liste des templates
- [x] Éditeur visuel de templates (drag & drop)
- [x] Page liste des automatisations
- [x] Page création nouvelle automatisation
- [x] Automatisations suggérées (bienvenue, remerciement, réactivation, anniversaire)

## À améliorer (optionnel)
- [ ] Ajouter des templates de démarrage pré-configurés
- [ ] Améliorer l'affichage des statistiques en temps réel
- [ ] Historique undo/redo pour l'éditeur de templates
- [ ] Documentation webhook SendGrid


## Phase 4 - Multi-organisation ✅
- [x] Créer le modèle Organization dans le schéma Prisma
- [x] Créer le modèle OrganizationMember pour les membres
- [x] Créer les APIs CRUD pour les organisations
- [x] Créer la page de gestion des organisations
- [x] Créer la page détail/édition organisation
- [x] Gestion des membres et rôles
- [x] Ajouter le lien Organisations dans le Sidebar
- [x] Installation des composants shadcn/ui (button, input, card, dialog, etc.)
- [x] Installation de sonner pour les toasts
- [x] Test création d'organisation (Fondation Espoir créée avec succès)
- [ ] Ajouter organizationId aux tables existantes (Donor, Donation, Campaign, etc.)
- [ ] Ajouter le sélecteur d'organisation dans le header
- [ ] Implémenter le contexte d'organisation actuelle
- [ ] Filtrer les données par organisation

## Phase 5 - Tableau de bord personnalisable ✅
- [x] Installer react-grid-layout pour le drag & drop
- [x] Créer le modèle DashboardLayout pour sauvegarder les configurations
- [x] Créer le composant DashboardGrid avec react-grid-layout
- [x] Créer les composants widgets (statistiques, graphiques, listes)
- [x] Implémenter le système de grille drag & drop
- [x] Ajouter le mode édition du dashboard
- [x] Créer les présets de layouts (Standard, Analytique, Opérationnel, Minimal)
- [x] Ajouter le bouton Personnaliser dans le dashboard
- [x] Page de personnalisation du dashboard
- [x] Catalogue de widgets (10 widgets disponibles)
- [x] Widgets statistiques : Total Collecté, Donateurs, Don Moyen, Revenus Mensuels
- [x] Widgets graphiques : Évolution des Dons, Répartition par Type, Segments
- [x] Widgets listes : Top Donateurs, Dons Récents, Campagnes Actives
- [ ] Sauvegarder/charger la configuration depuis la base de données
- [ ] Widgets avec données dynamiques (API)


## Phase 6 - Sélecteur d'organisation et persistance dashboard
- [x] Créer le contexte React pour l'organisation active
- [x] Créer le composant OrganizationSelector (dropdown)
- [x] Intégrer le sélecteur dans le Sidebar/Header
- [x] Créer l'API GET/PUT pour les layouts dashboard
- [x] Modifier la page customize pour charger/sauvegarder depuis la DB
- [x] Tester le changement d'organisation
- [x] Tester la persistance du layout


## Phase 7 - Refactorisation Tailwind CSS Design System
- [x] Analyser la version Tailwind (v4) et structure CSS actuelle
- [x] Créer design-tokens.css avec palette de couleurs complète
- [x] Définir spacing scale, typography, border radius, shadows
- [x] Créer cards.css avec classes réutilisables
- [x] Créer buttons.css avec variantes
- [x] Créer headers.css pour navigation
- [x] Créer forms.css pour inputs et formulaires
- [x] Créer badges.css pour badges et tags
- [x] Créer tables.css pour tables et listes
- [x] Créer modals.css pour modals et dialogs
- [x] Créer utilities.css pour classes utilitaires
- [x] Remplacer couleurs hard-codées par tokens
- [x] Mettre à jour globals.css pour importer le design system
- [x] Tester la cohérence visuelle sur toutes les pages
- [ ] Pousser sur Git
