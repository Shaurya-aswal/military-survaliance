import { ChevronRight, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MissionHeaderProps {
  breadcrumb: string[];
}

export function MissionHeader({ breadcrumb }: MissionHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-mission-slate-900/95 backdrop-blur px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumb.map((item, index) => (
          <span key={item} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span
              className={
                index === breadcrumb.length - 1
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
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
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              CS
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">Commander Smith</p>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Mission Lead
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}
