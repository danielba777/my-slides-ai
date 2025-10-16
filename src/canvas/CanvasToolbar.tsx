"use client";

import { useMemo, useRef } from "react";
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
  Palette,
  Plus,
  SendToBack,
  Trash2,
  Unlock,
  type LucideIcon,
} from "lucide-react";
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
          "flex w-[320px] flex-col gap-3 rounded-2xl border border-border/80 bg-background/95 px-4 py-3 shadow-xl backdrop-blur",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <ToolbarIconButton
            icon={Plus}
            label="Textfeld hinzufuegen"
            onClick={onAddText}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <ToolbarIconButton
            icon={ImagePlus}
            label="Bild einfuegen"
            onClick={triggerImagePicker}
          />

          <ToolbarIconButton
            icon={Copy}
            label="Auswahl duplizieren"
            onClick={onDuplicate}
            disabled={!selected}
          />

          <ToolbarIconButton
            icon={Camera}
            label="Snapshot speichern"
            onClick={onSnapshot}
          />

          <ToolbarIconButton
            icon={Trash2}
            label="Auswahl entfernen"
            onClick={onDelete}
            disabled={!selected}
          />
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Label
            htmlFor={colorInputId}
            className="text-xs font-medium text-muted-foreground"
          >
            Hintergrund
          </Label>
          <input
            id={colorInputId}
            type="color"
            className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent p-1"
            value={canvas.bg ?? "#ffffff"}
            onChange={(event) => onPatch({ bg: event.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <ToolbarIconButton
            icon={BringToFront}
            label="In den Vordergrund"
            onClick={onFront}
            disabled={!selected}
          />
          <ToolbarIconButton
            icon={SendToBack}
            label="In den Hintergrund"
            onClick={onBack}
            disabled={!selected}
          />
          <ToolbarIconButton
            icon={Lock}
            label="Auswahl sperren"
            onClick={() => onLock(true)}
            disabled={!selected}
          />
          <ToolbarIconButton
            icon={Unlock}
            label="Auswahl entsperren"
            onClick={() => onLock(false)}
            disabled={!selected}
          />
        </div>

        {selectedIsText && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Textinhalt
                </Label>
                <Input
                  value={(selected as any).text ?? ""}
                  onChange={(event) => handleTextChange(event.target.value)}
                  placeholder="Hier schreiben..."
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Schriftgroesse
                  </Label>
                  <Input
                    type="number"
                    className="h-9"
                    value={(selected as any).fontSize ?? 72}
                    onChange={(event) =>
                      handleNumberChange("fontSize", Number(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Breite
                  </Label>
                  <Input
                    type="number"
                    className="h-9"
                    value={(selected as any).width ?? 400}
                    onChange={(event) =>
                      handleNumberChange("width", Number(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Zeilenhoehe
                  </Label>
                  <Input
                    type="number"
                    step="0.05"
                    className="h-9"
                    value={(selected as any).lineHeight ?? 1.12}
                    onChange={(event) =>
                      handleNumberChange("lineHeight", Number(event.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ToolbarIconButton
                  icon={Bold}
                  label="Fett"
                  onClick={() => toggleFontWeight("bold")}
                  active={(selected as any).fontStyle?.includes("bold")}
                />
                <ToolbarIconButton
                  icon={Italic}
                  label="Kursiv"
                  onClick={() => toggleFontWeight("italic")}
                  active={(selected as any).fontStyle?.includes("italic")}
                />
                <ToolbarIconButton
                  icon={AlignLeft}
                  label="Linksbundig"
                  onClick={() => handleAlign("left")}
                  active={(selected as any).align === "left"}
                />
                <ToolbarIconButton
                  icon={AlignCenter}
                  label="Zentriert"
                  onClick={() => handleAlign("center")}
                  active={(selected as any).align === "center"}
                />
                <ToolbarIconButton
                  icon={AlignRight}
                  label="Rechtsbundig"
                  onClick={() => handleAlign("right")}
                  active={(selected as any).align === "right"}
                />

                <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-2 py-1">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="color"
                    className="h-6 w-6 cursor-pointer rounded-full border border-border"
                    value={(selected as any).fill ?? "#111111"}
                    onChange={(event) => handleFillChange(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
