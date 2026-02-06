import { BarChart3, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Detections',
    value: '2,847',
    change: '+12%',
    icon: BarChart3,
  },
  {
    title: 'Threats Identified',
    value: '142',
    change: '-8%',
    icon: AlertTriangle,
  },
  {
    title: 'Verified Contacts',
    value: '1,983',
    change: '+23%',
    icon: Shield,
  },
  {
    title: 'Avg Response Time',
    value: '2.3s',
    change: '-15%',
    icon: TrendingUp,
  },
];

export default function Analytics() {
  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Analytics']} showActivityPanel={false}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Performance metrics and detection statistics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                <p className="text-xs text-slate-400 mt-1">
                  <span className={stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                    {stat.change}
                  </span>{' '}
                  from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
            <CardHeader>
              <CardTitle className="text-slate-100">Detection Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center rounded-lg bg-[hsl(217,33%,17%)]/50">
                <p className="text-slate-400">Chart placeholder</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(222,47%,8%)] border-[hsl(217,33%,17%)]">
            <CardHeader>
              <CardTitle className="text-slate-100">Threat Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center rounded-lg bg-[hsl(217,33%,17%)]/50">
                <p className="text-slate-400">Chart placeholder</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
