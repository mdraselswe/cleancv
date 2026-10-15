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
  /** What the reader asks for: "write for a full stack role", "stress Node.js". */
  maxInstructionChars: 400,
  /** The digest of the CV the summary is written from. */
  maxFactsChars: 6000,
  /** Bullets rewritten in one request - an entry holds at most this many. */
  maxBullets: 12,
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
  /** The reader’s own words about what the rewrite should do. */
  instruction?: string;
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

export const buildUserPrompt = ({
  text,
  context,
  jobDescription,
  instruction,
}: PolishRequest): string =>
  [
    context ? `Context (do not repeat it): ${context}` : '',
    instruction ? `Reader’s instruction (style and emphasis only):
${instruction}` : '',
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

/* --- Writing from the CV and an instruction ------------------------------- */

/** The rules every generated text keeps, whatever the reader asked for. */
const GROUNDING_RULES = [
  'Hard rules:',
  '- Every fact must come from the CV facts you are given. Never add a number, percentage, skill, tool, employer, title, date, degree or claim that is not in them.',
  '- The reader’s instruction chooses the angle, the role to aim at and what to put first. It never permits adding a fact. If the instruction asks for something the CV does not support, leave it out rather than invent it.',
  '- Write the CV text in English, even if the instruction is in another language.',
  '- Plain, specific, ATS-friendly language. No buzzwords ("passionate", "results-driven"), no emojis, no first-person pronouns.',
];

export const buildGenerateSummaryPrompt = (hasJobDescription: boolean): string =>
  [
    'You write the professional summary of a resume, for the role the reader names.',
    'Two to four sentences, under 80 words. Open with the role and the years of experience if "Years of experience" is given, then the strongest evidence for THAT role, chosen from the CV facts.',
    'Different target roles must produce different summaries: pick and order the facts a recruiter for the named role cares about, and say less about the rest.',
    ...GROUNDING_RULES,
    hasJobDescription
      ? '- A job description is given. Use its wording where the CV already supports it. Never claim something only because the job asks for it.'
      : '',
    '- Reply with the summary only: no quotes, no preface, no explanation, no list.',
  ]
    .filter(Boolean)
    .join('\n');

export interface GenerateSummaryRequest {
  role: string;
  facts: string;
  instruction?: string;
  jobDescription?: string;
}

export const buildGenerateSummaryUser = ({
  role,
  facts,
  instruction,
  jobDescription,
}: GenerateSummaryRequest): string =>
  [
    `Target role: ${role}`,
    instruction ? `Reader’s instruction:\n${instruction}` : '',
    jobDescription ? `Job description:\n${jobDescription}` : '',
    `CV facts:\n${facts}`,
  ]
    .filter(Boolean)
    .join('\n\n');

export const buildRewriteBulletsPrompt = (hasJobDescription: boolean): string =>
  [
    'You rewrite the bullet points of one resume entry (a job or a project), following the reader’s instruction.',
    'Return exactly as many bullets as you were given, in the same order, each one rewriting the bullet at that position.',
    'Each bullet: starts with a strong past-tense verb, one or two lines, under 28 words, keeps every number exactly as written.',
    'You may re-word, tighten, lead with the outcome and use the vocabulary of the role named in the instruction. You may not merge bullets, add bullets or drop one.',
    ...GROUNDING_RULES,
    '- Keep **double-asterisk** bold markers on the same words if present; do not invent new ones.',
    hasJobDescription
      ? '- A job description is given for vocabulary only. Never add something because the job asks for it.'
      : '',
    'Reply with a JSON array of strings and nothing else.',
  ]
    .filter(Boolean)
    .join('\n');

export interface RewriteBulletsRequest {
  bullets: string[];
  context?: string;
  instruction?: string;
  jobDescription?: string;
}

export const buildRewriteBulletsUser = ({
  bullets,
  context,
  instruction,
  jobDescription,
}: RewriteBulletsRequest): string =>
  [
    context ? `Entry: ${context}` : '',
    instruction ? `Reader’s instruction:\n${instruction}` : '',
    jobDescription ? `Job description (vocabulary only):\n${jobDescription}` : '',
    `Bullets (JSON array):\n${JSON.stringify(bullets)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

/** The model's JSON array, or null when it is not an array of the right length. */
export const parseBulletList = (raw: string, expected: number): string[] | null => {
  const body = raw
    .trim()
    .replace(/^```[a-z]*\n?|```$/gi, '')
    .trim();
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');

  if (start === -1 || end <= start) return null;

  try {
    const parsed: unknown = JSON.parse(body.slice(start, end + 1));

    if (!Array.isArray(parsed) || parsed.length !== expected) return null;
    if (!parsed.every((item) => typeof item === 'string')) return null;

    return parsed.map((item) => cleanSuggestion(item as string));
  } catch {
    return null;
  }
};

/**
 * Whole years between a month ("YYYY-MM", as the document stores it, or the
 * "MM/YYYY" it prints) and now, or null when it is neither. The model is told
 * this number rather than left to subtract dates itself.
 */
export const yearsSince = (month: string, now: Date = new Date()): number | null => {
  const value = month.trim();
  const stored = /^(\d{4})-(\d{1,2})$/.exec(value);
  const printed = /^(\d{1,2})\/(\d{4})$/.exec(value);
  const year = stored ? Number(stored[1]) : printed ? Number(printed[2]) : null;
  const monthIndex = stored ? Number(stored[2]) : printed ? Number(printed[1]) : null;

  if (year === null || monthIndex === null || monthIndex < 1 || monthIndex > 12) return null;

  const start = new Date(year, monthIndex - 1, 1);
  const years = (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  return years >= 0 ? Math.floor(years) : null;
};
