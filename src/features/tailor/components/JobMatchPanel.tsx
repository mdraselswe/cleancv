'use client';

import { Target, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, Textarea } from '@/components/ui';
import { useResume, useResumeActions } from '@/features/resume';
import { bn, bnPercent } from '@/lib/bn';

import { analyzeTailor } from '../engine';
import { TailorDialog } from './TailorDialog';

/**
 * The "Job match" panel: where a job posting goes in and a tailored CV comes
 * out.
 *
 * This used to live only inside the score drawer, three clicks from anywhere,
 * and nobody found it. It is a panel of the editor now, beside Design and
 * Sections, because "make my CV fit this job" is a task and not a score.
 */
export const JobMatchPanel = () => {
  const resume = useResume();
  const actions = useResumeActions();
  const [dialogOpen, setDialogOpen] = useState(false);

  const jobDescription = resume.meta.targetJobDescription;
  const analysis = useMemo(() => analyzeTailor(resume, jobDescription), [resume, jobDescription]);
  const hasPosting = analysis.keywords.length > 0;
  const percent = hasPosting ? Math.round((analysis.matched.length / analysis.keywords.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-ui text-fg-muted font-medium">চাকরির বিজ্ঞপ্তি</span>
        <Textarea
          rows={10}
          value={jobDescription}
          placeholder="পুরো বিজ্ঞপ্তিটি এখানে পেস্ট করুন — পদের নাম, দায়িত্ব, যোগ্যতা সব। এটি শুধু এই ডিভাইসে মেলানোর কাজে ব্যবহৃত হয়, আপনার CV-তে কখনো ছাপা হয় না।"
          onChange={(event) => actions.setJobDescription(event.target.value)}
        />
      </label>

      {hasPosting ? (
        <section
          aria-label="মিল"
          className="border-border-base bg-surface/70 rounded-card flex flex-col gap-2.5 border p-3.5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-fg text-ui-md font-bold">
              {bn(analysis.keywords.length)}টি মূল শব্দের মধ্যে {bn(analysis.matched.length)}টি আপনার CV-তে আছে
            </p>
            <span className="text-fg-subtle text-ui-xs tabular-nums">{bnPercent(percent)}</span>
          </div>

          <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
            <div
              className="app-gradient-bg h-full rounded-full transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          {analysis.missing.length > 0 ? (
            <div>
              <p className="text-fg-muted text-ui-xs mb-1.5 font-semibold">আপনার CV-তে এখনো নেই</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missing.slice(0, 20).map((keyword) => (
                  <span
                    key={keyword}
                    className="bg-warning/12 text-warning text-ui-2xs rounded-full px-2 py-0.5 font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="text-fg-subtle text-ui-2xs mt-2 leading-snug">
                শুধু যা সত্যিই আপনার সম্পর্কে সত্যি, তা-ই যোগ করুন। পরের ধাপে যেগুলো সত্যি সেগুলোতে
                টিক দিতে পারবেন।
              </p>
            </div>
          ) : (
            <p className="text-success text-ui-xs font-medium">সব মূল শব্দ আগে থেকেই আছে।</p>
          )}
        </section>
      ) : (
        <p className="text-fg-subtle text-ui-xs leading-snug">
          ওপরে একটি বিজ্ঞপ্তি পেস্ট করুন, এই প্যানেল দেখাবে আপনার CV কতটা মেলে।
        </p>
      )}

      <div className="border-primary/20 bg-primary-soft/40 rounded-card flex flex-col gap-2.5 border p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="bg-primary text-primary-fg mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg">
            <Target size={16} aria-hidden="true" />
          </span>
          <div>
            <p className="text-fg text-ui-md font-bold">চাকরির জন্য এই CV সাজান</p>
            <p className="text-fg-muted text-ui-xs mt-0.5 leading-snug">
              মিলে যাওয়া দক্ষতা ও বুলেট আগে বসায়, আর বিজ্ঞপ্তির নিজস্ব শব্দগুলো বোল্ড করে। আপনি টিক
              না দিলে কিছুই যোগ হয় না, আর একবার “ফিরিয়ে নিন” চাপলে সব ফেরত আসে। এই CV যেমন আছে
              তেমন রাখতে চান? “নতুন কপি হিসেবে রাখুন” বেছে নিন।
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          className="self-start"
          disabled={!hasPosting}
          leading={<Wand2 size={15} />}
          onClick={() => setDialogOpen(true)}
        >
          এই CV সাজান
        </Button>
      </div>

      <TailorDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
};
