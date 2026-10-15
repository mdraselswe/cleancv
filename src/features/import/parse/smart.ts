import { ROUTES } from '@/constants';

import type { ParsedResume } from '../types';
import type { SmartSettings } from '../settings';
import { smartResponseSchema, toParsedResume } from './smartSchema';

/**
 * Smart parsing through whatever endpoint the user configured.
 *
 * The request goes through this app's own server rather than straight from the
 * page, for two reasons that both bite in practice: most providers refuse
 * browser-origin requests outright, and a local Ollama is reachable from the
 * server process but not from a cross-origin fetch. Nothing is stored on the
 * way through — the route forwards and returns.
 */

export interface SmartInput {
  /** Extracted text. Sent when the source is not an image, or vision is off. */
  text?: string;
  /** Data URL of the original image, when the model is being asked to look. */
  imageDataUrl?: string;
}

/** Strips a ```json fence, which models add however firmly they are told not to. */
const unfence = (content: string): string => {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(content);
  const body = (fenced?.[1] ?? content).trim();

  // Some models still prepend a sentence; take the outermost object.
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');

  return start !== -1 && end > start ? body.slice(start, end + 1) : body;
};

export const parseWithModel = async (
  input: SmartInput,
  settings: SmartSettings,
  signal?: AbortSignal,
): Promise<ParsedResume> => {
  const response = await fetch(ROUTES.api.importParse, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: settings.endpoint,
      model: settings.model,
      apiKey: settings.apiKey,
      text: input.text,
      imageDataUrl: input.imageDataUrl,
    }),
    signal,
  });

  const payload = (await response.json()) as { content?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? 'মডেলের এন্ডপয়েন্ট অনুরোধটি গ্রহণ করেনি।');
  }

  let raw: unknown;

  try {
    raw = JSON.parse(unfence(payload.content ?? ''));
  } catch {
    throw new Error(
      'মডেল JSON ফেরত দেয়নি। অন্য একটি মডেল চেষ্টা করুন — কিছু ছোট মডেল এই ফরম্যাট ধরে রাখতে পারে না।',
    );
  }

  const parsed = smartResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error('মডেল ভুল ধরনের JSON ফেরত দিয়েছে।');
  }

  return toParsedResume(parsed.data);
};
