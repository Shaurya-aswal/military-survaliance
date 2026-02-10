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
  Trash2,
  Radio,
  ScanSearch,
  Eye,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; border: string; bg: string }> = {
  threat: { label: 'Threat', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/5' },
  verified: { label: 'Verified', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
  analyzing: { label: 'Analyzing', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
};

const statusIcons = {
  threat: AlertTriangle,
  verified: CheckCircle,
  analyzing: Search,
};

export default function LiveFeed() {
  const [isLoading, setIsLoading] = useState(true);
  const analyses = useDetectionHistory((s) => s.analyses);
  const removeAnalysis = useDetectionHistory((s) => s.removeAnalysis);
  const clearAll = useDetectionHistory((s) => s.clearAll);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const totalDetections = analyses.reduce((sum, a) => sum + a.totalDetections, 0);
  const totalThreats = analyses.reduce((sum, a) => sum + a.threats, 0);

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Live Feed']}>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
              <Radio className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Live Detection Feed</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time monitoring • {totalDetections} detection{totalDetections !== 1 ? 's' : ''} across {analyses.length} scan{analyses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {analyses.length > 0 && (
            <button
              onClick={() => { if (window.confirm('Delete ALL analysis records? This cannot be undone.')) clearAll(); }}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/15 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>

        {/* Quick stats bar */}
        {analyses.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Detections', value: totalDetections, icon: Eye, color: 'bg-blue-500/10', textColor: 'text-blue-400' },
              { label: 'Threats', value: totalThreats, icon: AlertTriangle, color: 'bg-red-500/10', textColor: 'text-red-400' },
              { label: 'Scans', value: analyses.length, icon: ScanSearch, color: 'bg-emerald-500/10', textColor: 'text-emerald-400' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 sm:gap-3 rounded-xl border border-[hsl(217,33%,17%)]/60 bg-[hsl(222,47%,8%)]/50 p-2 sm:p-3">
                <div className={cn('flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg shrink-0', stat.color)}>
                  <stat.icon className={cn('h-4 w-4', stat.textColor)} />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-slate-100 font-mono">{stat.value}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-[hsl(222,47%,8%)] border border-[hsl(217,33%,17%)]/40 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[hsl(217,33%,17%)]/50" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 rounded bg-[hsl(217,33%,17%)]/50" />
                    <div className="h-3 w-32 rounded bg-[hsl(217,33%,17%)]/30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-12 rounded-lg bg-[hsl(217,33%,17%)]/30" />
                  <div className="h-12 rounded-lg bg-[hsl(217,33%,17%)]/20" />
                </div>
              </div>
            ))}
          </div>
        ) : analyses.length > 0 ? (
          <div className="space-y-4">
            {analyses.map((analysis, i) => (
              <div key={analysis.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <ImageGroupCard
                  analysis={analysis}
                  onViewDetails={(d) => { setSelectedDetection(d); setModalOpen(true); }}
                  onDelete={() => removeAnalysis(analysis.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(217,33%,17%)]/20 mb-5">
              <Radio className="w-9 h-9 text-slate-600" />
            </div>
            <p className="text-slate-400 text-base font-medium mb-1">No detections yet</p>
            <p className="text-slate-600 text-sm max-w-sm text-center leading-relaxed">
              Go to <span className="text-blue-400 font-medium">Image Analysis</span> to upload an image and run the YOLO+ViT detection pipeline.
            </p>
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

/* ─── Image Group Card ─── */
function ImageGroupCard({
  analysis,
  onViewDetails,
  onDelete,
}: {
  analysis: AnalysisRecord;
  onViewDetails: (d: Detection) => void;
  onDelete: () => void;
}) {
  const date = new Date(analysis.timestamp);
  const timeStr = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const hasThreat = analysis.threats > 0;

  return (
    <Card
      className={cn(
        'bg-[hsl(222,47%,8%)]/80 overflow-hidden transition-all duration-300 group/card hover:shadow-xl',
        hasThreat
          ? 'border-red-500/30 hover:border-red-500/40 shadow-lg shadow-red-500/5 hover:shadow-red-500/10'
          : 'border-[hsl(217,33%,17%)]/60 hover:border-blue-500/20 hover:shadow-blue-500/5'
      )}
    >
      {/* Threat accent bar */}
      {hasThreat && (
        <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      )}

      <CardHeader className="pb-3 pt-4 px-3 sm:px-6">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={cn(
              'flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl flex-shrink-0 border transition-colors',
              hasThreat
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-[hsl(217,33%,17%)]/50 border-[hsl(217,33%,17%)]/60',
            )}>
              <ImageIcon className={cn('w-4 h-4 sm:w-5 sm:h-5', hasThreat ? 'text-red-400' : 'text-slate-400')} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                {analysis.imageName}
              </CardTitle>
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {dateStr} {timeStr}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> {analysis.processingTimeMs.toFixed(0)}ms
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap justify-end">
            <Badge variant="outline" className="text-[9px] sm:text-[10px] font-mono text-slate-300 border-slate-600/60 bg-[hsl(217,33%,17%)]/30">
              {analysis.totalDetections} obj
            </Badge>
            {analysis.threats > 0 && (
              <Badge className="text-[9px] sm:text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-0.5 sm:mr-1" />
                {analysis.threats}
              </Badge>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete analysis "${analysis.imageName}"?`)) onDelete(); }}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-red-500/10 hover:text-red-400"
              title="Delete this analysis"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-3 sm:px-6">
        <div className="space-y-1.5">
          {analysis.detections.map((detection, idx) => {
            const cfg = statusConfig[detection.status] || statusConfig.analyzing;
            const StatusIcon = statusIcons[detection.status as keyof typeof statusIcons] || Search;
            return (
              <div
                key={detection.id}
                onClick={() => onViewDetails(detection)}
                className={cn(
                  'flex items-center gap-2 sm:gap-4 rounded-xl border p-2 sm:p-3 cursor-pointer transition-all duration-200',
                  'hover:bg-[hsl(217,33%,17%)]/30 hover:border-blue-500/25',
                  cfg.border, cfg.bg,
                )}
              >
                <span className="text-[10px] text-slate-600 font-mono w-4 sm:w-5 text-center flex-shrink-0">
                  #{idx + 1}
                </span>

                <div
                  className={cn(
                    'w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0',
                    detection.gradientFrom,
                    detection.gradientTo,
                  )}
                >
                  <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                    {detection.objectName}
                  </p>
                  {detection.description && (
                    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5 hidden sm:block">
                      {detection.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-slate-400 font-mono flex-shrink-0 tabular-nums">
                  <Percent className="w-3 h-3 hidden sm:block" />
                  {detection.confidenceScore}%
                </div>

                <Badge
                  variant="outline"
                  className={cn('text-[9px] sm:text-[10px] font-mono flex-shrink-0 hidden sm:flex', cfg.color, cfg.border, cfg.bg)}
                >
                  {cfg.label}
                </Badge>

                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
