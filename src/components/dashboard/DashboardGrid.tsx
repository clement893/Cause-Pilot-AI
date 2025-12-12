"use client";

import { useState, useCallback, useMemo } from "react";
import GridLayout from "react-grid-layout";

// Type défini localement car @types/react-grid-layout n'est pas compatible avec v2
interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Edit2,
  Plus,
  Save,
  X,
  GripVertical,
  Trash2,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";

// Types de widgets disponibles
export type WidgetType =
  | "STAT_TOTAL_DONATIONS"
  | "STAT_DONOR_COUNT"
  | "STAT_AVERAGE_DONATION"
  | "STAT_MONTHLY_REVENUE"
  | "STAT_CONVERSION_RATE"
  | "STAT_RETENTION_RATE"
  | "CHART_DONATIONS_OVER_TIME"
  | "CHART_DONATIONS_BY_TYPE"
  | "CHART_DONATIONS_BY_CAMPAIGN"
  | "CHART_DONOR_SEGMENTS"
  | "LIST_TOP_DONORS"
  | "LIST_RECENT_DONATIONS"
  | "LIST_ACTIVE_CAMPAIGNS"
  | "LIST_AT_RISK_DONORS"
  | "ALERT_CHURN_RISK"
  | "ALERT_GOAL_PROGRESS"
  | "QUICK_ACTIONS"
  | "NOTES";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  config?: Record<string, unknown>;
}

export interface DashboardLayoutConfig {
  widgets: Array<WidgetConfig & { x: number; y: number; w: number; h: number }>;
}

interface DashboardGridProps {
  layout: DashboardLayoutConfig;
  onLayoutChange: (layout: DashboardLayoutConfig) => void;
  renderWidget: (widget: WidgetConfig) => React.ReactNode;
  isEditing?: boolean;
  onEditToggle?: (editing: boolean) => void;
  onSave?: () => void;
  columns?: number;
  rowHeight?: number;
}

// Catalogue des widgets disponibles
const WIDGET_CATALOG: Array<{
  type: WidgetType;
  title: string;
  description: string;
  category: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
}> = [
  {
    type: "STAT_TOTAL_DONATIONS",
    title: "Total Collecté",
    description: "Affiche le montant total des dons",
    category: "Statistiques",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    type: "STAT_DONOR_COUNT",
    title: "Nombre de Donateurs",
    description: "Affiche le nombre total de donateurs",
    category: "Statistiques",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    type: "STAT_AVERAGE_DONATION",
    title: "Don Moyen",
    description: "Affiche le montant moyen des dons",
    category: "Statistiques",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    type: "STAT_MONTHLY_REVENUE",
    title: "Revenus Mensuels",
    description: "Affiche les revenus du mois en cours",
    category: "Statistiques",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    type: "CHART_DONATIONS_OVER_TIME",
    title: "Évolution des Dons",
    description: "Graphique de l'évolution des dons dans le temps",
    category: "Graphiques",
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    type: "CHART_DONATIONS_BY_TYPE",
    title: "Répartition par Type",
    description: "Graphique de répartition des dons par type",
    category: "Graphiques",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
  },
  {
    type: "CHART_DONOR_SEGMENTS",
    title: "Segments Donateurs",
    description: "Répartition des donateurs par segment",
    category: "Graphiques",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
  },
  {
    type: "LIST_TOP_DONORS",
    title: "Top Donateurs",
    description: "Liste des meilleurs donateurs",
    category: "Listes",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    type: "LIST_RECENT_DONATIONS",
    title: "Dons Récents",
    description: "Liste des derniers dons reçus",
    category: "Listes",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    type: "LIST_ACTIVE_CAMPAIGNS",
    title: "Campagnes Actives",
    description: "Liste des campagnes en cours",
    category: "Listes",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    type: "LIST_AT_RISK_DONORS",
    title: "Donateurs à Risque",
    description: "Donateurs avec un risque de churn élevé",
    category: "Alertes",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    type: "ALERT_GOAL_PROGRESS",
    title: "Progression Objectifs",
    description: "Progression vers les objectifs de collecte",
    category: "Alertes",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  {
    type: "QUICK_ACTIONS",
    title: "Actions Rapides",
    description: "Raccourcis vers les actions fréquentes",
    category: "Outils",
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
  },
  {
    type: "NOTES",
    title: "Notes",
    description: "Zone de notes personnelles",
    category: "Outils",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
];

export default function DashboardGrid({
  layout,
  onLayoutChange,
  renderWidget,
  isEditing = false,
  onEditToggle,
  onSave,
  columns = 12,
  rowHeight = 100,
}: DashboardGridProps) {
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  // Convertir le layout en format react-grid-layout
  const gridLayout = useMemo(() => {
    return layout.widgets.map((widget) => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: WIDGET_CATALOG.find((w) => w.type === widget.type)?.minSize.w || 2,
      minH: WIDGET_CATALOG.find((w) => w.type === widget.type)?.minSize.h || 2,
      static: !isEditing,
    }));
  }, [layout.widgets, isEditing]);

  // Gérer le changement de layout
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = useCallback(
    (newLayout: any) => {
      const layoutItems = newLayout as GridLayoutItem[];
      const updatedWidgets = layout.widgets.map((widget) => {
        const layoutItem = layoutItems.find((l) => l.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          };
        }
        return widget;
      });

      onLayoutChange({ widgets: updatedWidgets });
    },
    [layout.widgets, onLayoutChange]
  );

  // Ajouter un widget
  const handleAddWidget = useCallback(
    (widgetType: WidgetType) => {
      const catalogItem = WIDGET_CATALOG.find((w) => w.type === widgetType);
      if (!catalogItem) return;

      // Trouver la position Y la plus basse
      const maxY = layout.widgets.reduce(
        (max, w) => Math.max(max, w.y + w.h),
        0
      );

      const newWidget = {
        id: `widget-${Date.now()}`,
        type: widgetType,
        title: catalogItem.title,
        x: 0,
        y: maxY,
        w: catalogItem.defaultSize.w,
        h: catalogItem.defaultSize.h,
      };

      onLayoutChange({
        widgets: [...layout.widgets, newWidget],
      });

      setIsAddWidgetOpen(false);
      toast.success(`Widget "${catalogItem.title}" ajouté`);
    },
    [layout.widgets, onLayoutChange]
  );

  // Supprimer un widget
  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      onLayoutChange({
        widgets: layout.widgets.filter((w) => w.id !== widgetId),
      });
      toast.success("Widget supprimé");
    },
    [layout.widgets, onLayoutChange]
  );

  // Grouper les widgets par catégorie
  const widgetsByCategory = useMemo(() => {
    const categories: Record<string, typeof WIDGET_CATALOG> = {};
    WIDGET_CATALOG.forEach((widget) => {
      if (!categories[widget.category]) {
        categories[widget.category] = [];
      }
      categories[widget.category].push(widget);
    });
    return categories;
  }, []);

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ajouter un widget</DialogTitle>
                    <DialogDescription>
                      Choisissez un widget à ajouter à votre tableau de bord
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {Object.entries(widgetsByCategory).map(
                      ([category, widgets]) => (
                        <div key={category}>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                            {category}
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {widgets.map((widget) => (
                              <button
                                key={widget.type}
                                onClick={() => handleAddWidget(widget.type)}
                                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                              >
                                <p className="font-medium text-white">
                                  {widget.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {widget.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditToggle?.(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button size="sm" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditToggle?.(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Personnaliser
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        className={`transition-all ${
          isEditing ? "bg-muted/20 rounded-lg p-4 border-2 border-dashed border-muted" : ""
        }`}
      >
        <GridLayout
          className="layout"
          layout={gridLayout}
          cols={columns}
          rowHeight={rowHeight}
          width={1200}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditing}
          isResizable={isEditing}
          draggableHandle=".widget-drag-handle"
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {layout.widgets.map((widget) => (
            <div
              key={widget.id}
              className={`bg-card rounded-lg border border-border overflow-hidden ${
                isEditing ? "ring-2 ring-primary/20" : ""
              }`}
            >
              {isEditing && (
                <div className="absolute top-0 left-0 right-0 h-8 bg-muted/80 flex items-center justify-between px-2 z-10">
                  <div className="widget-drag-handle cursor-move flex items-center gap-1 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {widget.title ||
                        WIDGET_CATALOG.find((w) => w.type === widget.type)
                          ?.title}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Configurer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemoveWidget(widget.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <div className={isEditing ? "pt-8 h-full" : "h-full"}>
                {renderWidget(widget)}
              </div>
            </div>
          ))}
        </GridLayout>
      </div>

      {/* Empty state */}
      {layout.widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Aucun widget
          </h3>
          <p className="text-muted-foreground mb-4">
            Commencez par ajouter des widgets à votre tableau de bord
          </p>
          <Button onClick={() => setIsAddWidgetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un widget
          </Button>
        </div>
      )}
    </div>
  );
}

export { WIDGET_CATALOG };
