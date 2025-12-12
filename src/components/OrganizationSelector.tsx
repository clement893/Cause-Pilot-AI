"use client";

import { useState, useRef, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// ID spécial pour le mode Super Admin
const SUPER_ADMIN_ID = "super-admin";

export default function OrganizationSelector() {
  const { organizations, currentOrganization, setCurrentOrganization, isLoading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Vérifier si l'utilisateur est super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch("/api/super-admin/check");
        if (response.ok) {
          const data = await response.json();
          setIsSuperAdmin(data.isSuperAdmin);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification super-admin:", error);
      }
    };
    checkSuperAdmin();
  }, []);

  // Détecter si on est en mode super-admin basé sur l'URL
  useEffect(() => {
    setIsSuperAdminMode(pathname?.startsWith("/super-admin") || false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuperAdminClick = () => {
    setIsOpen(false);
    router.push("/super-admin");
  };

  const handleOrganizationClick = (org: typeof organizations[0]) => {
    setCurrentOrganization(org);
    setIsOpen(false);
    // Si on était en mode super-admin, rediriger vers le dashboard
    if (isSuperAdminMode) {
      router.push("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-slate-700 rounded-lg"></div>
        <div className="w-24 h-4 bg-slate-700 rounded"></div>
      </div>
    );
  }

  if (organizations.length === 0 && !isSuperAdmin) {
    return (
      <Link
        href="/organizations"
        className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors"
      >
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="text-sm text-purple-300">Créer une organisation</span>
      </Link>
    );
  }

  // Affichage actuel (Super Admin ou Organisation)
  const displayName = isSuperAdminMode ? "Super Admin" : currentOrganization?.name || "Sélectionner";
  const displaySubtitle = isSuperAdminMode ? "Gestion globale" : currentOrganization?.plan || "Organisation";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-3 py-2 border rounded-lg hover:bg-slate-800 transition-colors min-w-[200px] ${
          isSuperAdminMode 
            ? "bg-amber-500/10 border-amber-500/30" 
            : "bg-slate-800/50 border-slate-700"
        }`}
      >
        {/* Logo ou initiale */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isSuperAdminMode 
            ? "bg-gradient-to-br from-amber-500 to-orange-500" 
            : "bg-gradient-to-br from-purple-500 to-pink-500"
        }`}>
          {isSuperAdminMode ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) : currentOrganization?.logo ? (
            <img
              src={currentOrganization.logo}
              alt={currentOrganization.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-white font-bold text-sm">
              {currentOrganization?.name?.charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </div>

        {/* Nom */}
        <div className="flex-1 text-left">
          <p className={`text-sm font-medium truncate ${isSuperAdminMode ? "text-amber-300" : "text-white"}`}>
            {displayName}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {displaySubtitle}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Super Admin Option */}
          {isSuperAdmin && (
            <>
              <div className="p-2 border-b border-slate-700">
                <p className="text-xs font-semibold text-amber-400 uppercase px-2">
                  Administration
                </p>
              </div>
              <button
                onClick={handleSuperAdminClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors ${
                  isSuperAdminMode ? "bg-amber-500/20" : ""
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-amber-300">Super Admin</p>
                  <p className="text-xs text-gray-400">Gestion globale</p>
                </div>
                {isSuperAdminMode && (
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </>
          )}

          {/* Organizations */}
          <div className="p-2 border-b border-slate-700">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2">
              Vos organisations
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationClick(org)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors ${
                  !isSuperAdminMode && currentOrganization?.id === org.id ? "bg-purple-600/20" : ""
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white truncate">{org.name}</p>
                  <p className="text-xs text-gray-400">/{org.slug}</p>
                </div>
                {!isSuperAdminMode && currentOrganization?.id === org.id && (
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="p-2 border-t border-slate-700">
            <Link
              href="/organizations"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Gérer les organisations
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
