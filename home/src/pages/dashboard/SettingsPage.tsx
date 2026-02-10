import {
  User,
  Bell,
  Shield,
  Monitor,
  Globe,
  Database,
  Cpu,
  Palette,
  Settings as SettingsIcon,
  ExternalLink,
  MapPin,
  Volume2,
  Eye,
  Zap,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/clerk-react';
import { cn } from '@/lib/utils';

const settingsSections = [
  {
    title: 'Detection Pipeline',
    description: 'Configure YOLO + ViT analysis settings',
    icon: Cpu,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    settings: [
      { id: 'auto-classify', label: 'Auto-classify with ViT', description: 'Run ViT classifier automatically after YOLO detection', defaultOn: true },
      { id: 'high-conf', label: 'High-confidence mode', description: 'Only show detections above 70% confidence', defaultOn: false },
      { id: 'batch-mode', label: 'Batch processing', description: 'Queue multiple images for sequential analysis', defaultOn: false },
    ],
  },
  {
    title: 'Notifications & Alerts',
    description: 'Configure alert preferences and sounds',
    icon: Bell,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    settings: [
      { id: 'threat-alert', label: 'Threat alerts', description: 'Show notifications for threat detections', defaultOn: true },
      { id: 'sound-alert', label: 'Sound alerts', description: 'Play audio for high-priority detections', defaultOn: false },
      { id: 'desktop-notif', label: 'Desktop notifications', description: 'Browser push notifications for new detections', defaultOn: false },
    ],
  },
  {
    title: 'Map & Geolocation',
    description: 'Configure threat map behavior',
    icon: MapPin,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    settings: [
      { id: 'auto-geo', label: 'Auto-capture geolocation', description: 'Automatically tag analyses with device GPS coordinates', defaultOn: true },
      { id: 'cluster-markers', label: 'Cluster markers', description: 'Group nearby markers on the threat map', defaultOn: true },
      { id: 'dark-tiles', label: 'Dark map tiles', description: 'Use CartoDB Dark Matter tile layer', defaultOn: true },
    ],
  },
  {
    title: 'Display & Interface',
    description: 'Customize the dashboard appearance',
    icon: Palette,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    settings: [
      { id: 'animations', label: 'Animations', description: 'Enable interface transition animations', defaultOn: true },
      { id: 'compact-view', label: 'Compact view', description: 'Reduce spacing in detection cards', defaultOn: false },
      { id: 'show-confidence', label: 'Show confidence scores', description: 'Display percentage on detection cards', defaultOn: true },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useUser();
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.emailAddresses?.[0]?.emailAddress ?? 'Operator';
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Settings']} showActivityPanel={false}>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-500/10 border border-slate-500/20 shrink-0">
            <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Settings</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Configure your mission control preferences
            </p>
          </div>
        </div>

        {/* Profile card */}
        <Card className="bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative shrink-0">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl border-2 border-[hsl(217,33%,17%)] object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-[hsl(217,33%,17%)]">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-[hsl(222,47%,8%)] bg-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg font-semibold text-slate-100 truncate">{displayName}</p>
                <p className="text-xs sm:text-sm text-slate-500 truncate">{email}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Badge className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Operator Level-3
                </Badge>
                <Badge className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="relative flex h-1.5 w-1.5 mr-1"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {settingsSections.map((section, sectionIdx) => (
            <Card
              key={section.title}
              className="bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60 transition-all duration-300 hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${sectionIdx * 80}ms` }}
            >
              <CardHeader className="pb-3 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border shrink-0', section.iconBg)}>
                    <section.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', section.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold text-slate-100">{section.title}</CardTitle>
                    <CardDescription className="text-[11px] text-slate-500 hidden sm:block">{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 pt-0 px-2 sm:px-6">
                {section.settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between rounded-xl p-2 sm:p-3 transition-colors hover:bg-[hsl(217,33%,17%)]/20 group"
                  >
                    <div className="min-w-0 pr-3 sm:pr-4">
                      <Label htmlFor={setting.id} className="text-xs sm:text-sm text-slate-200 font-medium cursor-pointer">
                        {setting.label}
                      </Label>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-relaxed hidden sm:block">{setting.description}</p>
                    </div>
                    <Switch id={setting.id} defaultChecked={setting.defaultOn} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System info footer */}
        <Card className="bg-[hsl(222,47%,8%)]/80 border-[hsl(217,33%,17%)]/60">
          <CardContent className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="grid grid-cols-2 sm:flex items-center gap-4 sm:gap-6">
                {[
                  { label: 'Backend', value: 'FastAPI', icon: Zap },
                  { label: 'Detection', value: 'YOLOv8n', icon: Eye },
                  { label: 'Classifier', value: 'ViT-B/16', icon: Cpu },
                  { label: 'Database', value: 'MongoDB', icon: Database },
                ].map((info) => (
                  <div key={info.label} className="flex items-center gap-2">
                    <info.icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">{info.label}</p>
                      <p className="text-xs text-slate-400 font-mono">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="https://github.com/Shaurya-aswal/military-survaliance"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
