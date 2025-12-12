"use client";

import AppLayout from "@/components/layout/AppLayout";
import FormBuilder from "@/components/forms/FormBuilder";

export default function NewFormPage() {
  return (
    <AppLayout 
      breadcrumbs={[
        { name: "Formulaires Don", href: "/forms" },
        { name: "Nouveau formulaire" }
      ]}
    >
      <div className="max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Nouveau formulaire</h1>
          <p className="mt-1 text-sm text-muted-foreground">Créez un nouveau formulaire de don</p>
        </div>

        <FormBuilder mode="create" />
      </div>
    </AppLayout>
  );
}
