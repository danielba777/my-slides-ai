import * as React from "react";
import { usePresentationState } from "@/states/presentation-state";
import type { CanvasDoc } from "@/canvas/types";

export default function OverlayImageEditorLayer({ slideId }: { slideId: string }) {
  const slides = usePresentationState((s) => s.slides);
  const setSlides = usePresentationState((s) => s.setSlides);

  const dragging = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);

  const getCanvas = React.useCallback(() => {
    const idx = slides.findIndex((s) => s.id === slideId);
    if (idx < 0) return { idx: -1, c: null as CanvasDoc | null };
    const c = (slides[idx].canvas ?? null) as CanvasDoc | null;
    return { idx, c };
  }, [slides, slideId]);

  const getOverlayIndex = (c: CanvasDoc | null) =>
    (c?.nodes ?? []).findIndex((n: any) => n?.type === "image" && n?.id === "user-overlay-image");

  const mutate = (fn: (c: CanvasDoc, i: number) => void) => {
    const { idx, c } = getCanvas();
    if (idx < 0 || !c) return;
    const overlayIdx = getOverlayIndex(c);
    if (overlayIdx < 0) return;
    const next: CanvasDoc = { ...c, nodes: [...(c.nodes ?? [])] };
    fn(next, overlayIdx);
    const updated = slides.slice();
    updated[idx] = { ...updated[idx]!, canvas: next };
    setSlides(updated);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    dragging.current = false;
    last.current = null;
  };

  const onMouseLeave = () => {
    dragging.current = false;
    last.current = null;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    mutate((c, i) => {
      const n = { ...(c.nodes[i] as any) };
      n.x = (n.x ?? 0) + dx;
      n.y = (n.y ?? 0) + dy;
      c.nodes[i] = n;
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.05 : 0.95;
    mutate((c, i) => {
      const n = { ...(c.nodes[i] as any) };
      const prevW = n.width ?? c.width;
      const prevH = n.height ?? c.height;
      const newW = Math.max(20, prevW * factor);
      const newH = Math.max(20, prevH * factor);
      const cx = e.nativeEvent.offsetX;
      const cy = e.nativeEvent.offsetY;
      const px = (cx - (n.x ?? 0)) / prevW;
      const py = (cy - (n.y ?? 0)) / prevH;
      const nx = (n.x ?? 0) + (prevW - newW) * px;
      const ny = (n.y ?? 0) + (prevH - newH) * py;
      n.width = newW;
      n.height = newH;
      n.x = nx;
      n.y = ny;
      c.nodes[i] = n;
    });
  };

  return (
    <div
      className="absolute inset-0 z-[5] cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onWheel={onWheel}
      style={{ pointerEvents: "auto" }}
      aria-label="Overlay image editor layer"
    />
  );
}