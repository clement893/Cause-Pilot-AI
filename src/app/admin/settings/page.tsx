"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { Settings, Building, Mail, CreditCard, Shield, Bell, Palette, Save, RefreshCw } from "lucide-react";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  label: string;
  description: string | null;
  dataType: string;
  isRequired: boolean;
  options: string | null;
  isSecret: boolean;
  isReadOnly: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [groupedSettings, setGroupedSettings] = useState<Record<string, SystemSetting[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("organization");
  const [changes, setChanges] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      const data = await res.json();

      setSettings(data.settings || []);
      setGroupedSettings(data.grouped || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings?action=seed", {
        method: "POST",
      });
      if (res.ok) {
        fetchSettings();
        alert("Paramètres initialisés avec succès !");
      }
    } catch (error) {
      console.error("Error initializing settings:", error);
    }
  };

  const handleChange = (key: string, value: string) => {
    setChanges((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) return;

    setSaving(true);
    try {
      const settingsToUpdate = Object.entries(changes).map(([key, value]) => ({
        key,
        value,
      }));

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });

      if (res.ok) {
        setChanges({});
        fetchSettings();
        alert("Paramètres enregistrés avec succès !");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const getValue = (setting: SystemSetting) => {
    return changes[setting.key] !== undefined ? changes[setting.key] : setting.value;
  };

  const categoryIcons: Record<string, typeof Settings> = {
    organization: Building,
    email: Mail,
    donations: CreditCard,
    security: Shield,
    notifications: Bell,
    appearance: Palette,
  };

  const categoryLabels: Record<string, string> = {
    organization: "Organisation",
    email: "Email",
    donations: "Dons",
    security: "Sécurité",
    notifications: "Notifications",
    appearance: "Apparence",
  };

  const renderInput = (setting: SystemSetting) => {
    const value = getValue(setting);
    const isChanged = changes[setting.key] !== undefined;

    switch (setting.dataType) {
      case "BOOLEAN":
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => handleChange(setting.key, e.target.checked ? "true" : "false")}
              disabled={setting.isReadOnly}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        );

      case "SELECT":
        const options = setting.options ? JSON.parse(setting.options) : [];
        return (
          <select
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            disabled={setting.isReadOnly}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-purple-500 ${
              isChanged ? "border-purple-500" : "border-slate-700"
            } ${setting.isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case "COLOR":
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              disabled={setting.isReadOnly}
              className="w-12 h-10 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              disabled={setting.isReadOnly}
              className={`flex-1 px-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-purple-500 ${
                isChanged ? "border-purple-500" : "border-slate-700"
              }`}
            />
          </div>
        );

      case "NUMBER":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            disabled={setting.isReadOnly}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-purple-500 ${
              isChanged ? "border-purple-500" : "border-slate-700"
            } ${setting.isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        );

      case "JSON":
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            disabled={setting.isReadOnly}
            rows={3}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500 ${
              isChanged ? "border-purple-500" : "border-slate-700"
            } ${setting.isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        );

      default:
        return (
          <input
            type={setting.dataType === "EMAIL" ? "email" : setting.dataType === "URL" ? "url" : setting.isSecret ? "password" : "text"}
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            disabled={setting.isReadOnly}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-purple-500 ${
              isChanged ? "border-purple-500" : "border-slate-700"
            } ${setting.isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Link href="/admin" className="hover:text-white">Administration</Link>
                <span>/</span>
                <span className="text-white">Paramètres</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Paramètres système</h1>
            </div>
            <div className="flex gap-3">
              {settings.length === 0 && (
                <button
                  onClick={initializeSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Initialiser
                </button>
              )}
              {Object.keys(changes).length > 0 && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Enregistrement..." : `Enregistrer (${Object.keys(changes).length})`}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h2 className="text-lg font-semibold text-white">Catégories</h2>
                </div>
                <div className="divide-y divide-slate-800">
                  {Object.keys(groupedSettings).map((category) => {
                    const Icon = categoryIcons[category] || Settings;
                    return (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`w-full flex items-center gap-3 p-4 transition-colors ${
                          activeCategory === category
                            ? "bg-purple-500/10 border-l-2 border-purple-500 text-white"
                            : "text-gray-400 hover:bg-slate-800/50 hover:text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{categoryLabels[category] || category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Settings Form */}
            <div className="lg:col-span-3">
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h2 className="text-lg font-semibold text-white">
                    {categoryLabels[activeCategory] || activeCategory}
                  </h2>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center text-gray-400">Chargement...</div>
                ) : !groupedSettings[activeCategory] ? (
                  <div className="p-8 text-center text-gray-400">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun paramètre. Cliquez sur &quot;Initialiser&quot; pour commencer.</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {groupedSettings[activeCategory].map((setting) => (
                      <div key={setting.key}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {setting.label}
                          {setting.isRequired && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {renderInput(setting)}
                        {setting.description && (
                          <p className="mt-1 text-xs text-gray-500">{setting.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
