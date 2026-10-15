'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { MAX_DOCUMENTS } from '@/constants';
import { useAiStatus } from '@/features/ai';
import { useActiveDocument, useLibraryActions, useLibraryStore } from '@/features/library';
import { useResume, useResumeActions, type Resume } from '@/features/resume';
import { AI_POLISH } from '@/lib/aiPolish';
import { bn } from '@/lib/bn';
import { stripEmphasis } from '@/lib/text';

import {
  DEFAULT_TAILOR_OPTIONS,
  analyzeTailor,
  applyTailor,
  spellingIn,
  suggestJobName,
  type TailorOptions,
} from '../engine';

/**
 * What making the result does to the library.
 *
 * `update` changes this CV in place and can be undone; it adds no file, which is
 * what most readers want — a posting a week is a posting a week of copies
 * otherwise. `copy` keeps this CV as it is and adds a new one.
 */
export type TailorMode = 'update' | 'copy';

/** How many of the most relevant bullets the AI pass rewrites. The quota is shared. */
const AI_BULLETS = 6;

/** A term that looks like a technology or a product rather than an ordinary word. */
const looksTechnical = (spelling: string): boolean =>
  /[A-Z].*[A-Z]|[0-9.+#]|^[A-Z]/.test(spelling) && spelling.length > 1;

/**
 * The state behind the "Tailor to this job" dialog: the options, the preview
 * they produce, and making the copy.
 *
 * The copy is a *new* document. The CV the reader is looking at is never
 * touched, so a tailoring they dislike costs them nothing but a delete.
 */
export const useTailor = (onDone: () => void) => {
  const resume = useResume();
  const resumeActions = useResumeActions();
  const libraryActions = useLibraryActions();
  const documentCount = useLibraryStore((state) => state.documents.length);
  // The stored array itself: a selector that builds a new one would re-render forever.
  const documents = useLibraryStore((state) => state.documents);
  const documentNames = useMemo(() => documents.map((entry) => entry.name), [documents]);
  const activeDocument = useActiveDocument();
  const aiAvailable = useAiStatus();

  const jobDescription = resume.meta.targetJobDescription;
  const [options, setOptions] = useState<TailorOptions>(DEFAULT_TAILOR_OPTIONS);
  const [polishWithAi, setPolishWithAi] = useState(false);
  const [mode, setMode] = useState<TailorMode>('update');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState('');

  const analysis = useMemo(() => analyzeTailor(resume, jobDescription), [resume, jobDescription]);

  const preview = useMemo(
    () => applyTailor(resume, jobDescription, options),
    [resume, jobDescription, options],
  );

  // Terms the posting uses that the CV lacks: product-looking ones first.
  const missingSuggestions = useMemo(() => {
    const spelled = analysis.missing.map((keyword) => ({
      keyword,
      label: spellingIn(jobDescription, keyword),
    }));

    return [
      ...spelled.filter((entry) => looksTechnical(entry.label)),
      ...spelled.filter((entry) => !looksTechnical(entry.label)),
    ].slice(0, 24);
  }, [analysis.missing, jobDescription]);

  const baseName =
    activeDocument?.name || activeDocument?.personName || resume.basics.fullName || 'CV';
  // A second tailoring for the same posting must not be indistinguishable from the first.
  const defaultName = useMemo(() => {
    const stem = `${baseName} — ${suggestJobName(jobDescription) || 'tailored'}`.slice(0, 112);
    const taken = new Set(documentNames.map((entry) => entry.toLowerCase()));

    if (!taken.has(stem.toLowerCase())) return stem;

    for (let n = 2; n < 100; n += 1) {
      const candidate = `${stem} (${n})`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }

    return stem;
  }, [baseName, jobDescription, documentNames]);

  const patch = useCallback(
    (next: Partial<TailorOptions>) => setOptions((current) => ({ ...current, ...next })),
    [],
  );

  const toggleSkill = useCallback((keyword: string) => {
    setOptions((current) => ({
      ...current,
      addSkills: current.addSkills.includes(keyword)
        ? current.addSkills.filter((entry) => entry !== keyword)
        : [...current.addSkills, keyword],
    }));
  }, []);

  /** Rewrites the most relevant bullets of the copy; whatever fails is simply left as it was. */
  const polishBullets = async (draft: Resume): Promise<number> => {
    const keywordSet = new Set(analysis.keywords);
    const candidates = draft.experience
      .flatMap((entry) =>
        entry.bullets.map((text, index) => ({
          entry,
          index,
          text,
          score: [...stripEmphasis(text).toLowerCase().split(/\W+/)].filter((word) =>
            keywordSet.has(word),
          ).length,
        })),
      )
      .filter((candidate) => candidate.score > 0 && candidate.text.length >= 12)
      .sort((a, b) => b.score - a.score)
      .slice(0, AI_BULLETS);

    let done = 0;

    for (const [position, candidate] of candidates.entries()) {
      setBusy(`বুলেট গুছিয়ে লেখা হচ্ছে: ${bn(position + 1)} / ${bn(candidates.length)}…`);

      try {
        const response = await fetch('/api/ai/polish', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            kind: 'bullet',
            text: candidate.text.slice(0, AI_POLISH.maxTextChars),
            context: [candidate.entry.role, candidate.entry.company]
              .filter(Boolean)
              .join(' at ')
              .slice(0, AI_POLISH.maxContextChars),
            jobDescription: jobDescription.slice(0, AI_POLISH.maxJobDescriptionChars),
          }),
        });

        // Out of quota or not allowed: nothing later will fare better.
        if (response.status === 429 || response.status === 403) break;
        if (!response.ok) continue;

        const body = (await response.json()) as { suggestion?: string };

        if (body.suggestion) {
          candidate.entry.bullets[candidate.index] = body.suggestion;
          done += 1;
        }
      } catch {
        // A bullet that could not be polished stays as written.
      }
    }

    return done;
  };

  const create = async () => {
    if (mode === 'copy' && documentCount >= MAX_DOCUMENTS) {
      toast.error(`আপনি সর্বোচ্চ ${bn(MAX_DOCUMENTS)}টি CV রাখতে পারেন। জায়গা করতে একটি মুছে ফেলুন।`);

      return;
    }

    setBusy(mode === 'copy' ? 'আপনার কপি তৈরি হচ্ছে…' : 'আপনার CV আপডেট হচ্ছে…');

    try {
      const { resume: tailored, stats } = applyTailor(resume, jobDescription, options);
      let polished = 0;

      if (polishWithAi && aiAvailable) polished = await polishBullets(tailored);

      setBusy('সেভ হচ্ছে…');

      if (mode === 'copy') {
        await libraryActions.createNew((name.trim() || defaultName).slice(0, 120));
        resumeActions.replaceResume(tailored, { resetHistory: true });
      } else {
        // In place, and into the undo history: one Ctrl+Z puts it all back.
        resumeActions.replaceResume(tailored);
      }

      const parts = [
        stats.bulletsMoved > 0 ? `${bn(stats.bulletsMoved)}টি বুলেট সাজানো হয়েছে` : '',
        stats.keywordsBolded > 0 ? `${bn(stats.keywordsBolded)}টি শব্দ বোল্ড হয়েছে` : '',
        stats.skillsAdded > 0 ? `${bn(stats.skillsAdded)}টি দক্ষতা যোগ হয়েছে` : '',
        polished > 0 ? `${bn(polished)}টি বুলেট AI দিয়ে গুছিয়ে লেখা হয়েছে` : '',
      ].filter(Boolean);

      toast.success(mode === 'copy' ? 'সাজানো কপি তৈরি হয়েছে' : 'এই চাকরির জন্য CV সাজানো হয়েছে', {
        description:
          mode === 'copy'
            ? `${parts.join(' · ') || 'কিছু বদলানোর দরকার হয়নি'}। আপনার মূল CV আগের মতোই আছে।`
            : parts.join(' · ') || 'কিছু বদলানোর দরকার হয়নি।',
        action:
          mode === 'update' ? { label: 'ফিরিয়ে নিন', onClick: () => resumeActions.undo() } : undefined,
      });
      onDone();
    } finally {
      setBusy('');
    }
  };

  return {
    resume,
    jobDescription,
    analysis,
    stats: preview.stats,
    options,
    patch,
    toggleSkill,
    missingSuggestions,
    aiAvailable,
    polishWithAi,
    setPolishWithAi,
    name,
    setName,
    defaultName,
    mode,
    setMode,
    busy,
    create,
  };
};
