import { Clock, MapPin, Percent, Target, AlertTriangle, CheckCircle, XCircle, Shield, Crosshair } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Detection, DetectionStatus } from '@/types/detection';

interface DetectionModalProps {
  detection: Detection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<DetectionStatus, { label: string; className: string; dotColor: string }> = {
  threat: { label: 'THREAT', className: 'bg-red-500/15 text-red-400 border-red-500/30', dotColor: 'bg-red-400' },
  verified: { label: 'VERIFIED', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' },
  analyzing: { label: 'ANALYZING', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dotColor: 'bg-amber-400' },
};

export function DetectionModal({ detection, open, onOpenChange }: DetectionModalProps) {
  if (!detection) return null;

  const status = statusConfig[detection.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-[hsl(222,47%,6%)] border-[hsl(217,33%,17%)]/60 p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Hero image area */}
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            <div
              className={cn(
                'flex h-full w-full items-center justify-center bg-gradient-to-br relative',
                detection.gradientFrom,
                detection.gradientTo
              )}
            >
              <Crosshair className="h-20 w-20 text-white/15" />
              {/* Scan overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(222,47%,6%)]" />
            </div>
          </AspectRatio>
          <Badge
            className={cn(
              'absolute right-4 top-4 border text-[10px] font-mono font-bold tracking-wider uppercase',
              status.className
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5', status.dotColor)} />
            {status.label}
          </Badge>
          {/* Confidence overlay */}
          <div className="absolute left-4 bottom-4 flex items-center gap-2 rounded-lg bg-black/50 backdrop-blur-sm px-3 py-1.5 border border-white/10">
            <Percent className="h-3.5 w-3.5 text-white/70" />
            <span className="text-sm font-bold font-mono text-white">{detection.confidenceScore}%</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 pt-3 space-y-4 sm:space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
              {detection.objectName}
            </DialogTitle>
          </DialogHeader>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <InfoTile icon={Clock} label="Time Detected" value={detection.timeDetected} />
            <InfoTile icon={Shield} label="Confidence" value={`${detection.confidenceScore}%`} />
            {detection.location && (
              <InfoTile icon={MapPin} label="Location" value={detection.location} />
            )}
            {detection.coordinates && (
              <InfoTile
                icon={Target}
                label="Coordinates"
                value={`${detection.coordinates.lat.toFixed(4)}, ${detection.coordinates.lng.toFixed(4)}`}
              />
            )}
          </div>

          {/* Description */}
          {detection.description && (
            <div className="rounded-xl bg-[hsl(217,33%,17%)]/20 border border-[hsl(217,33%,17%)]/40 p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Threat Assessment</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {detection.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 pt-1">
            <Button
              className="flex-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-xl h-10 text-xs font-semibold"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Acknowledge
            </Button>
            <Button
              variant="ghost"
              className="flex-1 bg-[hsl(217,33%,17%)]/30 hover:bg-[hsl(217,33%,17%)]/50 text-slate-300 border border-[hsl(217,33%,17%)]/60 rounded-xl h-10 text-xs font-semibold"
              onClick={() => onOpenChange(false)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Dismiss
            </Button>
            <Button
              variant="ghost"
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl h-10 text-xs font-semibold"
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

function InfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[hsl(217,33%,17%)]/20 border border-[hsl(217,33%,17%)]/30 p-3 transition-colors hover:bg-[hsl(217,33%,17%)]/30">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(217,33%,17%)]/50">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-200 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
