"use client";

import { useEditorState } from "platejs/react";
import { useEffect } from "react";


export function GlobalUndoRedoHandler() {
  const editor = useEditorState();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      
      const isUndo = event.ctrlKey && event.key === "z" && !event.shiftKey;
      const isRedo =
        (event.ctrlKey && event.key === "y") ||
        (event.ctrlKey && event.shiftKey && event.key === "Z");

      if (!isUndo && !isRedo) return;

      
      const activeElement = document.activeElement;
      const isEditorFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true" ||
          activeElement.closest('[contenteditable="true"]') ||
          
          activeElement.closest("[data-plate-editor]") ||
          activeElement.closest(".presentation-slide"));

      
      if (!isEditorFocused) {
        event.preventDefault();
        event.stopPropagation();

        if (isUndo) {
          editor.tf.undo();
        } else if (isRedo) {
          editor.tf.redo();
        }
      }
    };

    
    document.addEventListener("keydown", handleKeyDown, true);

    
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [editor]);

  
  return null;
}
