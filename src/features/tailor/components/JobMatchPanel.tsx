'use client';

import { Target, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, Textarea } from '@/components/ui';
import { useResume, useResumeActions } from '@/features/resume';

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
        <span className="text-ui text-fg-muted font-medium">Job posting</span>
        <Textarea
          rows={10}
          value={jobDescription}
          placeholder="Paste the whole job posting here — the title, the responsibilities, the requirements. It is used only on this device for matching and is never printed on your CV."
          onChange={(event) => actions.setJobDescription(event.target.value)}
        />
      </label>

      {hasPosting ? (
        <section
          aria-label="Match"
          className="border-border-base bg-surface/70 rounded-card flex flex-col gap-2.5 border p-3.5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-fg text-ui-md font-bold">
              {analysis.matched.length} of {analysis.keywords.length} key terms are on your CV
            </p>
            <span className="text-fg-subtle text-ui-xs tabular-nums">{percent}%</span>
          </div>

          <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
            <div
              className="app-gradient-bg h-full rounded-full transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          {analysis.missing.length > 0 ? (
            <div>
              <p className="text-fg-muted text-ui-xs mb-1.5 font-semibold">Not on your CV yet</p>
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
                Add only what is honestly true of you. The next step lets you tick the ones that
                are.
              </p>
            </div>
          ) : (
            <p className="text-success text-ui-xs font-medium">Every key term is already there.</p>
          )}
        </section>
      ) : (
        <p className="text-fg-subtle text-ui-xs leading-snug">
          Paste a posting above and this panel shows how well your CV matches it.
        </p>
      )}

      <div className="border-primary/20 bg-primary-soft/40 rounded-card flex flex-col gap-2.5 border p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="bg-primary text-primary-fg mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg">
            <Target size={16} aria-hidden="true" />
          </span>
          <div>
            <p className="text-fg text-ui-md font-bold">Tailor this CV to the job</p>
            <p className="text-fg-muted text-ui-xs mt-0.5 leading-snug">
              Puts the matching skills and bullets first and the posting&apos;s own words in bold.
              Nothing is added that you do not tick, and one undo reverts it. Prefer to keep this
              CV as it is? Choose &quot;Save as a new copy&quot;.
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
          Tailor this CV
        </Button>
      </div>

      <TailorDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
};
