'use client';

import { LogIn, Menu as MenuIcon, Monitor, Moon, Sun, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BrandMark } from '@/components/brand';
import { Button, Menu, type MenuEntry } from '@/components/ui';
import { APP_NAME, AUTH_ROUTES, LEGAL_ROUTES, ROUTES } from '@/constants';
import { UserMenu, useAuthSession } from '@/features/auth';
import { useTheme, type ThemePreference } from '@/hooks';

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const;
const THEME_LABEL: Record<ThemePreference, string> = {
  light: 'Theme: light',
  dark: 'Theme: dark',
  system: 'Theme: system',
};

/*
 * Anchors are written against the home route so they also work from the
 * features page, which shares this header.
 */
const NAV = [
  { href: `${ROUTES.home}#my-cvs`, label: 'My CVs' },
  { href: `${ROUTES.home}#designs`, label: 'Designs' },
  { href: ROUTES.features, label: 'What’s included' },
] as const;

const LEGAL = [
  { href: LEGAL_ROUTES.privacy, label: 'Privacy' },
  { href: LEGAL_ROUTES.terms, label: 'Terms' },
] as const;

/**
 * The bar shared by the home and features pages: brand, the places to go,
 * theme and account.
 *
 * Privacy, Terms and Sign in are in the bar itself rather than only in the
 * footer — somebody deciding whether to trust a site with their CV looks for
 * them at the top. A narrow window keeps every link inside one menu rather
 * than dropping any.
 */
export const HomeHeader = () => {
  const theme = useTheme();
  const router = useRouter();
  const { signedIn, pending } = useAuthSession();
  const ThemeIcon = THEME_ICON[theme.preference];

  const menuEntries: MenuEntry[] = [
    ...[...NAV, ...LEGAL].map((link) => ({
      id: link.href,
      label: link.label,
      onSelect: () => router.push(link.href),
    })),
    ...(!pending && !signedIn
      ? [
          { id: 'sep', separator: true } as const,
          {
            id: 'sign-in',
            label: 'Sign in',
            icon: <LogIn size={15} />,
            onSelect: () => router.push(AUTH_ROUTES.signIn),
          },
          {
            id: 'sign-up',
            label: 'Create account',
            icon: <UserPlus size={15} />,
            onSelect: () => router.push(AUTH_ROUTES.signUp),
          },
        ]
      : []),
  ];

  return (
    <header className="border-border-base/70 bg-bg/75 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href={ROUTES.home} className="tap-target flex items-center gap-2.5">
          <BrandMark className="h-9 w-9 drop-shadow-sm transition hover:rotate-[-6deg]" />
          <span className="app-gradient-text text-ui-lg font-extrabold tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {[...NAV, ...LEGAL].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-fg-muted hover:bg-surface-2 hover:text-fg rounded-control text-ui px-2.5 py-1.5 font-medium transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Menu
            label="Site menu"
            entries={menuEntries}
            className="lg:hidden"
            trigger={(props) => (
              <Button size="icon" variant="ghost" aria-label="Site menu" {...props}>
                <MenuIcon size={18} />
              </Button>
            )}
          />
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
