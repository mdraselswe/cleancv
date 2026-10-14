'use client';

import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui';
import { type TemplateId } from '@/constants';
import { createSampleResume } from '@/features/resume';
import { bn } from '@/lib/bn';
import { TemplatePreview, getAvailableTemplates } from '@/features/templates';

const THUMB_WIDTH = 188;

export interface TemplateStripProps {
  onPick: (templateId: TemplateId) => void;
  disabled?: boolean;
}

/**
 * Every design, drawn with the sample CV, as a way to start rather than a
 * catalogue: choosing one opens a new document already set to it.
 */
export const TemplateStrip = ({ onPick, disabled }: TemplateStripProps) => {
  const sample = useMemo(() => createSampleResume(), []);
  const templates = getAvailableTemplates();

  return (
    <div className="scroll-slim -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pt-1 pb-4 sm:-mx-6 sm:px-6">
      {templates.map(({ meta }) => (
        <button
          key={meta.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(meta.id)}
          className="card-lift group border-border-base bg-surface rounded-panel flex w-[220px] flex-none snap-start flex-col overflow-hidden border text-left disabled:opacity-50"
        >
          <span className="bg-canvas flex justify-center px-4 pt-4">
            <span className="shadow-sheet block h-[210px] overflow-hidden rounded-t-[3px] transition duration-300 group-hover:-translate-y-1">
              <TemplatePreview templateId={meta.id} resume={sample} width={THUMB_WIDTH} />
            </span>
          </span>

          <span className="flex flex-col gap-1.5 p-3.5">
            <span className="text-fg text-ui-md flex items-center justify-between font-semibold">
              {meta.name}
              <ArrowRight
                size={15}
                className="text-primary -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
              />
            </span>
            <Badge tone={meta.atsBaseline >= 90 ? 'success' : 'warning'} className="self-start">
              ATS সীমা {bn(meta.atsBaseline)}
            </Badge>
          </span>
        </button>
      ))}
    </div>
  );
};
