import { Clock, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const historyItems: { id: string; name: string; time: string; status: string }[] = [];

export default function History() {
  return (
    <DashboardLayout breadcrumb={['Mission Control', 'History']} showActivityPanel={false}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Detection History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review past detections and their resolutions
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* History List */}
        <div className="space-y-3">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                </div>
              </div>
              <Badge variant="secondary">{item.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
