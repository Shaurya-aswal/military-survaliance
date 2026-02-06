import { BarChart3, TrendingUp, AlertTriangle, Shield, Image as ImageIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDetectionHistory } from '@/store/detectionHistory';

export default function Analytics() {
  const analyses = useDetectionHistory((s) => s.analyses);

  const totalDetections = analyses.reduce((sum, a) => sum + a.totalDetections, 0);
  const totalThreats = analyses.reduce((sum, a) => sum + a.threats, 0);
  const totalVerified = analyses.reduce((sum, a) => sum + a.verified, 0);
  const avgTime = analyses.length > 0
    ? (analyses.reduce((sum, a) => sum + a.processingTimeMs, 0) / analyses.length / 1000).toFixed(1)
    : '0.0';

  const stats = [
    {
      title: 'Total Detections',
      value: totalDetections.toLocaleString(),
      sub: `from ${analyses.length} image${analyses.length !== 1 ? 's' : ''}`,
      icon: BarChart3,
    },
    {
      title: 'Threats Identified',
      value: totalThreats.toLocaleString(),
      sub: totalDetections > 0
        ? `${((totalThreats / totalDetections) * 100).toFixed(0)}% of total`
        : 'no data yet',
      icon: AlertTriangle,
    },
    {
      title: 'Verified Contacts',
      value: totalVerified.toLocaleString(),
      sub: totalDetections > 0
        ? `${((totalVerified / totalDetections) * 100).toFixed(0)}% of total`
        : 'no data yet',
      icon: Shield,
    },
    {
      title: 'Avg Processing Time',
      value: `${avgTime}s`,
      sub: analyses.length > 0 ? 'per image' : 'no data yet',
      icon: TrendingUp,
    },
  ];

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
                <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
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
