"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { 
  Type, 
  Image, 
  MousePointer, 
  Minus, 
  Space, 
  Columns, 
  Share2, 
  FileText,
  Heading1,
  Trash2,
  Settings,
  Eye,
  Smartphone,
  Monitor,
  Undo,
  Redo,
  Save,
  Copy,
} from "lucide-react";
import { EmailBlock, BlockType, EmailTemplate, PERSONALIZATION_VARIABLES } from "@/lib/email-editor/types";
import { createBlock, blocksToHtml } from "@/lib/email-editor/utils";
import { BlockItem } from "./BlockItem";
import { BlockEditor } from "./BlockEditor";
import { DraggableBlock } from "./DraggableBlock";

interface EmailEditorProps {
  initialTemplate?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onExport?: (html: string) => void;
}

const BLOCK_TYPES: { type: BlockType; icon: React.ReactNode; label: string }[] = [
  { type: "heading", icon: <Heading1 className="w-5 h-5" />, label: "Titre" },
  { type: "text", icon: <Type className="w-5 h-5" />, label: "Texte" },
  { type: "image", icon: <Image className="w-5 h-5" />, label: "Image" },
  { type: "button", icon: <MousePointer className="w-5 h-5" />, label: "Bouton" },
  { type: "divider", icon: <Minus className="w-5 h-5" />, label: "Diviseur" },
  { type: "spacer", icon: <Space className="w-5 h-5" />, label: "Espace" },
  { type: "columns", icon: <Columns className="w-5 h-5" />, label: "Colonnes" },
  { type: "social", icon: <Share2 className="w-5 h-5" />, label: "Réseaux" },
  { type: "footer", icon: <FileText className="w-5 h-5" />, label: "Pied" },
];

export function EmailEditor({ initialTemplate, onSave, onExport }: EmailEditorProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialTemplate?.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState<EmailBlock[][]>([initialTemplate?.blocks || []]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [globalStyle, setGlobalStyle] = useState(initialTemplate?.globalStyle || {
    backgroundColor: "#ffffff",
    fontFamily: "Arial, sans-serif",
    contentWidth: "600px",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const saveToHistory = useCallback((newBlocks: EmailBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Si c'est un nouveau bloc depuis la palette
    if (active.id.toString().startsWith("new-")) {
      const blockType = active.id.toString().replace("new-", "") as BlockType;
      const newBlock = createBlock(blockType);
      
      const overIndex = blocks.findIndex(b => b.id === over.id);
      const newBlocks = [...blocks];
      
      if (overIndex >= 0) {
        newBlocks.splice(overIndex, 0, newBlock);
      } else {
        newBlocks.push(newBlock);
      }
      
      setBlocks(newBlocks);
      saveToHistory(newBlocks);
      setSelectedBlockId(newBlock.id);
      return;
    }

    // Réorganisation des blocs existants
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex);
        setBlocks(newBlocks);
        saveToHistory(newBlocks);
      }
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = (updatedBlock: EmailBlock) => {
    const newBlocks = blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const block = blocks[blockIndex];
    const newBlock = { ...JSON.parse(JSON.stringify(block)), id: crypto.randomUUID() };
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: initialTemplate?.id || crypto.randomUUID(),
        name: initialTemplate?.name || "Nouveau template",
        blocks,
        globalStyle,
        createdAt: initialTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleExport = () => {
    const html = blocksToHtml(blocks, globalStyle);
    if (onExport) {
      onExport(html);
    }
  };

  const getPreviewHtml = () => {
    return blocksToHtml(blocks, globalStyle);
  };

  return (
    <div className="flex h-full bg-slate-950">
      {/* Panneau gauche - Blocs disponibles */}
      <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Blocs</h3>
          <div className="grid grid-cols-3 gap-2">
            {BLOCK_TYPES.map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => handleAddBlock(type)}
                className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
                title={label}
              >
                <div className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                  {icon}
                </div>
                <span className="text-xs text-slate-500 group-hover:text-slate-300 mt-1">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Variables de personnalisation */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Variables</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {PERSONALIZATION_VARIABLES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => navigator.clipboard.writeText(key)}
                className="w-full text-left px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title={`Cliquez pour copier: ${key}`}
              >
                <span className="font-mono text-indigo-400">{key}</span>
                <span className="ml-2 text-slate-500">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Style global */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-3">Style global</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fond</label>
              <input
                type="color"
                value={globalStyle.backgroundColor}
                onChange={(e) => setGlobalStyle({ ...globalStyle, backgroundColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Police</label>
              <select
                value={globalStyle.fontFamily}
                onChange={(e) => setGlobalStyle({ ...globalStyle, fontFamily: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Tahoma, sans-serif">Tahoma</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Largeur</label>
              <select
                value={globalStyle.contentWidth}
                onChange={(e) => setGlobalStyle({ ...globalStyle, contentWidth: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="500px">500px</option>
                <option value="600px">600px</option>
                <option value="700px">700px</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Zone centrale - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Barre d'outils */}
        <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Annuler"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rétablir"
            >
              <Redo className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`p-2 rounded ${previewMode === "desktop" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
              title="Aperçu desktop"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`p-2 rounded ${previewMode === "mobile" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
              title="Aperçu mobile"
            >
              <Smartphone className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2" />
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded ${showPreview ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="Prévisualiser"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm text-slate-300 hover:text-white border border-slate-600 rounded hover:bg-slate-800 transition-colors"
            >
              Exporter HTML
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Canvas / Prévisualisation */}
        <div className="flex-1 overflow-auto p-8 bg-slate-800">
          {showPreview ? (
            <div 
              className="mx-auto bg-white shadow-xl"
              style={{ 
                width: previewMode === "mobile" ? "375px" : globalStyle.contentWidth,
                minHeight: "500px",
              }}
            >
              <iframe
                srcDoc={getPreviewHtml()}
                className="w-full h-full min-h-[500px]"
                title="Email Preview"
              />
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div 
                className="mx-auto bg-white shadow-xl min-h-[500px]"
                style={{ 
                  width: previewMode === "mobile" ? "375px" : globalStyle.contentWidth,
                  backgroundColor: globalStyle.backgroundColor,
                }}
              >
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p className="text-lg mb-2">Glissez des blocs ici</p>
                    <p className="text-sm">ou cliquez sur un bloc dans le panneau de gauche</p>
                  </div>
                ) : (
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.map((block) => (
                      <DraggableBlock
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onDelete={() => handleDeleteBlock(block.id)}
                        onDuplicate={() => handleDuplicateBlock(block.id)}
                      />
                    ))}
                  </SortableContext>
                )}
              </div>

              <DragOverlay>
                {activeId && !activeId.startsWith("new-") ? (
                  <div className="opacity-80">
                    <BlockItem block={blocks.find(b => b.id === activeId)!} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* Panneau droit - Éditeur de bloc */}
      {selectedBlock && !showPreview && (
        <div className="w-80 bg-slate-900 border-l border-slate-700 overflow-y-auto">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Propriétés
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDuplicateBlock(selectedBlock.id)}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title="Dupliquer"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteBlock(selectedBlock.id)}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <BlockEditor
            block={selectedBlock}
            onUpdate={handleUpdateBlock}
          />
        </div>
      )}
    </div>
  );
}
