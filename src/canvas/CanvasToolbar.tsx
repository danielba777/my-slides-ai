"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  BringToFront,
  Camera,
  Copy,
  ImagePlus,
  Italic,
  Lock,
  Plus,
  SendToBack,
  Trash2,
  Unlock,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef } from "react";
import type { CanvasDoc, CanvasNode } from "./types";

type Props = {
  canvas: CanvasDoc;
  onPatch: (patch: Partial<CanvasDoc>) => void;
  onSnapshot: () => void;
  onAddText: () => void;
  onAddImageFile: (file: File) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFront: () => void;
  onBack: () => void;
  onLock: (lock: boolean) => void;
  selected?: CanvasNode;
  className?: string;
};

type ToolbarIconButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
};

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}: ToolbarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground",
            active && "border-primary/70 bg-primary/10 text-primary",
          )}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function CanvasToolbar({
  canvas,
  onPatch,
  onSnapshot,
  onAddText,
  onAddImageFile,
  onDuplicate,
  onDelete,
  onFront,
  onBack,
  onLock,
  selected,
  className,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputId = useMemo(
    () => `canvas-bg-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const selectedIsText = selected?.type === "text";

  const applyToSelected = (updater: (node: CanvasNode) => CanvasNode) => {
    if (!selected) return;
    onPatch({
      nodes: canvas.nodes.map((node) =>
        node.id === selected.id ? updater(node) : node,
      ),
    });
  };

  const handleTextChange = (value: string) => {
    applyToSelected((node) => {
      if (node.type !== "text") return node;
      return {
        ...node,
        text: value,
        content: value,
      };
    });
  };

  const handleNumberChange = (
    key: "fontSize" | "width" | "lineHeight" | "letterSpacing",
    value: number,
  ) => {
    applyToSelected((node) => {
      if (node.type !== "text") return node;
      return {
        ...node,
        [key]: value,
      };
    });
  };

  const handleAlign = (align: "left" | "center" | "right") => {
    applyToSelected((node) => {
      if (node.type !== "text") return node;
      return {
        ...node,
        align,
      };
    });
  };

  const toggleFontWeight = (style: "bold" | "italic") => {
    applyToSelected((node) => {
      if (node.type !== "text") return node;
      const current = node.fontStyle ?? "normal";
      const hasBold = current.includes("bold");
      const hasItalic = current.includes("italic");

      const nextBold = style === "bold" ? !hasBold : hasBold;
      const nextItalic = style === "italic" ? !hasItalic : hasItalic;

      let next: "normal" | "bold" | "italic" | "bold italic" = "normal";
      if (nextBold && nextItalic) next = "bold italic";
      else if (nextBold) next = "bold";
      else if (nextItalic) next = "italic";

      return {
        ...node,
        fontStyle: next,
      };
    });
  };

  const handleFillChange = (value: string) => {
    applyToSelected((node) => {
      if (node.type !== "text") return node;
      return {
        ...node,
        fill: value,
      };
    });
  };

  const triggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddImageFile(file);
      event.target.value = "";
    }
  };

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={0}>
      <div
        className={cn(
          // Container wie Side-Menü: Card-Optik, Blur, Theme-Variablen
          "grid grid-cols-[auto,1fr] items-start gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur",
          // Breite etwas größer, da jetzt 2 Spalten
          "w-[420px]",
          className,
        )}
      >
        {/* Linke Spalte: Immer sichtbarer Add-Text Button */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onAddText}
            className={cn(
              // groß, klar, wie im Side-Menü
              "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium",
              "bg-primary text-primary-foreground hover:opacity-90 transition",
              // keine Ringe/Outlines
              "focus-visible:outline-none focus-visible:ring-0",
              // full width of left column
              "w-[90px]",
            )}
            aria-label="New Text Field"
            title="New Text Field"
          >
            <Plus className="mr-2 h-4 w-4" />
            Text +
          </button>
        </div>

        {/* Rechte Spalte: Alle weiteren Controls, sauber gestapelt */}
        <div className="flex flex-col gap-3">
          {/* Datei-Eingabe unsichtbar halten */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Top action bar: Insert Image, Duplicate, Snapshot, Delete */}
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarIconButton
              icon={ImagePlus}
              label="Insert Image"
              onClick={triggerImagePicker}
            />
            <ToolbarIconButton
              icon={Copy}
              label="Duplicate Selection"
              onClick={onDuplicate}
              disabled={!selected}
            />
            <ToolbarIconButton
              icon={Camera}
              label="Save Snapshot"
              onClick={onSnapshot}
            />
            <ToolbarIconButton
              icon={Trash2}
              label="Remove Selection"
              onClick={onDelete}
              disabled={!selected}
            />
          </div>

          {/* Text Formatting (only active when text is selected) */}
          <div className="flex items-center gap-2">
            <ToolbarIconButton
              icon={Bold}
              label="Bold"
              onClick={() => toggleFontWeight("bold")}
              disabled={!selectedIsText}
              active={
                selectedIsText &&
                (selected?.fontStyle ?? "normal").includes("bold")
              }
            />
            <ToolbarIconButton
              icon={Italic}
              label="Italic"
              onClick={() => toggleFontWeight("italic")}
              disabled={!selectedIsText}
              active={
                selectedIsText &&
                (selected?.fontStyle ?? "normal").includes("italic")
              }
            />
            <ToolbarIconButton
              icon={AlignLeft}
              label="Align Left"
              onClick={() => handleAlign("left")}
              disabled={!selectedIsText}
              active={selectedIsText && selected?.align === "left"}
            />
            <ToolbarIconButton
              icon={AlignCenter}
              label="Align Center"
              onClick={() => handleAlign("center")}
              disabled={!selectedIsText}
              active={
                selectedIsText && (selected?.align ?? "center") === "center"
              }
            />
            <ToolbarIconButton
              icon={AlignRight}
              label="Align Right"
              onClick={() => handleAlign("right")}
              disabled={!selectedIsText}
              active={selectedIsText && selected?.align === "right"}
            />
          </div>

          {/* Colors & Layers */}
          <div className="flex items-center gap-2">
            <Label
              htmlFor={colorInputId}
              className="text-xs text-muted-foreground"
            >
              Text Color
            </Label>
            <input
              id={colorInputId}
              type="color"
              onChange={(e) => handleFillChange(e.target.value)}
              value={
                (selectedIsText ? (selected?.fill as string) : canvas.bg) ??
                "#111111"
              }
              disabled={!selectedIsText}
              className="h-8 w-10 cursor-pointer rounded-md border border-border bg-background p-1"
              aria-label="Text Color"
              title="Text Color"
            />

            <Separator orientation="vertical" className="h-6" />

            <ToolbarIconButton
              icon={BringToFront}
              label="Bring to Front"
              onClick={onFront}
              disabled={!selected}
            />
            <ToolbarIconButton
              icon={SendToBack}
              label="Send to Back"
              onClick={onBack}
              disabled={!selected}
            />
            <ToolbarIconButton
              icon={selected?.locked ? Unlock : Lock}
              label={selected?.locked ? "Unlock" : "Lock"}
              onClick={() => onLock(!(selected?.locked ?? false))}
              disabled={!selected}
            />
          </div>

          {/* Typography & Dimensions */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Input
              type="number"
              min={8}
              step={1}
              value={selectedIsText ? (selected?.fontSize ?? 64) : 64}
              onChange={(e) =>
                handleNumberChange("fontSize", Number(e.target.value))
              }
              disabled={!selectedIsText}
              className="h-8 w-20"
            />

            <Label className="text-xs text-muted-foreground">Width</Label>
            <Input
              type="number"
              min={50}
              step={10}
              value={selectedIsText ? (selected?.width ?? 400) : 400}
              onChange={(e) =>
                handleNumberChange("width", Number(e.target.value))
              }
              disabled={!selectedIsText}
              className="h-8 w-24"
            />

            <Label className="text-xs text-muted-foreground">Zeilenh.</Label>
            <Input
              type="number"
              step={0.05}
              value={selectedIsText ? (selected?.lineHeight ?? 1.2) : 1.2}
              onChange={(e) =>
                handleNumberChange("lineHeight", Number(e.target.value))
              }
              disabled={!selectedIsText}
              className="h-8 w-20"
            />

            <Label className="text-xs text-muted-foreground">Buchst.</Label>
            <Input
              type="number"
              step={0.5}
              value={selectedIsText ? (selected?.letterSpacing ?? 0) : 0}
              onChange={(e) =>
                handleNumberChange("letterSpacing", Number(e.target.value))
              }
              disabled={!selectedIsText}
              className="h-8 w-20"
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
