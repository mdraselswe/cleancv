'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface AppShellProps {
  toolbar: ReactNode;
  children: ReactNode;
  /**
   * Pinned under the body. The caller decides when there is one — which
   * layouts need a way to swap panes is the caller's question, not the
   * frame's, and a `lg:hidden` here quietly answered it twice.
   */
  bottomBar?: ReactNode;
  className?: string;
}

/** Full-height frame: a fixed toolbar, a scrolling body, an optional bottom bar. */
export const AppShell = ({ toolbar, children, bottomBar, className }: AppShellProps) => (
  <div className={cn('bg-bg flex h-dvh flex-col overflow-hidden', className)}>
    <header className="border-border-base bg-surface z-20 flex-none border-b">{toolbar}</header>

    <main className="min-h-0 flex-1">{children}</main>

    {/*
      `pb-safe` keeps the row above the phone's home indicator. Without it the
      bar sits under the gesture area, where the bottom third of every label is
      covered and a tap lands on the system rather than on the app.
    */}
    {bottomBar ? <div className="pb-safe bg-surface z-20 flex-none">{bottomBar}</div> : null}
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

export const Pane = ({
  header,
  children,
  className,
  contentClassName,
  scroll = true,
}: PaneProps) => (
  /*
   * `flex-1` so the pane fills whatever axis its parent runs along. Without it
   * the one-pane phone layout — a block container, not a flex row — left the
   * section only as tall as its content, and the page background showed
   * through under a short form as if the panel had ended early.
   */
  <section className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
    {header ? (
      <div className="border-border-base bg-surface/85 flex-none border-b backdrop-blur">
        {header}
      </div>
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
