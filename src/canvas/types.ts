export type CanvasTextNode = {
  id: string;
  type: "text";
  x: number;
  y: number;
  rotation?: number;
  width?: number;
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: "normal" | "bold" | "italic" | "bold italic";
  align?: "left" | "center" | "right";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  padding?: number;
  textBg?: string | null;
  link?: string | null;
  locked?: boolean;
};

export type CanvasImageNode = {
  id: string;
  type: "image";
  x: number;
  y: number;
  rotation?: number;
  width: number;
  height: number;
  url: string;
  locked?: boolean;
};

export type CanvasNode = CanvasTextNode | CanvasImageNode;

export type CanvasDoc = {
  version: 1;
  width: number;
  height: number;
  bg?: string | null;
  nodes: CanvasNode[];
  selection?: string[];
  previewDataUrl?: string; // Snapshot für Thumbs/Export
};

export const DEFAULT_CANVAS: CanvasDoc = {
  version: 1,
  width: 1080,
  height: 1920,
  bg: "#ffffff",
  nodes: [],
  selection: [],
};
