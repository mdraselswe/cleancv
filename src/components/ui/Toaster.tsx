'use client';

import { Toaster as Sonner } from 'sonner';

/**
 * Transient confirmation, themed with the app's own tokens.
 *
 * Every action worth a toast here is one whose result happens somewhere the
 * reader is not looking: a PDF landing in the downloads folder, a document
 * written to a folder on disk, a backup parsed. Without a line saying so, the
 * only evidence the app did anything is that nothing changed on screen.
 *
 * Positioned bottom-centre above the phone's tab bar rather than top-right:
 * the top-right corner is where the export buttons are, and a toast that
 * covers the button that caused it hides the thing you would click again.
 */
export const Toaster = () => (
  <Sonner
    position="bottom-center"
    offset={16}
    mobileOffset={{ bottom: 76 }}
    gap={8}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          'flex w-full items-center gap-3 rounded-card border border-border-base bg-surface px-3.5 py-3 text-ui text-fg shadow-pop',
        description: 'text-fg-subtle text-ui-xs',
        actionButton:
          'ml-auto flex-none rounded-lg bg-primary px-2.5 py-1 text-ui-2xs font-medium text-primary-fg',
        cancelButton:
          'ml-auto flex-none rounded-lg bg-surface-2 px-2.5 py-1 text-ui-2xs font-medium text-fg-muted',
        error: 'border-danger text-danger',
        success: 'border-success/40',
      },
    }}
  />
);
