import { Radio, History, BarChart3, Settings, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Radio, label: 'Live Feed', path: '/' },
  { icon: History, label: 'History', path: '/history' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function MissionSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col bg-mission-slate-950 border-r border-border">
      {/* Logo area */}
      <div className="flex h-14 items-center justify-center border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <Radio className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={cn(
              'group flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
              'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
            activeClassName="bg-primary/20 text-primary hover:bg-primary/20 hover:text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout button */}
      <div className="flex flex-col items-center gap-2 pb-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-destructive/20 hover:text-destructive"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </button>
      </div>
    </aside>
  );
}
