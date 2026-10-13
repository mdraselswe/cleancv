'use client';

import { X } from 'lucide-react';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

import { Button } from './Button';

/** Closes on Escape from anywhere, which every overlay in the app owes the reader. */
const useEscape = (onClose: () => void) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
};

const subscribeNothing = () => () => undefined;

/**
 * Where an overlay is drawn: the end of `<body>`, not where it was declared.
 *
 * A dialog opened from inside a pane that is animating or transformed is
 * trapped in that pane's stacking context, so a button elsewhere in the page
 * paints over its own footer — "Next: Design" over "Create". Rendering at the
 * body is the only place nothing can sit between an overlay and the viewport.
 * Null until the client has mounted, so the server never has a body to draw to.
 */
const useOverlayRoot = (): HTMLElement | null =>
  useSyncExternalStore(
    subscribeNothing,
    () => document.body,
    () => null,
  );

export interface ModalHeaderProps {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  /** Sits between the text and the close button. */
  actions?: ReactNode;
}

export const ModalHeader = ({ title, subtitle, onClose, actions }: ModalHeaderProps) => (
  <header className="border-border-base flex flex-none items-start justify-between gap-3 border-b px-4 py-3">
    <div className="min-w-0">
      <h2 className="text-fg text-ui-lg font-semibold">{title}</h2>
      {subtitle ? <p className="text-fg-subtle text-ui-xs mt-0.5">{subtitle}</p> : null}
    </div>

    <div className="flex flex-none items-center gap-1">
      {actions}
      <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
        <X size={16} />
      </Button>
    </div>
  </header>
);

export interface ModalProps {
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** Width of the panel; the default suits a form or a short list. */
  className?: string;
}

/**
 * A centred overlay panel.
 *
 * Centred by flex rather than by `-translate-*`. A transform on an ancestor is
 * what `position: fixed` resolves against, and dnd-kit positions a drag overlay
 * in viewport coordinates — the page map's carried box came out half a screen
 * from the pointer for exactly this reason. Nothing between an overlay and the
 * viewport may be transformed, so the shared shell does not transform. See
 * ADR-043.
 */
export const Modal = ({ onClose, label, children, className }: ModalProps) => {
  useEscape(onClose);
  const root = useOverlayRoot();

  if (!root) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={`Close ${label.toLowerCase()}`}
        onClick={onClose}
        className="animate-fade fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div
          role="dialog"
          aria-label={label}
          aria-modal="true"
          className={cn(
            'border-border-base bg-surface shadow-pop animate-pop pointer-events-auto',
            'rounded-panel flex max-h-[88dvh] w-full flex-col overflow-hidden border',
            className ?? 'max-w-[560px]',
          )}
        >
          {children}
        </div>
      </div>
    </>,
    root,
  );
};

export interface DrawerProps {
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * A panel anchored to the right edge, full width on a phone.
 *
 * For lists you come back to — the library, the score breakdown — where the
 * document behind stays the subject and the panel is a place you visit rather
 * than a question you answer.
 */
export const Drawer = ({ onClose, label, children, className }: DrawerProps) => {
  useEscape(onClose);
  const root = useOverlayRoot();

  if (!root) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={`Close ${label.toLowerCase()}`}
        onClick={onClose}
        className="animate-fade fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
      />

      <aside
        aria-label={label}
        className={cn(
          'border-border-base bg-surface shadow-pop animate-slide-right',
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l',
          className ?? 'max-w-md',
        )}
      >
        {children}
      </aside>
    </>,
    root,
  );
};
