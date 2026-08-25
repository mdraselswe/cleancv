'use client';

import {
  Download,
  FileJson,
  FileUp,
  FolderOpen,
  Gauge,
  Monitor,
  Moon,
  Redo2,
  Sun,
  Undo2,
  Upload,
  Loader2,
} from 'lucide-react';

import { Badge, Button, Select } from '@/components/ui';
import { APP_NAME } from '@/constants';
import { IMPORT_INPUT_ID } from '@/features/export';
import type { TemplateId } from '@/constants';
import type { ThemePreference } from '@/hooks';
import { cn } from '@/lib/cn';

const SCORE_TONE_CLASS = {
  excellent: 'text-success',
  strong: 'text-success',
  fair: 'text-warning',
  poor: 'text-danger',
} as const;

const SCORE_TONE_BADGE = {
  excellent: 'success',
  strong: 'success',
  fair: 'warning',
  poor: 'danger',
} as const;

export interface ToolbarProps {
  documentName: string;
  onOpenLibrary: () => void;
  onOpenImport: () => void;
  templateId: TemplateId;
  templateOptions: readonly { value: string; label: string }[];
  onTemplateChange: (id: TemplateId) => void;

  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  pendingExport: 'design' | 'ats' | null;
  onExportDesign: () => void;
  onExportAts: () => void;
  onExportJson: () => void;

  themePreference: ThemePreference;
  onCycleTheme: () => void;

  atsScore: number;
  atsTone: 'excellent' | 'strong' | 'fair' | 'poor';
  onToggleScorePanel: () => void;
  scorePanelOpen: boolean;
}

const THEME_ICON: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export const Toolbar = ({
  documentName,
  onOpenLibrary,
  onOpenImport,
  templateId,
  templateOptions,
  onTemplateChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  pendingExport,
  onExportDesign,
  onExportAts,
  onExportJson,
  themePreference,
  onCycleTheme,
  atsScore,
  atsTone,
  onToggleScorePanel,
  scorePanelOpen,
}: ToolbarProps) => {
  const ThemeIcon = THEME_ICON[themePreference];

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="rounded-md bg-primary px-1.5 py-1 text-[11px] font-bold text-primary-fg">
          CV
        </span>
        <span className="hidden text-sm font-semibold text-fg sm:inline">{APP_NAME}</span>
        <button
          type="button"
          onClick={onOpenLibrary}
          title="My CVs — switch, duplicate or back up"
          className="hover:bg-surface-2 text-fg-subtle hover:text-fg -ml-1 inline-flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-1 transition"
        >
          <FolderOpen size={14} className="flex-none" />
          <span className="hidden truncate text-[13px] md:inline">
            {documentName || 'Untitled resume'}
          </span>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleScorePanel}
          aria-pressed={scorePanelOpen}
          title="ATS score"
          className={cn(
            'hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition lg:inline-flex',
            scorePanelOpen ? 'border-primary bg-primary-soft' : 'border-border-base hover:bg-surface-2',
          )}
        >
          <Gauge size={14} className={SCORE_TONE_CLASS[atsTone]} />
          <span className="text-fg">ATS</span>
          <Badge tone={SCORE_TONE_BADGE[atsTone]}>{atsScore}</Badge>
        </button>

        <div className="mr-1 hidden items-center gap-0.5 sm:flex">
          <Button
            size="icon"
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={15} />
          </Button>
        </div>

        <Select
          options={templateOptions}
          value={templateId}
          onChange={(event) => onTemplateChange(event.target.value as TemplateId)}
          aria-label="Template"
          className="hidden h-8 w-44 md:block"
        />

        <Button
          size="icon"
          variant="ghost"
          onClick={onOpenImport}
          aria-label="Import from a PDF, DOCX or screenshot"
          title="Import from a PDF, DOCX or screenshot"
        >
          <FileUp size={15} />
        </Button>

        {/* A label, not a ref-clicking button: keyboard and AT behaviour is native. */}
        <label
          htmlFor={IMPORT_INPUT_ID}
          title="Restore a JSON backup from this app"
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <Upload size={15} />
          <span className="sr-only">Import JSON</span>
        </label>
        <Button
          size="icon"
          variant="ghost"
          onClick={onExportJson}
          aria-label="Export JSON"
          title="Download a JSON backup"
        >
          <FileJson size={15} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onCycleTheme}
          aria-label={`Theme: ${themePreference}`}
          title={`Theme: ${themePreference}`}
        >
          <ThemeIcon size={15} />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportAts}
          disabled={pendingExport !== null}
          leading={
            pendingExport === 'ats' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )
          }
          title="Single-column, plain-text PDF for job portals"
        >
          ATS PDF
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onExportDesign}
          disabled={pendingExport !== null}
          leading={
            pendingExport === 'design' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )
          }
        >
          Download
        </Button>
      </div>
    </div>
  );
};
