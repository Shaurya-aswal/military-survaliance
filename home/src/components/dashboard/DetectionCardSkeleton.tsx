import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';

export function DetectionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-card">
      <AspectRatio ratio={16 / 9}>
        <Skeleton className="h-full w-full" />
      </AspectRatio>
      <div className="p-4">
        <Skeleton className="h-5 w-3/4" />
        <div className="mt-2 flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="mt-4 h-9 w-full" />
      </div>
    </div>
  );
}
