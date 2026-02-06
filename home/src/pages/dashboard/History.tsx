import { useState } from 'react';
import { Clock, Search, AlertTriangle, CheckCircle, Eye, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDetectionHistory } from '@/store/detectionHistory';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  threat: 'text-red-400 bg-red-500/10 border-red-500/30',
  verified: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  analyzing: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

export default function History() {
  const analyses = useDetectionHistory((s) => s.analyses);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = analyses.filter((a) =>
    a.imageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.detections.some((d) => d.objectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'History']} showActivityPanel={false}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Detection History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review past analyses and their results
          </p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by image name or detection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]"
          />
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Eye className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {analyses.length === 0
                ? 'No analyses performed yet.'
                : 'No results match your search.'}
            </p>
            <p className="text-slate-600 text-xs mt-1">
              {analyses.length === 0 && 'Go to Image Analysis to run your first detection.'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((analysis) => {
            const date = new Date(analysis.timestamp);
            const timeStr = date.toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            });

            return (
              <div
                key={analysis.id}
                className="rounded-lg border border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)] p-4 transition-colors hover:border-blue-500/30"
              >
                {/* Top row: image name + time */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(217,33%,17%)]">
                      <Clock className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">{analysis.imageName}</p>
                      <p className="text-xs text-slate-500">{timeStr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {analysis.processingTimeMs.toFixed(0)}ms
                    </span>
                    <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-600">
                      {analysis.totalDetections} detection{analysis.totalDetections !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Status summary chips */}
                <div className="flex items-center gap-2 mb-3">
                  {analysis.threats > 0 && (
                    <Badge className={cn('text-[10px] font-mono', statusColors.threat)}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {analysis.threats} Threat{analysis.threats !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {analysis.verified > 0 && (
                    <Badge className={cn('text-[10px] font-mono', statusColors.verified)}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {analysis.verified} Verified
                    </Badge>
                  )}
                  {analysis.analyzing > 0 && (
                    <Badge className={cn('text-[10px] font-mono', statusColors.analyzing)}>
                      <Search className="w-3 h-3 mr-1" />
                      {analysis.analyzing} Analyzing
                    </Badge>
                  )}
                </div>

                {/* Detection list */}
                <div className="flex flex-wrap gap-2">
                  {analysis.detections.map((d) => (
                    <span
                      key={d.id}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {d.objectName} ({d.confidenceScore}%)
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
