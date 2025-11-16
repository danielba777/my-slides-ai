import { type LayoutType } from "@/components/presentation/utils/parser";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { DRAG_ITEM_BLOCK } from "@platejs/dnd";
import { ImagePlugin } from "@platejs/media/react";
import { type TElement } from "platejs";
import { useEditorRef, type PlateEditor } from "platejs/react";
import { useRef } from "react";
import { useDrop } from "react-dnd";

function removeNodeById(editor: PlateEditor, element: TElement) {
  const path = editor.api.findPath(element);

  if (!path) return;
  editor.tf.removeNodes({ at: path });
  return element;
}

export default function LayoutImageDrop({
  slideIndex,
}: {
  slideIndex: number;
}) {
  
  const topRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const editor = useEditorRef();

  const handleImageDrop = (
    item: { element: TElement },
    layoutType: LayoutType,
  ) => {
    
    if (item?.element?.type !== ImagePlugin.key) return;

    
    let imageUrl = item.element.url as string;
    let imageQuery = item.element.query as string;

    
    const element = removeNodeById(editor, item.element);
    if (element?.url) imageUrl = element.url as string;
    if (element?.query) imageQuery = element.query as string;

    
    const { slides, setSlides, setCurrentSlideIndex } =
      usePresentationState.getState();

    
    const updatedSlides = slides.map((slide, index) => {
      if (index === slideIndex) {
        return {
          ...slide,
          rootImage: {
            url: imageUrl,
            query: imageQuery,
            layoutType,
          },
          layoutType,
        };
      }
      return slide;
    });

    
    setSlides(updatedSlides);
    setCurrentSlideIndex(slideIndex);
  };

  
  const [{ isTopOver }, dropTop] = useDrop({
    accept: [DRAG_ITEM_BLOCK],
    canDrop: (item: { element: TElement }) =>
      item.element.type === ImagePlugin.key,
    drop: (item) => {
      handleImageDrop(item, "vertical");
      return { droppedInLayoutZone: true }; 
    },
    collect: (monitor) => ({
      isTopOver: monitor.isOver() && monitor.canDrop(),
    }),
  });

  const [{ isLeftOver }, dropLeft] = useDrop({
    accept: [DRAG_ITEM_BLOCK],
    canDrop: (item: { element: TElement }) =>
      item?.element?.type === ImagePlugin.key,
    drop: (item) => {
      handleImageDrop(item, "left");
      return { droppedInLayoutZone: true }; 
    },
    collect: (monitor) => ({
      isLeftOver: monitor.isOver() && monitor.canDrop(),
    }),
  });

  const [{ isRightOver }, dropRight] = useDrop({
    accept: [DRAG_ITEM_BLOCK],
    canDrop: (item: { element: TElement }) =>
      item.element.type === ImagePlugin.key,
    drop: (item) => {
      handleImageDrop(item, "right");
      return { droppedInLayoutZone: true }; 
    },
    collect: (monitor) => ({
      isRightOver: monitor.isOver() && monitor.canDrop(),
    }),
  });
  
  dropTop(topRef);
  dropLeft(leftRef);
  dropRight(rightRef);

  return (
    <>
      {}
      <div
        ref={topRef}
        className={cn(
          "absolute left-0 right-0 top-0 z-50 h-16",
          isTopOver ? "bg-primary/20" : "bg-transparent",
          "transition-colors duration-200",
        )}
      />

      {}
      <div
        ref={leftRef}
        className={cn(
          "absolute bottom-0 left-0 top-16 z-50 w-8",
          isLeftOver ? "bg-primary/20" : "bg-transparent",
          "transition-colors duration-200",
        )}
      />

      {}
      <div
        ref={rightRef}
        className={cn(
          "absolute bottom-0 right-0 top-16 z-50 w-8",
          isRightOver ? "bg-primary/20" : "bg-transparent",
          "transition-colors duration-200",
        )}
      />
    </>
  );
}
