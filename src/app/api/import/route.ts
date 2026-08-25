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
    return badRequest('Request body must be JSON.');
  }

  const { endpoint = '', model = '', apiKey = '', text, imageDataUrl } = body;

  if (!endpoint || !model) return badRequest('Set an endpoint and a model under Smart import.');
  if (!text && !imageDataUrl) return badRequest('Nothing to read.');

  const url = chatUrl(endpoint);
  if (!url) {
    return badRequest('That endpoint is not a valid https URL (localhost is allowed for Ollama).');
  }

  const payloadSize = (text?.length ?? 0) + (imageDataUrl?.length ?? 0);
  if (payloadSize > MAX_PAYLOAD_CHARS) return badRequest('That document is too large to send.');

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
        { error: detail ?? `The endpoint returned ${upstream.status}.` },
        { status: 502 },
      );
    }

    const message = result.choices?.[0]?.message?.content;
    if (!message) return Response.json({ error: 'The endpoint returned no content.' }, { status: 502 });

    return Response.json({ content: message });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';

    return Response.json(
      {
        error: timedOut
          ? 'The endpoint took too long to answer.'
          : 'Could not reach that endpoint. Check the URL, and that a local model is running.',
      },
      { status: 502 },
    );
  }
}
