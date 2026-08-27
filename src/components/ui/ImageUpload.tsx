'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';

import { cn } from '@/lib/cn';

import { Button } from './Button';

export interface ImageUploadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  /** Bytes. Files above this are rejected with a message rather than truncated. */
  maxBytes: number;
  hint?: string;
  /** `avatar` crops to a circle, `wide` suits a signature strip. */
  shape?: 'avatar' | 'wide';
  className?: string;
}

const ACCEPTED = 'image/png,image/jpeg,image/webp';

/**
 * Reads a file to a data URL so uploads live inside the resume JSON — the whole
 * document stays portable through export/import with no asset hosting.
 */
export const ImageUpload = ({
  value,
  onChange,
  label,
  maxBytes,
  hint,
  shape = 'avatar',
  className,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > maxBytes) {
      setError(`Image must be under ${Math.round(maxBytes / 1024)} KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setError('');
      onChange(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => setError('That file could not be read.');
    reader.readAsDataURL(file);
  };

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
            <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onChange('')}
                leading={<Trash2 size={14} />}
              >
                Remove
              </Button>
            ) : null}
          </div>
          {error ? (
            <p className="text-ui-xs text-danger">{error}</p>
          ) : hint ? (
            <p className="text-ui-xs text-fg-subtle">{hint}</p>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFile}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
};
