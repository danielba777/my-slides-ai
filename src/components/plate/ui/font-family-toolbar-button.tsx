"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { FontFamilyPlugin } from "@platejs/basic-styles/react";
import dynamic from "next/dynamic";
import { KEYS } from "platejs";
import { useEditorRef, useEditorSelector } from "platejs/react";


const FontPicker = dynamic(
  () => import("@/components/ui/font-picker").then((mod) => mod.FontPicker),
  {
    loading: () => <Skeleton className="h-8 w-full" />,
    ssr: false,
  },
);


const DEFAULT_FONT_FAMILY = "Open Sans";

export function FontFamilyToolbarButton() {
  const editor = useEditorRef();

  
  
  const fontFamily = useEditorSelector(
    (editor) =>
      (editor.api.marks()?.[KEYS.fontFamily] as string) ?? DEFAULT_FONT_FAMILY,
    [],
  );

  console.log(fontFamily);
  
  const handleFontChange = (font: string) => {
    if (!editor || !font) return;

    
    if (!editor.selection) {
      editor.tf.select({
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 },
      });
    }

    
    editor.tf.focus();
    editor.tf.addMark(FontFamilyPlugin.key, font);
  };

  return (
    <div className="w-40">
      <FontPicker
        value={handleFontChange}
        defaultValue={fontFamily}
        autoLoad={true}
      />
    </div>
  );
}
