'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  /** Right-aligned hint, e.g. a keyboard shortcut. */
  hint?: string;
}

export interface MenuSeparator {
  id: string;
  separator: true;
}

export type MenuEntry = MenuItem | MenuSeparator;

const isSeparator = (entry: MenuEntry): entry is MenuSeparator => 'separator' in entry;

export interface MenuProps {
  /** The control that opens the menu. Receives the props it must spread. */
  trigger: (props: {
    onClick: () => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
  }) => ReactNode;
  entries: readonly MenuEntry[];
  /**
   * Fixed content above the items — who is signed in, which document this is.
   * Not a `MenuItem`: a label rendered as a disabled button is announced as an
   * action nobody may take, and the reader is told about a dead end that was
   * never a control.
   */
  header?: ReactNode;
  /** Which edge of the trigger the panel lines up with. */
  align?: 'start' | 'end';
  label: string;
  className?: string;
}

/**
 * A popover menu, for the actions a row or a toolbar has no room to show.
 *
 * Small screens are the reason this exists: five icon buttons crammed into a
 * hundred and twenty pixels are five targets nobody can hit and five labels
 * nobody can read. One target that opens a list of named actions is both
 * hittable and legible, and it says what each action *is* rather than hoping
 * the glyph carries it.
 *
 * Presentational on purpose — it takes its actions as props and knows nothing
 * about what they do.
 */
export const Menu = ({ trigger, entries, header, align = 'end', label, className }: MenuProps) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

      /*
       * Roving focus over the enabled items. Read from the DOM rather than
       * from the entry list: `disabled` already removes an item from the tab
       * order, so the rendered buttons are the authority on what is reachable.
       */
      const items = [
        ...(panel.current?.querySelectorAll<HTMLButtonElement>('button:enabled') ?? []),
      ];
      if (items.length === 0) return;

      event.preventDefault();
      const at = items.indexOf(document.activeElement as HTMLButtonElement);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(at + step + items.length) % items.length].focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className={cn('relative', className)}>
      {trigger({
        onClick: () => setOpen((current) => !current),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      })}

      {open ? (
        <div
          ref={panel}
          role="menu"
          aria-label={label}
          className={cn(
            'border-border-base bg-surface shadow-pop animate-pop absolute top-[calc(100%+6px)] z-50',
            'rounded-card min-w-52 overflow-hidden border p-1',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {header ? (
            <div className="border-border-base mb-1 border-b px-2.5 py-2">{header}</div>
          ) : null}

          {entries.map((entry) =>
            isSeparator(entry) ? (
              <div key={entry.id} role="separator" className="bg-border-base my-1 h-px" />
            ) : (
              <button
                key={entry.id}
                type="button"
                role="menuitem"
                disabled={entry.disabled}
                onClick={() => {
                  setOpen(false);
                  entry.onSelect();
                }}
                className={cn(
                  'text-ui flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-medium transition',
                  'disabled:pointer-events-none disabled:opacity-40',
                  entry.danger
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                {entry.icon ? <span className="flex-none">{entry.icon}</span> : null}
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                {entry.hint ? (
                  <span className="text-fg-subtle text-ui-2xs flex-none tabular-nums">
                    {entry.hint}
                  </span>
                ) : null}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
};
