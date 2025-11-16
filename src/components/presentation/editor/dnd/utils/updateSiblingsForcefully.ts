import { type NodeEntry, PathApi, type TElement, type TText } from "platejs";
import { type PlateEditor } from "platejs/react";


export const COMPONENTS_REQUIRING_SIBLING_UPDATES = [
  "pyramid-item",
  "cycle-item",
  "stair-item",
  "before-after-side",
  "compare-side",
  "timeline-item",
  "arrow-vertical-item",
  "box-item",
  "bullet",
  "cons-item",
  "pros-item",
] as const;


export function updateSiblingsForcefully(
  editor: PlateEditor,
  parentElement: NodeEntry<TElement | TText>[0] | null,
  parentPath: number[],
) {
  if (
    !parentElement?.children ||
    !Array.isArray(parentElement.children) ||
    (Array.isArray(parentElement.children) &&
      parentElement.children.length === 0)
  ) {
    return;
  }

  const updateTimestamp = Date.now();
  try {
    editor.tf.withoutNormalizing(() => {
      (parentElement.children as unknown[]).forEach((_, childIndex) => {
        const siblingPath = [...parentPath, childIndex];
        try {
          editor.tf.setNodes(
            { lastUpdate: updateTimestamp },
            { at: siblingPath },
          );
        } catch {
          
        }
      });
    });
  } catch {
    
  }
}


export function updateSiblingsAfterDrop(
  editor: PlateEditor,
  droppedElement: { type: string; id?: string },
  dropPath: number[],
) {
  
  if (
    !COMPONENTS_REQUIRING_SIBLING_UPDATES.includes(
      droppedElement.type as (typeof COMPONENTS_REQUIRING_SIBLING_UPDATES)[number],
    )
  ) {
    return;
  }

  
  const parentPath = PathApi.parent(dropPath);
  const parentElement = editor.api.node({ at: parentPath });

  if (!parentElement) return;

  
  updateSiblingsForcefully(editor, parentElement[0], parentPath);
}
