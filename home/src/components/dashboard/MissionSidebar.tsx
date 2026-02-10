import { useState } from 'react';
import {
  Radio,
  History,
  BarChart3,
  Settings,
  LogOut,
  ScanSearch,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Video,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { icon: Radio, label: 'Live Feed', path: '/dashboard', description: 'Real-time detections' },
  { icon: ScanSearch, label: 'Analysis', path: '/dashboard/analysis', description: 'Image analysis pipeline' },
  { icon: Video, label: 'Video', path: '/dashboard/video', description: 'Video analysis pipeline' },
  { icon: MapPin, label: 'Threat Map', path: '/dashboard/map', description: 'Geospatial overview' },
  { icon: History, label: 'History', path: '/dashboard/history', description: 'Past analyses' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics', description: 'Statistics & metrics' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings', description: 'Configuration' },
];

export function MissionSidebar() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col border-r border-[hsl(217,33%,17%)]/60 bg-[hsl(222,47%,4%)] transition-all duration-300 ease-in-out',
          expanded ? 'w-56' : 'w-[68px]',
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center border-b border-[hsl(217,33%,17%)]/60 px-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
              <Crosshair className="h-5 w-5 text-blue-400" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[hsl(222,47%,4%)]">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </div>
            {expanded && (
              <div className="min-w-0 animate-fade-in">
                <p className="text-xs font-bold text-slate-100 tracking-wider truncate">SENTINEL</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">DEFENSE v2.0</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1.5 px-3 py-4 overflow-y-auto">
          <span className={cn(
            'mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600 transition-opacity duration-200',
            expanded ? 'px-2 opacity-100' : 'opacity-0 h-0 mb-0 overflow-hidden',
          )}>
            Operations
          </span>
          {navItems.map((item) => {
            const linkContent = (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                  'text-slate-400 hover:bg-[hsl(217,33%,17%)]/50 hover:text-slate-100',
                  expanded ? '' : 'justify-center',
                )}
                activeClassName="bg-blue-500/15 text-blue-400 hover:bg-blue-500/15 hover:text-blue-400 shadow-sm shadow-blue-500/5"
              >
                <item.icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                {expanded && (
                  <span className="text-sm font-medium truncate block animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            );

            if (expanded) return <div key={item.path}>{linkContent}</div>;

            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="bg-[hsl(222,47%,10%)] border-[hsl(217,33%,17%)] px-3 py-2">
                  <p className="text-xs font-medium text-slate-100">{item.label}</p>
                  <p className="text-[10px] text-slate-500">{item.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-[hsl(217,33%,17%)]/60 px-3 py-3 space-y-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-500 transition-all duration-200 hover:bg-[hsl(217,33%,17%)]/50 hover:text-slate-300',
              expanded ? '' : 'justify-center',
            )}
          >
            {expanded ? <ChevronLeft className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            {expanded && <span className="text-xs font-medium animate-fade-in">Collapse</span>}
          </button>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-500 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400',
                  expanded ? '' : 'justify-center',
                )}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                {expanded && <span className="text-xs font-medium animate-fade-in">Sign Out</span>}
              </button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" sideOffset={12} className="bg-[hsl(222,47%,10%)] border-[hsl(217,33%,17%)]">
                <p className="text-xs text-slate-100">Sign Out</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-[hsl(217,33%,17%)]/60 bg-[hsl(222,47%,4%)]/95 backdrop-blur-xl px-1 py-1 safe-area-inset-bottom">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-slate-500 transition-colors min-w-0"
            activeClassName="text-blue-400"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="text-[9px] font-medium truncate max-w-[48px]">{item.label}</span>
          </NavLink>
        ))}
        {/* More menu — Settings & Analytics accessible via sidebar on desktop */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-slate-500 transition-colors hover:text-red-400"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-[9px] font-medium">Sign Out</span>
        </button>
      </nav>
    </>
  );
}
