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
- [x] Import CSV/Excel
  - [x] API import CSV
  - [x] API import Excel
  - [x] Validation des données
  - [x] Mapping des colonnes
  - [x] Gestion des erreurs
- [x] Export données (CSV, Excel)
  - [x] API export CSV
  - [x] API export Excel
  - [x] Filtres d'export
- [x] Interface utilisateur import/export
  - [x] Modal d'import avec drag & drop
  - [x] Boutons d'export dans la liste donateurs
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


## Page Liste Campagnes Email

### Fonctionnalités
- [x] Afficher toutes les campagnes (brouillons et envoyées)
- [x] Filtres par statut (Brouillon, Envoyé, Planifié)
- [x] Actions: Continuer brouillon, Voir résultats
- [x] Statistiques rapides (taux ouverture, clics)
- [x] Améliorer page détail/résultats campagne


## Liaison Campagnes P2P

- [x] Analyser la logique P2P existante
- [x] Corriger la liaison avec les campagnes
- [x] Permettre la création de collectes P2P
- [x] Ajouter API pour activer P2P sur campagnes existantes
- [x] Améliorer interface pour guider l'utilisateur


## Tracking SendGrid (Webhooks)

### Phase 1 - Base de données
- [x] Créer modèle EmailEvent pour stocker les événements
- [x] Ajouter champs de tracking sur EmailRecipient

### Phase 2 - API Webhook
- [x] Créer endpoint /api/webhooks/sendgrid
- [x] Valider la signature SendGrid
- [x] Parser les événements (open, click, bounce, etc.)
- [x] Enregistrer les événements en base

### Phase 3 - Mise à jour des statistiques
- [x] Calculer les taux d'ouverture réels
- [x] Calculer les taux de clics réels
- [x] Gérer les bounces et désabonnements

### Phase 4 - Interface
- [x] Afficher les statistiques réelles dans les résultats campagne
- [x] Ajouter graphique d'évolution des ouvertures/clics
- [x] Liste des destinataires avec statut détaillé
- [x] API pour récupérer les événements d'une campagne
- [x] Top liens cliqués

### Phase 5 - Configuration SendGrid
- [ ] Documenter la configuration du webhook dans SendGrid
- [ ] Tester avec des emails réels


## Éditeur de Templates Email (Drag & Drop)

### Phase 1 - Composants de blocs
- [x] Bloc Texte (titre, paragraphe, liste)
- [x] Bloc Image (avec upload)
- [x] Bloc Bouton (CTA)
- [x] Bloc Diviseur/Espacement
- [x] Bloc Colonnes (2-3 colonnes)
- [x] Bloc Social (icônes réseaux sociaux)
- [x] Bloc Footer (désabonnement, adresse)

### Phase 2 - Éditeur Drag & Drop
- [x] Zone de dépôt avec prévisualisation
- [x] Panneau de blocs disponibles
- [x] Réorganisation des blocs par glisser-déposer
- [x] Édition inline des contenus
- [x] Panneau de propriétés (couleurs, marges, etc.)

### Phase 3 - Fonctionnalités avancées
- [x] Sauvegarde automatique
- [ ] Historique undo/redo
- [x] Prévisualisation mobile/desktop
- [x] Export HTML compatible email
- [x] Variables de personnalisation

### Phase 4 - Gestion des templates
- [x] API CRUD templates
- [x] Page liste des templates
- [x] Templates prédéfinis (starter)
- [x] Duplication de templates


## Détection et Gestion des Doublons

### Phase 1 - API de détection
- [x] Créer algorithme de scoring de similarité
- [x] API recherche de doublons potentiels
- [x] API scan complet de la base pour doublons
- [x] Règles de détection configurables (email, nom, téléphone)

### Phase 2 - Import avec détection
- [x] Détecter les doublons pendant l'import CSV/Excel
- [x] Afficher les doublons trouvés avant import
- [x] Options: ignorer, mettre à jour, créer quand même

### Phase 3 - Interface de gestion
- [x] Page liste des doublons détectés
- [x] Comparaison côte à côte des enregistrements
- [x] Sélection des champs à conserver

### Phase 4 - Fusion des doublons
- [x] API fusion de deux donateurs
- [x] Transfert des dons et historique
- [x] Suppression du doublon après fusion
- [ ] Journal des fusions effectuées


## Gestion des Consentements RGPD

### Phase 1 - Modèle de données
- [x] Vérifier/créer le modèle Consent existant
- [x] Ajouter les types de consentement (email, téléphone, courrier, données)
- [x] Historique des modifications de consentement (ConsentHistory)
- [x] Date d'expiration des consentements

### Phase 2 - APIs
- [x] API CRUD consentements par donateur (/api/donors/[id]/consent)
- [ ] API mise à jour en masse des consentements
- [x] API export des consentements (audit) (/api/admin/consent-report)
- [x] API centre de préférences public (/api/preferences/[token])

### Phase 3 - Interface Administration
- [ ] Section consentements dans fiche donateur
- [x] Page rapport des consentements (/admin/consent)
- [x] Filtres par type de consentement
- [x] Export pour audit RGPD (CSV)

### Phase 4 - Centre de Préférences Public
- [x] Page publique de gestion des préférences (/preferences/[token])
- [x] Lien unique par donateur (token HMAC)
- [x] Formulaire de mise à jour des préférences
- [x] Confirmation des modifications

### Phase 5 - Intégration
- [ ] Vérification consentement avant envoi email
- [ ] Lien de désabonnement dans les emails
- [x] Journal des accès aux données (ConsentHistory)


## CausePilot - Assistant IA Fundraiser

### Phase 1 - API Backend
- [x] Créer l'API chat avec contexte intelligent
- [x] Intégrer le LLM pour les réponses
- [x] Ajouter le contexte des données utilisateur

### Phase 2 - Composant Chat
- [x] Créer le composant chat flottant
- [x] Design moderne avec avatar CausePilot
- [x] Historique des conversations
- [x] Suggestions de questions rapides

### Phase 3 - Intégration Dashboard
- [x] Widget CausePilot sur le tableau de bord
- [x] Conseils personnalisés basés sur les métriques
- [x] Alertes et recommandations proactives

### Phase 4 - Contexte Intelligent
- [x] Contexte adapté selon la page (campagnes, donateurs, etc.)
- [x] Suggestions d'actions pertinentes
- [x] Aide à la création de campagnes
