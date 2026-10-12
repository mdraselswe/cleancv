'use client';

import { Bold, Eraser, Italic } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { parseEmphasis, serializeEmphasis, type EmphasisSpan } from '@/lib/emphasis';

export interface RichTextEditorProps {
  /** The text with `**bold**` / `_italic_` markers — the same flat string the document stores. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  placeholder?: string;
  /** Visible height in lines, as a textarea's `rows`. */
  rows?: number;
  /** Ceiling on the stored string, markers included, as a textarea's `maxLength`. */
  maxLength?: number;
  /** Enter inserts nothing; with a handler it also reports the press (a bullet adds the next one). */
  onEnter?: () => void;
  /** Backspace in an already-empty editor — the cue to remove this line. */
  onBackspaceEmpty?: () => void;
  autoFocus?: boolean;
  /** Change it to take focus again with `autoFocus` still true — the same line twice in a row. */
  focusToken?: number;
  /** Right-aligned in the toolbar row: counters and coaching. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Text with bold and italic, edited where it is shown.
 *
 * The value is the same flat marker string the rest of the app already reasons
 * about; this is only a way of editing it without typing the markers. What it
 * deliberately does not do is own the text: while the editor has focus the DOM
 * is the source of truth and the string follows it. Writing the value back into
 * the DOM on every keystroke is what makes a caret jump to the start of the
 * line, so the DOM is rebuilt only when the value changed from somewhere else
 * (undo, another entry) and once on blur to tidy what was typed.
 *
 * One paragraph: Enter never inserts a line break, because the templates set
 * these fields as a single run of text. Pasted text is taken as plain text.
 */

const walk = (node: Node, bold: boolean, italic: boolean, out: EmphasisSpan[]): void => {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (text) out.push({ text, bold, italic });

      return;
    }

    if (!(child instanceof HTMLElement)) return;

    const tag = child.tagName;
    const style = child.style;
    const isBold =
      bold ||
      tag === 'B' ||
      tag === 'STRONG' ||
      style.fontWeight === 'bold' ||
      Number(style.fontWeight) >= 600;
    const isItalic = italic || tag === 'I' || tag === 'EM' || style.fontStyle === 'italic';

    if (tag === 'BR') {
      out.push({ text: ' ', bold, italic });

      return;
    }

    walk(child, isBold, isItalic, out);
  });
};

const read = (root: HTMLElement): string => {
  const spans: EmphasisSpan[] = [];

  walk(root, false, false, spans);

  return serializeEmphasis(spans);
};

const build = (root: HTMLElement, value: string): void => {
  root.textContent = '';

  for (const span of parseEmphasis(value)) {
    let node: Node = document.createTextNode(span.text);

    if (span.italic) {
      const wrapper = document.createElement('i');
      wrapper.append(node);
      node = wrapper;
    }

    if (span.bold) {
      const wrapper = document.createElement('b');
      wrapper.append(node);
      node = wrapper;
    }

    root.append(node);
  }
};

const placeCaretAtEnd = (root: HTMLElement): void => {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();

  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

const toolbarButton =
  'tap-target text-fg-muted hover:bg-surface-2 hover:text-fg flex h-7 w-7 items-center justify-center rounded-lg transition';

export const RichTextEditor = ({
  value,
  onChange,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
  placeholder,
  rows = 3,
  maxLength,
  onEnter,
  onBackspaceEmpty,
  autoFocus,
  focusToken,
  footer,
  className,
}: RichTextEditorProps) => {
  const root = useRef<HTMLDivElement>(null);
  const emitted = useRef(value);
  const [active, setActive] = useState({ bold: false, italic: false });
  const [focused, setFocused] = useState(false);

  // Mirror the string into the DOM only when it changed from outside this editor.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;

    const first = element.dataset.ready !== 'true';

    if (first || value !== emitted.current) {
      build(element, value);
      emitted.current = value;
      element.dataset.ready = 'true';

      if (!first && document.activeElement === element) placeCaretAtEnd(element);
    }
  }, [value]);

  useEffect(() => {
    if (!autoFocus || !root.current) return;

    root.current.focus();
    placeCaretAtEnd(root.current);
  }, [autoFocus, focusToken]);

  /*
   * A native listener, not React's `onBeforeInput`: React's is a synthetic
   * event built from other events and carries no `inputType`, which is the one
   * thing needed here to tell a line break from a letter.
   */
  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const onBeforeInput = (event: InputEvent) => {
      if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') {
        event.preventDefault();

        return;
      }

      if (maxLength === undefined) return;
      if (!event.inputType.startsWith('insert') || event.inputType === 'insertCompositionText') {
        return;
      }

      const selection = window.getSelection();
      const replacing = selection ? !selection.isCollapsed : false;
      const incoming = event.data?.length ?? 0;

      if (!replacing && emitted.current.length + incoming > maxLength) event.preventDefault();
    };

    element.addEventListener('beforeinput', onBeforeInput);

    return () => element.removeEventListener('beforeinput', onBeforeInput);
  }, [maxLength]);

  // Which buttons look pressed follows the selection, wherever it moves.
  useEffect(() => {
    if (!focused) return;

    const update = () => {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
      });
    };

    document.addEventListener('selectionchange', update);
    update();

    return () => document.removeEventListener('selectionchange', update);
  }, [focused]);

  const commit = useCallback(() => {
    const element = root.current;
    if (!element) return;

    // Chrome leaves a stray <br> in an emptied editable; without this the
    // placeholder never comes back.
    if ((element.textContent ?? '') === '') element.textContent = '';

    const next = read(element);

    if (next === emitted.current) return;

    emitted.current = next;
    onChange(next);
  }, [onChange]);

  const format = (command: 'bold' | 'italic' | 'removeFormat') => {
    const element = root.current;
    if (!element) return;

    element.focus();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(command);
    commit();
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        ref={root}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.55 + 1.1}rem` }}
        className={cn(
          'rte border-border-base bg-surface/85 text-ui-md text-fg rounded-control w-full border px-3 py-2 leading-relaxed shadow-sm transition',
          'hover:border-primary/30 focus:border-primary/50 focus:ring-ring focus:ring-2 focus:outline-none',
        )}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const element = root.current;

          // Tidy once focus has left: merge fragments, and show literal markers
          // the way the preview will draw them.
          if (element) {
            build(element, emitted.current);
            commit();
          }
        }}
        onInput={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onEnter?.();

            return;
          }

          if (event.key === 'Backspace' && onBackspaceEmpty && (root.current?.textContent ?? '') === '') {
            event.preventDefault();
            onBackspaceEmpty();

            return;
          }

          // Underline is not part of this grammar and would silently vanish.
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
            event.preventDefault();
          }
        }}
        onPaste={(event) => {
          event.preventDefault();

          const text = event.clipboardData.getData('text/plain').replace(/\s*\n+\s*/g, ' ');
          const room =
            maxLength === undefined ? text.length : Math.max(0, maxLength - emitted.current.length);

          if (text) document.execCommand('insertText', false, text.slice(0, room || undefined));
        }}
        onDrop={(event) => event.preventDefault()}
      />

      <div className="flex min-h-7 items-center gap-1.5">
        {/* `onMouseDown` keeps the selection in the editor while a button is pressed. */}
        <div role="toolbar" aria-label="Text formatting" className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Bold"
            title="Bold (Ctrl+B)"
            aria-pressed={active.bold}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format('bold')}
            className={cn(toolbarButton, active.bold && 'bg-primary-soft text-primary')}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            aria-label="Italic"
            title="Italic (Ctrl+I)"
            aria-pressed={active.italic}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format('italic')}
            className={cn(toolbarButton, active.italic && 'bg-primary-soft text-primary')}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            aria-label="Clear formatting"
            title="Clear formatting"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format('removeFormat')}
            className={toolbarButton}
          >
            <Eraser size={14} />
          </button>
        </div>

        {footer ? <div className="ml-auto min-w-0">{footer}</div> : null}
      </div>
    </div>
  );
};
