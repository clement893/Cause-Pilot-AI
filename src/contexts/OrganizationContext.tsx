"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  plan: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  isLoading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    // Ne pas essayer de charger les organisations si l'utilisateur n'est pas authentifié
    if (!session?.user) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/organizations", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      // Vérifier que la réponse est bien du JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Erreur: La réponse n'est pas du JSON", contentType, response.status);
        setIsLoading(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[OrganizationContext] Organizations fetched:`, data.length, data);
        setOrganizations(data);
        
        // Si l'utilisateur n'est pas super admin et a une organisation dans sa session, l'utiliser
        if (session?.user) {
          const sessionUser = session.user;
          const orgId = 'organizationId' in sessionUser ? (sessionUser as { organizationId?: string; role?: string }).organizationId : undefined;
          const role = 'role' in sessionUser ? (sessionUser as { organizationId?: string; role?: string }).role : undefined;
          
          console.log(`[OrganizationContext] Session user - orgId: ${orgId}, role: ${role}`);
          
          if (orgId && role !== "SUPER_ADMIN") {
            const sessionOrg = data.find((org: Organization) => org.id === orgId);
            console.log(`[OrganizationContext] Looking for org ${orgId} in data:`, sessionOrg);
            if (sessionOrg) {
              console.log(`[OrganizationContext] Setting organization from session:`, sessionOrg.name);
              setCurrentOrganizationState(sessionOrg);
              localStorage.setItem("currentOrganizationId", sessionOrg.id);
              setIsLoading(false);
              return;
            } else {
              console.warn(`[OrganizationContext] Organization ${orgId} from session not found in fetched organizations`);
            }
          }
        }
        
        // Si l'utilisateur n'a qu'une seule organisation, l'utiliser automatiquement
        if (data.length === 1) {
          console.log(`[OrganizationContext] Only one organization, setting it:`, data[0].name);
          setCurrentOrganizationState(data[0]);
          localStorage.setItem("currentOrganizationId", data[0].id);
          setIsLoading(false);
          return;
        }
        
        // Restaurer l'organisation sauvegardée ou prendre la première
        const savedOrgId = localStorage.getItem("currentOrganizationId");
        if (savedOrgId) {
          const savedOrg = data.find((org: Organization) => org.id === savedOrgId);
          if (savedOrg) {
            console.log(`[OrganizationContext] Restoring saved organization:`, savedOrg.name);
            setCurrentOrganizationState(savedOrg);
          } else if (data.length > 0) {
            console.log(`[OrganizationContext] Saved org not found, using first:`, data[0].name);
            setCurrentOrganizationState(data[0]);
          }
        } else if (data.length > 0) {
          console.log(`[OrganizationContext] No saved org, using first:`, data[0].name);
          setCurrentOrganizationState(data[0]);
        } else {
          console.warn(`[OrganizationContext] No organizations found for user`);
        }
      } else {
        // Si la réponse n'est pas OK, essayer de parser l'erreur JSON
        try {
          const errorData = await response.json();
          console.error("Erreur API:", errorData);
        } catch (jsonError) {
          // Si ce n'est pas du JSON, c'est probablement une redirection HTML
          console.error("Erreur: La réponse n'est pas du JSON (probablement une redirection)");
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des organisations:", error);
      // Si c'est une erreur de parsing JSON, c'est probablement une redirection HTML
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        console.error("Erreur: Réponse HTML reçue au lieu de JSON (probablement une redirection)");
      }
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const setCurrentOrganization = useCallback((org: Organization | null) => {
    setCurrentOrganizationState(org);
    if (org) {
      localStorage.setItem("currentOrganizationId", org.id);
    } else {
      localStorage.removeItem("currentOrganizationId");
    }
  }, []);

  const refreshOrganizations = useCallback(async () => {
    setIsLoading(true);
    await fetchOrganizations();
  }, [fetchOrganizations]);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        setCurrentOrganization,
        isLoading,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
