'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

/**
 * The interface language.
 *
 * Bangla is what the pages are written in, and what the server sends. English
 * is a layer applied in the browser for a reader who asks for it. The choice is
 * a cookie so it survives a reload, and changing it reloads the page: a
 * language switch is rare, and a reload is the one way to be sure nothing is
 * left half in each.
 *
 * None of this touches a CV. The document is written by its author, in the
 * language of the job they are applying for.
 */

export type Lang = 'bn' | 'en';

export const LANG_COOKIE = 'cv-lang';

const STORAGE_KEY = 'cv-maker:lang';

const readLang = (): Lang => {
  try {
    const match = new RegExp(`(?:^|; )${LANG_COOKIE}=(en|bn)`).exec(document.cookie);
    if (match) return match[1] as Lang;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'bn') return stored;
  } catch {
    // Storage and cookies can be blocked; the default is the page's own language.
  }

  return 'bn';
};

const subscribe = (): (() => void) => () => undefined;

/** `bn` on the server and during hydration, so both agree; the choice applies after. */
export const useLang = (): Lang => useSyncExternalStore(subscribe, readLang, () => 'bn');

/** Remembers the choice and reloads, so the whole page is in one language. */
export const setLang = (lang: Lang): void => {
  try {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Without either, the choice lasts only until the reload; nothing to recover.
  }

  window.location.reload();
};

export interface LangProps {
  bn: ReactNode;
  en: ReactNode;
}

/**
 * For the sentences whose parts Bangla puts in a different order, which cannot
 * be translated a piece at a time. Everything else is translated for free.
 */
export const Lang = ({ bn, en }: LangProps) => (useLang() === 'en' ? en : bn);

/**
 * Runs before first paint, so an English reader is not shown Bangla for the
 * moment it takes the page to load. The page is held back until the translator
 * has run, with a timeout so a script that never loads cannot blank it.
 */
export const LANG_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var m = /(?:^|; )${LANG_COOKIE}=(en|bn)/.exec(document.cookie);
    var lang = m ? m[1] : (localStorage.getItem('${STORAGE_KEY}') || 'bn');
    if (lang === 'en') document.documentElement.setAttribute('data-lang', 'en');
  } catch (e) {}
})();
`;
