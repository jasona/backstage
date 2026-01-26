'use client';

/**
 * Collapsible sidebar navigation component.
 * Follows Linear-style design patterns.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Speaker,
  Users,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Groups', href: '/dashboard/groups', icon: Users },
  { label: 'Diagnostics', href: '/dashboard/diagnostics', icon: Activity },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  defaultCollapsed?: boolean;
}

export function Sidebar({ defaultCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen bg-base border-r border-border-subtle transition-all duration-200',
          isCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo / Brand */}
        <div
          className={cn(
            'flex items-center h-14 px-4 border-b border-border-subtle',
            isCollapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Speaker className="w-4 h-4 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-foreground truncate">
              Backstage
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center h-9 px-3 rounded-md transition-colors',
                  'hover:bg-hover',
                  isActive && 'bg-active text-foreground',
                  !isActive && 'text-muted-foreground',
                  isCollapsed && 'justify-center px-0'
                )}
              >
                <item.icon className={cn('w-4 h-4 flex-shrink-0', !isCollapsed && 'mr-3')} />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
                {isActive && (
                  <div className="absolute left-0 w-0.5 h-4 bg-primary rounded-r" />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-border-subtle">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapsed}
                className={cn(
                  'w-full h-9 text-muted-foreground hover:text-foreground',
                  isCollapsed && 'px-0'
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span className="text-sm">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={10}>
                Expand sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
