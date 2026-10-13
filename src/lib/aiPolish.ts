/**
 * What the AI polish may be asked, and what it may be believed.
 *
 * Pure functions, shared by the route that calls the model and the tests that
 * pin its guard rails. The model is a rewriting tool, not a source of facts:
 * everything here exists to keep it from adding any.
 */

export const AI_POLISH = {
  /** The longest text it will rewrite: a bullet or a summary, never a document. */
  maxTextChars: 1200,
  maxJobDescriptionChars: 6000,
  maxContextChars: 200,
  /** Requests one account may make per window. A free quota is shared by everyone. */
  rateLimit: { windowMs: 60 * 60 * 1000, max: 40 },
} as const;

export type PolishKind = 'bullet' | 'summary';

export interface PolishRequest {
  kind: PolishKind;
  text: string;
  /** The role and employer the bullet belongs to — wording context only. */
  context?: string;
  jobDescription?: string;
}

const KIND_GUIDE: Record<PolishKind, string> = {
  bullet:
    'One resume bullet. Start with a strong past-tense verb, keep it to one or two lines (under 28 words), and keep every number exactly as written.',
  summary:
    'A resume summary of two to four sentences, in the first person implied (no "I"), under 80 words.',
};

export const buildSystemPrompt = (kind: PolishKind, hasJobDescription: boolean): string =>
  [
    'You rewrite resume text. You are an editor, not an author.',
    KIND_GUIDE[kind],
    'Hard rules:',
    '- Use only facts that are in the text you are given. Never add a number, percentage, skill, tool, employer, title, date or claim that is not already there.',
    '- Do not make the work sound bigger than it was. If the original is modest, stay modest.',
    '- Keep **double-asterisk** bold markers and _underscore_ italic markers on the same words if present; do not invent new ones.',
    hasJobDescription
      ? '- A job description is given for vocabulary only. Prefer its wording where the original already says the same thing. Never add something because the job asks for it.'
      : '',
    '- Plain, specific, ATS-friendly language. No buzzwords, no emojis, no first-person pronouns.',
    '- Reply with the rewritten text only: no quotes, no preface, no explanation, no list.',
  ]
    .filter(Boolean)
    .join('\n');

export const buildUserPrompt = ({ text, context, jobDescription }: PolishRequest): string =>
  [
    context ? `Context (do not repeat it): ${context}` : '',
    jobDescription ? `Job description (vocabulary only):\n${jobDescription}` : '',
    `Text to rewrite:\n${text}`,
  ]
    .filter(Boolean)
    .join('\n\n');

/** Every run of digits in a string, as the tokens a number is made of. */
const numbersIn = (value: string): Set<string> =>
  new Set((value.match(/\d+(?:[.,]\d+)*/g) ?? []).map((token) => token.replace(/,/g, '')));

/** True when the rewrite contains a number the original did not. */
export const introducesNewNumbers = (original: string, suggestion: string): boolean => {
  const known = numbersIn(original);

  for (const token of numbersIn(suggestion)) {
    if (!known.has(token)) return true;
  }

  return false;
};

/** What the model sometimes wraps around an answer that was asked to be bare. */
export const cleanSuggestion = (raw: string): string =>
  raw
    .trim()
    .replace(/^```[a-z]*\n?|```$/gi, '')
    .replace(/^(here(?:'s| is)[^:\n]*:|rewritten(?: text)?:)\s*/i, '')
    .replace(/^["“”']+|["“”']+$/g, '')
    .replace(/^[-•*]\s+(?!\*)/, '')
    .replace(/\s*\n+\s*/g, ' ')
    .trim();
