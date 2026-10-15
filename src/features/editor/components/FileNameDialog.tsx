'use client';

import { FileText } from 'lucide-react';

import { Button, Field, Input, Modal, ModalHeader } from '@/components/ui';
import { useResume, useResumeActions } from '@/features/resume';
import { useLang } from '@/i18n';
import { toFileStem } from '@/lib/text';

/**
 * The name the PDF is saved under.
 *
 * It is the document's own name (`meta.documentName`), so what is typed here is
 * kept with the CV and used by every later download - and by the JSON backup.
 * Left empty, it falls back to the person's name, which is what a recruiter
 * wants to see in a downloads folder anyway.
 */
export interface FileNameDialogProps {
  onClose: () => void;
}

const COPY = {
  bn: {
    title: 'ফাইলের নাম',
    subtitle: 'ডাউনলোড করা PDF এই নামে সেভ হবে। রিক্রুটার CV খোলার আগেই এই নামটি দেখেন।',
    label: 'ফাইলের নাম',
    hint: 'বাংলা বা ইংরেজি, যা খুশি। স্পেস হাইফেন হয়ে যাবে, আর বিশেষ চিহ্ন বাদ যাবে।',
    designed: 'ডিজাইন করা PDF',
    ats: 'ATS-সেফ PDF',
    done: 'ঠিক আছে',
    clear: 'নাম থেকে নিন',
  },
  en: {
    title: 'File name',
    subtitle: 'The downloaded PDF is saved under this name. Recruiters see it before they open the CV.',
    label: 'File name',
    hint: 'Spaces become hyphens and special characters are dropped.',
    designed: 'Designed PDF',
    ats: 'ATS-safe PDF',
    done: 'Done',
    clear: 'Use my name',
  },
} as const;

export const FileNameDialog = ({ onClose }: FileNameDialogProps) => {
  const resume = useResume();
  const actions = useResumeActions();
  const copy = COPY[useLang()];

  const stem = toFileStem(resume.meta.documentName || resume.basics.fullName || 'resume');

  return (
    <Modal label={copy.title} onClose={onClose} className="max-w-[460px]">
      <ModalHeader title={copy.title} subtitle={copy.subtitle} onClose={onClose} />

      <div className="flex flex-col gap-4 p-4">
        <Field label={copy.label} hint={copy.hint}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              autoFocus
              value={resume.meta.documentName}
              maxLength={80}
              placeholder={resume.basics.fullName || 'Your Name'}
              onChange={(event) =>
                actions.edit((draft) => {
                  draft.meta.documentName = event.target.value;
                }, 'documentName')
              }
            />
          )}
        </Field>

        <ul className="bg-surface-2/60 rounded-control flex flex-col gap-2 p-3">
          {[
            { label: copy.designed, name: `${stem}.pdf` },
            { label: copy.ats, name: `${stem}-ATS.pdf` },
          ].map((row) => (
            <li key={row.name} className="flex items-center gap-2.5">
              <FileText size={16} className="text-fg-subtle flex-none" aria-hidden="true" />
              <span className="min-w-0">
                <span className="text-fg-subtle text-ui-2xs block">{row.label}</span>
                <span className="text-fg text-ui-md block truncate font-medium">{row.name}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!resume.meta.documentName}
            onClick={() =>
              actions.edit((draft) => {
                draft.meta.documentName = '';
              }, 'documentName')
            }
          >
            {copy.clear}
          </Button>
          <Button variant="primary" onClick={onClose}>
            {copy.done}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
