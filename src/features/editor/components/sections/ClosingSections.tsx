'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button, Field, ImageUpload, Input, Switch, TagInput, Tabs, Textarea } from '@/components/ui';
import {
  DEFAULT_DECLARATION_TEXT,
  LIMITS,
  ON_REQUEST_TEXT,
  REFERENCE_MODES,
  REFERENCE_MODE_LABEL,
  SIGNATURE_MODES,
} from '@/constants';
import type { ReferenceMode } from '@/constants';
import { createReferenceEntry, useResume, useResumeActions } from '@/features/resume';
import { formatToday } from '@/lib/date';

import { useResumeEdit } from '../../hooks/useResumeEdit';

/** The forms that close a document: interests, referees, declaration, signature. */

export const InterestsSection = () => {
  const { interests } = useResume();
  const { patch } = useResumeEdit();

  return (
    <Field
      label="Interests"
      hint="Be specific. 'Reading' says nothing; 'competitive bridge' starts a conversation."
    >
      {({ id, describedBy }) => (
        <TagInput
          id={id}
          describedBy={describedBy}
          value={interests.items}
          placeholder="Long-distance running"
          onChange={(items) => patch('interests', { items })}
        />
      )}
    </Field>
  );
};

const REFERENCE_TABS = REFERENCE_MODES.map((value) => ({
  value,
  label: REFERENCE_MODE_LABEL[value],
}));

export const ReferencesSection = () => {
  const { references } = useResume();
  const actions = useResumeActions();
  const { patch } = useResumeEdit();

  const setEntry = (id: string, changes: Record<string, string>) =>
    actions.edit((draft) => {
      draft.references.entries = draft.references.entries.map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry,
      );
    }, `ref:${id}`);

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        items={REFERENCE_TABS}
        value={references.mode}
        onChange={(mode: ReferenceMode) => patch('references', { mode })}
        ariaLabel="Reference style"
        className="self-start"
      />

      {references.mode === 'on-request' ? (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-fg-muted">
          Your resume will print: “{ON_REQUEST_TEXT}” — the usual choice unless the employer asked
          for referees up front.
        </p>
      ) : (
        <>
          {references.entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border-base p-3">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  aria-label="Remove referee"
                  onClick={() =>
                    actions.edit((draft) => {
                      draft.references.entries = draft.references.entries.filter(
                        (item) => item.id !== entry.id,
                      );
                    })
                  }
                  className="rounded p-1 text-fg-subtle transition hover:bg-surface-2 hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={entry.name}
                      onChange={(event) => setEntry(entry.id, { name: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Designation">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={entry.designation}
                      onChange={(event) => setEntry(entry.id, { designation: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Organisation" className="col-span-2">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={entry.organization}
                      onChange={(event) => setEntry(entry.id, { organization: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Email">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="email"
                      value={entry.email}
                      onChange={(event) => setEntry(entry.id, { email: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Phone">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="tel"
                      value={entry.phone}
                      onChange={(event) => setEntry(entry.id, { phone: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="How they know you" className="col-span-2">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={entry.relationship}
                      placeholder="Former line manager"
                      onChange={(event) => setEntry(entry.id, { relationship: event.target.value })}
                    />
                  )}
                </Field>
              </div>
            </div>
          ))}

          <Button
            size="sm"
            variant="outline"
            className="self-start"
            leading={<Plus size={14} />}
            onClick={() =>
              actions.edit((draft) => {
                draft.references.entries.push(createReferenceEntry());
              })
            }
          >
            Add referee
          </Button>
        </>
      )}
    </div>
  );
};

export const DeclarationSection = () => {
  const { declaration } = useResume();
  const { patch } = useResumeEdit();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Statement" className="col-span-2">
        {({ id }) => (
          <Textarea
            id={id}
            rows={3}
            maxLength={500}
            value={declaration.text}
            placeholder={DEFAULT_DECLARATION_TEXT}
            onChange={(event) => patch('declaration', { text: event.target.value })}
          />
        )}
      </Field>

      <Field label="Place">
        {({ id }) => (
          <Input
            id={id}
            value={declaration.place}
            placeholder="Dhaka"
            onChange={(event) => patch('declaration', { place: event.target.value })}
          />
        )}
      </Field>

      {declaration.showDate ? (
        <Field label="Date" hint={`Leave blank to print today's date (${formatToday()}).`}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={declaration.date}
              placeholder={formatToday()}
              onChange={(event) => patch('declaration', { date: event.target.value })}
            />
          )}
        </Field>
      ) : null}

      <div className="col-span-2">
        <Switch
          label="Print a date"
          description="Off leaves the declaration undated, so the same PDF keeps working months from now."
          checked={declaration.showDate}
          onChange={(showDate) => patch('declaration', { showDate })}
        />
      </div>
    </div>
  );
};

const SIGNATURE_TABS = SIGNATURE_MODES.map((value) => ({
  value,
  label: value === 'typed' ? 'Typed' : 'Upload image',
}));

export const SignatureSection = () => {
  const { signature, basics } = useResume();
  const { patch } = useResumeEdit();

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        items={SIGNATURE_TABS}
        value={signature.mode}
        onChange={(mode: (typeof SIGNATURE_MODES)[number]) => patch('signature', { mode })}
        ariaLabel="Signature style"
        className="self-start"
      />

      {signature.mode === 'typed' ? (
        <Field label="Signature name" hint={`Blank uses your full name (${basics.fullName || '—'}).`}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={signature.typedName}
              maxLength={LIMITS.nameChars}
              onChange={(event) => patch('signature', { typedName: event.target.value })}
            />
          )}
        </Field>
      ) : (
        <ImageUpload
          label="Signature image"
          shape="wide"
          value={signature.image}
          maxBytes={LIMITS.imageBytes}
          hint="A transparent PNG reads best."
          onChange={(image) => patch('signature', { image })}
        />
      )}

      <Field label="Caption" hint="Printed under the rule.">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={signature.caption}
            placeholder={basics.fullName}
            onChange={(event) => patch('signature', { caption: event.target.value })}
          />
        )}
      </Field>
    </div>
  );
};

/** File naming, kept beside the other document-level settings. */
export const DocumentNameSection = () => {
  const resume = useResume();
  const actions = useResumeActions();

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Document name"
        hint="Used for the downloaded file. Recruiters see the filename before they see the resume."
      >
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={resume.meta.documentName}
            maxLength={80}
            placeholder={`${resume.basics.fullName || 'Your name'} - ${resume.basics.headline || 'Role'}`}
            onChange={(event) =>
              actions.edit((draft) => {
                draft.meta.documentName = event.target.value;
              }, 'documentName')
            }
          />
        )}
      </Field>

    </div>
  );
};
