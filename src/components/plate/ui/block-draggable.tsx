"use client";

import { DndPlugin } from "@platejs/dnd";
import { expandListItemsWithChildren } from "@platejs/list";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { GripHorizontal, GripVertical } from "lucide-react";
import {
  type TElement,
  getContainerTypes,
  isType,
  KEYS,
  PathApi,
} from "platejs";
import {
  type PlateEditor,
  type PlateElementProps,
  type RenderNodeWrapper,
  MemoizedChildren,
  useEditorRef,
  useElement,
  usePath,
  usePluginOption,
  useSelected,
} from "platejs/react";
import * as React from "react";

import { Button } from "@/components/plate/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/plate/ui/tooltip";
import { useDraggable } from "@/components/presentation/editor/dnd/hooks/useDraggable";
import { useDropLine } from "@/components/presentation/editor/dnd/hooks/useDropLine";
import { getGridClassForElement } from "@/components/presentation/editor/lib";
import { cn } from "@/lib/utils";
import { MultiDndPlugin } from "../plugins/dnd-kit";


const UNDRAGGABLE_KEYS = [KEYS.tr, KEYS.td];




const SIBLING_ONLY_DROP_ELEMENTS = ["column", "table-row", "list-item"];




const requiresSiblingOnlyDrop = (elementType: string): boolean => {
  return SIBLING_ONLY_DROP_ELEMENTS.includes(elementType);
};

export const BlockDraggable: RenderNodeWrapper = (props) => {
  const { editor, element, path } = props;

  if (!props) return;

  
  const enabled = React.useMemo(() => {
    if (editor.dom.readOnly) return false;
    if (!path) return false;

    
    if (isType(editor, element, UNDRAGGABLE_KEYS)) return false;

    
    if (path.length === 1) return true;
    if (path.length === 2) return true;

    if (path.length === 3) {
      const isInColumn = editor.api.some({
        at: path,
        match: { type: editor.getType(KEYS.column) },
      });
      return isInColumn;
    }

    if (path.length === 4) {
      const isInTable = editor.api.some({
        at: path,
        match: { type: editor.getType(KEYS.table) },
      });
      return isInTable;
    }

    return false;
  }, [editor, element, path]);

  if (!enabled) return;

  
  return (props) => <Draggable {...props} />;
};

export function Draggable(props: PlateElementProps) {
  const { children, editor, element, path } = props;
  const blockSelectionApi = editor.getApi(BlockSelectionPlugin).blockSelection;

  let orientation: "vertical" | "horizontal" | undefined;
  const { isAboutToDrag, isDragging, nodeRef, previewRef, handleRef } =
    useDraggable({
      element,
      onDropHandler: (_, { dragItem }) => {
        const id = (dragItem as { id: string[] | string }).id;
        if (blockSelectionApi && id) {
          blockSelectionApi.add(id);
        }
        resetPreview();
        return undefined;
      },
      canDropNode: ({ dragEntry, dropEntry }) => {
        const dragElementType = dragEntry[0].type;

        
        if (requiresSiblingOnlyDrop(dragElementType)) {
          const dragParentPath = PathApi.parent(dragEntry[1]);
          const dropParentPath = PathApi.parent(dropEntry[1]);

          
          if (PathApi.equals(dragParentPath, dropParentPath)) {
            return true;
          }

          
          
          
          let currentDropPath = dropEntry[1];

          while (currentDropPath.length > 0) {
            const currentParentPath = PathApi.parent(currentDropPath);

            
            
            if (PathApi.equals(dragParentPath, currentParentPath)) {
              
              
              const siblingPath = currentDropPath;
              const siblingEntry = editor.api.node({ at: siblingPath });

              if (siblingEntry && siblingEntry[0].type === dragElementType) {
                return true;
              }
            }

            
            currentDropPath = PathApi.parent(currentDropPath);
          }

          
          return false;
        }

        
        return true;
      },
    });

  const isInColumn = path.length === 3;
  const isInTable = path.length === 4;

  if (path.length === 2) {
    orientation = "horizontal";
  }

  const [previewTop, setPreviewTop] = React.useState(0);

  const resetPreview = () => {
    if (previewRef.current) {
      previewRef.current.replaceChildren();
      previewRef.current?.classList.add("hidden");
    }
  };

  
  React.useEffect(() => {
    if (!isDragging) {
      resetPreview();
    }
  }, [isDragging, previewRef]);

  React.useEffect(() => {
    if (isAboutToDrag) {
      previewRef.current?.classList.remove("opacity-0");
    }
  }, [isAboutToDrag, previewRef]);

  return (
    <div
      className={cn(
        path?.length === 1 && "px-16",
        
        getGridClassForElement(
          editor as unknown as PlateEditor,
          element as unknown as TElement,
        ),
      )}
      ref={nodeRef}
    >
      <div
        className={cn(
          "relative h-full",
          isDragging && "opacity-50",
          "after:absolute after:-inset-1 after:pointer-events-none hover:after:border hover:after:border-blue-400",
          getContainerTypes(editor).includes(element.type)
            ? "group/container"
            : "group",
        )}
      >
        {!isInTable && (
          <Gutter orientation={orientation}>
            <div
              className={cn(
                "slate-blockToolbarWrapper",
                "flex",
                orientation === "horizontal"
                  ? "h-6 w-full justify-center"
                  : "h-[1.5em]",
                isType(editor, element, [
                  KEYS.h1,
                  KEYS.h2,
                  KEYS.h3,
                  KEYS.h4,
                  KEYS.h5,
                ]) &&
                  orientation === "vertical" &&
                  "h-[1.3em]",
                isInColumn && orientation === "vertical" && "h-4",
              )}
            >
              <div
                className={cn(
                  "slate-blockToolbar",
                  "pointer-events-auto flex items-center",
                  orientation === "horizontal" ? "mb-1" : "mr-1",
                  isInColumn && orientation === "vertical" && "mr-1.5",
                )}
              >
                <Button
                  ref={handleRef}
                  variant="ghost"
                  className={cn(
                    "p-0 bg-background/50",
                    orientation === "horizontal" ? "h-5 w-6" : "h-6 w-5",
                  )}
                  data-plate-prevent-deselect
                >
                  <DragHandle
                    orientation={orientation}
                    isDragging={isDragging}
                    previewRef={previewRef}
                    resetPreview={resetPreview}
                    setPreviewTop={setPreviewTop}
                  />
                </Button>
              </div>
            </div>
          </Gutter>
        )}

        <div
          ref={previewRef}
          className={cn("pointer-events-none absolute -left-0 hidden w-full")}
          style={{ top: `${-previewTop}px` }}
          contentEditable={false}
        />

        <div
          className="slate-blockWrapper h-full"
          onContextMenu={(event) =>
            editor
              .getApi(BlockSelectionPlugin)
              .blockSelection.addOnContextMenu({ element, event })
          }
        >
          <MemoizedChildren>{children}</MemoizedChildren>
          <DropLine />
        </div>
      </div>
    </div>
  );
}

function Gutter({
  children,
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
  const editor = useEditorRef();
  const element = useElement();
  const path = usePath();
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    "isSelectionAreaVisible",
  );

  const selected = useSelected();

  const isNodeType = (keys: string[] | string) => isType(editor, element, keys);
  const isInColumn = path.length === 3;

  return (
    <div
      {...props}
      className={cn(
        "slate-gutterLeft",
        "absolute z-50 flex cursor-text hover:opacity-100 sm:opacity-0",
        orientation === "horizontal"
          ? "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
          : "left-0 top-0 h-full -translate-x-full",
        getContainerTypes(editor).includes(element.type)
          ? "group-hover/container:opacity-100"
          : "group-hover:opacity-100",
        isSelectionAreaVisible && "hidden",
        !selected && "opacity-0",
        
        orientation === "vertical" && [
          isNodeType(KEYS.h1) && "pb-1 text-[1.875em]",
          isNodeType(KEYS.h2) && "pb-1 text-[1.5em]",
          isNodeType(KEYS.h3) && "pb-1 pt-[2px] text-[1.25em]",
          isNodeType([KEYS.h4, KEYS.h5]) && "pb-0 pt-1 text-[1.1em]",
          isNodeType(KEYS.h6) && "pb-0",
          isNodeType(KEYS.p) && "pb-0 pt-1",
          isNodeType(KEYS.blockquote) && "pb-0",
          isNodeType(KEYS.codeBlock) && "pb-0 pt-6",
          isNodeType([
            KEYS.img,
            KEYS.mediaEmbed,
            KEYS.excalidraw,
            KEYS.toggle,
            KEYS.column,
          ]) && "py-0",
          isNodeType([KEYS.placeholder, KEYS.table]) && "pb-0 pt-3",
          isInColumn && "mt-2 h-4 pt-0",
        ],
        className,
      )}
      contentEditable={false}
    >
      {children}
    </div>
  );
}

const DragHandle = React.memo(function DragHandle({
  orientation = "vertical",
  isDragging,
  previewRef,
  resetPreview,
  setPreviewTop,
}: {
  orientation?: "horizontal" | "vertical";
  isDragging: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
  resetPreview: () => void;
  setPreviewTop: (top: number) => void;
}) {
  const editor = useEditorRef();
  const element = useElement();

  const handleMouseDown = (e: React.MouseEvent) => {
    resetPreview();

    if (e.button !== 0 || e.shiftKey) return;

    
    editor.setOption(MultiDndPlugin, "isMouseDown", true);

    const blockSelection = editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.getNodes({ sort: true });

    let selectionNodes =
      blockSelection.length > 0
        ? blockSelection
        : editor.api.blocks({ mode: "highest" });

    
    if (!selectionNodes.some(([node]) => node.id === element.id)) {
      selectionNodes = [[element, editor.api.findPath(element)!]];
    }

    
    const blocks = expandListItemsWithChildren(editor, selectionNodes).map(
      ([node]) => node,
    );

    if (blockSelection.length === 0) {
      editor.tf.blur();
      editor.tf.collapse();
    }

    const elements = createDragPreviewElements(editor, blocks);
    previewRef.current?.append(...elements);
    previewRef.current?.classList.remove("hidden");
    previewRef.current?.classList.add("opacity-0");
    editor.setOption(DndPlugin, "multiplePreviewRef", previewRef);

    editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.set(blocks.map((block) => block.id as string));
  };

  const handleMouseUp = () => {
    resetPreview();

    
    editor.setOption(MultiDndPlugin, "isMouseDown", false);

    
    if (!isDragging) {
      editor.getApi(BlockSelectionPlugin).blockSelection.focus();
    }
  };

  const handleMouseEnter = () => {
    if (isDragging) return;

    const blockSelection = editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.getNodes({ sort: true });

    let selectedBlocks =
      blockSelection.length > 0
        ? blockSelection
        : editor.api.blocks({ mode: "highest" });

    
    if (!selectedBlocks.some(([node]) => node.id === element.id)) {
      selectedBlocks = [[element, editor.api.findPath(element)!]];
    }

    
    const processedBlocks = expandListItemsWithChildren(editor, selectedBlocks);

    const ids = processedBlocks.map((block) => block[0].id as string);

    if (ids.length > 1 && ids.includes(element.id as string)) {
      const previewTop = calculatePreviewTop(editor, {
        blocks: processedBlocks.map((block) => block[0]),
        element,
      });
      setPreviewTop(previewTop);
    } else {
      setPreviewTop(0);
    }
  };

  return (
    <Tooltip delayDuration={1000}>
      <TooltipTrigger asChild>
        <div
          className="flex size-full items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          role="button"
          data-plate-prevent-deselect
        >
          {orientation === "horizontal" ? (
            <GripHorizontal className="text-muted-foreground" />
          ) : (
            <GripVertical className="text-muted-foreground" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>Hold and drag to move, or click to edit</TooltipContent>
    </Tooltip>
  );
});

const DropLine = React.memo(function DropLine({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <div
      {...props}
      className={cn(
        "slate-dropLine",
        "absolute opacity-100 transition-opacity",
        "bg-blue-500",
        
        (dropLine === "top" || dropLine === "bottom") && "inset-x-0 h-0.5",
        
        (dropLine === "left" || dropLine === "right") && "inset-y-0 w-0.5",
        
        dropLine === "top" && "-top-px",
        dropLine === "bottom" && "-bottom-px",
        dropLine === "left" && "-left-px",
        dropLine === "right" && "-right-px",
        className,
      )}
    />
  );
});

const createDragPreviewElements = (
  editor: PlateEditor,
  blocks: TElement[],
): HTMLElement[] => {
  const elements: HTMLElement[] = [];
  const ids: string[] = [];

  
  const removeDataAttributes = (element: HTMLElement) => {
    Array.from(element.attributes).forEach((attr) => {
      if (
        attr.name.startsWith("data-slate") ||
        attr.name.startsWith("data-block-id")
      ) {
        element.removeAttribute(attr.name);
      }
    });

    Array.from(element.children).forEach((child) => {
      removeDataAttributes(child as HTMLElement);
    });
  };

  const resolveElement = (node: TElement, index: number) => {
    const domNode = editor.api.toDOMNode(node)!;
    const newDomNode = domNode.cloneNode(true) as HTMLElement;

    
    const applyScrollCompensation = (
      original: Element,
      cloned: HTMLElement,
    ) => {
      const scrollLeft = original.scrollLeft;

      if (scrollLeft > 0) {
        
        const scrollWrapper = document.createElement("div");
        scrollWrapper.style.overflow = "hidden";
        scrollWrapper.style.width = `${original.clientWidth}px`;

        
        const innerContainer = document.createElement("div");
        innerContainer.style.transform = `translateX(-${scrollLeft}px)`;
        innerContainer.style.width = `${original.scrollWidth}px`;

        
        while (cloned.firstChild) {
          innerContainer.append(cloned.firstChild);
        }

        
        const originalStyles = window.getComputedStyle(original);
        cloned.style.padding = "0";
        innerContainer.style.padding = originalStyles.padding;

        scrollWrapper.append(innerContainer);
        cloned.append(scrollWrapper);
      }
    };

    applyScrollCompensation(domNode, newDomNode);

    ids.push(node.id as string);
    const wrapper = document.createElement("div");
    wrapper.append(newDomNode);
    wrapper.style.display = "flow-root";

    const lastDomNode = blocks[index - 1];

    if (lastDomNode) {
      const lastDomNodeRect = editor.api
        .toDOMNode(lastDomNode)!
        .parentElement!.getBoundingClientRect();

      const domNodeRect = domNode.parentElement!.getBoundingClientRect();

      const distance = domNodeRect.top - lastDomNodeRect.bottom;

      
      if (distance > 15) {
        wrapper.style.marginTop = `${distance}px`;
      }
    }

    removeDataAttributes(newDomNode);
    elements.push(wrapper);
  };

  blocks.forEach((node, index) => resolveElement(node, index));

  editor.setOption(DndPlugin, "draggingId", ids);

  return elements;
};

const calculatePreviewTop = (
  editor: PlateEditor,
  {
    blocks,
    element,
  }: {
    blocks: TElement[];
    element: TElement;
  },
): number => {
  const child = editor.api.toDOMNode(element)!;
  const editable = editor.api.toDOMNode(editor)!;
  const firstSelectedChild = blocks[0]!;

  const firstDomNode = editor.api.toDOMNode(firstSelectedChild)!;
  
  const editorPaddingTop = Number(
    window.getComputedStyle(editable).paddingTop.replace("px", ""),
  );

  
  const firstNodeToEditorDistance =
    firstDomNode.getBoundingClientRect().top -
    editable.getBoundingClientRect().top -
    editorPaddingTop;

  
  const firstMarginTopString = window.getComputedStyle(firstDomNode).marginTop;
  const marginTop = Number(firstMarginTopString.replace("px", ""));

  
  const currentToEditorDistance =
    child.getBoundingClientRect().top -
    editable.getBoundingClientRect().top -
    editorPaddingTop;

  const currentMarginTopString = window.getComputedStyle(child).marginTop;
  const currentMarginTop = Number(currentMarginTopString.replace("px", ""));

  const previewElementsTopDistance =
    currentToEditorDistance -
    firstNodeToEditorDistance +
    marginTop -
    currentMarginTop;

  return previewElementsTopDistance;
};
