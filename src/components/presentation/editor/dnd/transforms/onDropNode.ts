import { type PlateEditor } from "platejs/react";
import { type DropTargetMonitor } from "react-dnd";

import { insertColumnGroup } from "@platejs/layout";
import { type TElement } from "platejs";

import { type ElementDragItemNode } from "@platejs/dnd";
import { type UseDropNodeOptions } from "../hooks";

import { MultiDndPlugin } from "@/components/plate/plugins/dnd-kit";
import { getDropPath } from "../utils/getDropPath";
import { updateSiblingsAfterDrop } from "../utils/updateSiblingsForcefully";

export const onDropNode = (
  editor: PlateEditor,
  {
    canDropNode,
    dragItem,
    element,
    monitor,
    nodeRef,
  }: {
    dragItem: ElementDragItemNode;
    monitor: DropTargetMonitor;
  } & Pick<UseDropNodeOptions, "canDropNode" | "element" | "nodeRef">,
) => {
  const { orientation } = editor.getOptions(MultiDndPlugin);
  const result = getDropPath(editor, {
    canDropNode,
    dragItem,
    element,
    monitor,
    nodeRef,
  });

  if (!result) return;

  if (orientation) {
    const result = getDropPath(editor, {
      canDropNode,
      dragItem,
      element,
      monitor,
      nodeRef,
    });

    if (!result) return;

    const { dragPath, to } = result;

    if (!to) return;
    
    const draggedIds = Array.isArray(dragItem.id) ? dragItem.id : [dragItem.id];

    if (draggedIds.length > 1) {
      
      const elements: TElement[] = [];

      draggedIds.forEach((id) => {
        const entry = editor.api.node<TElement>({ id, at: [] });
        if (entry) {
          elements.push(entry[0]);
        }
      });

      editor.tf.withoutNormalizing(() => {
        editor.tf.moveNodes({
          at: [],
          to,
          match: (n) => elements.some((element) => element.id === n.id),
        });

        
        elements.forEach((element) => {
          if (element?.type) {
            updateSiblingsAfterDrop(editor, element, to);
          }
        });
      });
    } else {
      
      editor.tf.withoutNormalizing(() => {
        editor.tf.moveNodes({
          at: dragPath,
          to,
        });

        
        const droppedElement = editor.api.node<TElement>({ at: to });
        if (droppedElement?.[0]?.type) {
          updateSiblingsAfterDrop(editor, droppedElement[0], to);
        }
      });
    }

    return;
  }

  const { direction, dragPath, to, hoveredPath, isExternalNode } = result;
  
  const draggedIds = Array.isArray(dragItem.id) ? dragItem.id : [dragItem.id];

  
  if (direction === "left" || direction === "right") {
    if (!hoveredPath) return;

    
    
    
    
    
    const shouldCreateColumns =
      hoveredPath.length === 1 || isExternalNode || draggedIds.length > 1;

    if (!shouldCreateColumns) {
      
      if (!to) return;

      const draggedElementIds = new Set(draggedIds);

      editor.tf.withoutNormalizing(() => {
        editor.tf.moveNodes({
          at: [],
          to,
          match: (n) => draggedElementIds.has(n.id as string),
        });
      });

      
      draggedElementIds.forEach((id) => {
        const entry = editor.api.node<TElement>({ id, at: [] });
        console.log("Entry:", entry);
        if (entry?.[0].type) {
          updateSiblingsAfterDrop(editor, entry[0], to);
        }
      });
      return;
    }

    
    const targetElementId = element.id as string;

    
    const draggedElementIds = new Set(draggedIds);

    
    insertColumnGroup(editor, {
      columns: 2,
      at: hoveredPath,
    });

    
    const columnGroupPath = hoveredPath;
    const firstColumnPath = [...columnGroupPath, 0];
    const secondColumnPath = [...columnGroupPath, 1];

    
    const targetColumnPath =
      direction === "left" ? secondColumnPath : firstColumnPath;
    const draggedColumnPath =
      direction === "left" ? firstColumnPath : secondColumnPath;

    
    editor.transforms.withoutNormalizing(() => {
      
      
      editor.tf.moveNodes({
        at: [],
        to: [...targetColumnPath, 0],
        match: (n) => n.id === targetElementId,
      });

      if (
        isExternalNode &&
        dragItem.element &&
        typeof dragItem.element === "object"
      ) {
        
        if (Array.isArray(dragItem.element)) {
          
          dragItem.element.forEach((elem, index) => {
            editor.tf.insertNodes(elem, {
              at: [...draggedColumnPath, index],
            });
          });
        } else {
          
          editor.tf.insertNodes(dragItem.element as TElement, {
            at: [...draggedColumnPath, 0],
          });
        }
      } else {
        
        
        const nodesToMove: TElement[] = [];
        draggedElementIds.forEach((id) => {
          const entry = editor.api.node<TElement>({ id, at: [] });
          if (entry) {
            nodesToMove.push(entry[0]);
          }
        });

        
        if (nodesToMove.length > 0) {
          editor.tf.moveNodes({
            at: [],
            to: [...draggedColumnPath, 0],
            match: (n) => draggedElementIds.has(n.id as string),
          });
        }
      }

      
      draggedElementIds.forEach((id) => {
        const entry = editor.api.node<TElement>({ id });
        console.log("Entry:", entry);
        if (entry?.[0]?.type) {
          updateSiblingsAfterDrop(editor, entry[0], [...draggedColumnPath, 0]);
        }
      });
    });

    return;
  }

  
  if (!to) return;

  if (draggedIds.length > 1) {
    
    const draggedElementIds = new Set(draggedIds);

    editor.tf.moveNodes({
      at: [],
      to,
      match: (n) => draggedElementIds.has(n.id as string),
    });

    
    draggedElementIds.forEach((id) => {
      const entry = editor.api.node<TElement>({ id });
      if (entry?.[0].type) {
        updateSiblingsAfterDrop(editor, entry[0], to);
      }
    });
  } else if (
    isExternalNode &&
    dragItem.element &&
    typeof dragItem.element === "object"
  ) {
    
    editor.tf.insertNodes(dragItem.element as TElement, {
      at: to,
    });
  } else if (dragPath) {
    
    editor.tf.moveNodes({
      at: dragPath,
      to,
    });
    
    const droppedElement = editor.api.node<TElement>(to);
    if (droppedElement?.[0].type) {
      updateSiblingsAfterDrop(editor, droppedElement[0], to);
    }
  }
};
