import { Clock, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const historyItems = [
  { id: '1', name: 'UAV - Model X', time: 'Today, 14:02', status: 'Acknowledged' },
  { id: '2', name: 'Transport Vehicle', time: 'Today, 13:45', status: 'Verified' },
  { id: '3', name: 'Unknown Personnel', time: 'Today, 12:30', status: 'Dismissed' },
  { id: '4', name: 'Surveillance Drone', time: 'Yesterday, 22:15', status: 'Escalated' },
  { id: '5', name: 'Armored Vehicle', time: 'Yesterday, 18:00', status: 'Verified' },
];

export default function History() {
  return (
    <DashboardLayout breadcrumb={['Mission Control', 'History']} showActivityPanel={false}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Detection History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review past detections and their resolutions
          </p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search history..."
            className="pl-10 bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]"
          />
        </div>

        <div className="space-y-3">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-[hsl(217,33%,17%)] bg-[hsl(222,47%,8%)] p-4 transition-colors hover:border-blue-500/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(217,33%,17%)]">
                  <Clock className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-100">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.time}</p>
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
