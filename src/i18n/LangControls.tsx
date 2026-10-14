'use client';

import { Languages } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui';

import { setLang, useLang } from './index';

/**
 * Shows the English interface when that is the language chosen.
 *
 * The translator is loaded only for a reader who asked for English, so the
 * dictionary - the larger half of this feature - costs a Bangla reader nothing.
 */
export const LangRuntime = () => {
  const lang = useLang();

  useEffect(() => {
    if (lang !== 'en') return;

    let cancelled = false;
    let stop = () => undefined as void;

    document.documentElement.lang = 'en';

    void import('./translate').then((module) => {
      if (cancelled) return;

      stop = module.startTranslating();
      document.documentElement.setAttribute('data-i18n-ready', '');
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [lang]);

  return null;
};

export interface LangToggleProps {
  className?: string;
}

/** One button that says which language it will switch to. */
export const LangToggle = ({ className }: LangToggleProps) => {
  const lang = useLang();
  const next = lang === 'en' ? 'bn' : 'en';

  return (
    <Button
      size="sm"
      variant="ghost"
      className={className}
      onClick={() => setLang(next)}
      leading={<Languages size={15} aria-hidden="true" />}
      title={lang === 'en' ? 'বাংলায় দেখুন' : 'View in English'}
      aria-label={lang === 'en' ? 'বাংলায় দেখুন' : 'View in English'}
      data-no-translate=""
    >
      {lang === 'en' ? 'বাংলা' : 'English'}
    </Button>
  );
};
