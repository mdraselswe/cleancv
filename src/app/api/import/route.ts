import { SMART_SYSTEM_PROMPT } from '@/features/import/parse/smartSchema';

/**
 * Forwards a smart-import request to the endpoint the user configured.
 *
 * A pass-through, not a service: the endpoint, model and key all arrive with
 * the request, nothing is stored, and nothing is logged. It exists because a
 * browser cannot make this call itself — most providers reject browser-origin
 * requests, and a local Ollama is not reachable cross-origin.
 *
 * The endpoint is user-supplied, so this is a request-forwarder by design. It
 * is bounded to what the feature needs: one POST, a fixed path, a size cap and
 * a timeout.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Bigger than any CV's text, small enough that this is not an open relay. */
const MAX_PAYLOAD_CHARS = 400_000;
const TIMEOUT_MS = 90_000;

interface ImportRequestBody {
  endpoint?: string;
  model?: string;
  apiKey?: string;
  text?: string;
  imageDataUrl?: string;
}

const badRequest = (message: string) => Response.json({ error: message }, { status: 400 });

/** `https://host/v1` plus the one path this feature calls. */
const chatUrl = (endpoint: string): URL | null => {
  try {
    const base = endpoint.replace(/\/+$/, '');
    const url = new URL(`${base}/chat/completions`);

    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return null;
    }

    return url;
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  let body: ImportRequestBody;

  try {
    body = (await request.json()) as ImportRequestBody;
  } catch {
    return badRequest('অনুরোধের বডি অবশ্যই JSON হতে হবে।');
  }

  const { endpoint = '', model = '', apiKey = '', text, imageDataUrl } = body;

  if (!endpoint || !model) return badRequest('স্মার্ট ইমপোর্ট থেকে একটি এন্ডপয়েন্ট ও একটি মডেল ঠিক করুন।');
  if (!text && !imageDataUrl) return badRequest('পড়ার মতো কিছু নেই।');

  const url = chatUrl(endpoint);
  if (!url) {
    return badRequest('ওই এন্ডপয়েন্ট সঠিক https URL নয় (Ollama-র জন্য localhost চলবে)।');
  }

  const payloadSize = (text?.length ?? 0) + (imageDataUrl?.length ?? 0);
  if (payloadSize > MAX_PAYLOAD_CHARS) return badRequest('ডকুমেন্টটি পাঠানোর জন্য খুব বড়।');

  const content = imageDataUrl
    ? [
        { type: 'text', text: 'Extract this CV.' },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ]
    : `Extract this CV.\n\n${text}`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Both spellings: OpenAI-compatible gateways read one or the other.
        ...(apiKey ? { Authorization: `Bearer ${apiKey}`, 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: SMART_SYSTEM_PROMPT },
          { role: 'user', content },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const result = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string } | string;
    };

    if (!upstream.ok) {
      const detail =
        typeof result.error === 'string' ? result.error : result.error?.message;

      return Response.json(
        { error: detail ?? `এন্ডপয়েন্ট ${upstream.status} ফেরত দিয়েছে।` },
        { status: 502 },
      );
    }

    const message = result.choices?.[0]?.message?.content;
    if (!message) return Response.json({ error: 'এন্ডপয়েন্ট কোনো উত্তর দেয়নি।' }, { status: 502 });

    return Response.json({ content: message });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';

    return Response.json(
      {
        error: timedOut
          ? 'এন্ডপয়েন্ট উত্তর দিতে অনেক দেরি করেছে।'
          : 'ওই এন্ডপয়েন্টে পৌঁছানো যায়নি। URL দেখুন, আর লোকাল মডেল চালু আছে কি না যাচাই করুন।',
      },
      { status: 502 },
    );
  }
}
