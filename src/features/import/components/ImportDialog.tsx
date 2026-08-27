'use client';

import { CheckCircle2, FileUp, Loader2, Settings2, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button, Modal, ModalHeader } from '@/components/ui';
import { IMPORT_ACCEPT } from '@/constants';
import type { Resume } from '@/features/resume';
import { cn } from '@/lib/cn';

import type { ImportProviderId } from '../types';
import { useImport } from '../useImport';
import { ImportReview } from './ImportReview';
import { SmartImportSettings } from './SmartImportSettings';

const FILE_INPUT_ID = 'cv-import-file';

export interface ImportDialogProps {
  open: boolean;
  resume: Resume;
  onClose: () => void;
  onApply: (next: Resume) => void;
}

/**
 * Import an existing CV.
 *
 * Offline is the default and always available; smart import appears as an
 * option only once an endpoint is configured, rather than as a permanently
 * disabled button advertising something the user has not set up.
 */
export const ImportDialog = ({ open, resume, onClose, onApply }: ImportDialogProps) => {
  const { state, smartAvailable, run, cancel, reset } = useImport();
  const [provider, setProvider] = useState<ImportProviderId>('offline');
  const [showSettings, setShowSettings] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const busy = state.stage === 'extracting' || state.stage === 'parsing';

  const start = (file: File | undefined) => {
    if (file) void run(file, smartAvailable ? provider : 'offline');
  };

  const close = () => {
    cancel();
    setShowSettings(false);
    onClose();
  };

  return (
    <Modal label="Import a CV" onClose={close}>
      <ModalHeader
        title="Import a CV"
        subtitle="PDF, DOCX or a screenshot. Everything is reviewed before it is written."
        onClose={close}
      />

      {showSettings ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <SmartImportSettings onDone={() => setShowSettings(false)} />
          <Button variant="ghost" className="mt-3" onClick={() => setShowSettings(false)}>
            Back
          </Button>
        </div>
      ) : state.stage === 'restore' && state.restore ? (
        /*
         * Nothing to review: the file carried the document itself, so the
         * only question left is whether to open it. See ADR-023.
         */
        <div className="flex flex-col gap-3 px-4 py-5">
          <div className="flex gap-3">
            <CheckCircle2 size={20} className="text-success mt-0.5 flex-none" />
            <div className="min-w-0">
              <p className="text-fg text-ui-md font-medium">This PDF was made by CleanCV</p>
              <p className="text-fg-subtle text-ui-xs mt-1">
                It carries the CV inside it, so everything comes back exactly as it was — every
                section, the design and the wording. Nothing is guessed from the page.
              </p>
            </div>
          </div>

          <p className="bg-surface-2 text-fg-muted rounded-control text-ui-xs px-3 py-2">
            Opening it replaces what is in the editor now. Your other CVs are untouched — this is
            one document in the library.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>
              Choose another file
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApply(state.restore!.resume);
                reset();
                onClose();
              }}
            >
              Restore this CV
            </Button>
          </div>
        </div>
      ) : state.stage === 'review' && state.result ? (
        <ImportReview
          result={state.result}
          resume={resume}
          onApply={(next) => {
            onApply(next);
            reset();
            onClose();
          }}
          onCancel={reset}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              start(event.dataTransfer.files[0]);
            }}
            className={cn(
              'rounded-card border border-dashed px-4 py-8 text-center transition',
              dragging ? 'border-primary bg-primary-soft' : 'border-border-base',
            )}
          >
            {busy ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={22} className="text-primary animate-spin" />
                <p className="text-fg text-ui">{state.message}…</p>
                {state.progress >= 0 ? (
                  <div className="bg-surface-2 h-1.5 w-40 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full transition-[width]"
                      style={{ width: `${Math.round(state.progress * 100)}%` }}
                    />
                  </div>
                ) : null}
                <Button size="sm" variant="ghost" onClick={cancel}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <FileUp size={22} className="text-fg-subtle mx-auto" />
                <p className="text-fg text-ui mt-2">Drop a file here</p>
                <label
                  htmlFor={FILE_INPUT_ID}
                  className="border-border-base hover:bg-surface-2 rounded-control text-ui mt-2 inline-flex h-8 cursor-pointer items-center border px-3 font-medium transition"
                >
                  Choose a file
                </label>
                <input
                  ref={fileInput}
                  id={FILE_INPUT_ID}
                  type="file"
                  accept={IMPORT_ACCEPT}
                  className="sr-only"
                  onChange={(event) => {
                    start(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </>
            )}
          </div>

          {state.stage === 'error' ? (
            <p className="border-danger text-danger rounded-control text-ui-xs mt-3 border px-3 py-2">
              {state.error}
            </p>
          ) : null}

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-fg text-ui font-medium">How to read it</span>
              <Button
                size="sm"
                variant="ghost"
                leading={<Settings2 size={13} />}
                onClick={() => setShowSettings(true)}
              >
                {smartAvailable ? 'Change model' : 'Set up smart import'}
              </Button>
            </div>

            <div className="mt-2 flex flex-col gap-2">
              <label
                className={cn(
                  'rounded-card flex cursor-pointer gap-2.5 border px-3 py-2.5 transition',
                  provider === 'offline' || !smartAvailable
                    ? 'border-primary bg-primary-soft'
                    : 'border-border-base',
                )}
              >
                <input
                  type="radio"
                  name="import-provider"
                  className="mt-1"
                  checked={provider === 'offline' || !smartAvailable}
                  onChange={() => setProvider('offline')}
                />
                <span className="min-w-0">
                  <span className="text-fg text-ui block font-medium">
                    On this device — free, private
                  </span>
                  <span className="text-fg-subtle text-ui-xs block">
                    Reads headings, dates and bullets itself. Nothing is uploaded. Good on a plain
                    one-column CV, weaker on a heavily designed one.
                  </span>
                </span>
              </label>

              {smartAvailable ? (
                <label
                  className={cn(
                    'rounded-card flex cursor-pointer gap-2.5 border px-3 py-2.5 transition',
                    provider === 'smart' ? 'border-primary bg-primary-soft' : 'border-border-base',
                  )}
                >
                  <input
                    type="radio"
                    name="import-provider"
                    className="mt-1"
                    checked={provider === 'smart'}
                    onChange={() => setProvider('smart')}
                  />
                  <span className="min-w-0">
                    <span className="text-fg text-ui flex items-center gap-1.5 font-medium">
                      <Sparkles size={13} /> Smart import
                    </span>
                    <span className="text-fg-subtle text-ui-xs block">
                      Sends the document to the model you configured. Handles screenshots and
                      two-column layouts far better.
                    </span>
                  </span>
                </label>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
