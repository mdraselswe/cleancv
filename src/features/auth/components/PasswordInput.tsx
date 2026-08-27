'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Input, type InputProps } from '@/components/ui';

/**
 * A password field that can be read back.
 *
 * Nobody can proofread eleven dots. The toggle is a real button rather than a
 * decorated span so it is reachable by keyboard, and it never submits the form
 * it sits inside — `Input` defaults its own type, this one does not get to.
 */
export const PasswordInput = ({ className, ...rest }: Omit<InputProps, 'type'>) => {
  const [shown, setShown] = useState(false);

  return (
    /*
     * The toggle takes the field's own height (`inset-y-0`) rather than a fixed
     * one, so it stays centred whatever height the form sets — and it is 44px
     * wide, which is why it does *not* carry `tap-target`. That class sets
     * `position: relative` under a coarse pointer, and on an element positioned
     * absolutely it wins: the button left the corner of the field and came to
     * rest under it, on a phone only. See ADR-048.
     */
    <div className="relative">
      <Input
        {...rest}
        type={shown ? 'text' : 'password'}
        className={['pr-11', className].filter(Boolean).join(' ')}
      />
      <button
        type="button"
        onClick={() => setShown((current) => !current)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="text-fg-subtle hover:text-fg absolute inset-y-0 right-0 flex w-11 items-center justify-center transition"
      >
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};
