import dynamic from "next/dynamic";

export const SlideCanvas = dynamic(
  () => import("./SlideCanvasBase"),
  { ssr: false },
);

export default SlideCanvas;
