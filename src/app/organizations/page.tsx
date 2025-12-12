"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Users,
  Settings,
  MoreHorizontal,
  Crown,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  primaryColor: string;
  status: string;
  plan: string;
  createdAt: string;
  _count: {
    members: number;
  };
}

const planColors: Record<string, string> = {
  FREE: "bg-gray-500/20 text-gray-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  PROFESSIONAL: "bg-purple-500/20 text-purple-300",
  ENTERPRISE: "bg-amber-500/20 text-amber-300",
};

const statusIcons: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="h-4 w-4 text-green-400" />,
  INACTIVE: <XCircle className="h-4 w-4 text-gray-400" />,
  SUSPENDED: <XCircle className="h-4 w-4 text-red-400" />,
  PENDING: <Clock className="h-4 w-4 text-yellow-400" />,
};

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    plan: "FREE",
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Erreur lors du chargement des organisations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Organisation créée avec succès");
        setIsCreateOpen(false);
        setFormData({
          name: "",
          description: "",
          email: "",
          phone: "",
          website: "",
          plan: "FREE",
        });
        fetchOrganizations();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette organisation ?")) {
      return;
    }

    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Organisation supprimée");
        fetchOrganizations();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout
      title="Organisations"
      breadcrumbs={[{ name: "Organisations" }]}
      currentPage="organizations"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Building2 className="h-8 w-8 text-purple-400" />
            Organisations
          </h1>
          <p className="text-gray-400 mt-1">
            Gérez vos différentes organisations et associations
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4" />
              Nouvelle organisation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Créer une organisation</DialogTitle>
              <DialogDescription className="text-gray-400">
                Ajoutez une nouvelle organisation à votre compte
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Nom de l&apos;organisation *</Label>
                <Input
                  id="name"
                  placeholder="Ma Fondation"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description de l'organisation..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@fondation.org"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">Téléphone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 514 555-0100"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-300">Site web</Label>
                <Input
                  id="website"
                  placeholder="https://www.fondation.org"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan" className="text-gray-300">Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, plan: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="FREE">Gratuit</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professionnel</SelectItem>
                    <SelectItem value="ENTERPRISE">Entreprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="border-slate-700 text-gray-300 hover:bg-slate-800"
              >
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="bg-purple-600 hover:bg-purple-700">
                {creating ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une organisation..."
            className="pl-10 bg-slate-800 border-slate-700 text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700 animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Aucune organisation
            </h3>
            <p className="text-gray-400 text-center mb-4">
              {search
                ? "Aucune organisation ne correspond à votre recherche"
                : "Créez votre première organisation pour commencer"}
            </p>
            {!search && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Créer une organisation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <Card
              key={org.id}
              className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer group"
              onClick={() => router.push(`/organizations/${org.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: org.primaryColor }}
                    >
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        org.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-white group-hover:text-purple-400 transition-colors">
                        {org.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        @{org.slug}
                      </CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/organizations/${org.id}`);
                        }}
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/organizations/${org.id}?tab=members`);
                        }}
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Membres
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(org.id);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                {org.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {org.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcons[org.status]}
                    <Badge className={planColors[org.plan]}>
                      {org.plan === "FREE" && "Gratuit"}
                      {org.plan === "STARTER" && "Starter"}
                      {org.plan === "PROFESSIONAL" && "Pro"}
                      {org.plan === "ENTERPRISE" && (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Enterprise
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{org._count.members}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
