import { Clock, Percent } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Detection, DetectionStatus } from '@/types/detection';

interface DetectionCardProps {
  detection: Detection;
  onViewDetails: (detection: Detection) => void;
}

const statusConfig: Record<DetectionStatus, { label: string; className: string }> = {
  threat: { label: 'Threat', className: 'bg-red-600 text-white border-red-600' },
  verified: { label: 'Verified', className: 'bg-emerald-600 text-white border-emerald-600' },
  analyzing: { label: 'Analyzing', className: 'bg-amber-500 text-black border-amber-500' },
};

export function DetectionCard({ detection, onViewDetails }: DetectionCardProps) {
  const status = statusConfig[detection.status];

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border border-white/5 bg-card transition-all duration-300',
        'hover:border-primary hover:shadow-lg hover:shadow-primary/10'
      )}
    >
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <div
            className={cn(
              'flex h-full w-full items-center justify-center bg-gradient-to-br',
              detection.gradientFrom,
              detection.gradientTo
            )}
          >
            <span className="text-sm font-medium text-white/80 uppercase tracking-wider">
              {detection.objectName.split(' ')[0]}
            </span>
          </div>
        </AspectRatio>
        <Badge
          className={cn(
            'absolute right-3 top-3 border text-xs font-semibold',
            status.className
          )}
        >
          {status.label}
        </Badge>
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-foreground">{detection.objectName}</h3>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {detection.timeDetected}
          </span>
          <span className="flex items-center gap-1">
            <Percent className="h-3 w-3" />
            {detection.confidenceScore}%
          </span>
        </div>
        <Button
          variant="ghost"
          className="mt-4 w-full justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          onClick={() => onViewDetails(detection)}
        >
          View Details
        </Button>
      </div>
    </article>
  );
}
