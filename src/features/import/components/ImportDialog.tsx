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
    <Modal label="CV ইমপোর্ট করুন" onClose={close}>
      <ModalHeader
        title="CV ইমপোর্ট করুন"
        subtitle="PDF, DOCX বা স্ক্রিনশট। লেখার আগে সবকিছু আপনি দেখে নিতে পারবেন।"
        onClose={close}
      />

      {showSettings ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <SmartImportSettings onDone={() => setShowSettings(false)} />
          <Button variant="ghost" className="mt-3" onClick={() => setShowSettings(false)}>
            পেছনে যান
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
              <p className="text-fg text-ui-md font-medium">এই PDF CleanCV দিয়ে বানানো</p>
              <p className="text-fg-subtle text-ui-xs mt-1">
                এটির ভেতরেই CV রাখা আছে, তাই সবকিছু ঠিক যেমন ছিল তেমনই ফিরে আসবে — প্রতিটি সেকশন, ডিজাইন ও লেখা। পেজ থেকে কিছুই আন্দাজ করা হয় না।
              </p>
            </div>
          </div>

          <p className="bg-surface-2 text-fg-muted rounded-control text-ui-xs px-3 py-2">
            এটি খুললে এডিটরে এখন যা আছে তা বদলে যাবে। আপনার অন্য CV-গুলোর কিছু হবে না — এটি লাইব্রেরির একটি ডকুমেন্ট মাত্র।
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>
              অন্য ফাইল বেছে নিন
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApply(state.restore!.resume);
                reset();
                onClose();
              }}
            >
              এই CV ফিরিয়ে আনুন
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
                  বাতিল
                </Button>
              </div>
            ) : (
              <>
                <FileUp size={22} className="text-fg-subtle mx-auto" />
                <p className="text-fg text-ui mt-2">এখানে একটি ফাইল ফেলুন</p>
                <label
                  htmlFor={FILE_INPUT_ID}
                  className="border-border-base hover:bg-surface-2 rounded-control text-ui mt-2 inline-flex h-8 cursor-pointer items-center border px-3 font-medium transition"
                >
                  একটি ফাইল বেছে নিন
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
              <span className="text-fg text-ui font-medium">কীভাবে পড়া হবে</span>
              <Button
                size="sm"
                variant="ghost"
                leading={<Settings2 size={13} />}
                onClick={() => setShowSettings(true)}
              >
                {smartAvailable ? 'মডেল বদলান' : 'স্মার্ট ইমপোর্ট চালু করুন'}
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
                    এই ডিভাইসে — ফ্রি, ব্যক্তিগত
                  </span>
                  <span className="text-fg-subtle text-ui-xs block">
                    শিরোনাম, তারিখ ও বুলেট নিজেই পড়ে নেয়। কিছুই আপলোড হয় না। সাদামাটা এক কলামের CV-তে ভালো, অনেক ডিজাইনওয়ালা CV-তে দুর্বল।
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
                      <Sparkles size={13} /> স্মার্ট ইমপোর্ট
                    </span>
                    <span className="text-fg-subtle text-ui-xs block">
                      ডকুমেন্টটি আপনার ঠিক করা মডেলে পাঠায়। স্ক্রিনশট আর দুই কলামের CV অনেক ভালো বোঝে।
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
