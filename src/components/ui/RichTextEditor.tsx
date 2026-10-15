'use client';

import { Bold, Check, Eraser, Italic, Link2, Link2Off, Underline, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/cn';
import {
  isSafeHref,
  parseEmphasis,
  serializeEmphasis,
  type EmphasisSpan,
} from '@/lib/emphasis';

export interface RichTextEditorProps {
  /** The text with its inline markers — the same flat string the document stores. */
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
 * Text with bold, italic, underline and links, edited where it is shown.
 *
 * The value is the same flat marker string the rest of the app already reasons
 * about; this is only a way of editing it without typing the markers. What it
 * deliberately does not do is own the text: while the editor has focus the DOM
 * is the source of truth and the string follows it. Writing the value back into
 * the DOM on every keystroke is what makes a caret jump to the start of the
 * line, so the DOM is rebuilt only when the value changed from somewhere else
 * (undo, another entry) and once when focus leaves, to tidy what was typed.
 *
 * One paragraph: Enter never inserts a line break, because the templates set
 * these fields as a single run of text. Pasted text is taken as plain text.
 */

interface Style {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  href?: string;
}

const walk = (node: Node, inherited: Style, out: EmphasisSpan[]): void => {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (text) out.push({ text, ...inherited });

      return;
    }

    if (!(child instanceof HTMLElement)) return;

    const tag = child.tagName;
    const style = child.style;

    if (tag === 'BR') {
      out.push({ text: ' ', ...inherited });

      return;
    }

    const attribute = tag === 'A' ? (child.getAttribute('href') ?? '') : '';

    walk(
      child,
      {
        bold:
          inherited.bold ||
          tag === 'B' ||
          tag === 'STRONG' ||
          style.fontWeight === 'bold' ||
          Number(style.fontWeight) >= 600,
        italic: inherited.italic || tag === 'I' || tag === 'EM' || style.fontStyle === 'italic',
        underline:
          inherited.underline || tag === 'U' || style.textDecorationLine.includes('underline'),
        href: isSafeHref(attribute) ? attribute : inherited.href,
      },
      out,
    );
  });
};

const read = (root: HTMLElement): string => {
  const spans: EmphasisSpan[] = [];

  walk(root, { bold: false, italic: false, underline: false }, spans);

  return serializeEmphasis(spans);
};

const build = (root: HTMLElement, value: string): void => {
  root.textContent = '';

  for (const span of parseEmphasis(value)) {
    let node: Node = document.createTextNode(span.text);

    const wrapIn = (tag: 'i' | 'u' | 'b') => {
      const wrapper = document.createElement(tag);
      wrapper.append(node);
      node = wrapper;
    };

    if (span.italic) wrapIn('i');
    if (span.underline) wrapIn('u');
    if (span.bold) wrapIn('b');

    if (span.href) {
      const anchor = document.createElement('a');
      anchor.setAttribute('href', span.href);
      anchor.append(node);
      node = anchor;
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

/** The link around a node inside the editor, if there is one. */
const linkAround = (root: HTMLElement, node: Node | null): HTMLAnchorElement | null => {
  const element = node instanceof Element ? node : (node?.parentElement ?? null);
  const anchor = element?.closest('a') ?? null;

  return anchor && root.contains(anchor) ? (anchor as HTMLAnchorElement) : null;
};

/** What somebody means by a typed address: `example.com` is a web address. */
const normaliseAddress = (raw: string): string => {
  const value = raw.trim();
  if (!value) return '';
  if (isSafeHref(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(value)) return `https://${value}`;

  return '';
};

const toolbarButton =
  'tap-target text-fg-muted hover:bg-surface-2 hover:text-fg flex h-7 w-7 items-center justify-center rounded-lg transition';

interface LinkDraft {
  address: string;
  /** Editing a link that is already there, rather than making one. */
  existing: boolean;
  error: string;
}

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
  const container = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const emitted = useRef(value);
  // The selection to restore when the address box hands focus back.
  const savedRange = useRef<Range | null>(null);
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    link: false,
  });
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<LinkDraft | null>(null);

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
      const element = root.current;
      const selection = window.getSelection();

      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        link: element ? linkAround(element, selection?.anchorNode ?? null) !== null : false,
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

  const format = (command: 'bold' | 'italic' | 'underline' | 'removeFormat') => {
    const element = root.current;
    if (!element) return;

    element.focus();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(command);
    commit();
  };

  const openLink = () => {
    const element = root.current;
    if (!element) return;

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || !element.contains(selection.anchorNode)) {
      element.focus();
      placeCaretAtEnd(element);
    }

    const current = window.getSelection();
    if (!current || current.rangeCount === 0) return;

    savedRange.current = current.getRangeAt(0).cloneRange();
    const anchor = linkAround(element, current.anchorNode);

    setDraft({
      address: anchor?.getAttribute('href') ?? '',
      existing: anchor !== null,
      error: '',
    });
  };

  const restoreSelection = () => {
    const element = root.current;
    const range = savedRange.current;

    if (!element) return null;

    element.focus();

    if (range) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    return range;
  };

  const closeLink = () => {
    setDraft(null);
    restoreSelection();
    savedRange.current = null;
  };

  const applyLink = () => {
    if (!draft) return;

    const address = normaliseAddress(draft.address);

    if (!address) {
      setDraft({ ...draft, error: 'https://example.com-এর মতো একটি ওয়েব ঠিকানা বা একটি ইমেইল লিখুন।' });

      return;
    }

    const element = root.current;
    const range = restoreSelection();
    if (!element || !range) return;

    const anchor = linkAround(element, range.commonAncestorContainer);

    if (anchor) {
      anchor.setAttribute('href', address);
    } else if (range.collapsed) {
      // Nothing selected: the address itself becomes the visible text.
      const escaped = address.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

      document.execCommand(
        'insertHTML',
        false,
        `<a href="${escaped}">${escaped.replace(/^mailto:/i, '')}</a>`,
      );
    } else {
      document.execCommand('createLink', false, address);
    }

    savedRange.current = null;
    setDraft(null);
    commit();
  };

  const removeLink = () => {
    const element = root.current;
    const range = restoreSelection();
    if (!element || !range) return;

    const anchor = linkAround(element, range.commonAncestorContainer);

    // Unwrap in place so only the link goes, never the words.
    if (anchor) anchor.replaceWith(...Array.from(anchor.childNodes));
    else document.execCommand('unlink');

    savedRange.current = null;
    setDraft(null);
    commit();
  };

  return (
    <div ref={container} className={cn('flex flex-col gap-1', className)}>
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
        onBlur={(event) => {
          const element = root.current;

          // Focus moving to this editor's own address box is not leaving it.
          if (container.current?.contains(event.relatedTarget as Node | null)) return;

          setFocused(false);

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

          if (
            event.key === 'Backspace' &&
            onBackspaceEmpty &&
            (root.current?.textContent ?? '') === ''
          ) {
            event.preventDefault();
            onBackspaceEmpty();
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
        <div role="toolbar" aria-label="লেখার ফরম্যাটিং" className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="বোল্ড"
            title="বোল্ড (Ctrl+B)"
            aria-pressed={active.bold}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format('bold')}
            className={cn(toolbarButton, active.bold && 'bg-primary-soft text-primary')}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            aria-label="ইটালিক"
            title="ইটালিক (Ctrl+I)"
            aria-pressed={active.italic}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format('italic')}
            className={cn(toolbarButton, active.italic && 'bg-primary-soft text-primary')}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            aria-label="আন্ডারলাইন"
            title="আন্ডারলাইন (Ctrl+U)"
            aria-pressed={active.underline}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format('underline')}
            className={cn(toolbarButton, active.underline && 'bg-primary-soft text-primary')}
          >
            <Underline size={14} />
          </button>
          <button
            type="button"
            aria-label="লিংক"
            title={active.link ? 'লিংক এডিট' : 'লিংক যোগ করুন'}
            aria-pressed={active.link}
            onMouseDown={(event) => event.preventDefault()}
            onClick={openLink}
            className={cn(toolbarButton, active.link && 'bg-primary-soft text-primary')}
          >
            <Link2 size={14} />
          </button>
          <button
            type="button"
            aria-label="ফরম্যাটিং মুছুন"
            title="ফরম্যাটিং মুছুন"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format('removeFormat')}
            className={toolbarButton}
          >
            <Eraser size={14} />
          </button>
        </div>

        {footer ? <div className="ml-auto min-w-0">{footer}</div> : null}
      </div>

      {draft ? (
        <div className="border-border-base bg-surface-2/60 rounded-control flex flex-col gap-1.5 border p-2">
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="url"
              inputMode="url"
              aria-label="লিংকের ঠিকানা"
              placeholder="https://example.com"
              value={draft.address}
              onChange={(event) => setDraft({ ...draft, address: event.target.value, error: '' })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyLink();
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  closeLink();
                }
              }}
              className="border-border-base bg-surface text-ui-md text-fg focus:ring-ring h-8 min-w-0 flex-1 rounded-lg border px-2.5 focus:ring-2 focus:outline-none"
            />
            <button
              type="button"
              aria-label="লিংক প্রয়োগ করুন"
              title="লিংক প্রয়োগ করুন"
              onClick={applyLink}
              className="bg-primary text-primary-fg flex h-8 w-8 flex-none items-center justify-center rounded-lg"
            >
              <Check size={15} />
            </button>
            {draft.existing ? (
              <button
                type="button"
                aria-label="লিংক সরান"
                title="লিংক সরান"
                onClick={removeLink}
                className="text-danger hover:bg-danger/10 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
              >
                <Link2Off size={15} />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="বাতিল"
              title="বাতিল"
              onClick={closeLink}
              className="text-fg-muted hover:bg-surface flex h-8 w-8 flex-none items-center justify-center rounded-lg"
            >
              <X size={15} />
            </button>
          </div>
          {draft.error ? <p className="text-danger text-ui-xs">{draft.error}</p> : null}
          <p className="text-fg-subtle text-ui-2xs leading-snug">
            যে শব্দে লিংক দিতে চান, আগে সেটি সিলেক্ট করুন। ATS-সেফ PDF-এ লিংকের পরে ঠিকানাটিও ছাপা হয়।
          </p>
        </div>
      ) : null}
    </div>
  );
};
