'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import Link from 'next/link';

import { BrandMark } from '@/components/brand';
import { Button } from '@/components/ui';
import { APP_NAME, ROUTES } from '@/constants';
import { UserMenu } from '@/features/auth';
import { useTheme, type ThemePreference } from '@/hooks';

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const;
const THEME_LABEL: Record<ThemePreference, string> = {
  light: 'Theme: light',
  dark: 'Theme: dark',
  system: 'Theme: system',
};

const NAV = [
  { href: '#my-cvs', label: 'My CVs' },
  { href: '#designs', label: 'Designs' },
  { href: '#how', label: 'How it works' },
] as const;

/** The home page's bar: brand, three anchors, theme and account. */
export const HomeHeader = () => {
  const theme = useTheme();
  const ThemeIcon = THEME_ICON[theme.preference];

  return (
    <header className="border-border-base/70 bg-bg/75 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href={ROUTES.home} className="tap-target flex items-center gap-2.5">
          <BrandMark className="h-9 w-9 drop-shadow-sm transition hover:rotate-[-6deg]" />
          <span className="app-gradient-text text-ui-lg font-extrabold tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        <nav aria-label="Page sections" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-fg-muted hover:bg-surface-2 hover:text-fg rounded-control text-ui px-3 py-1.5 font-medium transition"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={theme.cycle}
            aria-label={THEME_LABEL[theme.preference]}
            title={THEME_LABEL[theme.preference]}
          >
            <ThemeIcon size={16} />
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
