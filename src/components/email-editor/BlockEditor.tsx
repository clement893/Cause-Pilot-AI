"use client";

import { useState } from "react";
import { 
  EmailBlock, 
  TextBlock, 
  HeadingBlock, 
  ImageBlock, 
  ButtonBlock, 
  DividerBlock, 
  SpacerBlock, 
  SocialBlock, 
  FooterBlock,
  ColumnsBlock,
  PERSONALIZATION_VARIABLES,
} from "@/lib/email-editor/types";
import { Plus, Trash2, Upload } from "lucide-react";

interface BlockEditorProps {
  block: EmailBlock;
  onUpdate: (block: EmailBlock) => void;
}

export function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  const updateStyle = (key: string, value: string) => {
    onUpdate({
      ...block,
      style: { ...block.style, [key]: value },
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Éditeur spécifique au type de bloc */}
      {block.type === "text" && <TextEditor block={block as TextBlock} onUpdate={onUpdate} />}
      {block.type === "heading" && <HeadingEditor block={block as HeadingBlock} onUpdate={onUpdate} />}
      {block.type === "image" && <ImageEditor block={block as ImageBlock} onUpdate={onUpdate} />}
      {block.type === "button" && <ButtonEditor block={block as ButtonBlock} onUpdate={onUpdate} />}
      {block.type === "divider" && <DividerEditor block={block as DividerBlock} onUpdate={onUpdate} />}
      {block.type === "spacer" && <SpacerEditor block={block as SpacerBlock} onUpdate={onUpdate} />}
      {block.type === "social" && <SocialEditor block={block as SocialBlock} onUpdate={onUpdate} />}
      {block.type === "footer" && <FooterEditor block={block as FooterBlock} onUpdate={onUpdate} />}
      {block.type === "columns" && <ColumnsEditor block={block as ColumnsBlock} onUpdate={onUpdate} />}

      {/* Styles communs */}
      <div className="border-t border-slate-700 pt-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Style</h4>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Fond</label>
            <input
              type="color"
              value={block.style?.backgroundColor || "#ffffff"}
              onChange={(e) => updateStyle("backgroundColor", e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Alignement</label>
            <div className="flex gap-1">
              {["left", "center", "right"].map((align) => (
                <button
                  key={align}
                  onClick={() => updateStyle("textAlign", align)}
                  className={`flex-1 py-1.5 text-xs rounded ${
                    block.style?.textAlign === align 
                      ? "bg-indigo-600 text-white" 
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {align === "left" ? "Gauche" : align === "center" ? "Centre" : "Droite"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Padding</label>
            <input
              type="text"
              value={block.style?.padding || "10px 20px"}
              onChange={(e) => updateStyle("padding", e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              placeholder="10px 20px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TextEditor({ block, onUpdate }: { block: TextBlock; onUpdate: (block: EmailBlock) => void }) {
  const [showVariables, setShowVariables] = useState(false);

  const insertVariable = (variable: string) => {
    onUpdate({ ...block, content: block.content + variable });
    setShowVariables(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-slate-400">Contenu</label>
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            + Variable
          </button>
        </div>
        {showVariables && (
          <div className="mb-2 p-2 bg-slate-800 rounded border border-slate-600">
            <div className="grid grid-cols-2 gap-1">
              {PERSONALIZATION_VARIABLES.slice(0, 6).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => insertVariable(key)}
                  className="text-xs text-left px-2 py-1 hover:bg-slate-700 rounded"
                >
                  <span className="text-indigo-400">{key}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <textarea
          value={block.content}
          onChange={(e) => onUpdate({ ...block, content: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white min-h-[100px]"
          placeholder="Entrez votre texte..."
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Taille police</label>
        <select
          value={block.style?.fontSize || "16px"}
          onChange={(e) => onUpdate({ ...block, style: { ...block.style, fontSize: e.target.value } })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Couleur texte</label>
        <input
          type="color"
          value={block.style?.color || "#333333"}
          onChange={(e) => onUpdate({ ...block, style: { ...block.style, color: e.target.value } })}
          className="w-full h-8 rounded cursor-pointer"
        />
      </div>
    </div>
  );
}

function HeadingEditor({ block, onUpdate }: { block: HeadingBlock; onUpdate: (block: EmailBlock) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Texte</label>
        <input
          type="text"
          value={block.content}
          onChange={(e) => onUpdate({ ...block, content: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Niveau</label>
        <div className="flex gap-1">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => onUpdate({ ...block, level: level as 1 | 2 | 3 })}
              className={`flex-1 py-1.5 text-xs rounded ${
                block.level === level 
                  ? "bg-indigo-600 text-white" 
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              H{level}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Couleur</label>
        <input
          type="color"
          value={block.style?.color || "#1a1a1a"}
          onChange={(e) => onUpdate({ ...block, style: { ...block.style, color: e.target.value } })}
          className="w-full h-8 rounded cursor-pointer"
        />
      </div>
    </div>
  );
}

function ImageEditor({ block, onUpdate }: { block: ImageBlock; onUpdate: (block: EmailBlock) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        onUpdate({ ...block, src: url });
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Image URL</label>
        <input
          type="text"
          value={block.src}
          onChange={(e) => onUpdate({ ...block, src: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Ou télécharger</label>
        <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-600 rounded cursor-pointer hover:border-indigo-500 transition-colors">
          <Upload className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">
            {uploading ? "Téléchargement..." : "Choisir un fichier"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Texte alternatif</label>
        <input
          type="text"
          value={block.alt}
          onChange={(e) => onUpdate({ ...block, alt: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
          placeholder="Description de l'image"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Largeur</label>
        <select
          value={block.width || "100%"}
          onChange={(e) => onUpdate({ ...block, width: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="100%">100%</option>
          <option value="75%">75%</option>
          <option value="50%">50%</option>
          <option value="300px">300px</option>
          <option value="200px">200px</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Lien (optionnel)</label>
        <input
          type="text"
          value={block.link || ""}
          onChange={(e) => onUpdate({ ...block, link: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

function ButtonEditor({ block, onUpdate }: { block: ButtonBlock; onUpdate: (block: EmailBlock) => void }) {
  const updateButtonStyle = (key: string, value: string) => {
    onUpdate({
      ...block,
      buttonStyle: { ...block.buttonStyle, [key]: value },
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Texte du bouton</label>
        <input
          type="text"
          value={block.text}
          onChange={(e) => onUpdate({ ...block, text: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Lien</label>
        <input
          type="text"
          value={block.link}
          onChange={(e) => onUpdate({ ...block, link: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Couleur fond</label>
        <input
          type="color"
          value={block.buttonStyle?.backgroundColor || "#6366f1"}
          onChange={(e) => updateButtonStyle("backgroundColor", e.target.value)}
          className="w-full h-8 rounded cursor-pointer"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Couleur texte</label>
        <input
          type="color"
          value={block.buttonStyle?.color || "#ffffff"}
          onChange={(e) => updateButtonStyle("color", e.target.value)}
          className="w-full h-8 rounded cursor-pointer"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Arrondi</label>
        <select
          value={block.buttonStyle?.borderRadius || "6px"}
          onChange={(e) => updateButtonStyle("borderRadius", e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="0">Carré</option>
          <option value="4px">Léger</option>
          <option value="6px">Moyen</option>
          <option value="12px">Arrondi</option>
          <option value="9999px">Pilule</option>
        </select>
      </div>
    </div>
  );
}

function DividerEditor({ block, onUpdate }: { block: DividerBlock; onUpdate: (block: EmailBlock) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Style de ligne</label>
        <select
          value={block.lineStyle || "solid"}
          onChange={(e) => onUpdate({ ...block, lineStyle: e.target.value as "solid" | "dashed" | "dotted" })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="solid">Solide</option>
          <option value="dashed">Tirets</option>
          <option value="dotted">Pointillés</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Couleur</label>
        <input
          type="color"
          value={block.lineColor || "#e5e7eb"}
          onChange={(e) => onUpdate({ ...block, lineColor: e.target.value })}
          className="w-full h-8 rounded cursor-pointer"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Épaisseur</label>
        <select
          value={block.lineWidth || "1px"}
          onChange={(e) => onUpdate({ ...block, lineWidth: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="1px">1px</option>
          <option value="2px">2px</option>
          <option value="3px">3px</option>
          <option value="4px">4px</option>
        </select>
      </div>
    </div>
  );
}

function SpacerEditor({ block, onUpdate }: { block: SpacerBlock; onUpdate: (block: EmailBlock) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Hauteur</label>
        <select
          value={block.height}
          onChange={(e) => onUpdate({ ...block, height: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="10px">10px</option>
          <option value="20px">20px</option>
          <option value="30px">30px</option>
          <option value="40px">40px</option>
          <option value="50px">50px</option>
          <option value="60px">60px</option>
        </select>
      </div>
    </div>
  );
}

function SocialEditor({ block, onUpdate }: { block: SocialBlock; onUpdate: (block: EmailBlock) => void }) {
  const platforms = ["facebook", "twitter", "instagram", "linkedin", "youtube"] as const;

  const addLink = () => {
    const availablePlatforms = platforms.filter(p => !block.links.some(l => l.platform === p));
    if (availablePlatforms.length > 0) {
      onUpdate({
        ...block,
        links: [...block.links, { platform: availablePlatforms[0], url: "#" }],
      });
    }
  };

  const removeLink = (index: number) => {
    const newLinks = block.links.filter((_, i) => i !== index);
    onUpdate({ ...block, links: newLinks });
  };

  const updateLink = (index: number, field: "platform" | "url", value: string) => {
    const newLinks = block.links.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    onUpdate({ ...block, links: newLinks });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Taille icônes</label>
        <select
          value={block.iconSize || "32px"}
          onChange={(e) => onUpdate({ ...block, iconSize: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="24px">Petit</option>
          <option value="32px">Moyen</option>
          <option value="40px">Grand</option>
        </select>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400">Liens</label>
          <button
            onClick={addLink}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {block.links.map((link, index) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                value={link.platform}
                onChange={(e) => updateLink(index, "platform", e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
              >
                {platforms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="text"
                value={link.url}
                onChange={(e) => updateLink(index, "url", e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                placeholder="URL"
              />
              <button
                onClick={() => removeLink(index)}
                className="p-1 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FooterEditor({ block, onUpdate }: { block: FooterBlock; onUpdate: (block: EmailBlock) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Nom organisation</label>
        <input
          type="text"
          value={block.companyName || ""}
          onChange={(e) => onUpdate({ ...block, companyName: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Adresse</label>
        <textarea
          value={block.address || ""}
          onChange={(e) => onUpdate({ ...block, address: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white min-h-[60px]"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Texte désabonnement</label>
        <input
          type="text"
          value={block.unsubscribeText || "Se désabonner"}
          onChange={(e) => onUpdate({ ...block, unsubscribeText: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
        />
      </div>
    </div>
  );
}

function ColumnsEditor({ block, onUpdate }: { block: ColumnsBlock; onUpdate: (block: EmailBlock) => void }) {
  const columnLayouts = [
    { label: "2 colonnes (50/50)", columns: [{ width: "50%" }, { width: "50%" }] },
    { label: "2 colonnes (33/67)", columns: [{ width: "33.33%" }, { width: "66.67%" }] },
    { label: "2 colonnes (67/33)", columns: [{ width: "66.67%" }, { width: "33.33%" }] },
    { label: "3 colonnes", columns: [{ width: "33.33%" }, { width: "33.33%" }, { width: "33.33%" }] },
  ];

  const setLayout = (layout: { width: string }[]) => {
    const newColumns = layout.map((col, i) => ({
      id: block.columns[i]?.id || `col-${i + 1}`,
      width: col.width,
      blocks: block.columns[i]?.blocks || [],
    }));
    onUpdate({ ...block, columns: newColumns });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-2">Disposition</label>
        <div className="space-y-1">
          {columnLayouts.map((layout, index) => (
            <button
              key={index}
              onClick={() => setLayout(layout.columns)}
              className="w-full text-left px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              {layout.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Note: Pour ajouter du contenu dans les colonnes, utilisez l&apos;éditeur HTML avancé.
      </p>
    </div>
  );
}
