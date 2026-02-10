import { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Shield,
  Image as ImageIcon,
  Crosshair,
  Timer,
  Layers,
  Activity,
  Target,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDetectionHistory } from '@/store/detectionHistory';
import { cn } from '@/lib/utils';

export default function Analytics() {
  const analyses = useDetectionHistory((s) => s.analyses);

  const totalDetections = analyses.reduce((sum, a) => sum + a.totalDetections, 0);
  const totalThreats = analyses.reduce((sum, a) => sum + a.threats, 0);
  const totalVerified = analyses.reduce((sum, a) => sum + a.verified, 0);
  const totalAnalyzing = analyses.reduce((sum, a) => sum + a.analyzing, 0);
  const avgTime = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + a.processingTimeMs, 0) / analyses.length
    : 0;
  const avgTimeSec = (avgTime / 1000).toFixed(1);

  // Object frequency map
  const objectFrequency = useMemo(() => {
    const map: Record<string, number> = {};
    analyses.forEach((a) =>
      a.detections.forEach((d) => {
        map[d.objectName] = (map[d.objectName] || 0) + 1;
      })
    );
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [analyses]);

  const maxFreq = objectFrequency.length > 0 ? objectFrequency[0][1] : 1;

  // Confidence distribution
  const confidenceBuckets = useMemo(() => {
    const buckets = [
      { label: '90-100%', min: 90, max: 100, count: 0 },
      { label: '80-89%', min: 80, max: 89, count: 0 },
      { label: '70-79%', min: 70, max: 79, count: 0 },
      { label: '60-69%', min: 60, max: 69, count: 0 },
      { label: '<60%', min: 0, max: 59, count: 0 },
    ];
    analyses.forEach((a) =>
      a.detections.forEach((d) => {
        const bucket = buckets.find((b) => d.confidenceScore >= b.min && d.confidenceScore <= b.max);
        if (bucket) bucket.count++;
      })
    );
    return buckets;
  }, [analyses]);

  const maxBucketCount = Math.max(...confidenceBuckets.map((b) => b.count), 1);

  // Processing speed per scan
  const speedData = useMemo(() => {
    return analyses
      .slice(-10)
      .map((a) => ({
        name: a.imageName.length > 10 ? a.imageName.slice(0, 10) + '…' : a.imageName,
        ms: a.processingTimeMs,
      }));
  }, [analyses]);

  const maxSpeed = speedData.length > 0 ? Math.max(...speedData.map((s) => s.ms)) : 1;

  const stats = [
    {
      title: 'Total Detections',
      value: totalDetections.toLocaleString(),
      sub: `from ${analyses.length} image${analyses.length !== 1 ? 's' : ''}`,
      icon: Crosshair,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: 'Threats Identified',
      value: totalThreats.toLocaleString(),
      sub: totalDetections > 0
        ? `${((totalThreats / totalDetections) * 100).toFixed(1)}% of total`
        : 'no data yet',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      title: 'Verified Objects',
      value: totalVerified.toLocaleString(),
      sub: totalDetections > 0
        ? `${((totalVerified / totalDetections) * 100).toFixed(1)}% of total`
        : 'no data yet',
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Avg Processing',
      value: `${avgTimeSec}s`,
      sub: analyses.length > 0 ? `~${avgTime.toFixed(0)}ms per image` : 'no data yet',
      icon: Timer,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Analytics']} showActivityPanel={false}>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
            <BarChart3 className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Analytics Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Performance metrics and detection statistics
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, i) => (
            <Card
              key={stat.title}
              className={cn(
                'bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60 overflow-hidden transition-all duration-300 hover:shadow-lg group animate-fade-in',
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', stat.bg, stat.border)}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{stat.title}</span>
                </div>
                <div className="text-3xl font-bold text-slate-100 font-mono tracking-tight">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {/* Object Frequency Bar Chart */}
          <Card className="bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  Object Frequency
                </CardTitle>
                <span className="text-[10px] font-mono text-slate-500">
                  {objectFrequency.length} unique type{objectFrequency.length !== 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {objectFrequency.length === 0 ? (
                <EmptyChart message="Run analyses to see object frequency" />
              ) : (
                <div className="space-y-3">
                  {objectFrequency.map(([name, count], i) => (
                    <div key={name} className="group/bar">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-300 font-medium truncate max-w-[70%]">{name}</span>
                        <span className="text-xs font-mono text-slate-500">{count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[hsl(217,33%,17%)]/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700 ease-out"
                          style={{
                            width: `${(count / maxFreq) * 100}%`,
                            animationDelay: `${i * 100}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Threat Distribution Donut */}
          <Card className="bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  Threat Distribution
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {totalDetections === 0 ? (
                <EmptyChart message="Run analyses to see threat distribution" />
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  {/* CSS Donut */}
                  <div className="relative h-36 w-36 sm:h-44 sm:w-44 shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      {(() => {
                        const segments = [
                          { value: totalThreats, color: '#ef4444', label: 'Threats' },
                          { value: totalVerified, color: '#10b981', label: 'Verified' },
                          { value: totalAnalyzing, color: '#f59e0b', label: 'Analyzing' },
                        ].filter((s) => s.value > 0);
                        const total = segments.reduce((s, seg) => s + seg.value, 0);
                        let offset = 0;
                        const circumference = 2 * Math.PI * 35;
                        return segments.map((seg) => {
                          const pct = seg.value / total;
                          const dash = pct * circumference;
                          const gap = circumference - dash;
                          const currentOffset = offset;
                          offset += dash;
                          return (
                            <circle
                              key={seg.label}
                              cx="50"
                              cy="50"
                              r="35"
                              fill="none"
                              stroke={seg.color}
                              strokeWidth="10"
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={-currentOffset}
                              strokeLinecap="round"
                              className="transition-all duration-700"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-100 font-mono">{totalDetections}</span>
                      <span className="text-[10px] text-slate-500">total</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Threats', value: totalThreats, color: 'bg-red-500', textColor: 'text-red-400' },
                      { label: 'Verified', value: totalVerified, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                      { label: 'Analyzing', value: totalAnalyzing, color: 'bg-amber-500', textColor: 'text-amber-400' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-3 w-3 rounded-sm', item.color)} />
                          <span className="text-xs text-slate-300">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-bold font-mono', item.textColor)}>{item.value}</span>
                          <span className="text-[10px] text-slate-600 font-mono w-10 text-right">
                            {totalDetections > 0 ? `${((item.value / totalDetections) * 100).toFixed(0)}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {/* Confidence Distribution */}
          <Card className="bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Confidence Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalDetections === 0 ? (
                <EmptyChart message="Run analyses to see confidence distribution" />
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {confidenceBuckets.map((bucket) => (
                    <div key={bucket.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400 font-mono">{bucket.label}</span>
                        <span className="text-xs font-mono text-slate-500">{bucket.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[hsl(217,33%,17%)]/50 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            bucket.min >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                            bucket.min >= 80 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                            bucket.min >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                            'bg-gradient-to-r from-slate-500 to-slate-400'
                          )}
                          style={{ width: `${(bucket.count / maxBucketCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Speed per Scan */}
          <Card className="bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  Processing Speed
                </CardTitle>
                <span className="text-[10px] font-mono text-slate-500">last {speedData.length} scans</span>
              </div>
            </CardHeader>
            <CardContent>
              {speedData.length === 0 ? (
                <EmptyChart message="Run analyses to see processing speed" />
              ) : (
                <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-40">
                  {speedData.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group/speed min-w-0">
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 opacity-0 group-hover/speed:opacity-100 transition-opacity">
                        {item.ms.toFixed(0)}ms
                      </span>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500 hover:from-amber-500 hover:to-amber-300 min-h-[4px]"
                        style={{ height: `${(item.ms / maxSpeed) * 100}%` }}
                      />
                      <span className="text-[7px] sm:text-[8px] font-mono text-slate-600 truncate w-full text-center">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-40 flex flex-col items-center justify-center rounded-xl bg-[hsl(217,33%,17%)]/20 border border-dashed border-[hsl(217,33%,17%)]/40">
      <BarChart3 className="h-8 w-8 text-slate-700 mb-2" />
      <p className="text-xs text-slate-600">{message}</p>
    </div>
  );
}
