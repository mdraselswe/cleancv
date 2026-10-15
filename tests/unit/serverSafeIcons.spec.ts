import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * A template is rendered to a string inside the PDF route handler, on the
 * server. `lucide-react` is a client component library, and calling one from
 * there throws - which took every PDF export down on a deployment that the
 * local server, which bundles differently, rendered without complaint.
 *
 * Anything a template imports must therefore be plain markup.
 */
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    return statSync(path).isDirectory() ? walk(path) : [path];
  });

describe('server-rendered code', () => {
  it('does not import lucide-react', () => {
    const roots = ['src/features/templates', 'src/lib', 'src/constants'];
    const offenders = roots
      .flatMap(walk)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => readFileSync(file, 'utf8').includes("from 'lucide-react'"));

    expect(offenders).toEqual([]);
  });
});
