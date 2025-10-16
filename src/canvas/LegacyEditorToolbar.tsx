"use client";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import * as React from "react";

type LegacyEditorToolbarProps = {
  /** Wird beim Klick auf „Text +“ aufgerufen */
  onAddText?: () => void;
  /** Rechte Seite: hier werden die bestehenden Legacy-Controls (B, I, Slider, Farben, …) reingereicht */
  children: React.ReactNode;
  className?: string;
};

/**
 * Präsentations-/Layout-Komponente für die Legacy-Canvas-Toolbar.
 * - Immer sichtbar
 * - An Side-Menü angelehnt: Border, bg-background/95, shadow, rounded-xl, backdrop-blur
 * - 2 Spalten: links „Text +“, rechts vorhandene Controls (als children)
 * - Keine Logikänderung an den Controls selbst – nur Aussehen/Struktur.
 */
export function LegacyEditorToolbar({
  onAddText,
  children,
  className,
}: LegacyEditorToolbarProps) {
  const handleAdd = React.useCallback(() => {
    if (onAddText) {
      onAddText();
      return;
    }
    // Fallback: feuert ein globales Event, das (falls verdrahtet) ein Textfeld im Canvas erzeugt.
    window.dispatchEvent(new CustomEvent("canvas:add-text"));
  }, [onAddText]);

  return (
    <div
      className={cn(
        // mittig & auf sinnvolle Breite begrenzt
        "mx-auto w-full max-w-[960px]",
        className,
      )}
    >
      <div
        className={cn(
          // Desktop: eine Zeile; Mobile: darf umbrechen
          "flex md:flex-nowrap flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border/80",
          "bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 w-full min-w-0",
        )}
      >
        {/* „Text +“ ganz links in derselben oberen Zeile */}
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium shrink-0",
            "bg-primary text-primary-foreground hover:opacity-90 transition",
            "focus-visible:outline-none focus-visible:ring-0",
          )}
          aria-label="Text hinzufügen"
          title="Text hinzufügen"
        >
          <Plus className="mr-2 h-4 w-4" />
          Text
        </button>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export default LegacyEditorToolbar;
