"use client";
import {
  CanvasDoc,
  CanvasImageNode,
  CanvasNode,
  CanvasTextNode,
} from "./types";

export const withDefaults = (c?: CanvasDoc): CanvasDoc => ({
  version: 1,
  width: c?.width ?? 1080,
  height: c?.height ?? 1620, // 2:3 aspect ratio
  bg: c?.bg ?? "#ffffff",
  nodes: c?.nodes ?? [],
  selection: c?.selection ?? [],
  previewDataUrl: c?.previewDataUrl,
});

export const addText = (c: CanvasDoc, text = "Neuer Text"): CanvasDoc => ({
  ...c,
  nodes: [
    ...c.nodes,
    (() => {
      const width = Math.round(c.width * 0.7); // ~70% Breite
      const x = Math.round((c.width - width) / 2); // horizontal zentriert
      const y = Math.round(c.height * (1 / 3)); // ~1/3 von oben
      return {
        id: crypto.randomUUID(),
        type: "text",
        x,
        y,
        text,
        fontFamily: "Inter",
        fontSize: 64,
        fill: "#111",
        stroke: "#000",
        strokeWidth: 0,
        padding: 8,
        textBg: null,
        align: "center",
        width,
      } satisfies CanvasTextNode;
    })(),
  ],
  selection: [],
});

export const addImage = (c: CanvasDoc, url: string): CanvasDoc => ({
  ...c,
  nodes: [
    ...c.nodes,
    {
      id: crypto.randomUUID(),
      type: "image",
      x: 0,
      y: 0,
      width: c.width,
      height: c.height,
      url,
    } satisfies CanvasImageNode,
  ],
  selection: [],
});

export const updateNode = (
  c: CanvasDoc,
  id: string,
  patch: Partial<CanvasNode>,
): CanvasDoc => ({
  ...c,
  nodes: c.nodes.map((n) =>
    n.id === id ? ({ ...n, ...patch } as CanvasNode) : n,
  ),
});

export const selectOnly = (c: CanvasDoc, ids: string[]): CanvasDoc => ({
  ...c,
  selection: ids,
});

export const removeSelected = (c: CanvasDoc): CanvasDoc => {
  const set = new Set(c.selection);
  return { ...c, nodes: c.nodes.filter((n) => !set.has(n.id)), selection: [] };
};

export const duplicateSelected = (c: CanvasDoc): CanvasDoc => {
  if (!c.selection?.length) return c;
  const set = new Set(c.selection);
  const clones = c.nodes
    .filter((n) => set.has(n.id))
    .map((n) => ({ ...n, id: crypto.randomUUID(), x: n.x + 20, y: n.y + 20 }));
  return { ...c, nodes: [...c.nodes, ...clones], selection: [] };
};

export const zOrder = (c: CanvasDoc, dir: "front" | "back"): CanvasDoc => {
  if (!c.selection?.length) return c;
  const set = new Set(c.selection);
  const picked = c.nodes.filter((n) => set.has(n.id));
  const others = c.nodes.filter((n) => !set.has(n.id));
  return dir === "front"
    ? { ...c, nodes: [...others, ...picked] }
    : { ...c, nodes: [...picked, ...others] };
};

export const lockSelected = (c: CanvasDoc, lock = true): CanvasDoc => {
  if (!c.selection?.length) return c;
  const set = new Set(c.selection);
  return {
    ...c,
    nodes: c.nodes.map((n: any) =>
      set.has(n.id) ? { ...n, locked: lock } : n,
    ),
    selection: [],
  };
};
