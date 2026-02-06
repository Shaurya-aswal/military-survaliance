import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DetectionModal } from '@/components/dashboard/DetectionModal';
import { useDetectionHistory, AnalysisRecord } from '@/store/detectionHistory';
import { Detection } from '@/types/detection';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Image as ImageIcon,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Search,
  Percent,
  ChevronRight,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; border: string }> = {
  threat: { label: 'Threat', color: 'text-red-400', border: 'border-red-500/30 bg-red-500/5' },
  verified: { label: 'Verified', color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/5' },
  analyzing: { label: 'Analyzing', color: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/5' },
};

const statusIcons = {
  threat: AlertTriangle,
  verified: CheckCircle,
  analyzing: Search,
};

export default function LiveFeed() {
  const [isLoading, setIsLoading] = useState(true);
  const analyses = useDetectionHistory((s) => s.analyses);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Live Feed']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Live Detection Feed</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time monitoring — all detections from one image grouped in a single container
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <Card key={i} className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)] animate-pulse">
                <CardContent className="py-16" />
              </Card>
            ))}
          </div>
        ) : analyses.length > 0 ? (
          <div className="space-y-6">
            {analyses.map((analysis) => (
              <ImageGroupCard
                key={analysis.id}
                analysis={analysis}
                onViewDetails={(d) => { setSelectedDetection(d); setModalOpen(true); }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No detections yet.</p>
            <p className="text-slate-600 text-xs mt-1">Run an Image Analysis to populate the live feed.</p>
          </div>
        )}
      </div>

      <DetectionModal
        detection={selectedDetection}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </DashboardLayout>
  );
}

/**
 * Single container card for ALL detections from one image.
 * Two soldiers from the same photo → one card with two rows.
 */
function ImageGroupCard({
  analysis,
  onViewDetails,
}: {
  analysis: AnalysisRecord;
  onViewDetails: (d: Detection) => void;
}) {
  const date = new Date(analysis.timestamp);
  const timeStr = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const hasThreat = analysis.threats > 0;

  return (
    <Card
      className={cn(
        'bg-[hsl(222,47%,8%)] overflow-hidden transition-all',
        hasThreat
          ? 'border-red-500/30 shadow-lg shadow-red-500/5'
          : 'border-[hsl(217,33%,17%)]'
      )}
    >
      {/* ── Header: image name, time, stats ── */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0',
              hasThreat ? 'bg-red-500/10' : 'bg-[hsl(217,33%,17%)]'
            )}>
              <ImageIcon className={cn('w-5 h-5', hasThreat ? 'text-red-400' : 'text-slate-400')} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base text-slate-100 truncate">
                {analysis.imageName}
              </CardTitle>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {timeStr}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> {analysis.processingTimeMs.toFixed(0)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] font-mono text-slate-300 border-slate-600">
              {analysis.totalDetections} object{analysis.totalDetections !== 1 ? 's' : ''}
            </Badge>
            {analysis.threats > 0 && (
              <Badge className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {analysis.threats} threat{analysis.threats !== 1 ? 's' : ''}
              </Badge>
            )}
            {analysis.verified > 0 && (
              <Badge className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                {analysis.verified} verified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* ── Detection rows — all from this one image ── */}
      <CardContent className="pt-0 pb-4">
        <div className="space-y-2">
          {analysis.detections.map((detection, idx) => {
            const cfg = statusConfig[detection.status] || statusConfig.analyzing;
            const StatusIcon = statusIcons[detection.status as keyof typeof statusIcons] || Search;
            return (
              <div
                key={detection.id}
                onClick={() => onViewDetails(detection)}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-3 cursor-pointer transition-all',
                  'hover:bg-slate-800/60 hover:border-blue-500/30',
                  cfg.border
                )}
              >
                {/* Index */}
                <span className="text-xs text-slate-500 font-mono w-5 text-center flex-shrink-0">
                  {idx + 1}
                </span>

                {/* Gradient swatch */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0',
                    detection.gradientFrom,
                    detection.gradientTo
                  )}
                >
                  <StatusIcon className="w-4 h-4 text-white/70" />
                </div>

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {detection.objectName}
                  </p>
                  {detection.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {detection.description}
                    </p>
                  )}
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono flex-shrink-0">
                  <Percent className="w-3 h-3" />
                  {detection.confidenceScore}%
                </div>

                {/* Status badge */}
                <Badge
                  variant="outline"
                  className={cn('text-[10px] font-mono flex-shrink-0', cfg.color, cfg.border)}
                >
                  {cfg.label}
                </Badge>

                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
