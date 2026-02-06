import { ReactNode } from 'react';
import { MissionSidebar } from './MissionSidebar';
import { MissionHeader } from './MissionHeader';
import { ActivityPanel } from './ActivityPanel';
import { mockActivityLogs } from '@/data/mockData';

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb: string[];
  showActivityPanel?: boolean;
}

export function DashboardLayout({ children, breadcrumb, showActivityPanel = true }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <MissionSidebar />

      {/* Main content area */}
      <div className="ml-16">
        {/* Header */}
        <MissionHeader breadcrumb={breadcrumb} />

        {/* Content */}
        <main className={showActivityPanel ? 'mr-72' : ''}>
          {children}
        </main>

        {/* Activity Panel */}
        {showActivityPanel && <ActivityPanel logs={mockActivityLogs} />}
      </div>
    </div>
  );
}
