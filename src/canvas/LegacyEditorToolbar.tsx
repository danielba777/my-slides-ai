"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { SlideTextElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Paintbrush,
  Plus,
} from "lucide-react";
import * as React from "react";
import { useCallback } from "react";

type TextBgMode = "block" | "blob";

type LegacyEditorToolbarProps = {
  /** Wird beim Klick auf „Text +“ aufgerufen */
  onAddText?: () => void;
  /** Vorhandene (legacy) Controls werden hier gerendert */
  children: React.ReactNode;
  className?: string;
  selectedText?: SlideTextElement | null;
  onChangeSelectedText?: (patch: Partial<SlideTextElement>) => void;
};

/**
 * Ultra-kompakte, moderne Toolbar (iOS-like):
 * – Primärzeile mit: „+ Text", Ausrichtung, BG-Toggle (mit Mini-Panel)
 * – Legacy-Controls wandern sauber in ein Collapsible
 * – Breite: niemals größer als Parent (Canvas) – der Parent begrenzt das maxWidth
 */
function LegacyEditorToolbar({
  onAddText,
  children,
  className,
  selectedText,
  onChangeSelectedText,
}: LegacyEditorToolbarProps) {
  const handleAdd = useCallback(() => {
    if (onAddText) return onAddText();
    window.dispatchEvent(new CustomEvent("canvas:add-text"));
  }, [onAddText]);

  const [textBgEnabled, setTextBgEnabled] = React.useState(false);
  const [textBgMode, setTextBgMode] = React.useState<TextBgMode>("block");
  const [textBgPadding, setTextBgPadding] = React.useState(12);
  const [textBgRadius, setTextBgRadius] = React.useState(12);
  const [textBgOpacity, setTextBgOpacity] = React.useState(55); // 0-100
  const [textBgColor, setTextBgColor] = React.useState<string>("#000000");

  const hasSelection = !!selectedText;
  const selectedBackground = selectedText?.background;

  React.useEffect(() => {
    if (!selectedBackground) {
      setTextBgEnabled(false);
      setTextBgMode("block");
      setTextBgPadding(12);
      setTextBgRadius(12);
      setTextBgOpacity(55);
      setTextBgColor("#000000");
      return;
    }
    setTextBgEnabled(!!selectedBackground.enabled);
    setTextBgMode(selectedBackground.mode ?? "block");
    setTextBgPadding(selectedBackground.paddingX ?? 12);
    setTextBgRadius(selectedBackground.radius ?? 12);
    setTextBgOpacity(Math.round((selectedBackground.opacity ?? 0.55) * 100));
    setTextBgColor(selectedBackground.color ?? "#000000");
  }, [
    selectedText?.id,
    selectedBackground?.enabled,
    selectedBackground?.mode,
    selectedBackground?.paddingX,
    selectedBackground?.radius,
    selectedBackground?.opacity,
    selectedBackground?.color,
  ]);

  const buildBackground = useCallback(
    (overrides?: Partial<SlideTextElement["background"]>) => ({
      enabled: overrides?.enabled ?? textBgEnabled,
      mode: overrides?.mode ?? textBgMode,
      color: overrides?.color ?? textBgColor,
      opacity: overrides?.opacity ?? textBgOpacity / 100,
      paddingX: overrides?.paddingX ?? textBgPadding,
      paddingY: overrides?.paddingY ?? textBgPadding,
      radius: overrides?.radius ?? textBgRadius,
      lineOverlap:
        overrides?.lineOverlap ?? selectedBackground?.lineOverlap ?? 0,
    }),
    [
      textBgEnabled,
      textBgMode,
      textBgColor,
      textBgOpacity,
      textBgPadding,
      textBgRadius,
      selectedBackground?.lineOverlap,
    ],
  );

  const commitBackground = useCallback(
    (overrides?: Partial<SlideTextElement["background"]>) => {
      if (!onChangeSelectedText) return;
      onChangeSelectedText({ background: buildBackground(overrides) });
    },
    [buildBackground, onChangeSelectedText],
  );

  const handleToggleBg = useCallback(
    (v: boolean) => {
      setTextBgEnabled(v);
      if (!hasSelection) return;
      commitBackground({ enabled: v });
    },
    [commitBackground, hasSelection],
  );

  const handleModeChange = useCallback(
    (mode: TextBgMode) => {
      setTextBgMode(mode);
      if (!hasSelection) return;
      commitBackground({ mode });
    },
    [commitBackground, hasSelection],
  );

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-border/60 bg-background/80 backdrop-blur-md shadow-sm supports-backdrop-blur:bg-background/60",
        className,
      )}
      role="toolbar"
      aria-label="Canvas toolbar"
    >
      {/* === Primärzeile: nur wichtigste Controls === */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        <div className="flex items-center gap-2">
          {/* + Text */}
          <Button
            size="icon"
            variant="secondary"
            className="rounded-xl"
            onClick={handleAdd}
            aria-label="Text hinzufügen"
            title="Text hinzufügen"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Bold / Italic */}
          <Button size="icon" variant="ghost" className="rounded-xl">
            <span className="font-bold text-base">B</span>
          </Button>
          <Button size="icon" variant="ghost" className="rounded-xl italic">
            I
          </Button>

          {/* Align */}
          <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
            <Button size="icon" variant="ghost" className="rounded-md">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-md">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-md">
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sekundärzeile: „Erweiterte Optionen" */}
      <div className="border-t px-3">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between rounded-xl">
              Erweiterte Optionen
              <ChevronDown className="h-4 w-4 data-[state=open]:hidden" />
              <ChevronUp className="hidden h-4 w-4 data-[state=open]:block" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-wrap items-center gap-3 py-3">
              <MiniRange
                label="Padding"
                min={0}
                max={48}
                value={textBgPadding}
                onChange={(v) => {
                  setTextBgPadding(v);
                  commitBackground({ paddingX: v, paddingY: v });
                }}
              />
              <MiniRange
                label="Rundung"
                min={0}
                max={64}
                value={textBgRadius}
                onChange={(v) => {
                  setTextBgRadius(v);
                  commitBackground({ radius: v });
                }}
              />
              <MiniRange
                label="Transparenz"
                min={0}
                max={100}
                value={textBgOpacity}
                onChange={(v) => {
                  setTextBgOpacity(v);
                  commitBackground({ opacity: v / 100 });
                }}
              />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Farbe</span>
                <input
                  type="color"
                  value={textBgColor}
                  onChange={(e) => {
                    const c = e.currentTarget.value;
                    setTextBgColor(c);
                    commitBackground({ color: c });
                  }}
                  className="h-6 w-7 cursor-pointer rounded-md border border-border bg-background p-0.5"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Modus: {textBgMode === "block" ? "Block" : "Blob"}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setTextBgMode("block"); commitBackground({ mode: "block" }); }}>
                    Block
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setTextBgMode("blob"); commitBackground({ mode: "blob" }); }}>
                    Blob
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
export default LegacyEditorToolbar;

// -------- Mini Range Control (kompakt & einheitlich) ----------
function MiniRange({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.currentTarget.value))}
        className="h-1.5 w-24"
      />
    </div>
  );
}
