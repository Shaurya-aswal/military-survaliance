import { Radio, History, BarChart3, Settings, LogOut, ScanSearch } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { icon: Radio, label: 'Live Feed', path: '/dashboard' },
  { icon: ScanSearch, label: 'Image Analysis', path: '/dashboard/analysis' },
  { icon: History, label: 'History', path: '/dashboard/history' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export function MissionSidebar() {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col bg-[hsl(222,47%,4%)] border-r border-[hsl(217,33%,17%)]">
      {/* Logo area */}
      <div className="flex h-14 items-center justify-center border-b border-[hsl(217,33%,17%)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
          <Radio className="h-4 w-4 text-blue-400" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={cn(
              'group flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
              'text-slate-400 hover:bg-[hsl(217,33%,17%)] hover:text-slate-100'
            )}
            activeClassName="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-400"
          >
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout button */}
      <div className="flex flex-col items-center gap-2 pb-4">
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </button>
      </div>
    </aside>
  );
}
