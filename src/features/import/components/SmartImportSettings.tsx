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
      <p className="text-fg-subtle text-[12.5px]">
        Smart import sends the CV&apos;s text — or the image itself — to a model you choose. Anything
        speaking the OpenAI <code>/chat/completions</code> shape works. The request goes through this
        app&apos;s server and nothing is kept.
      </p>

      <Field label="Start from a provider" hint={preset?.note}>
        {({ id, describedBy }) => (
          <Select
            id={id}
            aria-describedby={describedBy}
            value={presetId}
            placeholder="Choose one…"
            options={SMART_PRESETS.map((entry) => ({ value: entry.id, label: entry.label }))}
            onChange={(event) => {
              const chosen = SMART_PRESETS.find((entry) => entry.id === event.target.value);
              setPresetId(event.target.value);
              if (chosen) patch({ endpoint: chosen.endpoint, model: chosen.model });
            }}
          />
        )}
      </Field>

      <Field label="Endpoint" hint="The base URL, without /chat/completions.">
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

      <Field label="Model">
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
        label="API key"
        hint="Stored in this browser only. Leave blank for a local model that needs none."
      >
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="password"
            autoComplete="off"
            aria-describedby={describedBy}
            value={draft.apiKey}
            placeholder="Optional"
            onChange={(event) => patch({ apiKey: event.target.value })}
          />
        )}
      </Field>

      <Switch
        checked={draft.useVision}
        onChange={(useVision) => patch({ useVision })}
        label="Send screenshots as images"
        description="Lets the model see the layout instead of reading OCR text. Needs a model that accepts images."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          onClick={() => {
            saveSmartSettings(draft);
            onDone?.();
          }}
        >
          Save
        </Button>
        {saved.endpoint ? (
          <Button
            variant="ghost"
            onClick={() => {
              clearSmartSettings();
              setDraft({ endpoint: '', model: '', apiKey: '', useVision: true });
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>

      <p className="text-fg-subtle text-[11.5px]">
        A free tier is not automatically a private one — several say usage may be retained to improve
        their models. Worth knowing before importing someone else&apos;s CV. A model running on this
        machine sends nothing anywhere.
      </p>
    </div>
  );
};
