import { ChevronRight, Bell, Shield, Wifi } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/clerk-react';
import { useDetectionHistory } from '@/store/detectionHistory';

interface MissionHeaderProps {
  breadcrumb: string[];
}

export function MissionHeader({ breadcrumb }: MissionHeaderProps) {
  const { user } = useUser();
  const analyses = useDetectionHistory((s) => s.analyses);
  const totalThreats = analyses.reduce((sum, a) => sum + a.threats, 0);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.emailAddresses?.[0]?.emailAddress ?? 'Operator';

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'OP';

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-[hsl(217,33%,17%)]/60 bg-[hsl(222,47%,6%)]/80 backdrop-blur-xl px-3 sm:px-6">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <nav className="flex items-center gap-1 text-xs sm:text-sm min-w-0">
          {breadcrumb.map((item, index) => (
            <span key={item} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              {index > 0 && <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-600 shrink-0" />}
              <span
                className={`${
                  index === breadcrumb.length - 1
                    ? 'text-slate-100 font-semibold'
                    : 'text-slate-500 font-medium hidden sm:inline'
                } truncate`}
              >
                {item}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: System status + User */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* System status indicators — hidden on small */}
        <div className="hidden lg:flex items-center gap-3 mr-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="relative h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400" />
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
            </div>
            <span className="text-[10px] font-mono font-medium text-emerald-400 uppercase tracking-wider">System Online</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(217,33%,17%)]/50">
            <Wifi className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-mono text-slate-400">API</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(217,33%,17%)]/50">
            <Shield className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] font-mono text-slate-400">{analyses.length} scans</span>
          </div>
        </div>

        {/* Compact online dot on mobile */}
        <div className="flex lg:hidden items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="relative h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400" />
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-400">ON</span>
        </div>

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:text-slate-100 hover:bg-[hsl(217,33%,17%)]/50 rounded-xl"
        >
          <Bell className="h-4 w-4" />
          {totalThreats > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {totalThreats > 9 ? '9+' : totalThreats}
            </span>
          )}
        </Button>

        {/* Divider */}
        <div className="h-6 sm:h-8 w-px bg-[hsl(217,33%,17%)]/60" />

        {/* User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs sm:text-sm font-medium text-slate-100 leading-tight truncate max-w-[120px]">{displayName}</p>
            <p className="text-[10px] text-slate-500 font-mono">OPERATOR LEVEL-3</p>
          </div>
          <div className="relative">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-[hsl(217,33%,17%)] ring-2 ring-blue-500/20">
              {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={displayName} />}
              <AvatarFallback className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 text-blue-300 text-[10px] sm:text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-[hsl(222,47%,6%)] bg-emerald-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
