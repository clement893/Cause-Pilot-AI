"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { EmailBlock } from "@/lib/email-editor/types";
import { BlockItem } from "./BlockItem";

interface DraggableBlockProps {
  block: EmailBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function DraggableBlock({ block, isSelected, onSelect, onDelete, onDuplicate }: DraggableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isSelected ? "ring-2 ring-indigo-500" : ""}`}
      onClick={onSelect}
    >
      {/* Poignée de drag et actions */}
      <div className={`absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-1 bg-surface-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity ${isDragging ? "opacity-100" : ""}`}>
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing"
          title="Glisser pour réorganiser"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 text-slate-400 hover:text-indigo-400"
          title="Dupliquer"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-slate-400 hover:text-error-light"
          title="Supprimer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Contenu du bloc */}
      <div className={`ml-0 group-hover:ml-8 transition-all ${isDragging ? "ml-8" : ""}`}>
        <BlockItem block={block} />
      </div>

      {/* Indicateur de type de bloc */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs bg-surface-secondary/80 text-slate-300 px-2 py-0.5 rounded">
          {getBlockTypeLabel(block.type)}
        </span>
      </div>
    </div>
  );
}

function getBlockTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: "Texte",
    heading: "Titre",
    image: "Image",
    button: "Bouton",
    divider: "Diviseur",
    spacer: "Espace",
    columns: "Colonnes",
    social: "Réseaux",
    footer: "Pied",
  };
  return labels[type] || type;
}
