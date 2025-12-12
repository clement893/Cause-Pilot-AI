import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-surface-primary via-brand/10 to-surface-primary -z-10" />
      
      {/* Header */}
      <header className="container py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="sidebar-logo-icon">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-foreground font-bold text-xl">Cause Pilot AI</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-text-secondary hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#modules" className="text-text-secondary hover:text-foreground transition-colors">
              Modules
            </a>
            <Link href="/donors" className="btn-primary">
              Accéder à l&apos;app
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 bg-brand-subtle border border-brand/30 rounded-full">
            <span className="text-brand-light text-sm font-medium">
              🚀 Plateforme de gestion philanthropique avec IA
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Nucleus Cause{" "}
            <span className="text-gradient">
              Pilot AI
            </span>
          </h1>
          
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            La plateforme unifiée pour gérer vos donateurs, automatiser vos campagnes 
            et optimiser votre collecte de fonds avec l&apos;intelligence artificielle.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/donors" className="btn-gradient btn-xl shadow-brand-lg hover:scale-105 transition-transform">
              Base Donateurs
            </Link>
            <button className="btn-outline btn-xl">
              Voir la démo
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="card-glass text-center p-6">
            <div className="text-4xl font-bold text-foreground mb-2">99.9%</div>
            <div className="text-text-secondary">Disponibilité garantie</div>
          </div>
          <div className="card-glass text-center p-6">
            <div className="text-4xl font-bold text-foreground mb-2">+25%</div>
            <div className="text-text-secondary">Engagement donateurs</div>
          </div>
          <div className="card-glass text-center p-6">
            <div className="text-4xl font-bold text-foreground mb-2">95%</div>
            <div className="text-text-secondary">Pertinence IA</div>
          </div>
        </div>

        {/* Modules Section */}
        <section id="modules" className="mt-32">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            Modules de la plateforme
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Une suite complète d&apos;outils pour gérer votre organisation philanthropique
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/donors" className="card-glass-interactive p-6 group">
              <div className="card-feature-icon-purple group-hover:bg-brand/30 transition-colors">
                <svg className="w-6 h-6 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Base Donateurs</h3>
              <p className="text-text-secondary text-sm">
                Gestion centralisée des profils et historique des dons
              </p>
              <span className="inline-block mt-3 text-brand-light text-sm font-medium">
                Disponible →
              </span>
            </Link>
            
            <Link href="/forms" className="card-glass-interactive p-6 group">
              <div className="card-feature-icon-pink group-hover:bg-accent/30 transition-colors">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Formulaires Don</h3>
              <p className="text-text-secondary text-sm">
                Création de formulaires personnalisés et paiements
              </p>
              <span className="inline-block mt-3 text-accent text-sm font-medium">
                Disponible →
              </span>
            </Link>
            
            <Link href="/marketing" className="card-glass-interactive p-6 group">
              <div className="card-feature-icon-blue group-hover:bg-info/30 transition-colors">
                <svg className="w-6 h-6 text-info-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Marketing Auto</h3>
              <p className="text-text-secondary text-sm">
                Campagnes email et workflows automatisés
              </p>
              <span className="inline-block mt-3 text-info-light text-sm font-medium">
                Disponible →
              </span>
            </Link>
            
            <Link href="/analytics" className="card-glass-interactive p-6 group">
              <div className="card-feature-icon-green group-hover:bg-success/30 transition-colors">
                <svg className="w-6 h-6 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Analytics</h3>
              <p className="text-text-secondary text-sm">
                Tableaux de bord et métriques en temps réel
              </p>
              <span className="inline-block mt-3 text-success-light text-sm font-medium">
                Disponible →
              </span>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mt-32">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Pourquoi Cause Pilot AI?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-feature">
              <div className="card-feature-icon-purple">
                <svg className="w-6 h-6 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Performance</h3>
              <p className="text-text-secondary">
                Recherche en moins de 3 secondes, export de 10 000 donateurs en 30 secondes.
              </p>
            </div>
            
            <div className="card-feature">
              <div className="card-feature-icon-pink">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Conformité</h3>
              <p className="text-text-secondary">
                RGPD/PIPEDA intégré, PCI DSS pour les paiements, chiffrement AES-256.
              </p>
            </div>
            
            <div className="card-feature">
              <div className="card-feature-icon-blue">
                <svg className="w-6 h-6 text-info-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Copilote IA</h3>
              <p className="text-text-secondary">
                Assistant intelligent avec 95% de pertinence pour vos questions en langage naturel.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container py-12 border-t border-border mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sidebar-logo-icon">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-text-secondary">© 2024 Cause Pilot AI. Tous droits réservés.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-text-secondary hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="text-text-secondary hover:text-foreground transition-colors">Conditions</a>
            <a href="#" className="text-text-secondary hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
