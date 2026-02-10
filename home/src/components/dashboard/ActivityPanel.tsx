import { useState } from 'react';
import { ChevronRight, ChevronLeft, AlertTriangle, Monitor, User, Activity, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ActivityLog } from '@/types/detection';

interface ActivityPanelProps {
  logs: ActivityLog[];
  /** When true, renders inline (no fixed positioning or toggle button) — used inside mobile drawer */
  embedded?: boolean;
}

const typeIcons = {
  alert: AlertTriangle,
  system: Monitor,
  user: User,
};

const typeColors = {
  alert: 'text-red-400 bg-red-500/10 border-red-500/20',
  system: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  user: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const typeDots = {
  alert: 'bg-red-400',
  system: 'bg-blue-400',
  user: 'bg-emerald-400',
};

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function ActivityPanel({ logs, embedded = false }: ActivityPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const alertCount = logs.filter((l) => l.type === 'alert').length;

  // Embedded mode: render just the log list, no fixed positioning or toggle
  if (embedded) {
    return (
      <div className="flex h-full flex-col">
        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(217,33%,17%)]/30 mx-auto mb-4">
                  <Activity className="h-6 w-6 text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-500">No activity yet</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Run an image analysis to see events appear here in real-time.
                </p>
              </div>
            ) : (
              logs.map((log, index) => {
                const Icon = typeIcons[log.type];
                const colorCls = typeColors[log.type];
                const dotCls = typeDots[log.type];
                return (
                  <div
                    key={log.id}
                    className="group relative flex gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-[hsl(217,33%,17%)]/30"
                  >
                    {index < logs.length - 1 && (
                      <div className="absolute left-[26px] top-[42px] bottom-[-8px] w-px bg-[hsl(217,33%,17%)]/40" />
                    )}
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors', colorCls)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-200 leading-relaxed">{log.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', dotCls)} />
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatRelativeTime(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        'fixed right-0 top-16 z-30 h-[calc(100vh-4rem)] border-l border-[hsl(217,33%,17%)]/60 bg-[hsl(222,47%,4%)]/95 backdrop-blur-sm transition-all duration-300',
        isOpen ? 'w-80' : 'w-0'
      )}
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'absolute -left-10 top-4 z-40 h-8 w-8 rounded-l-xl rounded-r-none border border-r-0 border-[hsl(217,33%,17%)]/60 bg-[hsl(222,47%,6%)] text-slate-400 hover:bg-[hsl(217,33%,17%)] hover:text-slate-100 transition-all duration-200',
        )}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="flex h-full flex-col animate-fade-in">
          {/* Header */}
          <div className="border-b border-[hsl(217,33%,17%)]/60 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Activity Feed</h2>
                  <p className="text-[10px] text-slate-500">{logs.length} events</p>
                </div>
              </div>
              {alertCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                  {alertCount}
                </span>
              )}
            </div>
          </div>

          {/* Activity list */}
          <ScrollArea className="flex-1">
            <div className="px-4 py-3 space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(217,33%,17%)]/30 mx-auto mb-4">
                    <Activity className="h-6 w-6 text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No activity yet</p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Run an image analysis to see events appear here in real-time.
                  </p>
                </div>
              ) : (
                logs.map((log, index) => {
                  const Icon = typeIcons[log.type];
                  const colorCls = typeColors[log.type];
                  const dotCls = typeDots[log.type];
                  return (
                    <div
                      key={log.id}
                      className="group relative flex gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-[hsl(217,33%,17%)]/30"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Timeline line */}
                      {index < logs.length - 1 && (
                        <div className="absolute left-[26px] top-[42px] bottom-[-8px] w-px bg-[hsl(217,33%,17%)]/40" />
                      )}

                      {/* Icon */}
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                        colorCls,
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-200 leading-relaxed">{log.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn('h-1.5 w-1.5 rounded-full', dotCls)} />
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatRelativeTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </aside>
  );
}
