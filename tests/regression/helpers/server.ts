import { spawn, type ChildProcess } from 'node:child_process';

/**
 * Boots the app for the regression suite.
 *
 * Set `CV_TEST_BASE_URL` to reuse a server you already have running — that turns
 * a 30-second cold start into an instant run while iterating. Otherwise the
 * suite starts its own `next dev` on a private port and shuts it down after.
 */

const PORT = Number(process.env.CV_TEST_PORT ?? 3123);

export interface TestServer {
  baseUrl: string;
  stop: () => Promise<void>;
}

const waitForReady = async (baseUrl: string, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(4000) });
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Server at ${baseUrl} did not become ready in ${timeoutMs}ms`);
};

const kill = async (child: ChildProcess): Promise<void> => {
  if (child.exitCode !== null || child.pid === undefined) return;

  // `next dev` spawns a worker; killing the tree is what actually frees the port.
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
};

export const startTestServer = async (): Promise<TestServer> => {
  const existing = process.env.CV_TEST_BASE_URL;

  if (existing) {
    await waitForReady(existing, 20_000);

    return { baseUrl: existing, stop: async () => {} };
  }

  const baseUrl = `http://localhost:${PORT}`;
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });

  await waitForReady(baseUrl, 90_000);

  return { baseUrl, stop: () => kill(child) };
};

export interface PdfRequest {
  baseUrl: string;
  resume: unknown;
  mode?: 'design' | 'ats';
  /** Break points measured by the preview, as the editor sends them. */
  pageBreaks?: number[];
}

export const requestPdf = async ({
  baseUrl,
  resume,
  mode = 'design',
  pageBreaks = [],
}: PdfRequest): Promise<Uint8Array> => {
  const response = await fetch(`${baseUrl}/api/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, mode, pageBreaks }),
  });

  if (!response.ok) {
    throw new Error(`PDF request failed: ${response.status} ${await response.text()}`);
  }

  return new Uint8Array(await response.arrayBuffer());
};
