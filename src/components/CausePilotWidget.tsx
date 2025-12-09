"use client";

import { useState, useEffect } from "react";
import { Sparkles, Lightbulb, TrendingUp, ArrowRight, RefreshCw } from "lucide-react";

interface CausePilotWidgetProps {
  stats?: {
    totalDonors?: number;
    newDonorsThisMonth?: number;
    donorGrowth?: number;
    totalDonations?: number;
    donationsThisMonth?: number;
    donationGrowth?: number;
    activeCampaigns?: number;
    averageDonation?: number;
  };
}

interface Tip {
  title: string;
  description: string;
  action: string;
  actionUrl: string;
  priority: "high" | "medium" | "low";
}

export default function CausePilotWidget({ stats }: CausePilotWidgetProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Générer des conseils personnalisés basés sur les stats
    const generatedTips: Tip[] = [];

    if (stats) {
      // Conseil sur la croissance des donateurs
      if (stats.donorGrowth !== undefined && stats.donorGrowth < 5) {
        generatedTips.push({
          title: "Augmentez votre base de donateurs",
          description: `Votre croissance de donateurs est de ${stats.donorGrowth}% ce mois-ci. Lancez une campagne de parrainage pour booster vos acquisitions.`,
          action: "Créer une campagne",
          actionUrl: "/campaigns/new",
          priority: "high",
        });
      }

      // Conseil sur les campagnes actives
      if (stats.activeCampaigns !== undefined && stats.activeCampaigns === 0) {
        generatedTips.push({
          title: "Lancez une campagne !",
          description: "Vous n'avez aucune campagne active. C'est le moment idéal pour engager vos donateurs avec une nouvelle initiative.",
          action: "Créer une campagne",
          actionUrl: "/campaigns/new",
          priority: "high",
        });
      }

      // Conseil sur le don moyen
      if (stats.averageDonation !== undefined && stats.averageDonation < 50) {
        generatedTips.push({
          title: "Augmentez le don moyen",
          description: `Votre don moyen est de ${stats.averageDonation?.toFixed(2)}$. Proposez des montants suggérés plus élevés dans vos formulaires.`,
          action: "Modifier les formulaires",
          actionUrl: "/forms",
          priority: "medium",
        });
      }

      // Conseil sur les emails
      if (stats.totalDonors !== undefined && stats.totalDonors > 100) {
        generatedTips.push({
          title: "Segmentez vos communications",
          description: `Avec ${stats.totalDonors} donateurs, personnalisez vos emails par segment pour de meilleurs taux d'engagement.`,
          action: "Créer une campagne email",
          actionUrl: "/marketing/campaigns/new",
          priority: "medium",
        });
      }

      // Conseil sur les nouveaux donateurs
      if (stats.newDonorsThisMonth !== undefined && stats.newDonorsThisMonth > 0) {
        generatedTips.push({
          title: "Accueillez vos nouveaux donateurs",
          description: `${stats.newDonorsThisMonth} nouveaux donateurs ce mois-ci ! Envoyez-leur un email de bienvenue personnalisé.`,
          action: "Envoyer un email",
          actionUrl: "/marketing/campaigns/new",
          priority: "low",
        });
      }

      // Conseil P2P
      generatedTips.push({
        title: "Explorez le P2P Fundraising",
        description: "Le peer-to-peer fundraising peut multiplier votre portée par 10. Vos donateurs deviennent vos ambassadeurs !",
        action: "Découvrir le P2P",
        actionUrl: "/p2p",
        priority: "low",
      });
    }

    // Conseils par défaut si pas de stats
    if (generatedTips.length === 0) {
      generatedTips.push(
        {
          title: "Bienvenue sur CausePilot !",
          description: "Je suis votre assistant IA pour maximiser vos collectes de fonds. Explorez le tableau de bord pour commencer.",
          action: "Explorer",
          actionUrl: "/dashboard",
          priority: "low",
        },
        {
          title: "Créez votre première campagne",
          description: "Une campagne bien structurée peut augmenter vos dons de 40%. Commencez dès maintenant !",
          action: "Créer une campagne",
          actionUrl: "/campaigns/new",
          priority: "medium",
        }
      );
    }

    // Trier par priorité
    generatedTips.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setTips(generatedTips);
    setIsLoading(false);
  }, [stats]);

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const currentTip = tips[currentTipIndex];

  if (isLoading || !currentTip) {
    return (
      <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-2xl p-6">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const priorityColors = {
    high: "from-red-500/20 to-orange-500/20 border-red-500/30",
    medium: "from-pink-500/10 to-purple-600/10 border-pink-500/20",
    low: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
  };

  return (
    <div className={`bg-gradient-to-r ${priorityColors[currentTip.priority]} border rounded-2xl p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              CausePilot
              {currentTip.priority === "high" && (
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                  Priorité haute
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400">Conseil personnalisé</p>
          </div>
        </div>
        {tips.length > 1 && (
          <button
            onClick={nextTip}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Conseil suivant"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <h4 className="font-semibold text-white">{currentTip.title}</h4>
        </div>
        <p className="text-sm text-gray-300">{currentTip.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <a
          href={currentTip.actionUrl}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
        >
          {currentTip.action}
          <ArrowRight className="w-4 h-4" />
        </a>
        <div className="flex items-center gap-1">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTipIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentTipIndex ? "bg-pink-500" : "bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
