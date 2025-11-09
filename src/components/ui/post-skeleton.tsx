import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <div className="group relative block aspect-[2/3] w-full overflow-hidden rounded-xl border bg-muted/30 text-left">
      {/* Main image skeleton */}
      <Skeleton className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export function DummyPost() {
  return (
    <div className="relative block aspect-[2/3] w-full overflow-hidden rounded-xl border border-dashed border-muted-foreground/20 bg-muted/80 text-left opacity-50">
      {/* Empty state placeholder */}
      <div className="absolute inset-0 flex items-center justify-center"></div>
    </div>
  );
}

export function PostSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  );
}
