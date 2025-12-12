"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import FormBuilder from "@/components/forms/FormBuilder";
import { DonationForm } from "@/types/form";

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<DonationForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data);
      }
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!form) {
    return (
      <AppLayout breadcrumbs={[{ name: "Formulaires Don", href: "/forms" }, { name: "Non trouvé" }]}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-white">Formulaire non trouvé</h2>
          <Link href="/forms" className="mt-4 text-pink-400 hover:text-pink-300">
            Retour à la liste
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      breadcrumbs={[
        { name: "Formulaires Don", href: "/forms" },
        { name: form.name, href: `/forms/${id}` },
        { name: "Modifier" }
      ]}
    >
      <div className="max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Modifier le formulaire</h1>
          <p className="mt-1 text-sm text-gray-400">{form.name}</p>
        </div>

        <FormBuilder mode="edit" initialData={form} />
      </div>
    </AppLayout>
  );
}
