'use client';

import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { STORAGE_KEYS } from '@/constants';

/**
 * Bring-your-own endpoint configuration for smart import.
 *
 * No provider is hard-coded on purpose. Free tiers appear, tighten and vanish
 * on their own schedule, and an app that bets on one is a maintenance problem
 * the first time that one changes its terms. Anything speaking the
 * OpenAI-compatible `/chat/completions` shape works here — Gemini's compat
 * endpoint, Groq, OpenRouter, a local Ollama, or Anthropic through a gateway —
 * so switching is a settings change rather than a release.
 */

export const smartSettingsSchema = z.object({
  /** Base URL, e.g. `http://localhost:11434/v1`. No trailing `/chat/completions`. */
  endpoint: z.string().trim().max(300).catch('').default(''),
  model: z.string().trim().max(120).catch('').default(''),
  /** Blank is valid: a local Ollama needs no key. */
  apiKey: z.string().trim().max(300).catch('').default(''),
  /** Whether to send images to the model rather than OCR them locally. */
  useVision: z.boolean().catch(true).default(true),
});

export type SmartSettings = z.infer<typeof smartSettingsSchema>;

export const EMPTY_SMART_SETTINGS: SmartSettings = {
  endpoint: '',
  model: '',
  apiKey: '',
  useVision: true,
};

/** Presets that fill in the two fields people get wrong most often. */
export const SMART_PRESETS = [
  {
    id: 'ollama',
    label: 'Ollama (on this machine)',
    endpoint: 'http://localhost:11434/v1',
    model: 'qwen2.5vl',
    note: 'Free and private — nothing leaves your computer. Needs a vision model pulled locally.',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash',
    note: 'Has a free tier. Check the current terms: free usage may be retained and used to improve their models.',
  },
  {
    id: 'groq',
    label: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1',
    model: '',
    note: 'Free tier, very fast. Pick a model that accepts images if you want screenshot import.',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1',
    model: '',
    note: 'Routes to many providers, some with free models. Quality varies by model.',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    endpoint: 'https://api.anthropic.com/v1',
    model: 'claude-haiku-4-5-20251001',
    note: 'Paid — there is no free tier. The most reliable of these on a messy layout.',
  },
] as const;

export const isSmartConfigured = (settings: SmartSettings): boolean =>
  settings.endpoint.length > 0 && settings.model.length > 0;

const read = (): SmartSettings => {
  if (typeof localStorage === 'undefined') return EMPTY_SMART_SETTINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.smartImport);

    return raw
      ? smartSettingsSchema.parse(JSON.parse(raw))
      : EMPTY_SMART_SETTINGS;
  } catch {
    return EMPTY_SMART_SETTINGS;
  }
};

/**
 * Read through `useSyncExternalStore` rather than component state, so the
 * settings form and the import dialog cannot disagree about what is configured.
 */
const listeners = new Set<() => void>();
let snapshot: SmartSettings | null = null;

const emit = () => {
  snapshot = null;
  listeners.forEach((listener) => listener());
};

export const saveSmartSettings = (settings: SmartSettings): void => {
  localStorage.setItem(STORAGE_KEYS.smartImport, JSON.stringify(settings));
  emit();
};

export const clearSmartSettings = (): void => {
  localStorage.removeItem(STORAGE_KEYS.smartImport);
  emit();
};

export const getSmartSettings = (): SmartSettings => {
  snapshot ??= read();

  return snapshot;
};

export const useSmartSettings = (): SmartSettings =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    getSmartSettings,
    () => EMPTY_SMART_SETTINGS,
  );
