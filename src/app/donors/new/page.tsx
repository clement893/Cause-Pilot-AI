"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { DonorForm } from "@/components/donors/DonorForm";
import { DonorFormData } from "@/types/donor";

export default function NewDonorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: DonorFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/donors/${result.data.id}`);
      } else {
        setError(result.error || "Une erreur est survenue");
      }
    } catch (err) {
      console.error("Error creating donor:", err);
      setError("Une erreur est survenue lors de la création du donateur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout 
      breadcrumbs={[
        { name: "Base Donateurs", href: "/donors" },
        { name: "Nouveau donateur" }
      ]}
    >
      <div className="max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Nouveau donateur</h1>
          <p className="mt-1 text-sm text-gray-400">
            Ajoutez un nouveau donateur à votre base
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <DonorForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </AppLayout>
  );
}
