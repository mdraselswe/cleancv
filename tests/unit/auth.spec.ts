import { describe, expect, it } from 'vitest';

import { PASSWORD_MIN, REDIRECT_PARAM, ROUTES } from '@/constants';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/features/auth/schema/credentials';
import { readParam, readRedirect } from '@/features/auth/utils/redirect';
import { authErrorMessage, isUnverifiedEmail } from '@/features/auth/utils/errorMessage';
import { safeRedirect } from '@/lib/url';

describe('safeRedirect', () => {
  it('keeps an app-relative path', () => {
    expect(safeRedirect('/sign-up', '/')).toBe('/sign-up');
    expect(safeRedirect('/?tab=preview', '/')).toBe('/?tab=preview');
  });

  it('falls back for anything that leaves the app', () => {
    for (const hostile of [
      'https://evil.example/steal',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'sign-in',
      '',
      null,
      undefined,
    ]) {
      expect(safeRedirect(hostile, '/')).toBe('/');
    }
  });

  it('is not fooled by leading whitespace', () => {
    // A browser trims control characters before resolving, so " //evil" and
    // "//evil" navigate to the same place. The check must see both.
    expect(safeRedirect('  https://evil.example', '/')).toBe('/');
  });
});

describe('readRedirect', () => {
  it('reads the parameter and reduces it', () => {
    expect(readRedirect({ [REDIRECT_PARAM]: '/sign-up' })).toBe('/sign-up');
    expect(readRedirect({ [REDIRECT_PARAM]: 'https://evil.example' })).toBe(ROUTES.editor);
  });

  it('ignores a repeated parameter rather than picking one', () => {
    expect(readRedirect({ [REDIRECT_PARAM]: ['/a', '/b'] })).toBe(ROUTES.editor);
  });

  it('falls back when the parameter is absent', () => {
    expect(readRedirect({})).toBe(ROUTES.editor);
  });
});

describe('readParam', () => {
  it('returns a single value, and nothing for a repeated one', () => {
    expect(readParam({ token: 'abc' }, 'token')).toBe('abc');
    expect(readParam({ token: ['a', 'b'] }, 'token')).toBe('');
    expect(readParam({}, 'token')).toBe('');
  });
});

describe('credential schemas', () => {
  it('accepts a well-formed sign-up', () => {
    const parsed = signUpSchema.safeParse({
      name: '  Rasel  ',
      email: ' Person@Example.com ',
      password: 'a'.repeat(PASSWORD_MIN),
    });

    expect(parsed.success).toBe(true);
    // Trimmed, so a trailing space typed on a phone keyboard is not a new account.
    expect(parsed.success && parsed.data.name).toBe('Rasel');
    expect(parsed.success && parsed.data.email).toBe('Person@Example.com');
  });

  it('refuses a password under the minimum', () => {
    const parsed = signUpSchema.safeParse({
      name: 'Rasel',
      email: 'person@example.com',
      password: 'a'.repeat(PASSWORD_MIN - 1),
    });

    expect(parsed.success).toBe(false);
  });

  it('does not apply the length rule to signing in', () => {
    // An account older than the rule still has to be able to get in.
    const parsed = signInSchema.safeParse({ email: 'person@example.com', password: 'short' });

    expect(parsed.success).toBe(true);
  });

  it('rejects an empty password on sign in', () => {
    expect(signInSchema.safeParse({ email: 'person@example.com', password: '' }).success).toBe(
      false,
    );
  });

  it('requires an address that could exist', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-address' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'person@example.com' }).success).toBe(true);
  });

  it('reports a mismatch against the second box, not the first', () => {
    const password = 'a'.repeat(PASSWORD_MIN);
    const parsed = resetPasswordSchema.safeParse({ password, confirm: `${password}x` });

    expect(parsed.success).toBe(false);
    expect(parsed.success === false && parsed.error.issues[0].path).toEqual(['confirm']);
  });
});

describe('authErrorMessage', () => {
  it('rewrites the codes a reader can act on', () => {
    expect(authErrorMessage({ code: 'INVALID_EMAIL_OR_PASSWORD' })).toMatch(/do not match/);
    expect(authErrorMessage({ code: 'EMAIL_NOT_VERIFIED' })).toMatch(/inbox/);
  });

  it('reports rate limiting from the status, which carries no code', () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/Too many attempts/);
  });

  it('keeps an unmapped message rather than hiding it', () => {
    expect(authErrorMessage({ code: 'SOMETHING_NEW', message: 'Disk on fire' })).toBe(
      'Disk on fire',
    );
  });

  it('is empty for no error at all', () => {
    expect(authErrorMessage(null)).toBe('');
  });

  it('singles out the unverified case, which has its own affordance', () => {
    expect(isUnverifiedEmail({ code: 'EMAIL_NOT_VERIFIED' })).toBe(true);
    expect(isUnverifiedEmail({ code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(false);
  });
});
