import { User, Bell, Shield, Monitor } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const settingsSections = [
  {
    title: 'Profile Settings',
    description: 'Manage your account preferences',
    icon: User,
  },
  {
    title: 'Notifications',
    description: 'Configure alert preferences',
    icon: Bell,
  },
  {
    title: 'Security',
    description: 'Access control and authentication',
    icon: Shield,
  },
  {
    title: 'Display',
    description: 'Customize the dashboard appearance',
    icon: Monitor,
  },
];

export default function SettingsPage() {
  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Settings']} showActivityPanel={false}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your mission control preferences
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections.map((section) => (
            <Card key={section.title} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${section.title}-1`} className="text-sm text-muted-foreground">
                    Enable feature
                  </Label>
                  <Switch id={`${section.title}-1`} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${section.title}-2`} className="text-sm text-muted-foreground">
                    Advanced mode
                  </Label>
                  <Switch id={`${section.title}-2`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
