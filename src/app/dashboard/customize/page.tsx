"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, RotateCcw, Layout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import DashboardGrid, {
  DashboardLayoutConfig,
  WidgetConfig,
} from "@/components/dashboard/DashboardGrid";
import { renderWidgetByType } from "@/components/dashboard/widgets";
import { useOrganization } from "@/contexts/OrganizationContext";

// Layout par défaut
const DEFAULT_LAYOUT: DashboardLayoutConfig = {
  widgets: [
    { id: "stat-1", type: "STAT_TOTAL_DONATIONS", x: 0, y: 0, w: 3, h: 2 },
    { id: "stat-2", type: "STAT_DONOR_COUNT", x: 3, y: 0, w: 3, h: 2 },
    { id: "stat-3", type: "STAT_AVERAGE_DONATION", x: 6, y: 0, w: 3, h: 2 },
    { id: "stat-4", type: "STAT_MONTHLY_REVENUE", x: 9, y: 0, w: 3, h: 2 },
    { id: "chart-1", type: "CHART_DONATIONS_OVER_TIME", x: 0, y: 2, w: 8, h: 4 },
    { id: "chart-2", type: "CHART_DONATIONS_BY_TYPE", x: 8, y: 2, w: 4, h: 4 },
    { id: "list-1", type: "LIST_TOP_DONORS", x: 0, y: 6, w: 6, h: 4 },
    { id: "list-2", type: "LIST_RECENT_DONATIONS", x: 6, y: 6, w: 6, h: 4 },
  ],
};

// Présets de layouts
const LAYOUT_PRESETS = [
  {
    id: "default",
    name: "Standard",
    description: "Vue équilibrée avec statistiques et graphiques",
    layout: DEFAULT_LAYOUT,
  },
  {
    id: "analytics",
    name: "Analytique",
    description: "Focus sur les graphiques et tendances",
    layout: {
      widgets: [
        { id: "stat-1", type: "STAT_TOTAL_DONATIONS" as const, x: 0, y: 0, w: 4, h: 2 },
        { id: "stat-2", type: "STAT_DONOR_COUNT" as const, x: 4, y: 0, w: 4, h: 2 },
        { id: "stat-3", type: "STAT_AVERAGE_DONATION" as const, x: 8, y: 0, w: 4, h: 2 },
        { id: "chart-1", type: "CHART_DONATIONS_OVER_TIME" as const, x: 0, y: 2, w: 12, h: 4 },
        { id: "chart-2", type: "CHART_DONATIONS_BY_TYPE" as const, x: 0, y: 6, w: 6, h: 4 },
        { id: "chart-3", type: "CHART_DONOR_SEGMENTS" as const, x: 6, y: 6, w: 6, h: 4 },
      ],
    },
  },
  {
    id: "operations",
    name: "Opérationnel",
    description: "Focus sur les listes et actions",
    layout: {
      widgets: [
        { id: "stat-1", type: "STAT_TOTAL_DONATIONS" as const, x: 0, y: 0, w: 3, h: 2 },
        { id: "stat-2", type: "STAT_DONOR_COUNT" as const, x: 3, y: 0, w: 3, h: 2 },
        { id: "quick", type: "QUICK_ACTIONS" as const, x: 6, y: 0, w: 3, h: 3 },
        { id: "goals", type: "ALERT_GOAL_PROGRESS" as const, x: 9, y: 0, w: 3, h: 3 },
        { id: "list-1", type: "LIST_RECENT_DONATIONS" as const, x: 0, y: 2, w: 6, h: 4 },
        { id: "list-2", type: "LIST_AT_RISK_DONORS" as const, x: 6, y: 3, w: 6, h: 4 },
        { id: "list-3", type: "LIST_ACTIVE_CAMPAIGNS" as const, x: 0, y: 6, w: 6, h: 4 },
        { id: "list-4", type: "LIST_TOP_DONORS" as const, x: 6, y: 7, w: 6, h: 4 },
      ],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Vue simplifiée avec l'essentiel",
    layout: {
      widgets: [
        { id: "stat-1", type: "STAT_TOTAL_DONATIONS" as const, x: 0, y: 0, w: 4, h: 2 },
        { id: "stat-2", type: "STAT_DONOR_COUNT" as const, x: 4, y: 0, w: 4, h: 2 },
        { id: "stat-3", type: "STAT_MONTHLY_REVENUE" as const, x: 8, y: 0, w: 4, h: 2 },
        { id: "chart-1", type: "CHART_DONATIONS_OVER_TIME" as const, x: 0, y: 2, w: 12, h: 4 },
      ],
    },
  },
];

interface SavedLayout {
  id: string;
  name: string;
  layout: DashboardLayoutConfig;
  isDefault: boolean;
}

export default function CustomizeDashboardPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [layout, setLayout] = useState<DashboardLayoutConfig>(DEFAULT_LAYOUT);
  const [originalLayout, setOriginalLayout] = useState<DashboardLayoutConfig>(DEFAULT_LAYOUT);
  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [savedLayoutId, setSavedLayoutId] = useState<string | null>(null);

  // Charger le layout depuis la base de données
  useEffect(() => {
    const loadLayout = async () => {
      setLoading(true);
      try {
        // Utiliser userId=1 par défaut (à remplacer par l'authentification réelle)
        const userId = 1;
        const orgParam = currentOrganization ? `&organizationId=${currentOrganization.id}` : "";
        
        const response = await fetch(`/api/dashboard-layouts?userId=${userId}${orgParam}`);
        if (response.ok) {
          const layouts: SavedLayout[] = await response.json();
          
          // Trouver le layout par défaut ou le premier
          const defaultLayout = layouts.find(l => l.isDefault) || layouts[0];
          
          if (defaultLayout && defaultLayout.layout) {
            setLayout(defaultLayout.layout);
            setOriginalLayout(defaultLayout.layout);
            setSavedLayoutId(defaultLayout.id);
          }
        }
      } catch (error) {
        console.error("Error loading layout:", error);
        // Fallback sur localStorage
        const savedLayout = localStorage.getItem("dashboardLayout");
        if (savedLayout) {
          try {
            const parsed = JSON.parse(savedLayout);
            setLayout(parsed);
            setOriginalLayout(parsed);
          } catch (e) {
            console.error("Error parsing saved layout:", e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadLayout();
  }, [currentOrganization]);

  // Gérer le changement de layout
  const handleLayoutChange = useCallback((newLayout: DashboardLayoutConfig) => {
    setLayout(newLayout);
  }, []);

  // Appliquer un préset
  const handlePresetChange = (presetId: string) => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setLayout(preset.layout);
      setSelectedPreset(presetId);
      toast.success(`Préset "${preset.name}" appliqué`);
    }
  };

  // Sauvegarder le layout
  const handleSave = async () => {
    setSaving(true);
    try {
      const userId = 1; // À remplacer par l'authentification réelle
      
      if (savedLayoutId && savedLayoutId !== "default") {
        // Mettre à jour le layout existant
        const response = await fetch("/api/dashboard-layouts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: savedLayoutId,
            layout: layout,
            name: "Mon Dashboard",
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour");
        }
      } else {
        // Créer un nouveau layout
        const response = await fetch("/api/dashboard-layouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layout: layout,
            userId: userId,
            organizationId: currentOrganization?.id,
            name: "Mon Dashboard",
            isDefault: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la création");
        }

        const newLayout = await response.json();
        setSavedLayoutId(newLayout.id);
      }

      // Sauvegarder aussi dans localStorage comme backup
      localStorage.setItem("dashboardLayout", JSON.stringify(layout));

      setOriginalLayout(layout);
      toast.success("Dashboard personnalisé sauvegardé");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving layout:", error);
      // Fallback sur localStorage
      localStorage.setItem("dashboardLayout", JSON.stringify(layout));
      toast.success("Dashboard sauvegardé localement");
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    setLayout(originalLayout);
    router.push("/dashboard");
  };

  // Réinitialiser au layout par défaut
  const handleReset = () => {
    setLayout(DEFAULT_LAYOUT);
    setSelectedPreset("");
    toast.info("Layout réinitialisé");
  };

  // Rendre un widget
  const renderWidget = useCallback((widget: WidgetConfig) => {
    return renderWidgetByType(widget);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8 ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement du dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layout className="h-6 w-6 text-primary" />
                Personnaliser le Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Glissez et redimensionnez les widgets pour créer votre vue personnalisée
                {currentOrganization && (
                  <span className="ml-2 text-purple-400">
                    • {currentOrganization.name}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Présets */}
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Choisir un préset" />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div>
                      <p className="font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>

            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">
            <strong>Mode édition activé :</strong> Cliquez sur &quot;Ajouter un widget&quot; pour
            ajouter de nouveaux éléments. Glissez les widgets par leur poignée pour
            les déplacer. Redimensionnez-les en tirant sur les bords.
          </p>
        </div>

        {/* Grid */}
        <DashboardGrid
          layout={layout}
          onLayoutChange={handleLayoutChange}
          renderWidget={renderWidget}
          isEditing={isEditing}
          onEditToggle={setIsEditing}
          onSave={handleSave}
        />
      </main>
    </div>
  );
}
