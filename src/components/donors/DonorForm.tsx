"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, Checkbox, Card } from "@/components/ui";
import { Donor, DonorFormData, DonorStatus, DonorType, CommunicationChannel, CommunicationFrequency } from "@/types/donor";

interface DonorFormProps {
  donor?: Donor;
  onSubmit: (data: DonorFormData) => Promise<void>;
  loading?: boolean;
}

const statusOptions = [
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "LAPSED", label: "Lapsé" },
  { value: "PENDING", label: "En attente" },
  { value: "DECEASED", label: "Décédé" },
  { value: "DO_NOT_CONTACT", label: "Ne pas contacter" },
];

const donorTypeOptions = [
  { value: "INDIVIDUAL", label: "Individuel" },
  { value: "CORPORATE", label: "Entreprise" },
  { value: "FOUNDATION", label: "Fondation" },
  { value: "GOVERNMENT", label: "Gouvernement" },
  { value: "ANONYMOUS", label: "Anonyme" },
];

const channelOptions = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Téléphone" },
  { value: "SMS", label: "SMS" },
  { value: "MAIL", label: "Courrier" },
  { value: "SOCIAL_MEDIA", label: "Réseaux sociaux" },
];

const frequencyOptions = [
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "BIWEEKLY", label: "Bimensuel" },
  { value: "MONTHLY", label: "Mensuel" },
  { value: "QUARTERLY", label: "Trimestriel" },
  { value: "YEARLY", label: "Annuel" },
  { value: "NEVER", label: "Jamais" },
];

const countryOptions = [
  { value: "Canada", label: "Canada" },
  { value: "États-Unis", label: "États-Unis" },
  { value: "France", label: "France" },
  { value: "Belgique", label: "Belgique" },
  { value: "Suisse", label: "Suisse" },
  { value: "Autre", label: "Autre" },
];

const provinceOptions = [
  { value: "", label: "Sélectionner..." },
  { value: "QC", label: "Québec" },
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "Colombie-Britannique" },
  { value: "AB", label: "Alberta" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nouvelle-Écosse" },
  { value: "NB", label: "Nouveau-Brunswick" },
  { value: "NL", label: "Terre-Neuve-et-Labrador" },
  { value: "PE", label: "Île-du-Prince-Édouard" },
  { value: "NT", label: "Territoires du Nord-Ouest" },
  { value: "YT", label: "Yukon" },
  { value: "NU", label: "Nunavut" },
];

export function DonorForm({ donor, onSubmit, loading }: DonorFormProps) {
  const router = useRouter();
  const isEditing = !!donor;

  const [formData, setFormData] = useState<DonorFormData>({
    firstName: donor?.firstName || "",
    lastName: donor?.lastName || "",
    email: donor?.email || "",
    phone: donor?.phone || "",
    mobile: donor?.mobile || "",
    dateOfBirth: donor?.dateOfBirth?.split("T")[0] || "",
    address: donor?.address || "",
    address2: donor?.address2 || "",
    city: donor?.city || "",
    state: donor?.state || "",
    postalCode: donor?.postalCode || "",
    country: donor?.country || "Canada",
    profession: donor?.profession || "",
    employer: donor?.employer || "",
    jobTitle: donor?.jobTitle || "",
    industry: donor?.industry || "",
    status: (donor?.status as DonorStatus) || "ACTIVE",
    donorType: (donor?.donorType as DonorType) || "INDIVIDUAL",
    segment: donor?.segment || "",
    tags: donor?.tags || [],
    notes: donor?.notes || "",
    source: donor?.source || "",
    consentEmail: donor?.consentEmail || false,
    consentPhone: donor?.consentPhone || false,
    consentMail: donor?.consentMail || false,
    preferences: {
      preferredChannel: (donor?.preferences?.preferredChannel as CommunicationChannel) || "EMAIL",
      preferredFrequency: (donor?.preferences?.preferredFrequency as CommunicationFrequency) || "MONTHLY",
      preferredLanguage: donor?.preferences?.preferredLanguage || "fr",
      causesOfInterest: donor?.preferences?.causesOfInterest || [],
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePreferenceChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences!, [field]: value },
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Informations personnelles */}
      <Card className="bg-slate-900 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Informations personnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Prénom *"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            error={errors.firstName}
            placeholder="Jean"
          />
          <Input
            label="Nom *"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            error={errors.lastName}
            placeholder="Dupont"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            placeholder="jean.dupont@email.com"
          />
          <Input
            label="Téléphone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="(514) 555-1234"
          />
          <Input
            label="Mobile"
            type="tel"
            value={formData.mobile}
            onChange={(e) => handleChange("mobile", e.target.value)}
            placeholder="(514) 555-5678"
          />
          <Input
            label="Date de naissance"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleChange("dateOfBirth", e.target.value)}
          />
        </div>
      </Card>

      {/* Adresse */}
      <Card className="bg-slate-900 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Adresse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Adresse"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 rue Principale"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Adresse (suite)"
              value={formData.address2}
              onChange={(e) => handleChange("address2", e.target.value)}
              placeholder="Appartement 4B"
            />
          </div>
          <Input
            label="Ville"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Montréal"
          />
          <Select
            label="Province/État"
            value={formData.state}
            onChange={(e) => handleChange("state", e.target.value)}
            options={provinceOptions}
          />
          <Input
            label="Code postal"
            value={formData.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            placeholder="H2X 1Y4"
          />
          <Select
            label="Pays"
            value={formData.country}
            onChange={(e) => handleChange("country", e.target.value)}
            options={countryOptions}
          />
        </div>
      </Card>

      {/* Informations professionnelles */}
      <Card className="bg-slate-900 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Informations professionnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Profession"
            value={formData.profession}
            onChange={(e) => handleChange("profession", e.target.value)}
            placeholder="Ingénieur"
          />
          <Input
            label="Employeur"
            value={formData.employer}
            onChange={(e) => handleChange("employer", e.target.value)}
            placeholder="Entreprise ABC"
          />
          <Input
            label="Titre du poste"
            value={formData.jobTitle}
            onChange={(e) => handleChange("jobTitle", e.target.value)}
            placeholder="Directeur"
          />
          <Input
            label="Secteur d'activité"
            value={formData.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
            placeholder="Technologie"
          />
        </div>
      </Card>

      {/* Classification */}
      <Card className="bg-slate-900 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Classification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Statut"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            options={statusOptions}
          />
          <Select
            label="Type de donateur"
            value={formData.donorType}
            onChange={(e) => handleChange("donorType", e.target.value)}
            options={donorTypeOptions}
          />
          <Input
            label="Segment"
            value={formData.segment}
            onChange={(e) => handleChange("segment", e.target.value)}
            placeholder="VIP, Récurrent, etc."
          />
          <Input
            label="Source"
            value={formData.source}
            onChange={(e) => handleChange("source", e.target.value)}
            placeholder="Site web, Événement, etc."
          />
        </div>
      </Card>

      {/* Préférences de communication */}
      <Card className="bg-slate-900 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Préférences de communication</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Canal préféré"
            value={formData.preferences?.preferredChannel}
            onChange={(e) => handlePreferenceChange("preferredChannel", e.target.value)}
            options={channelOptions}
          />
          <Select
            label="Fréquence préférée"
            value={formData.preferences?.preferredFrequency}
            onChange={(e) => handlePreferenceChange("preferredFrequency", e.target.value)}
            options={frequencyOptions}
          />
        </div>
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-gray-300">Consentements (RGPD/PIPEDA)</p>
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="Consentement Email"
              checked={formData.consentEmail}
              onChange={(e) => handleChange("consentEmail", e.target.checked)}
            />
            <Checkbox
              label="Consentement Téléphone"
              checked={formData.consentPhone}
              onChange={(e) => handleChange("consentPhone", e.target.checked)}
            />
            <Checkbox
              label="Consentement Courrier"
              checked={formData.consentMail}
              onChange={(e) => handleChange("consentMail", e.target.checked)}
            />
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card className="bg-slate-900 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
        <Textarea
          label="Notes internes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Informations supplémentaires sur le donateur..."
          rows={4}
        />
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {isEditing ? "Mettre à jour" : "Créer le donateur"}
        </Button>
      </div>
    </form>
  );
}
