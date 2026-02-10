import { ReactNode, useState } from 'react';
import { MissionSidebar } from './MissionSidebar';
import { MissionHeader } from './MissionHeader';
import { ActivityPanel } from './ActivityPanel';
import { useDetectionHistory } from '@/store/detectionHistory';
import { Activity, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb: string[];
  showActivityPanel?: boolean;
}

export function DashboardLayout({ children, breadcrumb, showActivityPanel = true }: DashboardLayoutProps) {
  const activityLogs = useDetectionHistory((s) => s.activityLogs);
  const [mobileActivityOpen, setMobileActivityOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)]">
      {/* Sidebar */}
      <MissionSidebar />

      {/* Main content area — offset by collapsed sidebar width on desktop, no offset on mobile */}
      <div className="ml-0 md:ml-[68px] flex flex-col min-h-screen transition-all duration-300">
        {/* Header */}
        <MissionHeader breadcrumb={breadcrumb} />

        {/* Content wrapper */}
        <div className="flex flex-1 relative">
          <main className={`flex-1 min-w-0 transition-all duration-300 ${showActivityPanel ? 'xl:mr-80' : ''}`}>
            {children}
          </main>

          {/* Activity Panel — visible on xl+ */}
          {showActivityPanel && (
            <div className="hidden xl:block">
              <ActivityPanel logs={activityLogs} />
            </div>
          )}

          {/* Mobile Activity FAB — visible below xl when activity panel is enabled */}
          {showActivityPanel && (
            <button
              onClick={() => setMobileActivityOpen(true)}
              className="xl:hidden fixed right-3 bottom-20 md:bottom-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 shadow-lg backdrop-blur-sm hover:bg-blue-500/30 transition-colors"
              title="Activity Feed"
            >
              <Activity className="h-5 w-5" />
              {activityLogs.filter((l) => l.type === 'alert').length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {activityLogs.filter((l) => l.type === 'alert').length}
                </span>
              )}
            </button>
          )}

          {/* Mobile Activity Drawer overlay */}
          {showActivityPanel && mobileActivityOpen && (
            <div className="xl:hidden fixed inset-0 z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileActivityOpen(false)}
              />
              {/* Drawer */}
              <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-[hsl(222,47%,4%)]/98 border-l border-[hsl(217,33%,17%)]/60 shadow-2xl animate-slide-in-right">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(217,33%,17%)]/60">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold text-slate-100">Activity Feed</span>
                  </div>
                  <button
                    onClick={() => setMobileActivityOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-[hsl(217,33%,17%)]/40 hover:text-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-y-auto h-[calc(100%-52px)]">
                  <ActivityPanel logs={activityLogs} embedded />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
