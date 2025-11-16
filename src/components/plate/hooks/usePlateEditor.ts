
import React from "react";

import { MarkdownPlugin } from "@platejs/markdown";
import { type Value } from "@platejs/slate";
import { type AnyPluginConfig } from "platejs";
import {
  createPlateEditor,
  type CreatePlateEditorOptions,
  type PlateCorePlugin,
  type TPlateEditor,
} from "platejs/react";


export function usePlateEditor<
  V extends Value = Value,
  P extends AnyPluginConfig = PlateCorePlugin,
  TEnabled extends boolean | undefined = undefined,
>(
  options: CreatePlateEditorOptions<V, P> & {
    enabled?: TEnabled;
    initialMarkdown?: string;
  } = {},
  deps: React.DependencyList = [],
): TEnabled extends false
  ? null
  : TEnabled extends true | undefined
    ? TPlateEditor<V, P>
    : TPlateEditor<V, P> | null {
  const [, forceRender] = React.useState({});
  const isMountedRef = React.useRef(false);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const value = !options.initialMarkdown
    ? options.value
    : (editor: TPlateEditor) =>
        editor
          .getApi(MarkdownPlugin)
          .markdown.deserialize(options?.initialMarkdown ?? "");

  return React.useMemo((): any => {
    if (options.enabled === false) return null;

    const editor = createPlateEditor({
      ...options,
      value: value,
      onReady: (ctx) => {
        if (ctx.isAsync && isMountedRef.current) {
          forceRender({});
        }
        options.onReady?.(ctx);
      },
    });

    return editor;
  }, [options.id, options.enabled, ...deps]);
}
