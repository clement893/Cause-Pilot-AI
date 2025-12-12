"use client";

import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";

interface FormAIAnalysisProps {
  formId: string;
  formName: string;
}

interface AnalysisResult {
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    expectedImpact: string;
  }>;
  benchmarkComparison?: string;
  currentConversionAnalysis?: string;
  quickWins?: string[];
  strategicChanges?: string[];
  testingIdeas?: string[];
  expectedImprovement?: string;
}

export default function FormAIAnalysis({ formId, formName }: FormAIAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<"performance" | "conversion" | null>(null);

  const runAnalysis = async (type: "analyze_performance" | "conversion_tips") => {
    setLoading(true);
    setActiveAnalysis(type === "analyze_performance" ? "performance" : "conversion");
    
    try {
      const response = await fetch("/api/forms/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          formId
        })
      });

      const data = await response.json();
      if (data.success && data.suggestions) {
        setAnalysis(data.suggestions);
      }
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success-light";
    if (score >= 60) return "text-yellow-400";
    return "text-error-light";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-error/20/50 border-error text-red-300";
      case "medium": return "bg-yellow-900/50 border-yellow-700 text-yellow-300";
      case "low": return "bg-success/20/50 border-success text-green-300";
      default: return "bg-surface-tertiary text-foreground";
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-900/30 rounded-xl border border-indigo-700/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Analyse CausePilot</h3>
          <p className="text-sm text-muted-foreground">Obtenez des insights IA pour optimiser &quot;{formName}&quot;</p>
        </div>
      </div>

      {/* Boutons d'analyse */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => runAnalysis("analyze_performance")}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
            activeAnalysis === "performance" 
              ? "bg-indigo-600 text-white" 
              : "bg-surface-secondary text-foreground hover:bg-surface-tertiary"
          }`}
        >
          {loading && activeAnalysis === "performance" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <TrendingUp className="w-5 h-5" />
          )}
          Analyser les performances
        </button>
        <button
          onClick={() => runAnalysis("conversion_tips")}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
            activeAnalysis === "conversion" 
              ? "bg-brand text-white" 
              : "bg-surface-secondary text-foreground hover:bg-surface-tertiary"
          }`}
        >
          {loading && activeAnalysis === "conversion" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Lightbulb className="w-5 h-5" />
          )}
          Conseils conversion
        </button>
      </div>

      {/* Résultats de l'analyse */}
      {analysis && (
        <div className="space-y-4">
          {/* Score global */}
          {analysis.overallScore !== undefined && (
            <div className="bg-surface-secondary/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Score global</span>
                <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}/100
                </span>
              </div>
              <div className="w-full bg-surface-tertiary rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    analysis.overallScore >= 80 ? "bg-success" :
                    analysis.overallScore >= 60 ? "bg-warning" : "bg-error"
                  }`}
                  style={{ width: `${analysis.overallScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Points forts */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="bg-success/20/20 border border-success/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success-light" />
                <span className="text-sm font-medium text-success-light">Points forts</span>
              </div>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, i) => (
                  <li key={i} className="text-sm text-green-200">• {strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Points faibles */}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div className="bg-error/20/20 border border-error/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-error-light" />
                <span className="text-sm font-medium text-error-light">Points à améliorer</span>
              </div>
              <ul className="space-y-1">
                {analysis.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-sm text-red-200">• {weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommandations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Recommandations</span>
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className={`border rounded-lg p-3 ${getPriorityColor(rec.priority)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase">
                      {rec.priority === "high" ? "🔴 Priorité haute" : 
                       rec.priority === "medium" ? "🟡 Priorité moyenne" : "🟢 Priorité basse"}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{rec.action}</p>
                  <p className="text-xs opacity-75 mt-1">Impact attendu: {rec.expectedImpact}</p>
                </div>
              ))}
            </div>
          )}

          {/* Analyse de conversion */}
          {analysis.currentConversionAnalysis && (
            <div className="bg-surface-secondary/50 rounded-lg p-4">
              <span className="text-sm font-medium text-foreground">Analyse du taux de conversion</span>
              <p className="text-sm text-muted-foreground mt-1">{analysis.currentConversionAnalysis}</p>
            </div>
          )}

          {/* Quick wins */}
          {analysis.quickWins && analysis.quickWins.length > 0 && (
            <div className="bg-warning/20/20 border border-warning/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium text-warning">Gains rapides</span>
              </div>
              <ul className="space-y-1">
                {analysis.quickWins.map((win, i) => (
                  <li key={i} className="text-sm text-amber-200">• {win}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Changements stratégiques */}
          {analysis.strategicChanges && analysis.strategicChanges.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
              <span className="text-sm font-medium text-brand-light">Changements stratégiques</span>
              <ul className="space-y-1 mt-2">
                {analysis.strategicChanges.map((change, i) => (
                  <li key={i} className="text-sm text-purple-200">• {change}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Idées de tests */}
          {analysis.testingIdeas && analysis.testingIdeas.length > 0 && (
            <div className="bg-info/20/20 border border-info/50 rounded-lg p-4">
              <span className="text-sm font-medium text-info-light">Idées de tests A/B</span>
              <ul className="space-y-1 mt-2">
                {analysis.testingIdeas.map((idea, i) => (
                  <li key={i} className="text-sm text-blue-200">• {idea}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Amélioration attendue */}
          {analysis.expectedImprovement && (
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-success/50 rounded-lg p-4">
              <span className="text-sm font-medium text-success-light">📈 Amélioration potentielle</span>
              <p className="text-sm text-green-200 mt-1">{analysis.expectedImprovement}</p>
            </div>
          )}

          {/* Benchmark */}
          {analysis.benchmarkComparison && (
            <div className="bg-surface-secondary/50 rounded-lg p-4">
              <span className="text-sm font-medium text-foreground">Comparaison aux benchmarks</span>
              <p className="text-sm text-muted-foreground mt-1">{analysis.benchmarkComparison}</p>
            </div>
          )}
        </div>
      )}

      {/* État initial */}
      {!analysis && !loading && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">Cliquez sur un bouton pour lancer l&apos;analyse IA de votre formulaire</p>
        </div>
      )}
    </div>
  );
}
