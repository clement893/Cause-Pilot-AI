"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Badge, Spinner } from "@/components/ui";
import { Donor, DonorStatus } from "@/types/donor";

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

const donorTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  CORPORATE: "Entreprise",
  FOUNDATION: "Fondation",
  GOVERNMENT: "Gouvernement",
  ANONYMOUS: "Anonyme",
};

interface DonorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DonorDetailPage({ params }: DonorDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonor = async () => {
      try {
        const response = await fetch(`/api/donors/${id}`);
        const data = await response.json();

        if (data.success) {
          setDonor(data.data);
        } else {
          setError(data.error || "Donateur non trouvé");
        }
      } catch (err) {
        console.error("Error fetching donor:", err);
        setError("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchDonor();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce donateur ?")) return;

    try {
      const response = await fetch(`/api/donors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/donors");
      }
    } catch (err) {
      console.error("Error deleting donor:", err);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !donor) {
    return (
      <AppLayout breadcrumbs={[{ name: "Base Donateurs", href: "/donors" }, { name: "Erreur" }]}>
        <Card className="text-center max-w-md mx-auto bg-slate-900 border-slate-800">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-semibold text-white">{error || "Donateur non trouvé"}</h3>
          <div className="mt-4">
            <Link href="/donors">
              <Button variant="primary">Retour à la liste</Button>
            </Link>
          </div>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      breadcrumbs={[
        { name: "Base Donateurs", href: "/donors" },
        { name: `${donor.firstName} ${donor.lastName}` }
      ]}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {donor.firstName} {donor.lastName}
              </h1>
              <Badge variant={statusColors[donor.status]}>
                {statusLabels[donor.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {donorTypeLabels[donor.donorType]} • Créé le {new Date(donor.createdAt).toLocaleDateString("fr-CA")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/donors/${id}/receipts`}>
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reçus fiscaux
              </Button>
            </Link>
            <Link href={`/donors/${id}/edit`}>
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </Button>
            </Link>
            <Button variant="danger" onClick={handleDelete}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card className="bg-slate-900 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Informations de contact</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-400">Email</dt>
                <dd className="mt-1 text-sm text-white">{donor.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Téléphone</dt>
                <dd className="mt-1 text-sm text-white">{donor.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Mobile</dt>
                <dd className="mt-1 text-sm text-white">{donor.mobile || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Date de naissance</dt>
                <dd className="mt-1 text-sm text-white">
                  {donor.dateOfBirth ? new Date(donor.dateOfBirth).toLocaleDateString("fr-CA") : "-"}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Address */}
          <Card className="bg-slate-900 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Adresse</h3>
            <address className="not-italic text-sm text-white">
              {donor.address && <div>{donor.address}</div>}
              {donor.address2 && <div>{donor.address2}</div>}
              {(donor.city || donor.state || donor.postalCode) && (
                <div>
                  {donor.city}{donor.city && donor.state && ", "}{donor.state} {donor.postalCode}
                </div>
              )}
              {donor.country && <div>{donor.country}</div>}
              {!donor.address && !donor.city && <span className="text-gray-500">Aucune adresse renseignée</span>}
            </address>
          </Card>

          {/* Professional Info */}
          <Card className="bg-slate-900 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Informations professionnelles</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-400">Profession</dt>
                <dd className="mt-1 text-sm text-white">{donor.profession || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Employeur</dt>
                <dd className="mt-1 text-sm text-white">{donor.employer || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Titre du poste</dt>
                <dd className="mt-1 text-sm text-white">{donor.jobTitle || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Secteur</dt>
                <dd className="mt-1 text-sm text-white">{donor.industry || "-"}</dd>
              </div>
            </dl>
          </Card>

          {/* Notes */}
          {donor.notes && (
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{donor.notes}</p>
            </Card>
          )}
        </div>

        {/* Right Column - Stats & Quick Info */}
        <div className="space-y-6">
          {/* Donation Stats */}
          <Card className="bg-slate-900 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Statistiques de dons</h3>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Total des dons</dt>
                <dd className="text-lg font-bold text-white">
                  {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(donor.totalDonations)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Nombre de dons</dt>
                <dd className="text-lg font-semibold text-white">{donor.donationCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Don moyen</dt>
                <dd className="text-sm font-medium text-white">
                  {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(donor.averageDonation)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Plus gros don</dt>
                <dd className="text-sm font-medium text-white">
                  {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(donor.highestDonation)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Dernier don</dt>
                <dd className="text-sm text-white">
                  {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString("fr-CA") : "-"}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Consent Status */}
          <Card className="bg-slate-900 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Consentements</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Email</span>
                {donor.consentEmail ? (
                  <Badge variant="success">Autorisé</Badge>
                ) : (
                  <Badge variant="default">Non autorisé</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Téléphone</span>
                {donor.consentPhone ? (
                  <Badge variant="success">Autorisé</Badge>
                ) : (
                  <Badge variant="default">Non autorisé</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Courrier</span>
                {donor.consentMail ? (
                  <Badge variant="success">Autorisé</Badge>
                ) : (
                  <Badge variant="default">Non autorisé</Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Tags & Segment */}
          <Card className="bg-slate-900 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Classification</h3>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-400 mb-2">Segment</dt>
                <dd>
                  {donor.segment ? (
                    <Badge variant="info">{donor.segment}</Badge>
                  ) : (
                    <span className="text-sm text-gray-500">Non défini</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400 mb-2">Tags</dt>
                <dd className="flex flex-wrap gap-2">
                  {donor.tags && donor.tags.length > 0 ? (
                    donor.tags.map((tag, index) => (
                      <Badge key={index} variant="default">{tag}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Aucun tag</span>
                  )}
                </dd>
              </div>
              {donor.source && (
                <div>
                  <dt className="text-sm font-medium text-gray-400 mb-2">Source</dt>
                  <dd className="text-sm text-white">{donor.source}</dd>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
