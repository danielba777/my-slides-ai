"use client";
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
};

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
}: Props) {
  return (
    <div className="w-72 shrink-0 space-y-3">
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Canvas</div>
        <div className="flex items-center gap-2">
          <label className="text-xs">BG</label>
          <input
            type="color"
            value={canvas.bg ?? "#ffffff"}
            onChange={(e) => onPatch({ bg: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="rounded border px-2 py-1 text-sm"
            onClick={onAddText}
          >
            Text
          </button>
          <label className="rounded border px-2 py-1 text-sm cursor-pointer">
            Bild
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAddImageFile(f);
              }}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded border px-2 py-1 text-sm"
            onClick={onDuplicate}
          >
            Duplicate
          </button>
          <button
            className="rounded border px-2 py-1 text-sm"
            onClick={onDelete}
          >
            Delete
          </button>
          <button
            className="rounded border px-2 py-1 text-sm"
            onClick={onFront}
          >
            Front
          </button>
          <button className="rounded border px-2 py-1 text-sm" onClick={onBack}>
            Back
          </button>
          <button
            className="rounded border px-2 py-1 text-sm"
            onClick={() => onLock(true)}
          >
            Lock
          </button>
          <button
            className="rounded border px-2 py-1 text-sm"
            onClick={() => onLock(false)}
          >
            Unlock
          </button>
        </div>
        <button
          className="rounded border px-2 py-1 text-sm"
          onClick={onSnapshot}
        >
          Snapshot speichern
        </button>
      </div>

      {selected && selected.type === "text" && (
        <div className="rounded-md border p-3 space-y-2">
          <div className="text-sm font-medium">Text</div>
          <input
            className="w-full rounded border px-2 py-1 text-sm"
            value={selected.text}
            onChange={(e) =>
              onPatch({
                nodes: canvas.nodes.map((n) =>
                  n.id === selected.id ? { ...n, text: e.target.value } : n,
                ),
              })
            }
          />
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs">Font</label>
            <input
              className="w-40 rounded border px-2 py-1 text-sm"
              value={selected.fontFamily ?? ""}
              onChange={(e) =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id
                      ? { ...n, fontFamily: e.target.value }
                      : n,
                  ),
                })
              }
              placeholder="Inter, Roboto, ..."
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs">Size</label>
            <input
              type="number"
              className="w-24 rounded border px-2 py-1 text-sm"
              value={selected.fontSize ?? 64}
              onChange={(e) =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id
                      ? { ...n, fontSize: Number(e.target.value) }
                      : n,
                  ),
                })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs">Farbe</label>
            <input
              type="color"
              value={selected.fill ?? "#111111"}
              onChange={(e) =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, fill: e.target.value } : n,
                  ),
                })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs">Outline</label>
            <input
              type="color"
              value={selected.stroke ?? "#000000"}
              onChange={(e) =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, stroke: e.target.value } : n,
                  ),
                })
              }
            />
            <input
              type="number"
              className="w-16 rounded border px-2 py-1 text-sm"
              value={selected.strokeWidth ?? 0}
              onChange={(e) =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id
                      ? { ...n, strokeWidth: Number(e.target.value) }
                      : n,
                  ),
                })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs">Text-BG</label>
            <input
              type="color"
              value={selected.textBg ?? "#ffffff"}
              onChange={(e) =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, textBg: e.target.value } : n,
                  ),
                })
              }
            />
            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={() =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, textBg: null } : n,
                  ),
                })
              }
            >
              BG aus
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={() =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, fontStyle: "bold" } : n,
                  ),
                })
              }
            >
              B
            </button>
            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={() =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, fontStyle: "italic" } : n,
                  ),
                })
              }
            >
              I
            </button>
            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={() =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, align: "left" } : n,
                  ),
                })
              }
            >
              ⟸
            </button>
            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={() =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, align: "center" } : n,
                  ),
                })
              }
            >
              ≡
            </button>
            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={() =>
                onPatch({
                  nodes: canvas.nodes.map((n) =>
                    n.id === selected.id ? { ...n, align: "right" } : n,
                  ),
                })
              }
            >
              ⟹
            </button>
          </div>
          <input
            className="w-full rounded border px-2 py-1 text-sm"
            placeholder="https://link..."
            value={selected.link ?? ""}
            onChange={(e) =>
              onPatch({
                nodes: canvas.nodes.map((n) =>
                  n.id === selected.id
                    ? { ...n, link: e.target.value || null }
                    : n,
                ),
              })
            }
          />
        </div>
      )}
    </div>
  );
}
