'use client';

import { AlertTriangle, Check } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, SectionLabel, Switch, Tabs } from '@/components/ui';
import type { Resume } from '@/features/resume';
import { bn } from '@/lib/bn';
import { Lang } from '@/i18n';
import { cn } from '@/lib/cn';

import {
  MERGE_GROUP_LABEL,
  applyImport,
  foundGroups,
  groupSize,
  type ListStrategy,
  type MergeGroup,
} from '../merge';
import type { ImportResult } from '../types';

/**
 * What was found, before any of it is written.
 *
 * The whole point of this screen is that an import is a proposal. A parser
 * reading a designed PDF will get some of it wrong, and a wrong value that
 * looks plausible is worse than a missing one — so nothing lands until someone
 * has seen it next to what it replaces.
 */

const STRATEGY_TABS: Array<{ value: ListStrategy; label: string }> = [
  { value: 'replace', label: 'বদলে দিন' },
  { value: 'append', label: 'আগেরগুলোর সঙ্গে যোগ করুন' },
];

export interface ImportReviewProps {
  result: ImportResult;
  resume: Resume;
  onApply: (next: Resume) => void;
  onCancel: () => void;
}

/** A short, readable rendering of what a group holds. */
const preview = (result: ImportResult, group: MergeGroup): string[] => {
  const { parsed } = result;

  switch (group) {
    case 'basics':
      return [parsed.basics?.fullName, parsed.basics?.headline].filter(Boolean) as string[];
    case 'contact':
      return Object.values(parsed.contact ?? {}).filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      );
    case 'summary':
      return [parsed.summary?.text ?? ''];
    case 'experience':
      return (parsed.experience ?? []).map((entry) =>
        [entry.role, entry.company].filter(Boolean).join(' — '),
      );
    case 'education':
      return (parsed.education ?? []).map((entry) =>
        [entry.degree, entry.institute].filter(Boolean).join(' — '),
      );
    case 'skills':
      return (parsed.skills ?? []).map((group_) =>
        [group_.category, group_.items.join(', ')].filter(Boolean).join(': '),
      );
    case 'projects':
      return (parsed.projects ?? []).map((entry) => entry.name);
    case 'certifications':
      return (parsed.certifications ?? []).map((entry) =>
        [entry.name, entry.issuer].filter(Boolean).join(' — '),
      );
    case 'languages':
      return (parsed.languages ?? []).map((entry) =>
        [entry.name, entry.level].filter(Boolean).join(' — '),
      );
    default:
      return [];
  }
};

export const ImportReview = ({ result, resume, onApply, onCancel }: ImportReviewProps) => {
  const groups = useMemo(() => foundGroups(result.parsed), [result]);
  const [accepted, setAccepted] = useState<Set<MergeGroup>>(() => new Set(groups));
  const [strategy, setStrategy] = useState<ListStrategy>('replace');

  const toggle = (group: MergeGroup, on: boolean) =>
    setAccepted((current) => {
      const next = new Set(current);
      if (on) next.add(group);
      else next.delete(group);

      return next;
    });

  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-fg text-ui-md">
          ফাইলে চেনার মতো কিছু পাওয়া যায়নি।
        </p>
        <p className="text-fg-subtle text-ui-xs">
          অনেক ডিজাইনওয়ালা CV থেকে প্রায়ই এলোমেলো লেখা বের হয়। DOCX ফাইল, অথবা মডেলসহ স্মার্ট ইমপোর্ট সাধারণত ভালো কাজ করে।
        </p>
        <Button variant="outline" className="self-start" onClick={onCancel}>
          পেছনে যান
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {result.warnings.map((warning) => (
          <p
            key={warning}
            className="border-warning text-warning text-ui-xs mb-3 flex gap-2 rounded-lg border px-3 py-2"
          >
            <AlertTriangle size={15} className="mt-0.5 flex-none" />
            <span>{warning}</span>
          </p>
        ))}

        <p className="text-fg-subtle text-ui-xs mb-3">
          আপনি নিশ্চিত না করা পর্যন্ত কিছুই বদলায় না। যেটি ভুল এসেছে সেটি বন্ধ করে দিন — যেটি বন্ধ রাখবেন, সেখানে আপনার CV-তে এখন যা আছে তা-ই থাকবে।
        </p>

        <div className="mb-3">
          <SectionLabel>এই CV-তে আগে থেকে থাকা তালিকা</SectionLabel>
          <Tabs
            items={STRATEGY_TABS}
            value={strategy}
            onChange={(value: ListStrategy) => setStrategy(value)}
            ariaLabel="তালিকা কীভাবে মেশাবেন"
            className="mt-1.5 self-start"
          />
          <p className="text-fg-subtle text-ui-2xs mt-1.5">
            {strategy === 'replace'
              ? 'ইমপোর্ট করা পদ, শিক্ষা ও দক্ষতা এখন যা আছে তা বদলে দেবে।'
              : 'ইমপোর্ট করা এন্ট্রিগুলো CV-তে আগে থাকা এন্ট্রির পরে যোগ হবে।'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {groups.map((group) => {
            const lines = preview(result, group).filter(Boolean);
            const on = accepted.has(group);

            return (
              <div
                key={group}
                className={cn(
                  'rounded-xl border px-3 py-2.5 transition',
                  on ? 'border-border-base' : 'border-border-base opacity-55',
                )}
              >
                <Switch
                  checked={on}
                  onChange={(value) => toggle(group, value)}
                  label={MERGE_GROUP_LABEL[group]}
                  description={`${bn(groupSize(result.parsed, group))}টি পাওয়া গেছে`}
                />

                <ul className="text-fg-subtle text-ui-xs mt-1.5 flex flex-col gap-0.5 pl-12">
                  {lines.slice(0, 4).map((line, index) => (
                    <li key={index} className="truncate">
                      {line}
                    </li>
                  ))}
                  {lines.length > 4 ? <li>আরও {bn(lines.length - 4)}টি</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="border-border-base flex flex-none items-center justify-end gap-2 border-t px-4 py-3">
        <Button variant="ghost" onClick={onCancel}>
          বাতিল
        </Button>
        <Button
          variant="primary"
          disabled={accepted.size === 0}
          leading={<Check size={14} />}
          onClick={() => onApply(applyImport(resume, result.parsed, { accepted, strategy }))}
        >
          <Lang
            bn={`${bn(groups.length)}টির মধ্যে ${bn(accepted.size)}টি যোগ করুন`}
            en={`Apply ${accepted.size} of ${groups.length}`}
          />
        </Button>
      </footer>
    </div>
  );
};
