"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Users,
  Settings,
  Save,
  Trash2,
  UserPlus,
  Crown,
  Shield,
  Eye,
  Mail,
  Phone,
  Globe,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  legalName?: string;
  charityNumber?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone: string;
  currency: string;
  language: string;
  status: string;
  plan: string;
  maxUsers: number;
  maxDonors: number;
  maxCampaigns: number;
  createdAt: string;
  members: Member[];
  _count: {
    members: number;
    dashboardLayouts: number;
  };
}

interface Member {
  id: string;
  role: string;
  status: string;
  joinedAt?: string;
  user?: {
    id: number;
    name?: string;
    email: string;
  };
}

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Crown className="h-4 w-4 text-amber-400" />,
  ADMIN: <Shield className="h-4 w-4 text-purple-400" />,
  MANAGER: <Settings className="h-4 w-4 text-blue-400" />,
  ANALYST: <Eye className="h-4 w-4 text-green-400" />,
  MEMBER: <Users className="h-4 w-4 text-gray-400" />,
  VIEWER: <Eye className="h-4 w-4 text-gray-400" />,
};

const roleLabels: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  ANALYST: "Analyste",
  MEMBER: "Membre",
  VIEWER: "Lecteur",
};

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Organization>>({});

  useEffect(() => {
    fetchOrganization();
    fetchMembers();
  }, [id]);

  const fetchOrganization = async () => {
    try {
      const res = await fetch(`/api/organizations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrganization(data);
        setFormData(data);
      } else {
        toast.error("Organisation non trouvée");
        router.push("/organizations");
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/organizations/${id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Organisation mise à jour");
        fetchOrganization();
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cette organisation ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Organisation supprimée");
        router.push("/organizations");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Organisation" breadcrumbs={[{ name: "Organisations", href: "/organizations" }, { name: organization?.name || "Détails" }]} currentPage="organizations">
        
        <>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </>
      </AppLayout>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <AppLayout title="Organisation" breadcrumbs={[{ name: "Organisations", href: "/organizations" }, { name: organization?.name || "Détails" }]} currentPage="organizations">
      
      <>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/organizations")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: organization.primaryColor }}
              >
                {organization.logoUrl ? (
                  <img
                    src={organization.logoUrl}
                    alt={organization.name}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  organization.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {organization.name}
                </h1>
                <p className="text-muted-foreground text-sm">
                  /{organization.slug}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Building2 className="h-4 w-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Membres ({members.length})
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations générales */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                  <CardDescription>
                    Informations de base de l&apos;organisation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur principale</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.primaryColor || "#6366f1"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              primaryColor: e.target.value,
                            })
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.primaryColor || "#6366f1"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              primaryColor: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur secondaire</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.secondaryColor || "#8b5cf6"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              secondaryColor: e.target.value,
                            })
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.secondaryColor || "#8b5cf6"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              secondaryColor: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                  <CardDescription>
                    Coordonnées de l&apos;organisation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </Label>
                    <Input
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Site web
                    </Label>
                    <Input
                      value={formData.website || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Adresse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Adresse</Label>
                    <Input
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input
                        value={formData.city || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Province/État</Label>
                      <Input
                        value={formData.state || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Code postal</Label>
                      <Input
                        value={formData.postalCode || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, postalCode: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pays</Label>
                      <Input
                        value={formData.country || "CA"}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations légales */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations légales</CardTitle>
                  <CardDescription>
                    Informations fiscales et juridiques
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom légal</Label>
                    <Input
                      value={formData.legalName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, legalName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Numéro d&apos;organisme de bienfaisance</Label>
                    <Input
                      value={formData.charityNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          charityNumber: e.target.value,
                        })
                      }
                      placeholder="123456789RR0001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Numéro d&apos;identification fiscale</Label>
                    <Input
                      value={formData.taxId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, taxId: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Membres de l&apos;organisation</CardTitle>
                  <CardDescription>
                    {members.length} membre{members.length > 1 ? "s" : ""} •
                    Maximum {organization.maxUsers}
                  </CardDescription>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Inviter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Inviter un membre</DialogTitle>
                      <DialogDescription>
                        Envoyez une invitation à rejoindre l&apos;organisation
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="membre@exemple.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rôle</Label>
                        <Select defaultValue="MEMBER">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Administrateur</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="ANALYST">Analyste</SelectItem>
                            <SelectItem value="MEMBER">Membre</SelectItem>
                            <SelectItem value="VIEWER">Lecteur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsInviteOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={() => {
                          toast.info("Fonctionnalité en cours de développement");
                          setIsInviteOpen(false);
                        }}
                      >
                        Envoyer l&apos;invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun membre pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                            {member.user?.name?.charAt(0) ||
                              member.user?.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {member.user?.name || member.user?.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {roleIcons[member.role]}
                            {roleLabels[member.role]}
                          </Badge>
                          {member.role !== "OWNER" && (
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres régionaux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <Select
                      value={formData.timezone || "America/Toronto"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Toronto">
                          Toronto (EST)
                        </SelectItem>
                        <SelectItem value="America/Vancouver">
                          Vancouver (PST)
                        </SelectItem>
                        <SelectItem value="America/Montreal">
                          Montréal (EST)
                        </SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select
                      value={formData.currency || "CAD"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CAD">Dollar canadien (CAD)</SelectItem>
                        <SelectItem value="USD">Dollar américain (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <Select
                      value={formData.language || "fr"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan et limites</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Plan actuel</Label>
                    <Select
                      value={formData.plan || "FREE"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, plan: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Gratuit</SelectItem>
                        <SelectItem value="STARTER">Starter</SelectItem>
                        <SelectItem value="PROFESSIONAL">
                          Professionnel
                        </SelectItem>
                        <SelectItem value="ENTERPRISE">Entreprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-white">
                        {members.length}/{organization.maxUsers}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Utilisateurs
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-white">
                        0/{organization.maxDonors}
                      </p>
                      <p className="text-sm text-muted-foreground">Donateurs</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-white">
                        0/{organization.maxCampaigns}
                      </p>
                      <p className="text-sm text-muted-foreground">Campagnes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </>
    </AppLayout>
  );
}
