'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';

import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';
import { downscaleImage, type ImageBudget } from '@/lib/image';

import { Button } from './Button';

export interface ImageUploadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  /** How far the picture is resized before it enters the document. */
  budget: ImageBudget;
  hint?: string;
  /** `avatar` crops to a circle, `wide` suits a signature strip. */
  shape?: 'avatar' | 'wide';
  className?: string;
}

const ACCEPTED = 'image/png,image/jpeg,image/webp';

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Uploads live inside the resume JSON as data URLs, so the whole document stays
 * portable through export and import with no asset hosting.
 *
 * Which is exactly why the picture is resized on the way in rather than taken
 * at whatever size the camera wrote it: a four-megabyte portrait would be
 * carried in storage, in every backup and inside every exported PDF, to fill a
 * frame thirty millimetres wide. See `lib/image.ts`.
 *
 * What it was resized to is reported, because otherwise the reader uploads a
 * file they know the size of and is told nothing about what became of it.
 */
export const ImageUpload = ({
  value,
  onChange,
  label,
  budget,
  hint,
  shape = 'avatar',
  className,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setError('');
    setNote('');

    try {
      const image = await downscaleImage(file, budget);

      onChange(image.dataUrl);
      setNote(`ছোট করে ${bn(image.width)}×${bn(image.height)} করা হয়েছে, ${bn(kb(image.bytes))}।`);
    } catch (cause) {
      // Every message `downscaleImage` throws is written to be read by whoever
      // picked the file, so it is shown as it is rather than replaced.
      setError(cause instanceof Error ? cause.message : 'ফাইলটি পড়া যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const footnote = error ? (
    <p className="text-ui-xs text-danger">{error}</p>
  ) : note ? (
    <p className="text-ui-xs text-fg-subtle">{note}</p>
  ) : hint ? (
    <p className="text-ui-xs text-fg-subtle">{hint}</p>
  ) : null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-ui text-fg-muted font-medium">{label}</p>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            'border-border-base bg-surface-2 flex flex-none items-center justify-center overflow-hidden border',
            shape === 'avatar' ? 'h-16 w-16 rounded-full' : 'rounded-control h-12 w-32',
          )}
        >
          {value ? (
            // Data URL of arbitrary dimensions; next/image adds nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={18} className="text-fg-subtle" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'ছোট করা হচ্ছে…' : value ? 'বদলান' : 'আপলোড করুন'}
            </Button>
            {value ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setNote('');
                  setError('');
                  onChange('');
                }}
                leading={<Trash2 size={14} />}
              >
                সরান
              </Button>
            ) : null}
          </div>
          {footnote}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={(event) => void handleFile(event)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
};
