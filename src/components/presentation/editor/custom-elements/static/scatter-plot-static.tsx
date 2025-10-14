"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { SlateElement, type SlateElementProps } from "platejs";
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

type AnyRecord = Record<string, unknown>;

function getXKey(data: unknown[]): string {
  if (data.length === 0) return "x";
  const sample = data[0] as AnyRecord;
  if ("x" in sample) return "x";
  if ("X" in sample) return "X";
  return "x";
}

function getYKey(data: unknown[]): string {
  if (data.length === 0) return "y";
  const sample = data[0] as AnyRecord;
  if ("y" in sample) return "y";
  if ("Y" in sample) return "Y";
  return "y";
}

export default function ScatterPlotStatic(props: SlateElementProps) {
  const rawData = (props.element as unknown as { data?: unknown }).data;
  const dataArray = Array.isArray(rawData) ? (rawData as AnyRecord[]) : [];
  const xKey = getXKey(dataArray);
  const yKey = getYKey(dataArray);

  const chartConfig: ChartConfig = {
    [xKey]: { label: "X", color: "hsl(var(--chart-1))" },
    [yKey]: { label: "Y", color: "hsl(var(--chart-2))" },
  };

  return (
    <SlateElement {...props}>
      <div
        className={cn(
          "relative mb-4 w-full rounded-lg border bg-card p-2 shadow-sm",
        )}
        style={{
          backgroundColor: "var(--presentation-background)",
          color: "var(--presentation-text)",
          borderColor: "hsl(var(--border))",
        }}
      >
        <ChartContainer className="h-64 w-full" config={chartConfig}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis
              dataKey={xKey}
              type="number"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey={yKey}
              type="number"
              tickLine={false}
              axisLine={false}
            />
            <ZAxis range={[60, 60]} />
            <Scatter data={dataArray} fill="hsl(var(--chart-1))" />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ScatterChart>
        </ChartContainer>
      </div>
    </SlateElement>
  );
}
