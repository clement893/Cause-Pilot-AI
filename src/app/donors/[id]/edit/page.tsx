"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !donor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{error}</h3>
          <div className="mt-4">
            <Link href="/donors">
              <Button variant="primary">Retour à la liste</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/donors/${id}`}>
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Modifier {donor?.firstName} {donor?.lastName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Modifiez les informations du donateur
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {donor && <DonorForm donor={donor} onSubmit={handleSubmit} loading={saving} />}
      </main>
    </div>
  );
}
