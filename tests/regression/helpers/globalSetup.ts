import { spawn, type ChildProcess } from 'node:child_process';

/**
 * One server for the whole regression run.
 *
 * Each spec file used to start its own. Next refuses to run a second `next dev`
 * for the same project, so three of the four died on "Another next dev server
 * is already running" and the gate was only ever green when somebody remembered
 * to point `CV_TEST_BASE_URL` at a server they had started by hand.
 *
 * The server is started **without** the auth environment. What these tests
 * measure is the PDF's text layer, and `/api/pdf` is behind a sign-in — so a
 * suite that inherited a configured `DATABASE_URL` would spend its whole run
 * asserting against `401` bodies. Unconfigured auth in development opens the
 * download, which is exactly the mode this suite wants. See ADR-048.
 */

const PORT = Number(process.env.CV_TEST_PORT ?? 3123);
const BASE_URL = `http://localhost:${PORT}`;

/** Cleared for the child. Absent means "no accounts", which means "no gate". */
const AUTH_KEYS = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
];

const isUp = async (baseUrl: string): Promise<boolean> => {
  try {
    return (await fetch(baseUrl, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
};

const waitForReady = async (baseUrl: string, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isUp(baseUrl)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Server at ${baseUrl} did not become ready in ${timeoutMs}ms`);
};

/**
 * Is the download gate shut on this server?
 *
 * Asked with a deliberately invalid body, so it costs nothing either way: a
 * server with the gate open rejects it as a bad request before Chrome is
 * involved, and one with the gate shut answers 401 before it reads the body at
 * all. Two instant answers that tell the two cases apart.
 */
const assertGateOpen = async (baseUrl: string): Promise<void> => {
  const response = await fetch(`${baseUrl}/api/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  if (response.status !== 401) return;

  throw new Error(
    [
      `The server at ${baseUrl} has accounts configured, so /api/pdf requires a sign-in`,
      'and every test in this suite would assert against a 401 body.',
      '',
      'Either unset CV_TEST_BASE_URL and let the suite start its own server, or point it',
      'at one started without DATABASE_URL and BETTER_AUTH_SECRET.',
    ].join('\n'),
  );
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

export default async function setup() {
  const override = process.env.CV_TEST_BASE_URL;

  if (override) {
    await waitForReady(override, 20_000);
    await assertGateOpen(override);

    return;
  }

  /*
   * Something already listening on the port is reused rather than fought with —
   * on a machine where a previous run left a server behind, starting another is
   * the one thing guaranteed to fail.
   */
  if (await isUp(BASE_URL)) {
    await assertGateOpen(BASE_URL);
    process.env.CV_TEST_BASE_URL = BASE_URL;

    return;
  }

  const env = { ...process.env };
  for (const key of AUTH_KEYS) delete env[key];

  const child = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
    env,
  });

  await waitForReady(BASE_URL, 120_000);
  await assertGateOpen(BASE_URL);

  // Read by `startTestServer` in every spec file, which then starts nothing.
  process.env.CV_TEST_BASE_URL = BASE_URL;

  return async () => {
    await kill(child);
  };
}
