# Cause Pilot AI - Module Base Donateurs

## Phase 1 - Schéma de Base de Données
- [x] Créer le modèle Donor avec informations personnelles
- [x] Créer le modèle DonationHistory pour l'historique des dons
- [x] Créer le modèle DonorPreferences pour les préférences
- [x] Créer le modèle CustomField pour les champs personnalisés
- [x] Créer le modèle Consent pour la conformité RGPD/PIPEDA

## Phase 2 - API Routes
- [x] API CRUD donateurs (GET, POST, PUT, DELETE)
- [x] API recherche avancée avec filtres
- [x] API pagination et tri
- [x] API statistiques donateurs

## Phase 3 - Interface Utilisateur
- [x] Page liste des donateurs avec tableau
- [x] Formulaire ajout/édition donateur
- [x] Page détail donateur avec historique
- [x] Composant recherche avancée
- [x] Composant filtres et segmentation

## Phase 4 - Fonctionnalités Avancées
- [ ] Import CSV/Excel
- [ ] Export données (CSV, Excel)
- [ ] Détection et gestion des doublons
- [ ] Gestion des consentements RGPD

## Phase 5 - Tests et Déploiement
- [ ] Tests unitaires API
- [ ] Tests d'intégration
- [x] Push sur GitHub
- [ ] Déploiement Railway

## Phase 6 - Données de Test
- [x] Créer script de seed avec 50 donateurs fictifs
- [x] Ajouter API route pour exécuter le seed
- [x] Push sur GitHub

## Module Formulaires Don

### Phase 1 - Schéma Base de Données
- [x] Créer le modèle DonationForm pour les formulaires
- [x] Créer le modèle FormField pour les champs personnalisés
- [x] Créer le modèle DonationSubmission pour les soumissions
- [x] Ajouter les types de formulaires (unique, récurrent, billetterie, in memoriam)

### Phase 2 - API Routes
- [x] API CRUD formulaires de don
- [x] API soumission de don
- [x] API statistiques par formulaire

### Phase 3 - Interface Administration
- [x] Page liste des formulaires
- [x] Créateur de formulaire
- [x] Configuration des montants suggérés
- [x] Personnalisation visuelle

### Phase 4 - Formulaires Publics
- [x] Page de don publique
- [x] Formulaire don unique
- [x] Formulaire don récurrent
- [x] Formulaire billetterie événement
- [x] Formulaire don in memoriam
- [x] Page de confirmation/remerciement

### Phase 5 - Tests et Déploiement
- [x] Tests des formulaires
- [x] Push sur GitHub

## Navigation - Sidebar

### Phase 1 - Composants
- [x] Créer le composant Sidebar avec menu de navigation
- [x] Créer le composant AppLayout avec sidebar intégrée
- [x] Ajouter les icônes pour chaque section

### Phase 2 - Intégration
- [x] Intégrer le layout dans les pages donateurs
- [x] Intégrer le layout dans les pages formulaires
- [x] Ajouter les liens vers les modules à venir

### Phase 3 - Déploiement
- [x] Tester le build
- [x] Push sur GitHub

## Module Analytics & Reporting

### Phase 1 - API Routes
- [x] API statistiques globales (KPIs)
- [x] API tendances temporelles (dons par période)
- [x] API répartition par segment/source
- [x] API performance des campagnes

### Phase 2 - Tableau de Bord
- [x] Page dashboard principale
- [x] Cartes KPIs (total dons, donateurs, taux conversion)
- [x] Sélecteur de période
- [x] Filtres par campagne/segment

### Phase 3 - Graphiques
- [x] Graphique évolution des dons (barres)
- [x] Graphique répartition par type (barres de progression)
- [x] Graphique top donateurs (liste classée)
- [x] Graphique tendances mensuelles

### Phase 4 - Déploiement
- [x] Tester le build
- [x] Push sur GitHub

## Module Copilote IA

### Phase 1 - API Backend
- [x] Créer l'API route pour le chat IA
- [x] Implémenter le contexte donateurs/dons
- [x] Ajouter les fonctions d'analyse de données
- [x] Créer les prompts système spécialisés

### Phase 2 - Interface Chat
- [x] Page principale du Copilote
- [x] Composant de chat avec historique
- [x] Suggestions de questions prédéfinies
- [x] Affichage des réponses avec markdown

### Phase 3 - Recommandations et Insights
- [x] Génération de recommandations automatiques
- [x] Insights sur les donateurs
- [x] Suggestions d'actions
- [x] Visualisations dans les réponses

### Phase 4 - Déploiement
- [x] Tester le build
- [x] Push sur GitHub

## Module Gestion Campagnes

### Phase 1 - Schéma Base de Données
- [x] Créer le modèle Campaign
- [x] Créer le modèle CampaignMilestone
- [x] Créer le modèle CampaignDonor (relation campagne-donateur)
- [x] Ajouter les relations avec DonationForm

### Phase 2 - API Routes
- [x] API CRUD campagnes
- [x] API statistiques par campagne
- [x] API timeline et jalons
- [x] API donateurs par campagne
### Phase 3 - Interface Utilisateur
- [x] Page liste des campagnes
- [x] Page création campagne
- [x] Page détail campagne avec progression
- [x] Composant timeline des jalons
- [x] Tableau des donateurs par campagne

### Phase 4 - Déploiement
- [x] Tester le build
- [x] Push sur GitHub

## Module Marketing Automation

### Phase 1 - Schéma Base de Données
- [x] Créer le modèle EmailTemplate
- [x] Créer le modèle EmailCampaign
- [x] Créer le modèle EmailRecipient
- [x] Créer le modèle AutomationRule (triggers)

### Phase 2 - API Routes
- [x] API CRUD templates email
- [x] API CRUD campagnes email
- [x] API envoi de campagne
- [x] API CRUD automatisations (ouvertures, clics)

### Phase 3 - Interface Utilisateur
- [ ] Page liste des campagnes email
- [ ] Éditeur de templates email
- [ ] Page création campagne avec segmentation
- [ ] Page statistiques des envois
- [ ] Configuration des automatisations

### Phase 4 - Déploiement
- [x] Tester le build
- [x] Push sur GitHub

## Intégration SendGrid

### Phase 1 - Configuration
- [x] Installer le package @sendgrid/mail
- [x] Configurer les variables d'environnement
- [x] Créer le service d'envoi d'emails

### Phase 2 - Intégration Campagnes
- [x] Connecter SendGrid aux campagnes email
- [x] Implémenter l'envoi de masse
- [ ] Ajouter le tracking des ouvertures/clics

### Phase 3 - Tests et Déploiement
- [ ] Tester l'envoi d'emails
- [ ] Push sur GitHub

## Révision Flow Campagne Email

### Phase 1 - API Backend
- [x] Créer API assistance IA pour rédaction email
- [x] Créer API envoi test email
- [x] Créer API récupération segments donateurs

### Phase 2 - Interface Wizard Multi-étapes
- [x] Étape 1: Configuration (nom, sujet, expéditeur)
- [x] Étape 2: Rédaction avec assistant IA
- [x] Étape 3: Sélection segments/donateurs
- [x] Étape 4: Prévisualisation
- [x] Étape 5: Test et envoi

### Phase 3 - Fonctionnalités
- [x] Composant éditeur email avec IA
- [x] Sélecteur de segments avec compteur
- [x] Prévisualisation email responsive
- [x] Envoi test à adresse personnalisée
- [x] Sauvegarde brouillon automatique
- [x] Page résultats campagne (existante)

### Phase 4 - Déploiement
- [x] Tester le build
- [x] Push sur GitHub
