'use client';

import { Check, Loader2, Sparkles, Wand2 } from 'lucide-react';

import { Button, Input, Modal, ModalHeader, Select, Switch } from '@/components/ui';
import { cn } from '@/lib/cn';

import { useTailor } from '../hooks/useTailor';

export interface TailorDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Tailor a copy of this CV to the pasted job description.
 *
 * Every switch says what it will do and how much, from the same function that
 * will do it, so the counts are the result and not a promise. Nothing here
 * writes new sentences or claims; the only additions are skills the reader
 * ticked as really theirs.
 */
export const TailorDialog = ({ open, onClose }: TailorDialogProps) => {
  if (!open) return null;

  return <TailorBody onClose={onClose} />;
};

const TailorBody = ({ onClose }: { onClose: () => void }) => {
  const tailor = useTailor(onClose);
  const { analysis, stats, options, busy } = tailor;
  const empty = analysis.keywords.length === 0;
  const groups = tailor.resume.skills.map((group) => ({
    value: group.id,
    label: group.category || 'Skills',
  }));

  return (
    <Modal label="Tailor to this job" onClose={busy ? () => undefined : onClose} className="max-w-[620px]">
      <ModalHeader
        title="Tailor a copy to this job"
        subtitle="Your original is never changed. This makes a new CV."
        onClose={busy ? () => undefined : onClose}
      />

      <div className="scroll-slim flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        {empty ? (
          <p className="text-fg-muted text-ui-md rounded-control bg-surface-2 p-3 leading-relaxed">
            Paste the job description in the <strong>Target job</strong> tab first. Without it
            there is nothing to tailor to.
          </p>
        ) : (
          <>
            <section aria-label="How well it matches">
              <p className="text-fg text-ui-md font-semibold">
                Your CV already covers {analysis.matched.length} of {analysis.keywords.length} key
                terms in this posting.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.matched.slice(0, 18).map((keyword) => (
                  <span
                    key={keyword}
                    className="bg-success/12 text-success text-ui-2xs rounded-full px-2 py-0.5 font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3.5" aria-label="What to change">
              <Switch
                checked={options.reorderSkills}
                onChange={(reorderSkills) => tailor.patch({ reorderSkills })}
                label="Put the skills this job asks for first"
                description={
                  stats.skillsMoved > 0
                    ? `${stats.skillsMoved} skills or groups move up.`
                    : 'Already in a good order.'
                }
              />
              <Switch
                checked={options.reorderBullets}
                onChange={(reorderBullets) => tailor.patch({ reorderBullets })}
                label="Put the most relevant bullets first in each role"
                description={
                  stats.bulletsMoved > 0
                    ? `${stats.bulletsMoved} bullets move up. Roles stay in date order.`
                    : 'Already in a good order. Roles stay in date order.'
                }
              />
              <Switch
                checked={options.boldKeywords}
                onChange={(boldKeywords) => tailor.patch({ boldKeywords })}
                label="Bold the job’s own words in your bullets"
                description={
                  stats.keywordsBolded > 0
                    ? `${stats.keywordsBolded} terms are emphasised, at most two per bullet.`
                    : 'No matching words to emphasise.'
                }
              />
              <Switch
                checked={options.addSummaryLine}
                onChange={(addSummaryLine) => tailor.patch({ addSummaryLine })}
                label="Add a closing line to the summary"
                description={
                  analysis.matchedSkills.length >= 2
                    ? `“Strong in ${analysis.matchedSkills.slice(0, 3).join(', ')}.” — only skills you already list.`
                    : 'Needs two or more of your listed skills to match the posting.'
                }
              />
            </section>

            <section aria-label="Skills you have that are missing">
              <p className="text-fg text-ui-md font-semibold">Add skills you really have</p>
              <p className="text-fg-subtle text-ui-xs mt-0.5 leading-snug">
                The posting uses these and your CV does not. Tick only what is honestly true of
                you — nothing is added unless you tick it.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tailor.missingSuggestions.length === 0 ? (
                  <span className="text-fg-subtle text-ui-xs">Nothing missing.</span>
                ) : (
                  tailor.missingSuggestions.map(({ keyword, label }) => {
                    const on = options.addSkills.includes(keyword);

                    return (
                      <button
                        key={keyword}
                        type="button"
                        aria-pressed={on}
                        onClick={() => tailor.toggleSkill(keyword)}
                        className={cn(
                          'tap-target text-ui-xs inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition',
                          on
                            ? 'border-primary bg-primary text-primary-fg'
                            : 'border-border-base bg-surface text-fg-muted hover:border-primary/40',
                        )}
                      >
                        {on ? <Check size={12} /> : null}
                        {label}
                      </button>
                    );
                  })
                )}
              </div>

              {options.addSkills.length > 0 && groups.length > 0 ? (
                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-ui text-fg-muted font-medium">Add them to</span>
                  <Select
                    options={groups}
                    value={options.addSkillsGroupId || groups[0].value}
                    onChange={(event) => tailor.patch({ addSkillsGroupId: event.target.value })}
                  />
                </label>
              ) : null}
            </section>

            {tailor.aiAvailable ? (
              <section className="border-primary/20 bg-primary-soft/40 rounded-control border p-3">
                <Switch
                  checked={tailor.polishWithAi}
                  onChange={tailor.setPolishWithAi}
                  label="Also polish the 6 most relevant bullets with AI"
                  description="Uses your AI quota. It rewrites wording only and cannot add numbers; the copy is separate, so you can discard it."
                />
              </section>
            ) : null}

            <label className="flex flex-col gap-1.5">
              <span className="text-ui text-fg-muted font-medium">Name of the new CV</span>
              <Input
                value={tailor.name}
                placeholder={tailor.defaultName}
                maxLength={120}
                onChange={(event) => tailor.setName(event.target.value)}
              />
            </label>
          </>
        )}
      </div>

      <div className="border-border-base flex flex-none items-center justify-between gap-3 border-t px-4 py-3">
        <span className="text-fg-subtle text-ui-xs min-w-0 truncate" aria-live="polite">
          {busy}
        </span>
        <div className="flex flex-none gap-2">
          <Button variant="ghost" onClick={onClose} disabled={Boolean(busy)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={empty || Boolean(busy)}
            leading={
              busy ? <Loader2 size={15} className="animate-spin" /> : tailor.polishWithAi ? <Sparkles size={15} /> : <Wand2 size={15} />
            }
            onClick={() => void tailor.create()}
          >
            Create tailored copy
          </Button>
        </div>
      </div>
    </Modal>
  );
};
