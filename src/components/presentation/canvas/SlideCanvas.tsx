import dynamic from "next/dynamic";

const SlideCanvas = dynamic(() => import("./SlideCanvasBase"), {
  ssr: false,
});

export default SlideCanvas;
