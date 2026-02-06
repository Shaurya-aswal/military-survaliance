import { ChevronRight, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface MissionHeaderProps {
  breadcrumb: string[];
}

export function MissionHeader({ breadcrumb }: MissionHeaderProps) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.emailAddresses?.[0]?.emailAddress ?? 'Operator';

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'OP';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)]/95 backdrop-blur px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumb.map((item, index) => (
          <span key={item} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4 text-slate-500" />}
            <span
              className={
                index === breadcrumb.length - 1
                  ? 'text-slate-100 font-medium'
                  : 'text-slate-500'
              }
            >
              {item}
            </span>
          </span>
        ))}
      </nav>

      {/* User Profile Widget */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-[hsl(217,33%,17%)]">
            {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={displayName} />}
            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-100">{displayName}</p>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Operator
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}
