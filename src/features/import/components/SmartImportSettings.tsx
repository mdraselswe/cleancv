'use client';

import { useState } from 'react';

import { Button, Field, Input, Select, Switch } from '@/components/ui';

import {
  SMART_PRESETS,
  clearSmartSettings,
  saveSmartSettings,
  useSmartSettings,
  type SmartSettings,
} from '../settings';

/**
 * Where the user points smart import.
 *
 * Presets fill in the two fields people get wrong — the base URL and a model
 * name — but every field stays editable, because the whole reason this is
 * configurable is that the list of what is free changes without warning.
 */
export const SmartImportSettings = ({ onDone }: { onDone?: () => void }) => {
  const saved = useSmartSettings();
  const [draft, setDraft] = useState<SmartSettings>(saved);
  const [presetId, setPresetId] = useState('');

  const patch = (changes: Partial<SmartSettings>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const preset = SMART_PRESETS.find((entry) => entry.id === presetId);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-fg-subtle text-ui-xs">
        স্মার্ট ইমপোর্ট CV-র লেখা — অথবা ছবিটিই — আপনার বেছে নেওয়া একটি মডেলে পাঠায়। OpenAI-র <code>/chat/completions</code> ধরনের যেকোনো সার্ভিস চলে। অনুরোধটি এই অ্যাপের সার্ভারের ভেতর দিয়ে যায়, আর কিছুই জমা থাকে না।
      </p>

      <Field label="একটি প্রোভাইডার থেকে শুরু করুন" hint={preset?.note}>
        {({ id, describedBy }) => (
          <Select
            id={id}
            aria-describedby={describedBy}
            value={presetId}
            placeholder="একটি বেছে নিন…"
            options={SMART_PRESETS.map((entry) => ({ value: entry.id, label: entry.label }))}
            onChange={(event) => {
              const chosen = SMART_PRESETS.find((entry) => entry.id === event.target.value);
              setPresetId(event.target.value);
              if (chosen) patch({ endpoint: chosen.endpoint, model: chosen.model });
            }}
          />
        )}
      </Field>

      <Field label="এন্ডপয়েন্ট" hint="বেস URL, /chat/completions ছাড়া।">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={draft.endpoint}
            placeholder="http://localhost:11434/v1"
            onChange={(event) => patch({ endpoint: event.target.value })}
          />
        )}
      </Field>

      <Field label="মডেল">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={draft.model}
            placeholder="qwen2.5vl"
            onChange={(event) => patch({ model: event.target.value })}
          />
        )}
      </Field>

      <Field
        label="API কী"
        hint="শুধু এই ব্রাউজারে রাখা হয়। যে লোকাল মডেলে লাগে না, সেখানে ফাঁকা রাখুন।"
      >
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="password"
            autoComplete="off"
            aria-describedby={describedBy}
            value={draft.apiKey}
            placeholder="ঐচ্ছিক"
            onChange={(event) => patch({ apiKey: event.target.value })}
          />
        )}
      </Field>

      <Switch
        checked={draft.useVision}
        onChange={(useVision) => patch({ useVision })}
        label="স্ক্রিনশট ছবি হিসেবে পাঠান"
        description="OCR লেখা পড়ার বদলে মডেল সরাসরি লেআউট দেখতে পায়। ছবি নিতে পারে এমন মডেল লাগবে।"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          onClick={() => {
            saveSmartSettings(draft);
            onDone?.();
          }}
        >
          সংরক্ষণ
        </Button>
        {saved.endpoint ? (
          <Button
            variant="ghost"
            onClick={() => {
              clearSmartSettings();
              setDraft({ endpoint: '', model: '', apiKey: '', useVision: true });
            }}
          >
            সরান
          </Button>
        ) : null}
      </div>

      <p className="text-fg-subtle text-ui-2xs">
        ফ্রি প্ল্যান মানেই ব্যক্তিগত নয় — অনেকেই বলে ব্যবহারের তথ্য তাদের মডেল উন্নত করতে রাখা হতে পারে। অন্য কারও CV ইমপোর্ট করার আগে এটি জানা দরকার। আপনার নিজের কম্পিউটারে চলা মডেল কোথাও কিছু পাঠায় না।
      </p>
    </div>
  );
};
