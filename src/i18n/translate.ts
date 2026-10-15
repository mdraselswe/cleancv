/**
 * Bangla -> English, for the reader who switches the interface to English.
 *
 * The interface is written in Bangla. English is a layer on top: a dictionary
 * of exact strings plus a list of patterns for the ones with numbers or names
 * in them, applied to what is already on screen. Nothing here touches a CV -
 * the document is whatever its author typed, in whatever language.
 */

import { CARRIED } from './carried';
import { EXACT, TEMPLATES } from './dictionary';
import { MANUAL_EXACT, MANUAL_TEMPLATES } from './manual';

/** A Bangla letter, as opposed to a digit or punctuation. */
const BANGLA_LETTER = /[অ-হ়-ৎৗড়-ৣৰৱ]/;
const BANGLA_DIGITS = /[০-৯]/g;

export const toAsciiDigits = (text: string): string =>
  text.replace(BANGLA_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x09e6));

export const hasBanglaLetters = (text: string): boolean => BANGLA_LETTER.test(text);

const exact: Map<string, string> = new Map([...Object.entries(CARRIED), ...Object.entries(EXACT), ...Object.entries(MANUAL_EXACT)]);

interface CompiledTemplate {
  pattern: RegExp;
  replacement: string;
}

const compiled: CompiledTemplate[] = [...MANUAL_TEMPLATES, ...TEMPLATES].map(([source, replacement]) => ({
  pattern: new RegExp(`^${source}$`),
  replacement,
}));

const normalise = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** `{{1:role|roles}}` - the singular when capture 1 is 1, the plural otherwise. */
const applyPlurals = (text: string, captures: string[]): string =>
  text.replace(/\{\{(\d):([^|}]*)\|([^}]*)\}\}/g, (_, index: string, one: string, many: string) =>
    toAsciiDigits(captures[Number(index)] ?? '').trim() === '1' ? one : many,
  );

const translateFragment = (fragment: string, depth: number): string => {
  const trimmed = normalise(fragment);
  if (!trimmed) return fragment;

  const direct = exact.get(trimmed);
  if (direct !== undefined) return direct;

  if (!hasBanglaLetters(trimmed)) return toAsciiDigits(fragment);

  if (depth < 2) {
    for (const { pattern, replacement } of compiled) {
      const match = pattern.exec(trimmed);
      if (!match) continue;

      const captures = match.map((value, index) =>
        index === 0 ? value : translateList(value, depth + 1),
      );

      return applyPlurals(
        replacement.replace(/\$(\d)/g, (_, index: string) => captures[Number(index)] ?? ''),
        captures,
      );
    }
  }

  return fragment;
};

/** A capture can be one name, or several joined with a middle dot or comma. */
const translateList = (value: string, depth: number): string => {
  const whole = translateFragment(value, depth);
  if (whole !== value) return whole;

  for (const separator of [' · ', ', ']) {
    if (value.includes(separator)) {
      return value
        .split(separator)
        .map((piece) => translateFragment(piece, depth))
        .join(separator);
    }
  }

  return value;
};

/**
 * The English for one piece of interface text, or null when it needs none.
 * Leading and trailing whitespace is kept, because it is layout.
 */
export const translateText = (text: string): string | null => {
  if (!text) return null;

  if (!hasBanglaLetters(text)) {
    const ascii = toAsciiDigits(text);

    return ascii === text ? null : ascii;
  }

  const lead = /^\s*/.exec(text)?.[0] ?? '';
  const tail = /\s*$/.exec(text)?.[0] ?? '';
  const core = text.slice(lead.length, text.length - tail.length);
  const translated = toAsciiDigits(translateList(core, 0));

  return translated === core ? null : `${lead}${translated}${tail}`;
};

export const translatableAttributes = ['aria-label', 'title', 'placeholder', 'alt', 'aria-description'] as const;

/** Text a reader typed is theirs, and the CV is whatever its author wrote. */
const SKIP_TEXT =
  'script, style, noscript, textarea, input, [contenteditable="true"], .resume-root, [data-no-translate]';

/** A field's own label and placeholder are interface, even where its content is not. */
const SKIP_ATTRIBUTES = 'script, style, noscript, .resume-root, [data-no-translate]';

const skipped = (node: Node, selector: string = SKIP_TEXT): boolean => {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;

  return element ? element.closest(selector) !== null : false;
};

const translateTextNode = (node: Text) => {
  if (skipped(node)) return;

  const next = translateText(node.data);
  if (next !== null && next !== node.data) node.data = next;
};

const translateElementAttributes = (element: Element) => {
  if (skipped(element, SKIP_ATTRIBUTES)) return;

  for (const name of translatableAttributes) {
    const value = element.getAttribute(name);
    if (!value) continue;

    const next = translateText(value);
    if (next !== null && next !== value) element.setAttribute(name, next);
  }
};

/** Translates a subtree in place: its text nodes, and the attributes a reader sees. */
export const translateTree = (root: Node) => {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);

    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current: Node | null = root.nodeType === Node.ELEMENT_NODE ? root : walker.nextNode();

  while (current) {
    if (current.nodeType === Node.TEXT_NODE) translateTextNode(current as Text);
    else translateElementAttributes(current as Element);

    current = walker.nextNode();
  }
};

/**
 * Keeps the English up as React changes the page.
 * Returns a function that stops it.
 */
export const startTranslating = (): (() => void) => {
  translateTree(document.body);
  if (document.title) {
    const title = translateText(document.title);
    if (title) document.title = title;
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') {
        translateTextNode(record.target as Text);
      } else if (record.type === 'attributes') {
        translateElementAttributes(record.target as Element);
      } else {
        record.addedNodes.forEach((node) => translateTree(node));
      }
    }

    const title = translateText(document.title);
    if (title) document.title = title;
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...translatableAttributes],
  });

  return () => observer.disconnect();
};
