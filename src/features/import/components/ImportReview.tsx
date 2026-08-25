'use client';

import { AlertTriangle, Check } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, SectionLabel, Switch, Tabs } from '@/components/ui';
import type { Resume } from '@/features/resume';
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
  { value: 'replace', label: 'Replace' },
  { value: 'append', label: 'Add to existing' },
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
        <p className="text-fg text-[13.5px]">
          Nothing recognisable was found in that file.
        </p>
        <p className="text-fg-subtle text-[12.5px]">
          A heavily designed CV often extracts as jumbled text. A DOCX version, or Smart import with
          a model, will usually do better.
        </p>
        <Button variant="outline" className="self-start" onClick={onCancel}>
          Back
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
            className="border-warning text-warning mb-3 flex gap-2 rounded-lg border px-3 py-2 text-[12.5px]"
          >
            <AlertTriangle size={15} className="mt-0.5 flex-none" />
            <span>{warning}</span>
          </p>
        ))}

        <p className="text-fg-subtle mb-3 text-[12.5px]">
          Nothing is written until you apply. Turn off anything that came out wrong — what you leave
          off keeps whatever is in your CV now.
        </p>

        <div className="mb-3">
          <SectionLabel>Lists already in this CV</SectionLabel>
          <Tabs
            items={STRATEGY_TABS}
            value={strategy}
            onChange={(value: ListStrategy) => setStrategy(value)}
            ariaLabel="How to merge lists"
            className="mt-1.5 self-start"
          />
          <p className="text-fg-subtle mt-1.5 text-[11.5px]">
            {strategy === 'replace'
              ? 'Imported roles, education and skills replace what is there now.'
              : 'Imported entries are added after the ones already in the CV.'}
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
                  description={`${groupSize(result.parsed, group)} found`}
                />

                <ul className="text-fg-subtle mt-1.5 flex flex-col gap-0.5 pl-12 text-[12px]">
                  {lines.slice(0, 4).map((line, index) => (
                    <li key={index} className="truncate">
                      {line}
                    </li>
                  ))}
                  {lines.length > 4 ? <li>+{lines.length - 4} more</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="border-border-base flex flex-none items-center justify-end gap-2 border-t px-4 py-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={accepted.size === 0}
          leading={<Check size={14} />}
          onClick={() => onApply(applyImport(resume, result.parsed, { accepted, strategy }))}
        >
          Apply {accepted.size} of {groups.length}
        </Button>
      </footer>
    </div>
  );
};
