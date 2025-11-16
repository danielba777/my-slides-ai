import { createTPlatePlugin } from "platejs/react";
import { GeneratingLeaf } from "../custom-elements/generating-leaf";


export const GeneratingPlugin = createTPlatePlugin({
  key: "generating",
  node: { isLeaf: true, component: GeneratingLeaf },
});
