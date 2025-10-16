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
        // kompakt & mittig – keine unnötige Breite
        "mx-auto w-auto",
        className,
      )}
    >
      <div
        className={cn(
          // rechte Spalte nicht strecken: nur so breit wie Inhalt
          "grid grid-cols-[auto,auto] items-center justify-center gap-3 rounded-2xl border border-border/80",
          "bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80",
        )}
      >
        {/* Linke Spalte: „Text +“ */}
        <div className="pl-1">
          <button
            type="button"
            onClick={handleAdd}
            className={cn(
              // wie im Side-Menü: klare Fläche, Primary-Kontrast
              "inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium",
              "bg-primary text-primary-foreground hover:opacity-90 transition",
              "focus-visible:outline-none focus-visible:ring-0",
            )}
            aria-label="Text hinzufügen"
            title="Text hinzufügen"
          >
            <Plus className="mr-2 h-4 w-4" />
            Text
          </button>
        </div>

        {/* Rechte Spalte: Controls zentriert, keine Restbreite */}
        <div className={cn("flex flex-wrap items-center justify-center gap-2")}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default LegacyEditorToolbar;
