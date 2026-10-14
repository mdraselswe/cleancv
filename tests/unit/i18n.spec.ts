import { describe, expect, it } from 'vitest';

import { toAsciiDigits, translateText } from '@/i18n/translate';

describe('translateText', () => {
  it('translates an exact string', () => {
    expect(translateText('সাইন-ইন')).toBe('Sign in');
  });

  it('keeps the whitespace around a string, because it is layout', () => {
    expect(translateText('  সাইন-ইন ')).toBe('  Sign in ');
  });

  it('returns null for text that is already English', () => {
    expect(translateText('Sign in')).toBeNull();
    expect(translateText('')).toBeNull();
  });

  it('turns Bangla digits into plain ones where there is nothing else to translate', () => {
    expect(translateText('৯২')).toBe('92');
    expect(translateText('৫০%')).toBe('50%');
  });

  it('fills a pattern and chooses the singular or the plural', () => {
    expect(translateText('১টি পদ যোগ করা আছে।')).toBe('1 role listed.');
    expect(translateText('৩টি পদ যোগ করা আছে।')).toBe('3 roles listed.');
  });

  it('translates the names inside a pattern', () => {
    expect(translateText('বন্ধ করুন: সাইন-ইন')).toBe('Close Sign in');
  });

  it('puts the words of a reordered sentence in English order', () => {
    expect(translateText('CleanCV-এ ফিরে যান')).toBe('Back to CleanCV');
  });

  it('leaves a string it has no English for as it is', () => {
    const unknown = 'এমন একটি বাক্য যার অনুবাদ নেই';

    expect(translateText(unknown)).toBeNull();
  });
});

describe('toAsciiDigits', () => {
  it('converts only Bangla digits', () => {
    expect(toAsciiDigits('০১২৩৪৫৬৭৮৯ and 10')).toBe('0123456789 and 10');
  });
});
