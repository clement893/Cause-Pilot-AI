"use client";

import { DonorStats } from "@/types/donor";
import { Card } from "@/components/ui";

interface StatsCardsProps {
  stats: DonorStats | null;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-surface-primary border-border">
            <div className="h-4 bg-surface-tertiary rounded w-1/2 mb-2" />
            <div className="h-8 bg-surface-tertiary rounded w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Donateurs",
      value: stats.overview.totalDonors.toLocaleString("fr-CA"),
      change: stats.overview.growthRate,
      changeLabel: "vs mois dernier",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "indigo",
    },
    {
      title: "Donateurs Actifs",
      value: stats.overview.activeDonors.toLocaleString("fr-CA"),
      subtitle: `${Math.round((stats.overview.activeDonors / stats.overview.totalDonors) * 100) || 0}% du total`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "green",
    },
    {
      title: "Total Collecté",
      value: new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(stats.donations.totalAmount),
      subtitle: `Moy. ${new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(stats.donations.averageDonation)} / don`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "emerald",
    },
    {
      title: "Nouveaux ce mois",
      value: stats.overview.newDonorsThisMonth.toLocaleString("fr-CA"),
      change: stats.overview.growthRate,
      changeLabel: "vs mois dernier",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: "blue",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    indigo: { bg: "bg-indigo-900/50", text: "text-indigo-400", icon: "text-indigo-400" },
    green: { bg: "bg-success/20/50", text: "text-success-light", icon: "text-success-light" },
    emerald: { bg: "bg-emerald-900/50", text: "text-success-light", icon: "text-success-light" },
    blue: { bg: "bg-info/20/50", text: "text-info-light", icon: "text-info-light" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        return (
          <Card key={index} className="relative overflow-hidden bg-surface-primary border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
                {card.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{card.subtitle}</p>
                )}
                {card.change !== undefined && (
                  <div className="mt-2 flex items-center text-sm">
                    {card.change >= 0 ? (
                      <svg className="w-4 h-4 text-success-light mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-error-light mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    <span className={card.change >= 0 ? "text-success-light" : "text-error-light"}>
                      {card.change >= 0 ? "+" : ""}{card.change}%
                    </span>
                    <span className="text-text-tertiary ml-1">{card.changeLabel}</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <div className={colors.icon}>{card.icon}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
