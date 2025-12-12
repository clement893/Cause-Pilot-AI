"use client";

import { useState } from "react";
import { Button, Input, Select, Card, Checkbox } from "@/components/ui";
import { DonorSearchFilters, DonorStatus, DonorType } from "@/types/donor";

interface SearchFiltersProps {
  onSearch: (filters: DonorSearchFilters) => void;
  loading?: boolean;
}

const statusOptions = [
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "LAPSED", label: "Lapsé" },
  { value: "PENDING", label: "En attente" },
];

const donorTypeOptions = [
  { value: "INDIVIDUAL", label: "Individuel" },
  { value: "CORPORATE", label: "Entreprise" },
  { value: "FOUNDATION", label: "Fondation" },
];

export function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<DonorSearchFilters>({
    query: "",
    status: [],
    donorType: [],
    minTotalDonations: undefined,
    maxTotalDonations: undefined,
    hasEmailConsent: undefined,
    minPotentialScore: undefined,
    maxPotentialScore: undefined,
    minChurnRiskScore: undefined,
    maxChurnRiskScore: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleChange = (field: keyof DonorSearchFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusToggle = (status: DonorStatus) => {
    setFilters((prev) => {
      const current = prev.status || [];
      const updated = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      return { ...prev, status: updated };
    });
  };

  const handleTypeToggle = (type: DonorType) => {
    setFilters((prev) => {
      const current = prev.donorType || [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...prev, donorType: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters: DonorSearchFilters = {
      query: "",
      status: [],
      donorType: [],
      minTotalDonations: undefined,
      maxTotalDonations: undefined,
      hasEmailConsent: undefined,
      minPotentialScore: undefined,
      maxPotentialScore: undefined,
      minChurnRiskScore: undefined,
      maxChurnRiskScore: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <Card className="mb-6 bg-slate-900 border-slate-700">
      <form onSubmit={handleSubmit}>
        {/* Barre de recherche principale */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom, email, téléphone, ville..."
              value={filters.query}
              onChange={(e) => handleChange("query", e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" loading={loading}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Rechercher
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Filtres avancés
          </Button>
        </div>

        {/* Filtres avancés */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Statut */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Statut</p>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters.status?.includes(option.value as DonorStatus)}
                      onChange={() => handleStatusToggle(option.value as DonorStatus)}
                    />
                  ))}
                </div>
              </div>

              {/* Type de donateur */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Type de donateur</p>
                <div className="space-y-2">
                  {donorTypeOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters.donorType?.includes(option.value as DonorType)}
                      onChange={() => handleTypeToggle(option.value as DonorType)}
                    />
                  ))}
                </div>
              </div>

              {/* Montant des dons */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Total des dons</p>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min ($)"
                    value={filters.minTotalDonations || ""}
                    onChange={(e) => handleChange("minTotalDonations", e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Max ($)"
                    value={filters.maxTotalDonations || ""}
                    onChange={(e) => handleChange("maxTotalDonations", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              {/* Score de Potentiel */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Score de Potentiel
                  </span>
                </p>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min (1-100)"
                    min={1}
                    max={100}
                    value={filters.minPotentialScore || ""}
                    onChange={(e) => handleChange("minPotentialScore", e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Max (1-100)"
                    min={1}
                    max={100}
                    value={filters.maxPotentialScore || ""}
                    onChange={(e) => handleChange("maxPotentialScore", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => { handleChange("minPotentialScore", 70); handleChange("maxPotentialScore", 100); }}
                    className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                  >
                    Haut (70+)
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleChange("minPotentialScore", 40); handleChange("maxPotentialScore", 69); }}
                    className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30"
                  >
                    Moyen (40-69)
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleChange("minPotentialScore", 1); handleChange("maxPotentialScore", 39); }}
                    className="text-xs px-2 py-1 bg-slate-500/20 text-slate-400 rounded hover:bg-slate-500/30"
                  >
                    Faible (&lt;40)
                  </button>
                </div>
              </div>

              {/* Score de Risque Churn */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Risque de Churn
                  </span>
                </p>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min (1-100)"
                    min={1}
                    max={100}
                    value={filters.minChurnRiskScore || ""}
                    onChange={(e) => handleChange("minChurnRiskScore", e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Max (1-100)"
                    min={1}
                    max={100}
                    value={filters.maxChurnRiskScore || ""}
                    onChange={(e) => handleChange("maxChurnRiskScore", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => { handleChange("minChurnRiskScore", 70); handleChange("maxChurnRiskScore", 100); }}
                    className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                  >
                    Élevé (70+)
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleChange("minChurnRiskScore", 40); handleChange("maxChurnRiskScore", 69); }}
                    className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30"
                  >
                    Modéré (40-69)
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleChange("minChurnRiskScore", 1); handleChange("maxChurnRiskScore", 39); }}
                    className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                  >
                    Faible (&lt;40)
                  </button>
                </div>
              </div>
            </div>

            {/* Ligne 2: Tri */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {/* Tri */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Trier par</p>
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleChange("sortBy", e.target.value)}
                  options={[
                    { value: "createdAt", label: "Date de création" },
                    { value: "lastName", label: "Nom" },
                    { value: "totalDonations", label: "Total des dons" },
                    { value: "lastDonationDate", label: "Dernier don" },
                    { value: "donationCount", label: "Nombre de dons" },
                    { value: "potentialScore", label: "Score de potentiel" },
                    { value: "churnRiskScore", label: "Risque de churn" },
                  ]}
                />
                <div className="mt-2">
                  <Select
                    value={filters.sortOrder}
                    onChange={(e) => handleChange("sortOrder", e.target.value)}
                    options={[
                      { value: "desc", label: "Décroissant" },
                      { value: "asc", label: "Croissant" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Consentement email */}
            <div className="mt-4">
              <Checkbox
                label="Uniquement les donateurs avec consentement email"
                checked={filters.hasEmailConsent === true}
                onChange={(e) => handleChange("hasEmailConsent", e.target.checked ? true : undefined)}
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={handleReset}>
                Réinitialiser
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                Appliquer les filtres
              </Button>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}
