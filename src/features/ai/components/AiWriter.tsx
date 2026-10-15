'use client';

import { Check, ChevronDown, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui';
import { useResume } from '@/features/resume';
import { useLang } from '@/i18n';
import { AI_POLISH } from '@/lib/aiPolish';
import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';
import { stripEmphasis } from '@/lib/text';

import { useAiStatus } from '../hooks/useAiStatus';
import { buildResumeFacts } from '../utils/resumeFacts';

/**
 * Writing from an instruction, for the accounts that are allowed it.
 *
 * Two jobs, one panel:
 *
 * - `summary` writes the summary for a *named role* from the CV's own facts, so
 *   a Frontend Developer and a Full Stack Developer summary are two different
 *   texts from the same document, instead of one summary stretched to fit both.
 * - `bullets` rewrites every bullet of a job or project at once, following a
 *   sentence of instruction ("write for a Full Stack role, ATS-friendly").
 *
 * The model is told to use only facts in the CV and the server refuses a number
 * that is not there. The result is shown beside what it replaces and applied
 * only on a click: the reader is the one who knows what is still true.
 */

type Props =
  | { mode: 'summary'; onApply: (text: string) => void }
  | {
      mode: 'bullets';
      bullets: readonly string[];
      /** The role and employer, or the project, for wording only. */
      context?: string;
      onApply: (next: string[]) => void;
    };

const COPY = {
  bn: {
    open: 'AI দিয়ে প্রম্পট থেকে লিখুন',
    openBullets: 'AI দিয়ে সব বুলেট আপডেট করুন',
    close: 'বন্ধ করুন',
    role: 'কোন পদের জন্য লিখবেন?',
    rolePlaceholder: 'Full Stack Developer',
    instruction: 'আপনার নির্দেশ (ঐচ্ছিক)',
    summaryPlaceholder:
      'যেমন: Node.js আর API-র কাজ আগে রাখো, ছোট করে লেখো, লিডারশিপ ছুঁয়ে যাও',
    bulletsPlaceholder:
      'যেমন: Full Stack পদের জন্য ATS-friendly করো, ফলাফল আগে বলো, backend কাজ বেশি তুলে ধরো',
    ideas: 'আইডিয়া',
    write: 'লিখুন',
    writing: 'লেখা হচ্ছে…',
    again: 'আবার চেষ্টা করুন',
    use: 'এটি ব্যবহার করুন',
    useAll: 'সব বুলেট ব্যবহার করুন',
    dismiss: 'বাদ দিন',
    suggestion: 'AI-র পরামর্শ',
    before: 'আগে',
    after: 'পরে',
    check:
      'আসল তথ্যের সঙ্গে মিলিয়ে পড়ুন। AI-কে শুধু আপনার CV-র তথ্য ব্যবহার করতে বলা হয়েছে, তবে কোনটা সত্যি তা আপনিই জানেন।',
    stale: ' এটি তৈরির পর লেখাটি বদলে গেছে।',
    kept: (n: number) =>
      `${bn(n)}টি বুলেট বদলানো হয়নি, কারণ নতুন লেখায় আপনার লেখার বাইরের সংখ্যা এসেছিল।`,
    needFacts: 'আগে কিছু অভিজ্ঞতা, প্রজেক্ট বা দক্ষতা যোগ করুন, তবেই AI আপনার CV থেকে লিখতে পারবে।',
    failed: 'AI এটি লিখতে পারেনি।',
    network: 'AI সার্ভিসে পৌঁছানো যায়নি।',
  },
  en: {
    open: 'Write with AI from a prompt',
    openBullets: 'Update all bullets with AI',
    close: 'Close',
    role: 'Which role is this for?',
    rolePlaceholder: 'Full Stack Developer',
    instruction: 'Your instruction (optional)',
    summaryPlaceholder:
      'e.g. Lead with Node.js and API work, keep it short, touch on leadership',
    bulletsPlaceholder:
      'e.g. Make it ATS-friendly for a Full Stack role, lead with the outcome, stress backend work',
    ideas: 'Ideas',
    write: 'Write',
    writing: 'Writing…',
    again: 'Try again',
    use: 'Use this',
    useAll: 'Use all bullets',
    dismiss: 'Dismiss',
    suggestion: 'AI suggestion',
    before: 'Before',
    after: 'After',
    check:
      'Read it against what is true. The AI was told to use only facts from your CV, but you are the one who knows what is accurate.',
    stale: ' The text changed after this was written.',
    kept: (n: number) =>
      `${n} bullet${n === 1 ? ' was' : 's were'} left as they were, because the rewrite brought in a number that is not in yours.`,
    needFacts: 'Add some experience, projects or skills first, so the AI has your CV to write from.',
    failed: 'The AI could not write that.',
    network: 'Could not reach the AI service.',
  },
} as const;

const ROLE_CHIPS = [
  'Frontend Developer',
  'Full Stack Developer',
  'Backend Developer',
  'Software Engineer',
  'Tech Lead',
] as const;

const INSTRUCTION_CHIPS = {
  summary: [
    'Keep it to 2–3 sentences',
    'Lead with the strongest technical skills for this role',
    'Mention leadership and mentoring',
    'Use keywords from the job description',
  ],
  bullets: [
    'Make it ATS-friendly',
    'Lead with the outcome',
    'Write it for a Full Stack role',
    'Stress backend and API work',
    'Stress performance and scalability',
  ],
} as const;

interface SummaryOffer {
  kind: 'summary';
  suggestion: string;
}

interface BulletsOffer {
  kind: 'bullets';
  suggestions: string[];
  kept: number;
  /** The bullets they were made from - applying must not overwrite a newer edit. */
  basedOn: string[];
}

export const AiWriter = (props: Props) => {
  const enabled = useAiStatus();
  const resume = useResume();
  const copy = COPY[useLang()];

  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [instruction, setInstruction] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<SummaryOffer | BulletsOffer | null>(null);

  if (!enabled) return null;

  const isSummary = props.mode === 'summary';
  const currentBullets = props.mode === 'bullets' ? [...props.bullets] : [];
  const filled = currentBullets.filter((bullet) => stripEmphasis(bullet).trim().length >= 3);
  const targetRole = role.trim() || stripEmphasis(resume.basics.headline).trim();
  const jobDescription = resume.meta.targetJobDescription?.trim() || undefined;
  const label = isSummary ? copy.open : copy.openBullets;

  const run = async () => {
    setError('');

    const body = isSummary
      ? (() => {
          const facts = buildResumeFacts(resume);

          return facts.length < 40 ? null : {
            kind: 'summary-generate',
            role: targetRole || 'Software Engineer',
            facts,
            instruction: instruction.trim() || undefined,
            jobDescription: jobDescription?.slice(0, AI_POLISH.maxJobDescriptionChars),
          };
        })()
      : {
          kind: 'bullets',
          bullets: filled.slice(0, AI_POLISH.maxBullets),
          context: props.mode === 'bullets' ? props.context?.slice(0, AI_POLISH.maxContextChars) : undefined,
          instruction: instruction.trim() || undefined,
          jobDescription: jobDescription?.slice(0, AI_POLISH.maxJobDescriptionChars),
        };

    if (!body) {
      setError(copy.needFacts);

      return;
    }

    setPending(true);

    try {
      const response = await fetch('/api/ai/polish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => null)) as {
        suggestion?: string;
        suggestions?: string[];
        kept?: number;
        error?: string;
      } | null;

      if (!response.ok) {
        setError(result?.error ?? copy.failed);

        return;
      }

      if (isSummary && result?.suggestion) {
        setOffer({ kind: 'summary', suggestion: result.suggestion });
      } else if (!isSummary && result?.suggestions) {
        setOffer({
          kind: 'bullets',
          suggestions: result.suggestions,
          kept: result.kept ?? 0,
          basedOn: filled.slice(0, AI_POLISH.maxBullets),
        });
      } else {
        setError(result?.error ?? copy.failed);
      }
    } catch {
      setError(copy.network);
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!isSummary && filled.length === 0}
        className="border-primary/25 text-primary hover:bg-primary-soft rounded-control text-ui mt-1 inline-flex items-center gap-1.5 self-start border px-2.5 py-1.5 font-semibold transition disabled:opacity-40"
      >
        <Sparkles size={14} aria-hidden="true" />
        {label}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
    );
  }

  const chips = INSTRUCTION_CHIPS[isSummary ? 'summary' : 'bullets'];

  const applyOffer = () => {
    if (!offer) return;

    if (offer.kind === 'summary' && props.mode === 'summary') {
      props.onApply(offer.suggestion);
    }

    if (offer.kind === 'bullets' && props.mode === 'bullets') {
      // Rewritten bullets replace their originals in place; any the model was not
      // sent (beyond the cap) and any blank row stay where they were.
      let next = 0;
      const merged = [...props.bullets].map((bullet) => {
        if (stripEmphasis(bullet).trim().length < 3 || next >= offer.suggestions.length) return bullet;

        const replacement = offer.suggestions[next];
        next += 1;

        return replacement;
      });

      props.onApply(merged);
    }

    setOffer(null);
  };

  const stale =
    offer?.kind === 'bullets' &&
    props.mode === 'bullets' &&
    offer.basedOn.join('\u0000') !==
      props.bullets
        .filter((bullet) => stripEmphasis(bullet).trim().length >= 3)
        .slice(0, AI_POLISH.maxBullets)
        .join('\u0000');

  return (
    <div className="border-primary/25 bg-primary-soft/30 rounded-control mt-1 flex flex-col gap-3 border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-primary text-ui flex items-center gap-1.5 font-bold">
          <Sparkles size={14} aria-hidden="true" /> {label}
        </p>
        <button
          type="button"
          aria-label={copy.close}
          title={copy.close}
          onClick={() => {
            setOpen(false);
            setOffer(null);
            setError('');
          }}
          className="text-fg-subtle hover:text-fg rounded-md p-1"
        >
          <X size={15} />
        </button>
      </div>

      {isSummary ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-ui text-fg-muted font-medium">{copy.role}</span>
          <input
            type="text"
            value={role}
            maxLength={120}
            onChange={(event) => setRole(event.target.value)}
            placeholder={stripEmphasis(resume.basics.headline) || copy.rolePlaceholder}
            className="border-border-base bg-surface text-ui-md text-fg focus:border-primary h-9 rounded-lg border px-3 outline-none"
          />
          <span className="flex flex-wrap gap-1">
            {ROLE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setRole(chip)}
                className={cn(
                  'text-ui-xs rounded-full border px-2 py-0.5 transition',
                  role === chip
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border-base text-fg-muted hover:border-primary/40',
                )}
              >
                {chip}
              </button>
            ))}
          </span>
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-ui text-fg-muted font-medium">{copy.instruction}</span>
        <textarea
          value={instruction}
          rows={3}
          maxLength={AI_POLISH.maxInstructionChars}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder={isSummary ? copy.summaryPlaceholder : copy.bulletsPlaceholder}
          className="border-border-base bg-surface text-ui-md text-fg placeholder:text-fg-subtle focus:border-primary resize-y rounded-lg border px-3 py-2 outline-none"
        />
        <span className="flex flex-wrap items-center gap-1">
          <span className="text-fg-subtle text-ui-2xs">{copy.ideas}:</span>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() =>
                setInstruction((current) =>
                  current.includes(chip) ? current : `${current.trim()} ${chip}.`.trim(),
                )
              }
              className="border-border-base text-fg-muted hover:border-primary/40 text-ui-xs rounded-full border px-2 py-0.5 transition"
            >
              {chip}
            </button>
          ))}
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={pending}
          leading={pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          onClick={() => void run()}
        >
          {pending ? copy.writing : copy.write}
        </Button>
        {error ? <span className="text-danger text-ui-xs">{error}</span> : null}
      </div>

      {offer ? (
        <div className="border-border-base bg-surface rounded-control flex flex-col gap-2.5 border p-2.5">
          <p className="text-primary text-ui-2xs flex items-center gap-1 font-bold">
            <Sparkles size={12} aria-hidden="true" /> {copy.suggestion}
          </p>

          {offer.kind === 'summary' ? (
            <>
              {stripEmphasis(resume.summary.text).trim() ? (
                <p className="text-fg-subtle text-ui leading-relaxed">
                  <span className="font-semibold">{copy.before}: </span>
                  {stripEmphasis(resume.summary.text)}
                </p>
              ) : null}
              <p className="text-fg text-ui-md leading-relaxed">
                <span className="text-primary text-ui font-semibold">{copy.after}: </span>
                {offer.suggestion}
              </p>
            </>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {offer.suggestions.map((suggestion, index) => {
                const before = offer.basedOn[index] ?? '';
                const changed = suggestion !== before;

                return (
                  <li key={index} className="flex flex-col gap-0.5">
                    {changed ? (
                      <p className="text-fg-subtle text-ui line-through decoration-1">
                        {stripEmphasis(before)}
                      </p>
                    ) : null}
                    <p className={cn('text-ui-md leading-relaxed', changed ? 'text-fg' : 'text-fg-muted')}>
                      {stripEmphasis(suggestion)}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}

          {offer.kind === 'bullets' && offer.kept > 0 ? (
            <p className="text-warning text-ui-xs">{copy.kept(offer.kept)}</p>
          ) : null}

          <p className="text-fg-subtle text-ui-2xs leading-snug">
            {copy.check}
            {stale ? copy.stale : ''}
          </p>

          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="primary"
              disabled={Boolean(stale)}
              leading={<Check size={14} />}
              onClick={applyOffer}
            >
              {offer.kind === 'bullets' ? copy.useAll : copy.use}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              leading={<RotateCcw size={14} />}
              onClick={() => void run()}
            >
              {copy.again}
            </Button>
            <Button size="sm" variant="ghost" leading={<X size={14} />} onClick={() => setOffer(null)}>
              {copy.dismiss}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
