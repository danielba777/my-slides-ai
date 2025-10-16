"use client";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image as KImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import CanvasToolbar from "./CanvasToolbar";
import {
  addImage,
  addText,
  duplicateSelected,
  lockSelected,
  removeSelected,
  selectOnly,
  updateNode,
  withDefaults,
  zOrder,
} from "./commands";
import { ensureFonts, getSnap, loadImage } from "./konva-helpers";
import { CanvasDoc, CanvasNode, DEFAULT_CANVAS } from "./types";

type Props = {
  value?: CanvasDoc;
  onChange: (next: CanvasDoc) => void;
};

export default function SlideCanvas({ value, onChange }: Props) {
  const canvas = withDefaults(value ?? DEFAULT_CANVAS);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const selectionRectRef = useRef<any>(null);
  const selection = new Set(canvas.selection);

  // ⬇️ Responsive: Wrapper misst verfügbaren Platz, Stage wird passend skaliert
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // Stabil: nur auf WINDOW-Resize reagieren (kein ResizeObserver auf dem Wrapper!)
  useLayoutEffect(() => {
    const recompute = () => {
      const el = wrapperRef.current;
      if (!el) return;
      // Wrapper hat gleichbleibende, CSS-fixe Höhe (95vh) → keine Mess-Feedbacks
      const availW = el.clientWidth; // durch Layout bestimmt, nicht durch Stage
      const availH = el.clientHeight; // fix via CSS -> stabil
      const sx = availW / canvas.width;
      const sy = availH / canvas.height;
      const next = Math.min(sx, sy, 1);
      // clamp + Epsilon, um Mini-Deltas zu ignorieren
      const clamped = Math.max(0.1, Math.min(1, next));
      setScale((prev) => (Math.abs(prev - clamped) > 0.001 ? clamped : prev));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [canvas.width, canvas.height]);

  useEffect(() => {
    const layer = stageRef.current?.findOne("Layer");
    if (!layer || !trRef.current) return;
    const nodes = stageRef.current
      ?.find((node: any) => selection.has(node.id?.()))
      ?.filter((n: any) => !!n);
    trRef.current.nodes(nodes);
    layer.batchDraw();
  }, [canvas.selection]);

  useEffect(() => {
    const families = Array.from(
      new Set(
        canvas.nodes
          .filter((n) => n.type === "text" && n.fontFamily)
          .map((n: any) => n.fontFamily as string),
      ),
    );
    ensureFonts(families);
  }, [canvas.nodes]);

  const onDragMove = (id: string, x: number, y: number) => {
    const { x: sx, y: sy } = getSnap(x, y, 5);
    onChange(updateNode(canvas, id, { x: sx, y: sy }));
  };

  const selectSingle = (id: string, evt?: any) => {
    const node = canvas.nodes.find((n) => n.id === id);
    if (node?.locked) return;
    if (evt?.evt?.shiftKey) {
      const merged = Array.from(new Set([...(canvas.selection ?? []), id]));
      onChange({ ...canvas, selection: merged });
    } else {
      onChange(selectOnly(canvas, [id]));
    }
  };

  // Marquee-Select
  const [isSelecting, setSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const handleMouseDown = (e: any) => {
    if (e.target === stageRef.current) {
      setSelecting(true);
      const pos = stageRef.current.getPointerPosition();
      setSelectStart(pos);
      onChange({ ...canvas, selection: [] });
    }
  };
  const handleMouseMove = () => {
    if (!isSelecting || !selectStart) return;
    const pos = stageRef.current.getPointerPosition();
    const x = Math.min(pos.x, selectStart.x);
    const y = Math.min(pos.y, selectStart.y);
    const w = Math.abs(pos.x - selectStart.x);
    const h = Math.abs(pos.y - selectStart.y);
    const box = selectionRectRef.current;
    box.setAttrs({ x, y, width: w, height: h, visible: true });
  };
  const handleMouseUp = () => {
    if (!isSelecting) return;
    const box = selectionRectRef.current;
    const selBox = box.getClientRect();
    const ids: string[] = [];
    stageRef.current.find(".selectable").forEach((node: any) => {
      const nodeRect = node.getClientRect();
      const contained =
        selBox.x < nodeRect.x + nodeRect.width &&
        selBox.x + selBox.width > nodeRect.x &&
        selBox.y < nodeRect.y + nodeRect.height &&
        selBox.y + selBox.height > nodeRect.y;
      if (contained) ids.push(node.id());
    });
    box.visible(false);
    setSelecting(false);
    setSelectStart(null);
    if (ids.length) onChange(selectOnly(canvas, ids));
  };

  const selectedNode = useMemo<CanvasNode | undefined>(() => {
    const id = canvas.selection?.[0];
    return canvas.nodes.find((x) => x.id === id);
  }, [canvas.selection, canvas.nodes]);

  const makeSnapshot = () => {
    const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
    if (uri) onChange({ ...canvas, previewDataUrl: uri });
  };

  const onPatch = (patch: Partial<CanvasDoc>) =>
    onChange({ ...canvas, ...patch });
  const onAddText = () => onChange(addText(canvas));
  const onAddImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onChange(addImage(canvas, String(reader.result)));
    reader.readAsDataURL(file);
  };
  const onDuplicate = () => onChange(duplicateSelected(canvas));
  const onDelete = () => onChange(removeSelected(canvas));
  const onFront = () => onChange(zOrder(canvas, "front"));
  const onBack = () => onChange(zOrder(canvas, "back"));
  const onLock = (lock: boolean) => onChange(lockSelected(canvas, lock));

  return (
    <div className="relative w-full">
      <div
        ref={wrapperRef}
        className="group/canvas relative rounded-xl border bg-background/40 shadow-sm"
        style={{
          width: "100%",
          height: "95vh", // fix: stabilisiert die Messung
          overflow: "hidden", // keine internen Scrollbars
          // optional: sorgt dafuer, dass bei sehr breiten Screens der Wrapper nicht zu hoch wirkt
          // und die Stage mittig steht:
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CanvasToolbar
          canvas={canvas}
          onPatch={onPatch}
          onSnapshot={makeSnapshot}
          onAddText={onAddText}
          onAddImageFile={onAddImageFile}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onFront={onFront}
          onBack={onBack}
          onLock={onLock}
          selected={selectedNode}
          className="absolute left-4 top-4 z-20 pointer-events-none opacity-0 transition-opacity duration-150 group-hover/card-container:pointer-events-auto group-hover/card-container:opacity-100"
        />
        <Stage
          width={canvas.width}
          height={canvas.height}
          scaleX={scale}
          scaleY={scale}
          ref={stageRef}
          draggable={false}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={canvas.width}
              height={canvas.height}
              fill={canvas.bg ?? "#ffffff"}
              listening={false}
            />
            {canvas.nodes.map((n) => {
              if (n.type === "image") {
                const [img, setImg] = useState<HTMLImageElement | null>(null);
                useEffect(() => {
                  loadImage(n.url)
                    .then(setImg)
                    .catch(() => undefined);
                }, [n.url]);
                return (
                  <KImage
                    key={n.id}
                    id={n.id}
                    name="selectable"
                    className="selectable"
                    image={img ?? undefined}
                    x={n.x}
                    y={n.y}
                    width={n.width}
                    height={n.height}
                    rotation={n.rotation ?? 0}
                    draggable={!n.locked}
                    onDragMove={(e) =>
                      onDragMove(n.id, e.target.x(), e.target.y())
                    }
                    onClick={(e) => selectSingle(n.id, e)}
                    onTap={(e) => selectSingle(n.id, e)}
                  />
                );
              }
              if (n.type === "text") {
                const pad = n.padding ?? 0;
                const textWidth =
                  n.width ?? Math.min(900, canvas.width - n.x - 20);
                return (
                  <React.Fragment key={n.id}>
                    {n.textBg && (
                      <Rect
                        x={n.x - pad}
                        y={n.y - pad}
                        width={textWidth + pad * 2}
                        height={(n.fontSize ?? 64) + pad * 2 + 6}
                        fill={n.textBg}
                        listening={false}
                      />
                    )}
                    <Text
                      id={n.id}
                      name="selectable"
                      className="selectable"
                      x={n.x}
                      y={n.y}
                      width={textWidth}
                      text={n.text}
                      fontFamily={n.fontFamily}
                      fontSize={n.fontSize}
                      fill={n.fill ?? "#111"}
                      stroke={n.stroke ?? undefined}
                      strokeWidth={n.strokeWidth ?? 0}
                      align={n.align ?? "left"}
                      fontStyle={n.fontStyle ?? "normal"}
                      draggable={!n.locked}
                      onDragMove={(e) =>
                        onDragMove(n.id, e.target.x(), e.target.y())
                      }
                      onClick={(e) => selectSingle(n.id, e)}
                      onTap={(e) => selectSingle(n.id, e)}
                    />
                  </React.Fragment>
                );
              }
              return null;
            })}

            <Rect
              ref={selectionRectRef}
              fill="rgba(0,0,0,0.08)"
              visible={false}
            />

            <Transformer
              ref={trRef}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-left",
                "middle-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10)
                  return oldBox;
                return newBox;
              }}
              onTransformEnd={() => {
                const nodes = trRef.current?.nodes() ?? [];
                const updates = nodes.map((node: any) => {
                  const id = node.id();
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  const next: any = {
                    x: node.x(),
                    y: node.y(),
                    rotation: node.rotation(),
                  };
                  if (node.className === "Text" || node.className === "Image") {
                    next.width = Math.max(10, node.width() * scaleX);
                    next.height = Math.max(10, node.height() * scaleY);
                  }
                  node.scaleX(1);
                  node.scaleY(1);
                  return { id, next };
                });
                let c = { ...canvas };
                updates.forEach(({ id, next }) => {
                  c = updateNode(c, id, next);
                });
                onChange(c);
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
