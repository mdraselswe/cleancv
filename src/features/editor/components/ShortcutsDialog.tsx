'use client';

import { Modal, ModalHeader } from '@/components/ui';
import { KEYBOARD_SHORTCUTS } from '@/constants';

export interface ShortcutsDialogProps {
  onClose: () => void;
}

/**
 * The shortcut sheet.
 *
 * Undo, redo and save were already bound and nowhere written down, which makes
 * them features of the app that only its author has. Listing them costs one
 * dialog; the keys themselves come from `KEYBOARD_SHORTCUTS` so the sheet and
 * the bindings cannot drift apart.
 */
export const ShortcutsDialog = ({ onClose }: ShortcutsDialogProps) => (
  <Modal onClose={onClose} label="কীবোর্ড শর্টকাট" className="max-w-[420px]">
    <ModalHeader title="কীবোর্ড শর্টকাট" subtitle="ম্যাকে Ctrl-এর বদলে Cmd চাপুন।" onClose={onClose} />

    <dl className="divide-border-base scroll-slim min-h-0 divide-y overflow-y-auto px-4 py-1">
      {KEYBOARD_SHORTCUTS.map((shortcut) => (
        <div key={shortcut.keys} className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-fg text-ui">{shortcut.action}</dt>
          <dd className="flex-none">
            <kbd className="border-border-base bg-surface-2 text-fg-muted text-ui-2xs rounded-lg border px-2 py-1 font-sans font-medium">
              {shortcut.keys}
            </kbd>
          </dd>
        </div>
      ))}
    </dl>
  </Modal>
);
