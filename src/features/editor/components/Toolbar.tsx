'use client';

import {
  Download,
  FileJson,
  FileUp,
  FolderOpen,
  Gauge,
  Keyboard,
  Loader2,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Redo2,
  Sun,
  Undo2,
  Upload,
} from 'lucide-react';

import { Badge, Button, Menu, Select, type MenuEntry } from '@/components/ui';
import { APP_NAME } from '@/constants';
import type { TemplateId } from '@/constants';
import { UserMenu } from '@/features/auth';
import { IMPORT_INPUT_ID } from '@/features/export';
import type { SaveState } from '@/features/library';
import type { ThemePreference } from '@/hooks';
import { cn } from '@/lib/cn';

import { SaveStatus } from './SaveStatus';

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

const THEME_ICON: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_LABEL: Record<ThemePreference, string> = {
  light: 'Theme: light',
  dark: 'Theme: dark',
  system: 'Theme: system',
};

export interface ToolbarProps {
  documentName: string;
  saveState: SaveState;
  onOpenLibrary: () => void;
  onOpenImport: () => void;
  /** Jumps the editor to the design panel — the template picker on a phone. */
  onOpenDesign: () => void;
  onOpenShortcuts: () => void;
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

/**
 * The application bar: one row at every width.
 *
 * It used to wrap onto a second row below `sm`, which cost a phone eighty-two
 * pixels of a screen that had none to spare and left the first row all but
 * empty — the app name, the document name and the template picker were each
 * hidden at a different breakpoint, so what remained was a logo and four
 * unlabelled glyphs. Everything past the essentials now collapses into one
 * overflow menu instead of disappearing: a narrow window loses the shortcut,
 * never the action.
 *
 * What stays visible at every width is what the reader needs to know and do
 * without thinking — which CV is open, whether it is saved, and how to get the
 * PDF out.
 */
export const Toolbar = ({
  documentName,
  saveState,
  onOpenLibrary,
  onOpenImport,
  onOpenDesign,
  onOpenShortcuts,
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

  const menuEntries: MenuEntry[] = [
    {
      id: 'undo',
      label: 'Undo',
      hint: 'Ctrl+Z',
      icon: <Undo2 size={15} />,
      disabled: !canUndo,
      onSelect: onUndo,
    },
    {
      id: 'redo',
      label: 'Redo',
      hint: 'Ctrl+Shift+Z',
      icon: <Redo2 size={15} />,
      disabled: !canRedo,
      onSelect: onRedo,
    },
    { id: 'sep-1', separator: true },
    {
      id: 'design',
      label: 'Change the design',
      icon: <Palette size={15} />,
      onSelect: onOpenDesign,
    },
    {
      id: 'import',
      label: 'Import a CV file',
      icon: <FileUp size={15} />,
      onSelect: onOpenImport,
    },
    {
      id: 'restore',
      label: 'Restore a JSON backup',
      icon: <Upload size={15} />,
      /*
       * The file input is opened by script here rather than by a `<label>`:
       * a menu item has to be a button to take part in the menu's roving
       * focus, and a label inside one is neither focusable in that order nor
       * announced as an item. The button carries the same accessible name, and
       * the click happens inside the reader's own gesture.
       */
      onSelect: () => document.getElementById(IMPORT_INPUT_ID)?.click(),
    },
    {
      id: 'backup',
      label: 'Download a JSON backup',
      icon: <FileJson size={15} />,
      onSelect: onExportJson,
    },
    { id: 'sep-2', separator: true },
    {
      id: 'ats-pdf',
      label: 'Download the ATS PDF',
      icon: <Download size={15} />,
      disabled: pendingExport !== null,
      onSelect: onExportAts,
    },
    { id: 'sep-3', separator: true },
    {
      id: 'theme',
      label: THEME_LABEL[themePreference],
      icon: <ThemeIcon size={15} />,
      onSelect: onCycleTheme,
    },
    {
      id: 'shortcuts',
      label: 'Keyboard shortcuts',
      hint: '?',
      icon: <Keyboard size={15} />,
      onSelect: onOpenShortcuts,
    },
  ];

  return (
    <div className="flex min-h-13 items-center gap-2 px-2.5 py-2 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="bg-primary text-primary-fg text-ui-2xs flex h-6 w-6 flex-none items-center justify-center rounded-lg font-bold">
          CV
        </span>
        <span className="text-fg text-ui-md hidden font-semibold sm:inline">{APP_NAME}</span>

        <span aria-hidden="true" className="bg-border-base hidden h-5 w-px flex-none sm:block" />

        <button
          type="button"
          onClick={onOpenLibrary}
          title="My CVs — switch, duplicate or back up"
          className="tap-target text-fg-muted hover:bg-surface-2 hover:text-fg rounded-control inline-flex min-w-0 items-center gap-1.5 px-1.5 py-1 transition"
        >
          <FolderOpen size={14} className="flex-none" />
          <span className="text-ui max-w-[9rem] truncate md:max-w-[16rem]">
            {documentName || 'Untitled resume'}
          </span>
        </button>

        <SaveStatus state={saveState} className="hidden md:inline-flex" />
      </div>

      <div className="flex flex-none items-center gap-1">
        <button
          type="button"
          onClick={onToggleScorePanel}
          aria-pressed={scorePanelOpen}
          title="ATS score"
          className={cn(
            // From `md`, which is where the tab bar stops carrying a Score
            // tab. Between the two the score had no way in at all: no tab
            // below, no column beside, and a toggle that only appeared at
            // 1024px.
            'tap-target rounded-control text-ui hidden items-center gap-1.5 border px-2.5 py-1.5 font-medium transition md:inline-flex',
            scorePanelOpen
              ? 'border-primary bg-primary-soft'
              : 'border-border-base hover:bg-surface-2',
          )}
        >
          <Gauge size={14} className={SCORE_TONE_CLASS[atsTone]} />
          <span className="text-fg">ATS</span>
          <Badge tone={SCORE_TONE_BADGE[atsTone]}>{atsScore}</Badge>
        </button>

        <div className="hidden items-center gap-0.5 md:flex">
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
          className="mx-1 hidden h-9 w-44 lg:block"
        />

        <Menu
          label="More actions"
          entries={menuEntries}
          trigger={(props) => (
            <Button size="icon" variant="ghost" aria-label="More actions" title="More" {...props}>
              <MoreHorizontal size={17} />
            </Button>
          )}
        />

        <span aria-hidden="true" className="bg-border-base mx-1 hidden h-5 w-px sm:block" />

        <Button
          variant="outline"
          size="sm"
          onClick={onExportAts}
          disabled={pendingExport !== null}
          className="hidden sm:inline-flex"
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

        <span aria-hidden="true" className="bg-border-base mx-1 h-5 w-px" />

        {/*
          Last, past the divider: the account is not one of the document's
          controls. It is still on the strip at 390px, because "am I signed
          in?" is the question behind every refused download, and burying the
          answer in an overflow menu is how somebody concludes the button is
          broken.
        */}
        <UserMenu />
      </div>
    </div>
  );
};
