"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card } from "@/components/ui";
import { DonorTable } from "@/components/donors/DonorTable";
import { SearchFilters } from "@/components/donors/SearchFilters";
import { StatsCards } from "@/components/donors/StatsCards";
import { Pagination } from "@/components/donors/Pagination";
import { Donor, DonorStats, DonorSearchFilters, PaginatedResponse } from "@/types/donor";

export default function DonorsPage() {
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

  const fetchDonors = useCallback(async (filters: DonorSearchFilters = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", String(filters.page || 1));
      queryParams.set("limit", String(filters.limit || 20));
      if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
      if (filters.sortOrder) queryParams.set("sortOrder", filters.sortOrder);
      if (filters.query) queryParams.set("search", filters.query);

      const response = await fetch(`/api/donors?${queryParams.toString()}`);
      const data: PaginatedResponse<Donor> = await response.json();

      if (data.success) {
        setDonors(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/donors/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonors();
    fetchStats();
  }, [fetchDonors, fetchStats]);

  const handleSearch = async (filters: DonorSearchFilters) => {
    setCurrentFilters(filters);
    
    if (filters.status?.length || filters.donorType?.length || filters.minTotalDonations || filters.maxTotalDonations || filters.hasEmailConsent) {
      setLoading(true);
      try {
        const response = await fetch("/api/donors/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...filters, page: 1 }),
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
    </AppLayout>
  );
}
