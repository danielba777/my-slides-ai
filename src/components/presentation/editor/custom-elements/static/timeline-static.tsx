import { cn } from "@/lib/utils";
import { SlateElement, type SlateElementProps } from "platejs";
import { type TTimelineGroupElement } from "../../plugins/timeline-plugin";
import { containerVariants, lineVariants } from "../timeline";

export default function TimelineStatic(
  props: SlateElementProps<TTimelineGroupElement>,
) {
  const orientation = props.element?.orientation ?? "vertical";
  const sidedness = props.element?.sidedness ?? "single";

  return (
    <SlateElement {...props}>
      <div
        className={cn(lineVariants({ orientation, sidedness }))}
        style={{
          backgroundColor:
            (props.element.color as string) || "var(--presentation-primary)",
        }}
      />

      <div
        className={cn(
          containerVariants({ orientation, sidedness }),
          orientation === "horizontal" && "[&>*]:flex-1",
          orientation === "horizontal" &&
            sidedness === "double" &&
            "[&>div>div>div.slate-blockWrapper]:grid [&>div>div>div.slate-blockWrapper]:grid-rows-2",
        )}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}
