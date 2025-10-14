import { cn } from "@/lib/utils";
import { SlateElement, type SlateElementProps } from "platejs";

export default function TableElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div
        className={cn("overflow-x-auto")}
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div
          className={cn(
            "min-w-[600px] rounded-lg border bg-card p-2 shadow-sm",
          )}
          style={{
            backgroundColor: "var(--presentation-background)",
            color: "var(--presentation-text)",
            borderColor: "hsl(var(--border))",
          }}
        >
          <div className={cn("grid auto-rows-auto gap-2")}>
            {props.children}
          </div>
        </div>
      </div>
    </SlateElement>
  );
}
