'use client';

import { Download, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button, Modal, ModalHeader } from '@/components/ui';
import { AUTH_ROUTES, GATE_REASON, REDIRECT_PARAM, ROUTES } from '@/constants';

export interface SignInRequiredDialogProps {
  onClose: () => void;
}

/**
 * What the reader sees when they press Download without an account.
 *
 * It says what is gated and what is not, because the answer to "why do I need
 * an account?" is the only thing that decides whether they make one. It does
 * not hold a sign-in form: the real page has the password manager wiring, the
 * Google button and the reset link, and a second half-form here would be a
 * second thing to keep correct for no gain.
 *
 * Leaving for the sign-in page costs nothing — the document is already in this
 * browser's storage, and `?next=` brings them back to the editor.
 */
export const SignInRequiredDialog = ({ onClose }: SignInRequiredDialogProps) => {
  const router = useRouter();

  const withReturn = (path: string) =>
    `${path}?${REDIRECT_PARAM}=${encodeURIComponent(ROUTES.editor)}`;

  return (
    <Modal label="ডাউনলোডের জন্য সাইন-ইন করুন" onClose={onClose} className="max-w-[400px]">
      <ModalHeader title="ডাউনলোডের জন্য সাইন-ইন করুন" onClose={onClose} />

      <div className="flex flex-col gap-4 p-4">
        <div className="text-fg-muted text-ui-md flex items-start gap-3 leading-relaxed">
          <span className="bg-surface-2 rounded-control flex h-9 w-9 flex-none items-center justify-center">
            <Download size={17} aria-hidden="true" />
          </span>
          <p>{GATE_REASON}</p>
        </div>

        <p className="text-fg-subtle text-ui leading-relaxed">
          আপনার CV এই ব্রাউজারেই থাকে। সাইন-ইন করলে সেটি আপলোড হয় না। পরে চাইলে অ্যাকাউন্টে রাখার জন্য সর্বোচ্চ ৩টি CV বেছে নিতে পারবেন। এটি ফ্রি।
        </p>

        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            className="justify-center"
            leading={<LogIn size={16} />}
            onClick={() => router.push(withReturn(AUTH_ROUTES.signIn))}
          >
            সাইন-ইন
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="justify-center"
            onClick={() => router.push(withReturn(AUTH_ROUTES.signUp))}
          >
            অ্যাকাউন্ট খুলুন
          </Button>
          <Button variant="ghost" size="md" className="justify-center" onClick={onClose}>
            এখন নয়
          </Button>
        </div>
      </div>
    </Modal>
  );
};
