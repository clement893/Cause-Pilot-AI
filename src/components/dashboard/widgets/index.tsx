"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  AlertTriangle,
  Zap,
  FileText,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WidgetConfig, WidgetType } from "../DashboardGrid";

interface WidgetProps {
  widget: WidgetConfig;
  data?: Record<string, unknown>;
}

// Widget Statistique générique
function StatWidget({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = "primary",
}: {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/20 text-primary",
    green: "bg-success/20 text-success-light",
    blue: "bg-info/20 text-info-light",
    purple: "bg-brand/20 text-brand-light",
    amber: "bg-amber-500/20 text-warning",
  };

  return (
    <div className="h-full p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {change >= 0 ? (
            <TrendingUp className="h-4 w-4 text-success-light" />
          ) : (
            <TrendingDown className="h-4 w-4 text-error-light" />
          )}
          <span
            className={`text-sm ${
              change >= 0 ? "text-success-light" : "text-error-light"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
          {changeLabel && (
            <span className="text-sm text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Widget Total Donations
export function TotalDonationsWidget({ data }: { data?: Record<string, unknown> }) {
  const total = (data?.totalDonations as number) || 225705;
  const change = (data?.change as number) || 12.5;

  return (
    <StatWidget
      title="Total Collecté"
      value={`${total.toLocaleString("fr-CA")} $`}
      change={change}
      changeLabel="vs mois dernier"
      icon={DollarSign}
      color="green"
    />
  );
}

// Widget Nombre de Donateurs
export function DonorCountWidget({ data }: { data?: Record<string, unknown> }) {
  const count = (data?.donorCount as number) || 38;
  const newDonors = (data?.newDonors as number) || 5;

  return (
    <div className="h-full p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Donateurs Actifs</p>
          <p className="text-2xl font-bold text-white mt-1">{count}</p>
        </div>
        <div className="p-2 rounded-lg bg-info/20 text-info-light">
          <Users className="h-5 w-5" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        +{newDonors} ce mois
      </p>
    </div>
  );
}

// Widget Don Moyen
export function AverageDonationWidget({ data }: { data?: Record<string, unknown> }) {
  const average = (data?.averageDonation as number) || 504;
  const max = (data?.maxDonation as number) || 1006;

  return (
    <div className="h-full p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Don Moyen</p>
          <p className="text-2xl font-bold text-white mt-1">{average} $</p>
        </div>
        <div className="p-2 rounded-lg bg-brand/20 text-brand-light">
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">Max: {max} $</p>
    </div>
  );
}

// Widget Revenus Mensuels
export function MonthlyRevenueWidget({ data }: { data?: Record<string, unknown> }) {
  const revenue = (data?.monthlyRevenue as number) || 15420;
  const change = (data?.change as number) || -8.3;

  return (
    <StatWidget
      title="Revenus ce mois"
      value={`${revenue.toLocaleString("fr-CA")} $`}
      change={change}
      changeLabel="vs mois dernier"
      icon={Calendar}
      color="amber"
    />
  );
}

// Widget Graphique Evolution (placeholder)
export function DonationsOverTimeWidget() {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const values = [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45];
  const maxValue = Math.max(...values);

  return (
    <div className="h-full p-4 flex flex-col">
      <h3 className="text-sm font-medium text-white mb-4">Évolution des Dons</h3>
      <div className="flex-1 flex items-end gap-1">
        {values.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-primary/60 rounded-t transition-all hover:bg-primary"
              style={{ height: `${(value / maxValue) * 100}%`, minHeight: 4 }}
            />
            <span className="text-[10px] text-muted-foreground">
              {months[index].slice(0, 1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget Répartition par Type
export function DonationsByTypeWidget() {
  const data = [
    { label: "Individuel", value: 62, color: "bg-info" },
    { label: "Entreprise", value: 18, color: "bg-brand" },
    { label: "Fondation", value: 20, color: "bg-success" },
  ];

  return (
    <div className="h-full p-4 flex flex-col">
      <h3 className="text-sm font-medium text-white mb-4">Répartition par Type</h3>
      <div className="flex-1 flex flex-col justify-center gap-3">
        {data.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-white font-medium">{item.value}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget Segments Donateurs
export function DonorSegmentsWidget() {
  const segments = [
    { name: "Réguliers", count: 15, color: "bg-success" },
    { name: "Occasionnels", count: 12, color: "bg-info" },
    { name: "Nouveaux", count: 8, color: "bg-brand" },
    { name: "À risque", count: 3, color: "bg-error" },
  ];

  return (
    <div className="h-full p-4 flex flex-col">
      <h3 className="text-sm font-medium text-white mb-4">Segments Donateurs</h3>
      <div className="flex-1 grid grid-cols-2 gap-3">
        {segments.map((segment) => (
          <div
            key={segment.name}
            className="p-3 rounded-lg bg-muted/50 flex flex-col"
          >
            <div className={`w-3 h-3 rounded-full ${segment.color} mb-2`} />
            <p className="text-lg font-bold text-white">{segment.count}</p>
            <p className="text-xs text-muted-foreground">{segment.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget Top Donateurs
export function TopDonorsWidget() {
  const donors = [
    { name: "Manon Côté", city: "Gatineau", amount: 9352, donations: 13 },
    { name: "Stéphanie Tremblay", city: "Saguenay", amount: 9046, donations: 15 },
    { name: "Chantal Girard", city: "Montréal", amount: 8338, donations: 13 },
    { name: "Anne Tremblay", city: "Terrebonne", amount: 8121, donations: 14 },
    { name: "Paul Poirier", city: "Terrebonne", amount: 7927, donations: 15 },
  ];

  return (
    <div className="h-full p-4 flex flex-col">
      <h3 className="text-sm font-medium text-white mb-4">Top Donateurs</h3>
      <div className="flex-1 space-y-2 overflow-auto">
        {donors.map((donor, index) => (
          <div
            key={donor.name}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0
                  ? "bg-amber-500 text-black"
                  : index === 1
                  ? "bg-gray-400 text-black"
                  : index === 2
                  ? "bg-amber-700 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {donor.name}
              </p>
              <p className="text-xs text-muted-foreground">{donor.city}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {donor.amount.toLocaleString("fr-CA")} $
              </p>
              <p className="text-xs text-muted-foreground">
                {donor.donations} dons
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget Dons Récents
export function RecentDonationsWidget() {
  const donations = [
    { donor: "Marie Dupont", amount: 250, date: "Il y a 2h" },
    { donor: "Jean Martin", amount: 100, date: "Il y a 5h" },
    { donor: "Sophie Bernard", amount: 500, date: "Hier" },
    { donor: "Pierre Lefebvre", amount: 75, date: "Hier" },
  ];

  return (
    <div className="h-full p-4 flex flex-col">
      <h3 className="text-sm font-medium text-white mb-4">Dons Récents</h3>
      <div className="flex-1 space-y-2 overflow-auto">
        {donations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun don récent
          </p>
        ) : (
          donations.map((donation, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium text-white">{donation.donor}</p>
                <p className="text-xs text-muted-foreground">{donation.date}</p>
              </div>
              <p className="text-sm font-medium text-success-light">
                +{donation.amount} $
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Widget Campagnes Actives
export function ActiveCampaignsWidget() {
  const campaigns = [
    { name: "Campagne de Noël", progress: 75, goal: 50000, raised: 37500 },
    { name: "Urgence Humanitaire", progress: 45, goal: 25000, raised: 11250 },
    { name: "Bourses Étudiantes", progress: 90, goal: 15000, raised: 13500 },
  ];

  return (
    <div className="h-full p-4 flex flex-col">
      <h3 className="text-sm font-medium text-white mb-4">Campagnes Actives</h3>
      <div className="flex-1 space-y-4 overflow-auto">
        {campaigns.map((campaign) => (
          <div key={campaign.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">{campaign.name}</p>
              <span className="text-xs text-muted-foreground">
                {campaign.progress}%
              </span>
            </div>
            <Progress value={campaign.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {campaign.raised.toLocaleString("fr-CA")} $ /{" "}
              {campaign.goal.toLocaleString("fr-CA")} $
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget Donateurs à Risque
export function AtRiskDonorsWidget() {
  const donors = [
    { name: "Robert Gagnon", lastDonation: "Il y a 8 mois", risk: 85 },
    { name: "Claire Bouchard", lastDonation: "Il y a 6 mois", risk: 72 },
    { name: "Michel Roy", lastDonation: "Il y a 5 mois", risk: 65 },
  ];

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-medium text-white">Donateurs à Risque</h3>
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {donors.map((donor) => (
          <div
            key={donor.name}
            className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <div>
              <p className="text-sm font-medium text-white">{donor.name}</p>
              <p className="text-xs text-muted-foreground">
                {donor.lastDonation}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-warning">{donor.risk}%</p>
              <p className="text-xs text-muted-foreground">risque</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget Progression Objectifs
export function GoalProgressWidget() {
  const goals = [
    { name: "Objectif annuel", current: 225705, target: 300000 },
    { name: "Nouveaux donateurs", current: 38, target: 50 },
  ];

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-white">Objectifs</h3>
      </div>
      <div className="flex-1 space-y-4">
        {goals.map((goal) => {
          const progress = Math.round((goal.current / goal.target) * 100);
          return (
            <div key={goal.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{goal.name}</p>
                <span className="text-sm font-medium text-white">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {typeof goal.current === "number" && goal.current > 1000
                  ? `${goal.current.toLocaleString("fr-CA")} $`
                  : goal.current}{" "}
                /{" "}
                {typeof goal.target === "number" && goal.target > 1000
                  ? `${goal.target.toLocaleString("fr-CA")} $`
                  : goal.target}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Widget Actions Rapides
export function QuickActionsWidget() {
  const actions = [
    { label: "Nouveau don", icon: DollarSign, href: "/donors/new" },
    { label: "Ajouter donateur", icon: Users, href: "/donors/new" },
    { label: "Créer campagne", icon: Target, href: "/campaigns/new" },
    { label: "Voir rapports", icon: FileText, href: "/reports" },
  ];

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-white">Actions Rapides</h3>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => (window.location.href = action.href)}
          >
            <action.icon className="h-4 w-4" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

// Widget Notes
export function NotesWidget() {
  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-white">Notes</h3>
      </div>
      <textarea
        className="flex-1 w-full bg-muted/50 rounded-lg p-3 text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Écrivez vos notes ici..."
      />
    </div>
  );
}

// Mapper les types de widgets aux composants
export function renderWidgetByType(widget: WidgetConfig): React.ReactNode {
  switch (widget.type) {
    case "STAT_TOTAL_DONATIONS":
      return <TotalDonationsWidget />;
    case "STAT_DONOR_COUNT":
      return <DonorCountWidget />;
    case "STAT_AVERAGE_DONATION":
      return <AverageDonationWidget />;
    case "STAT_MONTHLY_REVENUE":
      return <MonthlyRevenueWidget />;
    case "CHART_DONATIONS_OVER_TIME":
      return <DonationsOverTimeWidget />;
    case "CHART_DONATIONS_BY_TYPE":
      return <DonationsByTypeWidget />;
    case "CHART_DONOR_SEGMENTS":
      return <DonorSegmentsWidget />;
    case "LIST_TOP_DONORS":
      return <TopDonorsWidget />;
    case "LIST_RECENT_DONATIONS":
      return <RecentDonationsWidget />;
    case "LIST_ACTIVE_CAMPAIGNS":
      return <ActiveCampaignsWidget />;
    case "LIST_AT_RISK_DONORS":
      return <AtRiskDonorsWidget />;
    case "ALERT_GOAL_PROGRESS":
      return <GoalProgressWidget />;
    case "QUICK_ACTIONS":
      return <QuickActionsWidget />;
    case "NOTES":
      return <NotesWidget />;
    default:
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Widget non disponible
        </div>
      );
  }
}
