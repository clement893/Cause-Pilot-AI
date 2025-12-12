"use client";

import { useState, useRef, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import Link from "next/link";

export default function OrganizationSelector() {
  const { organizations, currentOrganization, setCurrentOrganization, isLoading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-slate-700 rounded-lg"></div>
        <div className="w-24 h-4 bg-slate-700 rounded"></div>
      </div>
    );
  }

  if (organizations.length === 0) {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors min-w-[200px]"
      >
        {/* Logo ou initiale */}
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
          {currentOrganization?.logo ? (
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

        {/* Nom de l'organisation */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white truncate">
            {currentOrganization?.name || "Sélectionner"}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {currentOrganization?.plan || "Organisation"}
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
          <div className="p-2 border-b border-slate-700">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2">
              Vos organisations
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setCurrentOrganization(org);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors ${
                  currentOrganization?.id === org.id ? "bg-purple-600/20" : ""
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
                {currentOrganization?.id === org.id && (
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
