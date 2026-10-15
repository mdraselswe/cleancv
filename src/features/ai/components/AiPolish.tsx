'use client';

import { Check, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui';
import { AI_POLISH, type PolishKind } from '@/lib/aiPolish';
import { stripEmphasis } from '@/lib/text';

import { useAiStatus } from '../hooks/useAiStatus';

export interface AiPolishProps {
  kind: PolishKind;
  /** The text as it is now, markers included. */
  text: string;
  /** The role and employer, for wording only. */
  context?: string;
  /** The target job, when the reader pasted one. Vocabulary only. */
  jobDescription?: string;
  onApply: (next: string) => void;
}

interface Offer {
  suggestion: string;
  /** The text it was made from — applying must not overwrite a newer edit. */
  basedOn: string;
}

/**
 * "Polish with AI", for the accounts that are allowed it.
 *
 * Renders nothing for everyone else, including while the answer is unknown.
 * A rewrite is shown beside the original and applied only on a click: it is a
 * proposal from a model that was told not to invent anything, and the reader
 * is the one who knows whether it is still true.
 */
export const AiPolish = ({ kind, text, context, jobDescription, onApply }: AiPolishProps) => {
  const enabled = useAiStatus();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<Offer | null>(null);

  if (!enabled) return null;

  const plain = stripEmphasis(text).trim();
  const tooShort = plain.length < 12;

  const run = async () => {
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/ai/polish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind,
          text: text.slice(0, AI_POLISH.maxTextChars),
          context,
          jobDescription: jobDescription?.trim()
            ? jobDescription.trim().slice(0, AI_POLISH.maxJobDescriptionChars)
            : undefined,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        suggestion?: string;
        error?: string;
      } | null;

      if (!response.ok || !body?.suggestion) {
        setError(body?.error ?? 'AI এটি নতুন করে লিখতে পারেনি।');

        return;
      }

      setOffer({ suggestion: body.suggestion, basedOn: text });
    } catch {
      setError('AI সার্ভিসে পৌঁছানো যায়নি।');
    } finally {
      setPending(false);
    }
  };

  if (offer) {
    const stale = offer.basedOn !== text;

    return (
      <div className="border-primary/25 bg-primary-soft/40 rounded-control mt-1.5 flex flex-col gap-2 border p-2.5">
        <p className="text-primary text-ui-2xs flex items-center gap-1 font-bold">
          <Sparkles size={12} aria-hidden="true" /> AI-র পরামর্শ
        </p>
        <p className="text-fg text-ui-md leading-relaxed">{offer.suggestion}</p>
        <p className="text-fg-subtle text-ui-2xs leading-snug">
          আসল তথ্যের সঙ্গে মিলিয়ে পড়ুন। AI-কে নতুন কোনো তথ্য বা সংখ্যা যোগ করতে মানা করা হয়েছিল, তবে কোনটা সত্যি তা আপনিই জানেন।
          {stale ? ' এটি তৈরির পর লেখাটি বদলে গেছে।' : ''}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="primary"
            disabled={stale}
            leading={<Check size={14} />}
            onClick={() => {
              onApply(offer.suggestion);
              setOffer(null);
            }}
          >
            এটি ব্যবহার করুন
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leading={<RotateCcw size={14} />}
            disabled={pending}
            onClick={() => void run()}
          >
            {pending ? 'আবার লেখা হচ্ছে…' : 'আবার চেষ্টা করুন'}
          </Button>
          <Button size="sm" variant="ghost" leading={<X size={14} />} onClick={() => setOffer(null)}>
            বাদ দিন
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending || tooShort}
        title={tooShort ? 'আগে একটু লিখুন, তারপর AI দিয়ে গুছিয়ে নিন।' : 'AI দিয়ে এটি নতুন করে লিখুন'}
        leading={
          pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />
        }
        onClick={() => void run()}
      >
        {pending ? 'গুছিয়ে লেখা হচ্ছে…' : 'AI দিয়ে গুছিয়ে লিখুন'}
      </Button>
      {error ? <span className="text-danger text-ui-xs">{error}</span> : null}
    </div>
  );
};
