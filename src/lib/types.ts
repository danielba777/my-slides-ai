export type SlideTextElement = {
  id?: string;
  content?: string;
  fontFamily?: string;
  weight?: "regular" | "semibold" | "bold";
  scale?: number;
  lineHeight?: number;
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  x?: number;
  y?: number;
  rotation?: number;
  maxWidth?: number;
  maxHeight?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  color?: string;
  italic?: boolean;
  outlineEnabled?: boolean;
  outlineWidth?: number;
  outlineColor?: string;
  background?: SlideTextBackground;
};

export type SlideTextBackground = {
  enabled: boolean;
  mode: "block" | "blob";
  color: string;
  opacity: number;
  paddingX: number;
  paddingY: number;
  radius: number;
  lineOverlap?: number;
};
