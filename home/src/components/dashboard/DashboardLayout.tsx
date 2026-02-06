import { ReactNode } from 'react';
import { MissionSidebar } from './MissionSidebar';
import { MissionHeader } from './MissionHeader';
import { ActivityPanel } from './ActivityPanel';
import { useDetectionHistory } from '@/store/detectionHistory';

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb: string[];
  showActivityPanel?: boolean;
}

export function DashboardLayout({ children, breadcrumb, showActivityPanel = true }: DashboardLayoutProps) {
  const activityLogs = useDetectionHistory((s) => s.activityLogs);

  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)]">
      {/* Sidebar */}
      <MissionSidebar />

      {/* Main content area — offset by collapsed sidebar width */}
      <div className="ml-[68px] flex flex-col min-h-screen transition-all duration-300">
        {/* Header */}
        <MissionHeader breadcrumb={breadcrumb} />

        {/* Content wrapper */}
        <div className="flex flex-1 relative">
          <main className={`flex-1 min-w-0 transition-all duration-300 ${showActivityPanel ? 'mr-80' : ''}`}>
            {children}
          </main>

          {/* Activity Panel */}
          {showActivityPanel && <ActivityPanel logs={activityLogs} />}
        </div>
      </div>
    </div>
  );
}
