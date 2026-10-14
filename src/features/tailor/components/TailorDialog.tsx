'use client';

import { Check, Loader2, Sparkles, Wand2 } from 'lucide-react';

import { Button, Input, Modal, ModalHeader, Select, Switch, Tabs } from '@/components/ui';
import { bn } from '@/lib/bn';
import { Lang } from '@/i18n';
import { cn } from '@/lib/cn';

import { useTailor, type TailorMode } from '../hooks/useTailor';

const MODE_TABS = [
  { value: 'update' as const, label: 'এই CV হালনাগাদ করুন' },
  { value: 'copy' as const, label: 'নতুন কপি হিসেবে রাখুন' },
];

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
    label: group.category || 'দক্ষতা',
  }));

  return (
    <Modal label="এই চাকরির জন্য সাজান" onClose={busy ? () => undefined : onClose} className="max-w-[620px]">
      <ModalHeader
        title="এই চাকরির জন্য সাজান"
        subtitle={
          tailor.mode === 'update'
            ? 'এই CV-টিই বদলাবে। একবার “ফিরিয়ে নিন” চাপলেই সব আগের মতো হবে।'
            : 'এই CV যেমন আছে তেমনই থাকবে। একটি নতুন CV যোগ হবে।'
        }
        onClose={busy ? () => undefined : onClose}
      />

      <div className="scroll-slim flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        {empty ? (
          <p className="text-fg-muted text-ui-md rounded-control bg-surface-2 p-3 leading-relaxed">
            আগে <strong>লক্ষ্য চাকরি</strong> ট্যাবে চাকরির বিবরণ পেস্ট করুন। সেটি ছাড়া সাজানোর
            মতো কিছু নেই।
          </p>
        ) : (
          <>
            <Tabs
              items={MODE_TABS}
              value={tailor.mode}
              onChange={(mode: TailorMode) => tailor.setMode(mode)}
              ariaLabel="ফলাফল কোথায় রাখবেন"
              className="self-start"
            />

            <section aria-label="কতটা মিলেছে">
              <p className="text-fg text-ui-md font-semibold">
                <Lang
                  bn={`এই বিজ্ঞপ্তির ${bn(analysis.keywords.length)}টি মূল শব্দের মধ্যে আপনার CV-তে আগে থেকেই ${bn(analysis.matched.length)}টি আছে।`}
                  en={`Your CV already covers ${analysis.matched.length} of ${analysis.keywords.length} key terms in this posting.`}
                />
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

            <section className="flex flex-col gap-3.5" aria-label="কী বদলাবে">
              <Switch
                checked={options.reorderSkills}
                onChange={(reorderSkills) => tailor.patch({ reorderSkills })}
                label="এই চাকরি যে দক্ষতা চায়, সেগুলো আগে রাখুন"
                description={
                  stats.skillsMoved > 0
                    ? `${bn(stats.skillsMoved)}টি দক্ষতা বা গ্রুপ ওপরে উঠবে।`
                    : 'আগে থেকেই ভালো ক্রমে আছে।'
                }
              />
              <Switch
                checked={options.reorderBullets}
                onChange={(reorderBullets) => tailor.patch({ reorderBullets })}
                label="প্রতিটি পদে সবচেয়ে প্রাসঙ্গিক বুলেট আগে রাখুন"
                description={
                  stats.bulletsMoved > 0
                    ? `${bn(stats.bulletsMoved)}টি বুলেট ওপরে উঠবে। পদগুলো তারিখের ক্রমেই থাকবে।`
                    : 'আগে থেকেই ভালো ক্রমে আছে। পদগুলো তারিখের ক্রমেই থাকবে।'
                }
              />
              <Switch
                checked={options.boldKeywords}
                onChange={(boldKeywords) => tailor.patch({ boldKeywords })}
                label="বুলেটে বিজ্ঞপ্তির নিজস্ব শব্দগুলো বোল্ড করুন"
                description={
                  stats.keywordsBolded > 0
                    ? `${bn(stats.keywordsBolded)}টি শব্দ জোর পাবে, প্রতি বুলেটে সর্বোচ্চ দুটি।`
                    : 'জোর দেওয়ার মতো মিলে যাওয়া শব্দ নেই।'
                }
              />
              <Switch
                checked={options.addSummaryLine}
                onChange={(addSummaryLine) => tailor.patch({ addSummaryLine })}
                label="সারসংক্ষেপের শেষে একটি লাইন যোগ করুন"
                description={
                  analysis.matchedSkills.length >= 2
                    ? `“Strong in ${analysis.matchedSkills.slice(0, 3).join(', ')}.” — শুধু আপনার তালিকায় আগে থেকে থাকা দক্ষতা।`
                    : 'বিজ্ঞপ্তির সঙ্গে মেলে এমন দুটি বা বেশি দক্ষতা আপনার তালিকায় থাকতে হবে।'
                }
              />
            </section>

            <section aria-label="আপনার আছে কিন্তু CV-তে নেই এমন দক্ষতা">
              <p className="text-fg text-ui-md font-semibold">যে দক্ষতা সত্যিই আপনার আছে, তা যোগ করুন</p>
              <p className="text-fg-subtle text-ui-xs mt-0.5 leading-snug">
                বিজ্ঞপ্তিতে এগুলো আছে, আপনার CV-তে নেই। শুধু যেগুলো সত্যিই আপনার সম্পর্কে সত্যি, সেগুলোতে
                টিক দিন — টিক না দিলে কিছুই যোগ হয় না।
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tailor.missingSuggestions.length === 0 ? (
                  <span className="text-fg-subtle text-ui-xs">কিছুই বাদ পড়েনি।</span>
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
                  <span className="text-ui text-fg-muted font-medium">কোথায় যোগ করবেন</span>
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
                  label="সবচেয়ে প্রাসঙ্গিক ৬টি বুলেটও AI দিয়ে পরিমার্জন করুন"
                  description="আপনার AI কোটা খরচ হয়। এটি শুধু শব্দ বদলায়, সংখ্যা যোগ করতে পারে না। “ফিরিয়ে নিন” বাকিগুলোর সঙ্গে এটিও ফেরত দেয়।"
                />
              </section>
            ) : null}

            {tailor.mode === 'copy' ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-ui text-fg-muted font-medium">নতুন CV-র নাম</span>
                <Input
                  value={tailor.name}
                  placeholder={tailor.defaultName}
                  maxLength={120}
                  onChange={(event) => tailor.setName(event.target.value)}
                />
              </label>
            ) : null}
          </>
        )}
      </div>

      <div className="border-border-base flex flex-none items-center justify-between gap-3 border-t px-4 py-3">
        <span className="text-fg-subtle text-ui-xs min-w-0 truncate" aria-live="polite">
          {busy}
        </span>
        <div className="flex flex-none gap-2">
          <Button variant="ghost" onClick={onClose} disabled={Boolean(busy)}>
            বাতিল
          </Button>
          <Button
            variant="primary"
            disabled={empty || Boolean(busy)}
            leading={
              busy ? <Loader2 size={15} className="animate-spin" /> : tailor.polishWithAi ? <Sparkles size={15} /> : <Wand2 size={15} />
            }
            onClick={() => void tailor.create()}
          >
            {tailor.mode === 'copy' ? 'সাজানো কপি তৈরি করুন' : 'এই CV সাজান'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
