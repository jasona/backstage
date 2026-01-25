'use client';

/**
 * Page header component with title and actions.
 */

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Command } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}

export function Header({
  title,
  description,
  children,
  connectionStatus = 'connected',
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border-subtle bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Connection Status */}
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5 text-xs',
            connectionStatus === 'connected' && 'text-success border-success/30',
            connectionStatus === 'disconnected' && 'text-destructive border-destructive/30',
            connectionStatus === 'connecting' && 'text-warning border-warning/30'
          )}
        >
          {connectionStatus === 'connected' ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {connectionStatus === 'connected' && 'Connected'}
          {connectionStatus === 'disconnected' && 'Disconnected'}
          {connectionStatus === 'connecting' && 'Connecting...'}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {/* Command Palette Hint */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground"
        >
          <Command className="w-3 h-3" />
          <span className="text-xs">K</span>
        </Button>

        {children}
      </div>
    </header>
  );
}
