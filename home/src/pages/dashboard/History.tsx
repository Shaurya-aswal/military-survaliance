import { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  AlertTriangle,
  CheckCircle,
  Eye,
  Zap,
  Trash2,
  History as HistoryIcon,
  Filter,
  Image as ImageIcon,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDetectionHistory } from '@/store/detectionHistory';
import { cn } from '@/lib/utils';

type FilterMode = 'all' | 'threats' | 'verified' | 'analyzing';

const statusColors: Record<string, string> = {
  threat: 'text-red-400 bg-red-500/10 border-red-500/30',
  verified: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  analyzing: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

export default function History() {
  const analyses = useDetectionHistory((s) => s.analyses);
  const removeAnalysis = useDetectionHistory((s) => s.removeAnalysis);
  const clearAll = useDetectionHistory((s) => s.clearAll);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filtered = useMemo(() => {
    let result = analyses;

    // Text filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.imageName.toLowerCase().includes(q) ||
          a.detections.some((d) => d.objectName.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filterMode === 'threats') result = result.filter((a) => a.threats > 0);
    if (filterMode === 'verified') result = result.filter((a) => a.verified > 0);
    if (filterMode === 'analyzing') result = result.filter((a) => a.analyzing > 0);

    return result;
  }, [analyses, searchQuery, filterMode]);

  const totalThreats = analyses.reduce((s, a) => s + a.threats, 0);
  const totalVerified = analyses.reduce((s, a) => s + a.verified, 0);
  const totalAnalyzing = analyses.reduce((s, a) => s + a.analyzing, 0);

  const filterTabs: { mode: FilterMode; label: string; count: number; color: string }[] = [
    { mode: 'all', label: 'All', count: analyses.length, color: 'text-slate-300' },
    { mode: 'threats', label: 'Threats', count: totalThreats, color: 'text-red-400' },
    { mode: 'verified', label: 'Verified', count: totalVerified, color: 'text-emerald-400' },
    { mode: 'analyzing', label: 'Pending', count: totalAnalyzing, color: 'text-amber-400' },
  ];

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'History']} showActivityPanel={false}>
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
              <HistoryIcon className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Detection History</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Review and manage past analyses
              </p>
            </div>
          </div>
          {analyses.length > 0 && (
            <button
              onClick={() => { if (window.confirm('Delete ALL history? This cannot be undone.')) clearAll(); }}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/15 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>

        {/* Search + filter bar */}
        {analyses.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search by image name or object..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60 rounded-xl h-10 text-sm focus:border-blue-500/40 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[hsl(222,47%,8%)]/50 border border-[hsl(217,33%,17%)]/40">
              {filterTabs.map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => setFilterMode(tab.mode)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                    filterMode === tab.mode
                      ? 'bg-[hsl(217,33%,17%)]/70 text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <span>{tab.label}</span>
                  <span className={cn(
                    'font-mono text-[10px] px-1.5 py-0.5 rounded-md',
                    filterMode === tab.mode
                      ? `${tab.color} bg-black/20`
                      : 'text-slate-600'
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(217,33%,17%)]/20 mb-5">
              {analyses.length === 0 ? (
                <HistoryIcon className="w-9 h-9 text-slate-600" />
              ) : (
                <Search className="w-9 h-9 text-slate-600" />
              )}
            </div>
            <p className="text-slate-400 text-base font-medium mb-1">
              {analyses.length === 0 ? 'No analyses yet' : 'No matching results'}
            </p>
            <p className="text-slate-600 text-sm max-w-sm text-center leading-relaxed">
              {analyses.length === 0
                ? 'Go to Image Analysis to run your first detection.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              <span>Analysis</span>
              <span className="w-20 text-center">Objects</span>
              <span className="w-20 text-center">Speed</span>
              <span className="w-48 text-center">Status</span>
              <span className="w-8" />
            </div>

            {filtered.map((analysis, i) => {
              const date = new Date(analysis.timestamp);
              const timeStr = date.toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
              });

              const hasThreat = analysis.threats > 0;

              return (
                <div
                  key={analysis.id}
                  className={cn(
                    'rounded-xl border bg-[hsl(222,47%,8%)]/80 p-4 transition-all duration-300 hover:shadow-lg group animate-fade-in',
                    hasThreat
                      ? 'border-red-500/20 hover:border-red-500/30 hover:shadow-red-500/5'
                      : 'border-[hsl(217,33%,17%)]/60 hover:border-blue-500/20 hover:shadow-blue-500/5'
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Image info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
                        hasThreat
                          ? 'bg-red-500/10 border-red-500/20'
                          : 'bg-[hsl(217,33%,17%)]/50 border-[hsl(217,33%,17%)]/60'
                      )}>
                        <ImageIcon className={cn('h-5 w-5', hasThreat ? 'text-red-400' : 'text-slate-400')} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{analysis.imageName}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeStr}
                        </p>
                      </div>
                    </div>

                    {/* Object count */}
                    <div className="hidden sm:flex flex-col items-center w-20 shrink-0">
                      <span className="text-base font-bold text-slate-100 font-mono">{analysis.totalDetections}</span>
                      <span className="text-[10px] text-slate-500">objects</span>
                    </div>

                    {/* Speed */}
                    <div className="hidden sm:flex items-center gap-1 w-20 justify-center shrink-0">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-slate-400 font-mono">{analysis.processingTimeMs.toFixed(0)}ms</span>
                    </div>

                    {/* Status badges */}
                    <div className="hidden sm:flex items-center gap-1.5 w-48 justify-center shrink-0 flex-wrap">
                      {analysis.threats > 0 && (
                        <Badge className={cn('text-[10px] font-mono', statusColors.threat)}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {analysis.threats}
                        </Badge>
                      )}
                      {analysis.verified > 0 && (
                        <Badge className={cn('text-[10px] font-mono', statusColors.verified)}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {analysis.verified}
                        </Badge>
                      )}
                      {analysis.analyzing > 0 && (
                        <Badge className={cn('text-[10px] font-mono', statusColors.analyzing)}>
                          <Search className="w-3 h-3 mr-1" />
                          {analysis.analyzing}
                        </Badge>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => { if (window.confirm(`Delete analysis "${analysis.imageName}"?`)) removeAnalysis(analysis.id); }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-red-500/10 hover:text-red-400"
                      title="Delete this analysis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Detection chips — expandable row */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pl-14">
                    {analysis.detections.map((d) => (
                      <span
                        key={d.id}
                        className={cn(
                          'text-[10px] font-mono px-2 py-1 rounded-lg border transition-colors',
                          d.status === 'threat'
                            ? 'bg-red-500/5 text-red-400 border-red-500/20'
                            : d.status === 'verified'
                              ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                              : 'bg-[hsl(217,33%,17%)]/30 text-slate-400 border-[hsl(217,33%,17%)]/50'
                        )}
                      >
                        {d.objectName} <span className="text-slate-600">•</span> {d.confidenceScore}%
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
