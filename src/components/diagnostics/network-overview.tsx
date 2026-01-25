'use client';

/**
 * Network overview component showing summary cards.
 * Displays device counts, connection types, and overall health.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Wifi,
  Cable,
  Radio,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import type { NetworkHealthSummary } from '@/types/sonos';

interface NetworkOverviewProps {
  health: NetworkHealthSummary | null;
  isLoading: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sublabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

function StatCard({ icon, label, value, sublabel, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-surface border-border-subtle',
    success: 'bg-success/10 border-success/30',
    warning: 'bg-warning/10 border-warning/30',
    error: 'bg-destructive/10 border-destructive/30',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive',
  };

  return (
    <Card className={cn('border', variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-muted/50', iconStyles[variant])}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sublabel && (
              <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-surface border-border-subtle">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg bg-muted" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-12 bg-muted" />
                <Skeleton className="h-3 w-20 bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function NetworkOverview({ health, isLoading }: NetworkOverviewProps) {
  if (isLoading || !health) {
    return <LoadingSkeleton />;
  }

  const healthVariant =
    health.overallHealth === 'healthy'
      ? 'success'
      : health.overallHealth === 'warning'
      ? 'warning'
      : 'error';

  const healthIcon =
    health.overallHealth === 'healthy' ? (
      <CheckCircle className="w-5 h-5" />
    ) : health.overallHealth === 'warning' ? (
      <AlertTriangle className="w-5 h-5" />
    ) : (
      <AlertCircle className="w-5 h-5" />
    );

  const healthLabel =
    health.overallHealth === 'healthy'
      ? 'Healthy'
      : health.overallHealth === 'warning'
      ? 'Warning'
      : 'Critical';

  return (
    <div className="space-y-4">
      {/* Health Status Banner */}
      <Card className={cn(
        'border',
        healthVariant === 'success' && 'bg-success/10 border-success/30',
        healthVariant === 'warning' && 'bg-warning/10 border-warning/30',
        healthVariant === 'error' && 'bg-destructive/10 border-destructive/30'
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                healthVariant === 'success' && 'bg-success/20 text-success',
                healthVariant === 'warning' && 'bg-warning/20 text-warning',
                healthVariant === 'error' && 'bg-destructive/20 text-destructive'
              )}>
                {healthIcon}
              </div>
              <div>
                <p className="font-semibold text-foreground">Network Status: {healthLabel}</p>
                <p className="text-sm text-muted-foreground">
                  {health.onlineDevices} of {health.totalDevices} devices online
                  {health.issues.length > 0 && ` • ${health.issues.length} issue${health.issues.length > 1 ? 's' : ''} detected`}
                </p>
              </div>
            </div>
            <Badge
              variant={healthVariant === 'success' ? 'default' : 'outline'}
              className={cn(
                healthVariant === 'warning' && 'border-warning text-warning',
                healthVariant === 'error' && 'border-destructive text-destructive'
              )}
            >
              <Activity className="w-3 h-3 mr-1" />
              {health.hasSonosNet ? 'SonosNet Active' : 'WiFi Only'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Wifi className="w-5 h-5" />}
          label="Online"
          value={health.onlineDevices}
          sublabel={health.offlineDevices > 0 ? `${health.offlineDevices} offline` : undefined}
          variant={health.offlineDevices > 0 ? 'warning' : 'success'}
        />

        <StatCard
          icon={<Cable className="w-5 h-5" />}
          label="Wired"
          value={health.wiredDevices}
          sublabel="Ethernet connected"
        />

        <StatCard
          icon={<Radio className="w-5 h-5" />}
          label="SonosNet"
          value={health.sonosNetDevices}
          sublabel="Mesh network"
        />

        <StatCard
          icon={<Wifi className="w-5 h-5" />}
          label="WiFi"
          value={health.wifiDevices}
          sublabel="Direct WiFi"
          variant={!health.hasSonosNet && health.wifiDevices > 0 ? 'warning' : 'default'}
        />
      </div>
    </div>
  );
}
