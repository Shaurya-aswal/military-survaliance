import { useState } from 'react';
import { ChevronRight, ChevronLeft, AlertTriangle, Monitor, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ActivityLog } from '@/types/detection';

interface ActivityPanelProps {
  logs: ActivityLog[];
}

const typeIcons = {
  alert: AlertTriangle,
  system: Monitor,
  user: User,
};

const typeColors = {
  alert: 'text-mission-threat',
  system: 'text-muted-foreground',
  user: 'text-primary',
};

export function ActivityPanel({ logs }: ActivityPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={cn(
        'fixed right-0 top-14 z-30 h-[calc(100vh-3.5rem)] border-l border-border bg-mission-slate-950 transition-all duration-300',
        isOpen ? 'w-72' : 'w-0'
      )}
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'absolute -left-10 top-4 z-40 h-8 w-8 rounded-l-lg rounded-r-none border border-r-0 border-border bg-mission-slate-900 text-muted-foreground hover:bg-secondary hover:text-foreground',
          !isOpen && '-left-10'
        )}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 py-4">
              {logs.map((log) => {
                const Icon = typeIcons[log.type];
                return (
                  <div
                    key={log.id}
                    className="flex gap-3 rounded-lg border border-border/50 bg-mission-slate-900 p-3"
                  >
                    <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', typeColors[log.type])} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground leading-relaxed">{log.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{log.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </aside>
  );
}
