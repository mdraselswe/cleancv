/**
 * Builds the English half of the language switch.
 *
 * The interface is written in Bangla in the source; this reads each file
 * beside the English version it replaced (the base branch) and pairs every
 * string the two disagree on. The pairs become `src/i18n/dictionary.ts`, which
 * the runtime uses to show the English interface to a reader who asks for it.
 *
 *   node scripts/build-i18n.mjs [baseRef]        default base: main
 *
 * Both files are parsed and walked together, node against node, so a pair is
 * only recorded where the two versions have the same shape. Anything that does
 * not line up is listed at the end rather than guessed at.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const BASE = process.argv[2] || 'main';
const BANGLA = /[ঀ-৿]/;
const LATIN = /[A-Za-z]{2,}/;

const run = (command) => execSync(command, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const files = run(`git diff --name-only ${BASE}...HEAD -- src`)
  .split('\n')
  .map((line) => line.trim())
  .filter((file) => /\.(ts|tsx)$/.test(file) && !file.startsWith('src/i18n/'));

const exact = new Map(); // bangla -> Map<english, count>
const templates = []; // { bn: regexSource, en: replacement, sample }
const skipped = [];
const conflicts = [];

const norm = (text) => text.replace(/\s+/g, ' ').trim();

/** Some English strings in the base were saved with their punctuation doubly encoded. */
const repair = (text) =>
  text
    .replace(/\u00e2\u20ac\u201d/g, '\u2014')
    .replace(/\u00e2\u20ac\u201c/g, '\u2013')
    .replace(/\u00e2\u20ac\u0153/g, '\u201c')
    .replace(/\u00e2\u20ac\u009d/g, '\u201d')
    .replace(/\u00e2\u20ac\u2122/g, '\u2019')
    .replace(/\u00e2\u20ac\u00a6/g, '\u2026')
    .replace(/\u00e2\u20ac\u00a2/g, '\u2022');

const parse = (name, text) =>
  ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

/** An expression, with the digit helpers peeled off, as a comparable string. */
const expressionKey = (node) => {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const name = node.expression.text;
    if ((name === 'bn' || name === 'bnPercent') && node.arguments.length === 1) {
      return expressionKey(node.arguments[0]);
    }
  }
  if (ts.isParenthesizedExpression(node)) return expressionKey(node.expression);

  return node.getText().replace(/\s+/g, '');
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const addExact = (file, bn, en) => {
  const key = norm(bn);
  const value = repair(norm(en));
  if (!key || !value || key === value) return;
  if (!BANGLA.test(key)) return;
  // Only pairs where the English side really is English text.
  if (!LATIN.test(value) && !/[0-9]/.test(value)) return;

  const choices = exact.get(key) ?? new Map();
  choices.set(value, (choices.get(value) ?? 0) + 1);
  exact.set(key, choices);
};

/** The English most often paired with a Bangla string; a capitalised form wins a tie. */
const chooseEnglish = (choices) =>
  [...choices.entries()].sort((x, y) => {
    if (y[1] !== x[1]) return y[1] - x[1];
    const xCap = /^[A-Z]/.test(x[0]) ? 1 : 0;
    const yCap = /^[A-Z]/.test(y[0]) ? 1 : 0;

    return yCap - xCap;
  })[0][0];

const templateParts = (node) => {
  const parts = [node.head.text];
  const spans = [];
  for (const span of node.templateSpans) {
    spans.push(expressionKey(span.expression));
    parts.push(span.literal.text);
  }

  return { parts, spans };
};

const addTemplate = (file, bnNode, enNode) => {
  const bn = templateParts(bnNode);
  const en = templateParts(enNode);
  if (!BANGLA.test(bn.parts.join(''))) return;

  const used = new Set();
  const mapping = [];

  for (const key of bn.spans) {
    const index = en.spans.findIndex((candidate, at) => candidate === key && !used.has(at));
    if (index === -1) {
      mapping.push(-1);
    } else {
      used.add(index);
      mapping.push(index);
    }
  }

  // Every placeholder the English wording needs has to come from the Bangla one.
  if (used.size !== en.spans.length) {
    skipped.push(`${file}: template needs a value the Bangla version lacks: ${norm(en.parts.join('${}'))}`);
    return;
  }

  const source = bn.parts
    .map((part, at) => escapeRegex(part) + (at < bn.spans.length ? '([\\s\\S]+?)' : ''))
    .join('');

  // English text: the English parts with `$n` referring to the Bangla captures.
  const bnIndexOfEnglish = en.spans.map((_, englishIndex) => mapping.indexOf(englishIndex) + 1);
  const replacement = repair(
    en.parts.map((part, at) => part + (at < en.spans.length ? `$${bnIndexOfEnglish[at]}` : '')).join(''),
  );

  templates.push({ bn: source, en: replacement, sample: norm(bn.parts.join('…')) });
};

const walk = (file, a, b) => {
  if (!a || !b) return;

  if (a.kind !== b.kind) return;

  if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) {
    if (a.text !== b.text) addExact(file, b.text, a.text);

    return;
  }

  if (ts.isJsxText(a)) {
    if (norm(a.text) !== norm(b.text)) addExact(file, b.text, a.text);

    return;
  }

  if (ts.isTemplateExpression(a)) {
    const aText = a.head.text + a.templateSpans.map((span) => span.literal.text).join('');
    const bText = b.head.text + b.templateSpans.map((span) => span.literal.text).join('');

    if (aText !== bText && b.templateSpans.length >= 0) addTemplate(file, b, a);
    // Spans can hold strings of their own (ternaries); descend into matching ones.
    for (let i = 0; i < Math.min(a.templateSpans.length, b.templateSpans.length); i += 1) {
      walk(file, a.templateSpans[i].expression, b.templateSpans[i].expression);
    }

    return;
  }

  const childrenOf = (node) => {
    const list = [];
    ts.forEachChild(node, (child) => {
      if (!ts.isImportDeclaration(child)) list.push(child);
    });

    return list;
  };

  const ac = childrenOf(a);
  const bc = childrenOf(b);

  // Bangla often orders a sentence differently, which moves the values in it.
  // Pairing the text pieces by position would then put the wrong words round
  // the wrong numbers, so such an element is left for a hand-written pair.
  if ((ts.isJsxElement(a) || ts.isJsxFragment(a)) && ac.length === bc.length) {
    const identifiers = (node) => {
      const out = [];
      const visit = (current) => {
        if (ts.isIdentifier(current) && current.text !== 'bn' && current.text !== 'bnPercent') {
          out.push(current.text);
        }
        ts.forEachChild(current, visit);
      };
      visit(node);

      return out.join('.');
    };
    const keys = (list) =>
      list
        .filter((child) => ts.isJsxExpression(child) && child.expression)
        .map((child) => identifiers(child.expression));
    const aKeys = keys(ac);
    const bKeys = keys(bc);
    const sameValues = [...aKeys].sort().join('|') === [...bKeys].sort().join('|');

    if (aKeys.length > 1 && sameValues && aKeys.join('|') !== bKeys.join('|')) {
      skipped.push(`${file}: values reordered near "${norm(b.getText()).slice(0, 80)}"`);
      for (let i = 0; i < ac.length; i += 1) {
        if (!ts.isJsxText(ac[i])) walk(file, ac[i], bc[i]);
      }

      return;
    }
  }

  if (ac.length !== bc.length) {
    // Pair by name where things have one (properties, declarations, attributes),
    // and by kind in order for the rest.
    const nameOf = (node) => {
      if (ts.isPropertyAssignment(node) || ts.isJsxAttribute(node) || ts.isPropertySignature(node)) {
        return node.name.getText();
      }
      if (ts.isVariableStatement(node)) return node.declarationList.declarations[0]?.name.getText();
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isClassDeclaration(node)
      ) {
        return node.name?.getText();
      }

      return undefined;
    };

    const taken = new Set();
    const unmatched = [];

    for (const child of ac) {
      const name = nameOf(child);
      const at = name === undefined ? -1 : bc.findIndex((candidate, index) => !taken.has(index) && candidate.kind === child.kind && nameOf(candidate) === name);

      if (at === -1) {
        unmatched.push(child);
      } else {
        taken.add(at);
        walk(file, child, bc[at]);
      }
    }

    let j = 0;
    for (const child of unmatched) {
      while (j < bc.length && (taken.has(j) || bc[j].kind !== child.kind || nameOf(bc[j]) !== undefined)) j += 1;
      if (j < bc.length) {
        walk(file, child, bc[j]);
        j += 1;
      }
    }
    if (BANGLA.test(b.getText()) !== BANGLA.test(a.getText())) {
      skipped.push(`${file}: shape differs near "${norm(b.getText()).slice(0, 70)}"`);
    }

    return;
  }

  for (let i = 0; i < ac.length; i += 1) walk(file, ac[i], bc[i]);
};

for (const file of files) {
  let baseText;
  try {
    baseText = run(`git show ${BASE}:${file}`);
  } catch {
    continue;
  }

  const current = readFileSync(file, 'utf8');
  walk(file, parse(file, baseText), parse(file, current));
}

for (const [key, choices] of exact) {
  if (choices.size > 1) {
    conflicts.push(`${key} -> ${[...choices.entries()].map(([v, c]) => `${v} x${c}`).join(' | ')}`);
  }
}

const exactObject = Object.fromEntries(
  [...exact.entries()]
    .map(([key, choices]) => [key, chooseEnglish(choices)])
    .sort((x, y) => y[0].length - x[0].length),
);
templates.sort((x, y) => y.sample.length - x.sample.length);

const header = `/**
 * GENERATED by scripts/build-i18n.mjs - do not edit by hand.
 * Add anything the generator could not pair to \`manual.ts\`.
 *
 * Bangla (the source language of the interface) -> English.
 */
`;

writeFileSync(
  'src/i18n/dictionary.ts',
  `${header}export const EXACT: Record<string, string> = ${JSON.stringify(exactObject, null, 2)};

/** [regex source over the Bangla text, English replacement using $1..$n]. */
export const TEMPLATES: Array<[string, string]> = ${JSON.stringify(
    templates.map((entry) => [entry.bn, entry.en]),
    null,
    2,
  )};
`,
);

console.log(`files compared : ${files.length}`);
console.log(`exact pairs    : ${exact.size}`);
console.log(`templates      : ${templates.length}`);
console.log(`conflicts      : ${conflicts.length}`);
console.log(`skipped        : ${skipped.length}`);
if (process.argv.includes('--verbose')) {
  console.log('--- conflicts');
  console.log(conflicts.join('\n'));
  console.log('--- skipped');
  console.log(skipped.join('\n'));
}
