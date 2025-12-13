"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card } from "@/components/ui";
import { DonorTable } from "@/components/donors/DonorTable";
import { SearchFilters } from "@/components/donors/SearchFilters";
import { StatsCards } from "@/components/donors/StatsCards";
import { Pagination } from "@/components/donors/Pagination";
import { ImportModal } from "@/components/donors/ImportModal";
import { ExportButtons } from "@/components/donors/ExportButtons";
import { Donor, DonorStats, DonorSearchFilters, PaginatedResponse } from "@/types/donor";
import { Upload } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function DonorsPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [currentFilters, setCurrentFilters] = useState<DonorSearchFilters>({});
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchDonors = useCallback(async (filters: DonorSearchFilters = {}) => {
    if (!currentOrganization?.id) {
      console.log("⚠️ No organization selected, skipping donor fetch");
      return;
    }
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", String(filters.page || 1));
      queryParams.set("limit", String(filters.limit || 20));
      if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
      if (filters.sortOrder) queryParams.set("sortOrder", filters.sortOrder);
      if (filters.query) queryParams.set("search", filters.query);
      // Ajouter l'organisation courante (obligatoire)
      queryParams.set("organizationId", currentOrganization.id);

      const response = await fetch(`/api/donors?${queryParams.toString()}`, {
        headers: {
          'X-Organization-Id': currentOrganization.id,
        },
      });
      const data: PaginatedResponse<Donor> = await response.json();

      if (data.success) {
        setDonors(data.data);
        setPagination(data.pagination);
        console.log(`✅ Fetched ${data.data.length} donors for organization ${currentOrganization.id} (${currentOrganization.name})`);
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  const fetchStats = useCallback(async () => {
    if (!currentOrganization?.id) {
      return;
    }
    
    setStatsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("organizationId", currentOrganization.id);
      const response = await fetch(`/api/donors/stats?${queryParams.toString()}`, {
        headers: {
          'X-Organization-Id': currentOrganization.id,
        },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    // Attendre que l'organisation soit chargée avant de récupérer les donateurs
    if (!orgLoading && currentOrganization?.id) {
      fetchDonors(currentFilters);
      fetchStats();
    }
  }, [fetchDonors, fetchStats, currentOrganization?.id, orgLoading, currentFilters]); // Recharger quand l'organisation change

  const handleSearch = async (filters: DonorSearchFilters) => {
    setCurrentFilters(filters);
    
    if (filters.status?.length || filters.donorType?.length || filters.minTotalDonations || filters.maxTotalDonations || filters.hasEmailConsent) {
      setLoading(true);
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (currentOrganization?.id) {
          headers['X-Organization-Id'] = currentOrganization.id;
        }
        const response = await fetch("/api/donors/search", {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            ...filters, 
            page: 1,
            organizationId: currentOrganization?.id || undefined,
          }),
        });
        const data: PaginatedResponse<Donor> = await response.json();

        if (data.success) {
          setDonors(data.data);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Error searching donors:", error);
      } finally {
        setLoading(false);
      }
    } else {
      fetchDonors({ ...filters, page: 1 });
    }
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...currentFilters, page };
    setCurrentFilters(newFilters);
    
    if (currentFilters.status?.length || currentFilters.donorType?.length) {
      handleSearch(newFilters);
    } else {
      fetchDonors(newFilters);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce donateur ?")) return;

    try {
      const response = await fetch(`/api/donors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchDonors(currentFilters);
        fetchStats();
      }
    } catch (error) {
      console.error("Error deleting donor:", error);
    }
  };

  const handleSeed = async () => {
    if (!confirm("⚠️ Cette action va supprimer TOUS les donateurs existants et créer 30 nouveaux donateurs pour chaque organisation. Continuer ?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        const orgStats = data.data.organizations?.map((org: { organizationName: string; totalDonors: number; activeDonors: number; totalDonations: number }) => 
          `📦 ${org.organizationName}: ${org.totalDonors} donateurs (${org.activeDonors} actifs)`
        ).join("\n") || "";
        
        alert(`✅ ${data.message}\n\n📊 Statistiques:\n- Total: ${data.data.totalDonors} donateurs\n- Actifs: ${data.data.activeDonors}\n- Total dons: ${new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(data.data.totalDonations)}\n\n${orgStats}`);
        // Recharger les donateurs
        fetchDonors(currentFilters);
        fetchStats();
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Error seeding donors:", error);
      alert("❌ Erreur lors de la création des donateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = () => {
    fetchDonors(currentFilters);
    fetchStats();
  };

  return (
    <AppLayout breadcrumbs={[{ name: "Base Donateurs" }]}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Base Donateurs</h1>
            <p className="mt-1 text-sm text-gray-400">
              Gérez et analysez votre base de donateurs
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Export Button */}
            <ExportButtons
              filters={{
                status: currentFilters.status?.[0],
                search: currentFilters.query,
              }}
            />

            {/* Seed Button */}
            <button
              onClick={handleSeed}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors border border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🌱 Générer donateurs
            </button>

            {/* Import Button */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <Upload className="w-4 h-4" />
              Importer
            </button>

            {/* New Donor Button */}
            <Link href="/donors/new">
              <Button variant="primary">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau donateur
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Search and Filters */}
      <SearchFilters onSearch={handleSearch} loading={loading} />

      {/* Donors Table */}
      <Card padding="none" className="bg-slate-900 border-slate-800">
        <DonorTable donors={donors} onDelete={handleDelete} loading={loading} />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </AppLayout>
  );
}
