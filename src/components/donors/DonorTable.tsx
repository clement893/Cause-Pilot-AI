"use client";

import { Donor, DonorStatus } from "@/types/donor";
import { Badge, Button } from "@/components/ui";
import Link from "next/link";

interface DonorTableProps {
  donors: Donor[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

const statusColors: Record<DonorStatus, "success" | "warning" | "danger" | "default" | "info"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  LAPSED: "danger",
  DECEASED: "default",
  DO_NOT_CONTACT: "danger",
  PENDING: "info",
};

const statusLabels: Record<DonorStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  LAPSED: "Lapsé",
  DECEASED: "Décédé",
  DO_NOT_CONTACT: "Ne pas contacter",
  PENDING: "En attente",
};

export function DonorTable({ donors, onDelete, loading }: DonorTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun donateur</h3>
        <p className="mt-1 text-sm text-gray-500">Commencez par ajouter votre premier donateur.</p>
        <div className="mt-6">
          <Link href="/donors/new">
            <Button variant="primary">
              <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un donateur
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Donateur
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Dons
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nb Dons
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dernier Don
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {donors.map((donor) => (
            <tr key={donor.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium text-sm">
                        {donor.firstName[0]}{donor.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Link href={`/donors/${donor.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                      {donor.firstName} {donor.lastName}
                    </Link>
                    {donor.employer && (
                      <div className="text-sm text-gray-500">{donor.employer}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{donor.email || "-"}</div>
                <div className="text-sm text-gray-500">{donor.phone || "-"}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={statusColors[donor.status]}>
                  {statusLabels[donor.status]}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(donor.totalDonations)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {donor.donationCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {donor.lastDonationDate
                  ? new Date(donor.lastDonationDate).toLocaleDateString("fr-CA")
                  : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/donors/${donor.id}`}>
                    <Button variant="ghost" size="sm">
                      Voir
                    </Button>
                  </Link>
                  <Link href={`/donors/${donor.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      Modifier
                    </Button>
                  </Link>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(donor.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
