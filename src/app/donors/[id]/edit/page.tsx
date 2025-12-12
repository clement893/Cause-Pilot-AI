"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Spinner } from "@/components/ui";
import { DonorForm } from "@/components/donors/DonorForm";
import { Donor, DonorFormData } from "@/types/donor";

interface EditDonorPageProps {
  params: Promise<{ id: string }>;
}

export default function EditDonorPage({ params }: EditDonorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (data: DonorFormData) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/donors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/donors/${id}`);
      } else {
        setError(result.error || "Une erreur est survenue");
      }
    } catch (err) {
      console.error("Error updating donor:", err);
      setError("Une erreur est survenue lors de la mise à jour");
    } finally {
      setSaving(false);
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

  if (error && !donor) {
    return (
      <AppLayout breadcrumbs={[{ name: "Base Donateurs", href: "/donors" }, { name: "Erreur" }]}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">{error}</h3>
          <div className="mt-4">
            <Link href="/donors">
              <Button variant="primary">Retour à la liste</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      breadcrumbs={[
        { name: "Base Donateurs", href: "/donors" },
        { name: `${donor?.firstName} ${donor?.lastName}`, href: `/donors/${id}` },
        { name: "Modifier" }
      ]}
    >
      <div className="max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Modifier {donor?.firstName} {donor?.lastName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez les informations du donateur
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-error/20/50 border border-error text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {donor && <DonorForm donor={donor} onSubmit={handleSubmit} loading={saving} />}
      </div>
    </AppLayout>
  );
}
