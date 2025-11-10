import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PostSkeletonProps {
  aspectClassName?: string;
  showButton?: boolean;
}

interface DummyPostProps {
  aspectClassName?: string;
}

interface PostSkeletonGridProps extends PostSkeletonProps {
  gridClassName?: string;
  count?: number;
}

export function PostSkeleton({
  aspectClassName = "aspect-[2/3]",
  showButton = false,
}: PostSkeletonProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "group relative block w-full overflow-hidden rounded-xl border bg-muted/30 text-left",
          aspectClassName,
        )}
      >
        <Skeleton className="absolute inset-0 h-full w-full" />
      </div>
      {showButton && (
        <Skeleton className="h-10 w-full rounded-lg border border-zinc-900/30" />
      )}
    </div>
  );
}

export function DummyPost({
  aspectClassName = "aspect-[2/3]",
}: DummyPostProps = {}) {
  return (
    <div
      className={cn(
        "relative block w-full overflow-hidden rounded-xl border border-dashed border-muted-foreground/20 bg-muted/80 text-left opacity-50",
        aspectClassName,
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center"></div>
    </div>
  );
}

export function PostSkeletonGrid({
  gridClassName,
  aspectClassName,
  count = 12,
  showButton = false,
}: PostSkeletonGridProps = {}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
        gridClassName,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton
          key={index}
          aspectClassName={aspectClassName}
          showButton={showButton}
        />
      ))}
    </div>
  );
}
