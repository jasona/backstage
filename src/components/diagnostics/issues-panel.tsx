'use client';

/**
 * Issues panel component.
 * Displays detected network issues with recommendations.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  WifiOff,
  SignalLow,
  Wifi,
  Radio,
} from 'lucide-react';
import type { NetworkIssue } from '@/types/sonos';

interface IssuesPanelProps {
  issues: NetworkIssue[];
  isLoading: boolean;
}

function IssueIcon({ type }: { type: NetworkIssue['type'] }) {
  const icons: Record<NetworkIssue['type'], React.ReactNode> = {
    device_offline: <WifiOff className="w-4 h-4" />,
    weak_signal: <SignalLow className="w-4 h-4" />,
    wifi_only: <Wifi className="w-4 h-4" />,
    no_sonosnet: <Radio className="w-4 h-4" />,
  };

  return icons[type] || <AlertCircle className="w-4 h-4" />;
}

function IssueCard({ issue }: { issue: NetworkIssue }) {
  const [expanded, setExpanded] = useState(false);

  const severityStyles: Record<NetworkIssue['severity'], string> = {
    critical: 'border-l-destructive bg-destructive/5',
    warning: 'border-l-warning bg-warning/5',
    info: 'border-l-muted-foreground bg-muted/30',
  };

  const severityIconStyles: Record<NetworkIssue['severity'], string> = {
    critical: 'text-destructive',
    warning: 'text-warning',
    info: 'text-muted-foreground',
  };

  const severityBadgeStyles: Record<NetworkIssue['severity'], string> = {
    critical: 'bg-destructive/20 text-destructive border-destructive/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    info: 'bg-muted text-muted-foreground border-border-subtle',
  };

  return (
    <div
      className={cn(
        'border-l-4 rounded-r-lg p-4',
        severityStyles[issue.severity]
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', severityIconStyles[issue.severity])}>
          <IssueIcon type={issue.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {issue.roomName && (
                <span className="font-medium text-foreground">
                  {issue.roomName}
                </span>
              )}
              <Badge
                variant="outline"
                className={cn('text-xs', severityBadgeStyles[issue.severity])}
              >
                {issue.severity}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-foreground mb-2">{issue.message}</p>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            Recommendation
            {expanded ? (
              <ChevronUp className="w-3 h-3 ml-1" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-1" />
            )}
          </Button>

          {expanded && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {issue.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="bg-surface border-border-subtle">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32 bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border-l-4 border-muted rounded-r-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Skeleton className="w-4 h-4 bg-muted" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-7 w-32 bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function IssuesPanel({ issues, isLoading }: IssuesPanelProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (issues.length === 0) {
    return null; // Don't render anything if there are no issues
  }

  // Sort issues by severity (critical first, then warning, then info)
  const sortedIssues = [...issues].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  return (
    <Card className="bg-surface border-border-subtle">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Detected Issues
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="outline" className="text-xs bg-destructive/20 text-destructive border-destructive/30">
                {criticalCount} critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">
                {warningCount} warning
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {infoCount} info
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedIssues.map((issue, index) => (
          <IssueCard key={`${issue.type}-${issue.roomName || index}`} issue={issue} />
        ))}
      </CardContent>
    </Card>
  );
}
