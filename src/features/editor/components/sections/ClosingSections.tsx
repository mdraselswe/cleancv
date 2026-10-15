'use client';

import { Plus, Trash2 } from 'lucide-react';

import {
  Button,
  Field,
  ImageUpload,
  Input,
  Switch,
  TagInput,
  Tabs,
  Textarea,
} from '@/components/ui';
import {
  DEFAULT_DECLARATION_TEXT,
  IMAGE_BUDGET,
  LIMITS,
  ON_REQUEST_TEXT,
  REFERENCE_MODES,
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
      label="আগ্রহ ও শখ"
      hint="নির্দিষ্ট করে লিখুন। “বই পড়া” কিছুই বলে না; “দাবা প্রতিযোগিতা” কথোপকথন শুরু করে।"
    >
      {({ id, describedBy }) => (
        <TagInput
          id={id}
          describedBy={describedBy}
          value={interests.items}
          placeholder="দূরপাল্লার দৌড়"
          onChange={(items) => patch('interests', { items })}
        />
      )}
    </Field>
  );
};

const REFERENCE_UI_LABEL: Record<ReferenceMode, string> = {
  listed: 'রেফারি তালিকা করুন',
  'on-request': 'চাইলে দেওয়া হবে',
};

const REFERENCE_TABS = REFERENCE_MODES.map((value) => ({
  value,
  label: REFERENCE_UI_LABEL[value],
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
        ariaLabel="রেফারেন্সের ধরন"
        className="self-start"
      />

      {references.mode === 'on-request' ? (
        <p className="rounded-control bg-surface-2 text-ui text-fg-muted px-3 py-2">
          আপনার CV-তে এটি ছাপা হবে: “{ON_REQUEST_TEXT}” — নিয়োগকর্তা আগেই রেফারি চেয়ে না থাকলে সাধারণত
          এটিই ঠিক পছন্দ।
        </p>
      ) : (
        <>
          {references.entries.map((entry) => (
            <div key={entry.id} className="rounded-card border-border-base border p-3">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  aria-label="রেফারি সরান"
                  onClick={() =>
                    actions.edit((draft) => {
                      draft.references.entries = draft.references.entries.filter(
                        (item) => item.id !== entry.id,
                      );
                    })
                  }
                  className="tap-target text-fg-subtle hover:bg-surface-2 hover:text-danger flex h-8 w-8 flex-none items-center justify-center rounded-lg transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                <Field label="নাম">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={entry.name}
                      onChange={(event) => setEntry(entry.id, { name: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="পদবি">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={entry.designation}
                      onChange={(event) => setEntry(entry.id, { designation: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="প্রতিষ্ঠান" className="col-span-full">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={entry.organization}
                      onChange={(event) => setEntry(entry.id, { organization: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="ইমেইল">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="email"
                      value={entry.email}
                      onChange={(event) => setEntry(entry.id, { email: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="ফোন">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="tel"
                      value={entry.phone}
                      onChange={(event) => setEntry(entry.id, { phone: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="আপনাকে কীভাবে চেনেন" className="col-span-full">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={entry.relationship}
                      placeholder="আগের লাইন ম্যানেজার"
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
            রেফারি যোগ করুন
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
    <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
      <Field label="ঘোষণার লেখা" className="col-span-full">
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

      <Field label="স্থান">
        {({ id }) => (
          <Input
            id={id}
            value={declaration.place}
            placeholder="ঢাকা"
            onChange={(event) => patch('declaration', { place: event.target.value })}
          />
        )}
      </Field>

      {declaration.showDate ? (
        <Field label="তারিখ" hint={`ফাঁকা রাখলে আজকের তারিখ (${formatToday()}) ছাপা হবে।`}>
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

      <div className="col-span-full">
        <Switch
          label="তারিখ ছাপুন"
          description="বন্ধ রাখলে ঘোষণায় কোনো তারিখ থাকে না, ফলে একই PDF কয়েক মাস পরেও ব্যবহার করা যায়।"
          checked={declaration.showDate}
          onChange={(showDate) => patch('declaration', { showDate })}
        />
      </div>
    </div>
  );
};

const SIGNATURE_TABS = SIGNATURE_MODES.map((value) => ({
  value,
  label: value === 'typed' ? 'টাইপ করা' : 'ছবি আপলোড',
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
        ariaLabel="সইয়ের ধরন"
        className="self-start"
      />

      {signature.mode === 'typed' ? (
        <Field
          label="সইয়ের নাম"
          hint={`Blank uses your full name (${basics.fullName || '—'}).`}
        >
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
          label="সইয়ের ছবি"
          shape="wide"
          value={signature.image}
          budget={IMAGE_BUDGET}
          hint="ব্যাকগ্রাউন্ডহীন (স্বচ্ছ) PNG সবচেয়ে ভালো দেখায়।"
          onChange={(image) => patch('signature', { image })}
        />
      )}

      <Field label="ক্যাপশন" hint="রেখার নিচে ছাপা হবে।">
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
        label="ডকুমেন্টের নাম"
        hint="ডাউনলোড করা ফাইলের নাম হিসেবে ব্যবহৃত হয়। রিক্রুটার CV দেখার আগেই ফাইলের নামটি দেখেন।"
      >
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={resume.meta.documentName}
            maxLength={80}
            placeholder={`${resume.basics.fullName || 'আপনার নাম'} - ${resume.basics.headline || 'পদ'}`}
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
