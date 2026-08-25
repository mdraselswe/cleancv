'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface AppShellProps {
  toolbar: ReactNode;
  children: ReactNode;
  /** Fixed to the bottom on small screens; typically the tab bar. */
  bottomBar?: ReactNode;
  className?: string;
}

/** Full-height frame: a fixed toolbar, a scrolling body, an optional bottom bar. */
export const AppShell = ({ toolbar, children, bottomBar, className }: AppShellProps) => (
  <div className={cn('flex h-dvh flex-col overflow-hidden bg-bg', className)}>
    <header className="z-20 flex-none border-b border-border-base bg-surface">{toolbar}</header>

    <main className="min-h-0 flex-1">{children}</main>

    {bottomBar ? <div className="z-20 flex-none lg:hidden">{bottomBar}</div> : null}
  </div>
);

export interface PaneProps {
  /** Sticky pane header — section title, counters, pane-level actions. */
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Turns off internal scrolling for panes that manage their own. */
  scroll?: boolean;
}

export const Pane = ({ header, children, className, contentClassName, scroll = true }: PaneProps) => (
  <section className={cn('flex min-h-0 min-w-0 flex-col', className)}>
    {header ? (
      <div className="flex-none border-b border-border-base bg-surface/85 backdrop-blur">{header}</div>
    ) : null}
    <div
      className={cn(
        'min-h-0 flex-1',
        scroll && 'scroll-slim overflow-y-auto overscroll-contain',
        contentClassName,
      )}
    >
      {children}
    </div>
  </section>
);
