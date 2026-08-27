import { cn } from '@/lib/cn';

/**
 * The one message that belongs to a form rather than to a field.
 *
 * `role="alert"` so a screen reader hears it when it appears — a message that
 * only exists visually leaves a blind reader submitting the same form twice,
 * wondering why nothing happens.
 */
export type AuthNoticeTone = 'error' | 'success' | 'info';

export interface AuthNoticeProps {
  tone: AuthNoticeTone;
  children: React.ReactNode;
}

const TONE_CLASS: Record<AuthNoticeTone, string> = {
  error: 'border-danger/40 bg-danger/8 text-danger',
  success: 'border-success/40 bg-success/8 text-fg',
  info: 'border-border-base bg-surface-2 text-fg-muted',
};

export const AuthNotice = ({ tone, children }: AuthNoticeProps) => (
  <p
    role={tone === 'error' ? 'alert' : 'status'}
    className={cn(
      'rounded-control text-ui-md border px-3 py-2.5 leading-relaxed',
      TONE_CLASS[tone],
    )}
  >
    {children}
  </p>
);
