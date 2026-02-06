import { Clock, MapPin, Percent, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Detection, DetectionStatus } from '@/types/detection';

interface DetectionModalProps {
  detection: Detection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<DetectionStatus, { label: string; className: string }> = {
  threat: { label: 'Threat', className: 'bg-mission-threat text-white border-mission-threat' },
  verified: { label: 'Verified', className: 'bg-mission-verified text-white border-mission-verified' },
  analyzing: { label: 'Analyzing', className: 'bg-mission-analyzing text-black border-mission-analyzing' },
};

export function DetectionModal({ detection, open, onOpenChange }: DetectionModalProps) {
  if (!detection) return null;

  const status = statusConfig[detection.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-mission-slate-900 border-border p-0 overflow-hidden">
        {/* Image */}
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            <div
              className={cn(
                'flex h-full w-full items-center justify-center bg-gradient-to-br',
                detection.gradientFrom,
                detection.gradientTo
              )}
            >
              <Target className="h-16 w-16 text-white/30" />
            </div>
          </AspectRatio>
          <Badge
            className={cn(
              'absolute right-4 top-4 border text-sm font-semibold',
              status.className
            )}
          >
            {status.label}
          </Badge>
        </div>

        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {detection.objectName}
            </DialogTitle>
          </DialogHeader>

          {/* Metadata Grid */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Detected at {detection.timeDetected}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Percent className="h-4 w-4" />
              <span>Confidence: {detection.confidenceScore}%</span>
            </div>
            {detection.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{detection.location}</span>
              </div>
            )}
            {detection.coordinates && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>
                  {detection.coordinates.lat.toFixed(4)}, {detection.coordinates.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {detection.description && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Threat Assessment</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detection.description}
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => onOpenChange(false)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Acknowledge
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-muted hover:bg-secondary"
              onClick={() => onOpenChange(false)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Dismiss
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-mission-threat text-mission-threat hover:bg-mission-threat/10"
              onClick={() => onOpenChange(false)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Escalate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
