'use client';

import {
  ChevronDown,
  Cloud,
  CloudOff,
  Download,
  FileJson,
  FileUp,
  FolderOpen,
  Keyboard,
  Loader2,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Redo2,
  Target,
  Sun,
  Undo2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

import { BrandMark } from '@/components/brand';
import { Button, Menu, type MenuEntry } from '@/components/ui';
import { APP_NAME, ROUTES } from '@/constants';
import { UserMenu } from '@/features/auth';
import { IMPORT_INPUT_ID } from '@/features/export';
import type { SaveState } from '@/features/library';
import type { ThemePreference } from '@/hooks';
import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';

import { SaveStatus } from './SaveStatus';

const SCORE_TONE_VAR = {
  excellent: 'var(--score-excellent)',
  strong: 'var(--score-strong)',
  fair: 'var(--score-fair)',
  poor: 'var(--score-poor)',
} as const;

const THEME_ICON: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_LABEL: Record<ThemePreference, string> = {
  light: 'থিম: লাইট',
  dark: 'থিম: ডার্ক',
  system: 'থিম: সিস্টেম অনুযায়ী',
};

export interface ToolbarProps {
  documentName: string;
  saveState: SaveState;
  onOpenLibrary: () => void;
  onOpenImport: () => void;
  /** Jumps the editor to the design panel — the template picker on a phone. */
  onOpenDesign: () => void;
  /** Jumps to the Job match panel: paste a posting, tailor a copy. */
  onOpenJob: () => void;
  onOpenShortcuts: () => void;

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

  /** This CV is also kept on the server. */
  cloudSynced: boolean;
  cloudUsed: number;
  cloudMax: number;
  onToggleCloud: () => void;

  atsScore: number;
  atsTone: 'excellent' | 'strong' | 'fair' | 'poor';
  onToggleScorePanel: () => void;
  scorePanelOpen: boolean;
}

/**
 * The application bar: one row at every width.
 *
 * What stays visible is what the reader needs to know and do without
 * thinking — where home is, which CV is open, whether it is saved, the score,
 * and how to get the PDF out. Everything else collapses into one overflow menu
 * instead of disappearing: a narrow window loses the shortcut, never the
 * action.
 *
 * Downloading is one primary button with its siblings on a chevron — the
 * designed PDF is what nearly everyone wants, and the ATS PDF and the JSON
 * backup are one click behind it rather than three competing buttons.
 */
export const Toolbar = ({
  documentName,
  saveState,
  onOpenLibrary,
  onOpenImport,
  onOpenDesign,
  onOpenJob,
  onOpenShortcuts,
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
  cloudSynced,
  cloudUsed,
  cloudMax,
  onToggleCloud,
  atsScore,
  atsTone,
  onToggleScorePanel,
  scorePanelOpen,
}: ToolbarProps) => {
  const ThemeIcon = THEME_ICON[themePreference];

  const menuEntries: MenuEntry[] = [
    {
      id: 'undo',
      label: 'ফিরিয়ে নিন',
      hint: 'Ctrl+Z',
      icon: <Undo2 size={15} />,
      disabled: !canUndo,
      onSelect: onUndo,
    },
    {
      id: 'redo',
      label: 'আবার করুন',
      hint: 'Ctrl+Shift+Z',
      icon: <Redo2 size={15} />,
      disabled: !canRedo,
      onSelect: onRedo,
    },
    { id: 'sep-1', separator: true },
    {
      id: 'cloud',
      label: cloudSynced ? 'এই CV-র সিঙ্ক বন্ধ করুন' : 'এই CV আমার অ্যাকাউন্টে সিঙ্ক করুন',
      hint: `${bn(cloudUsed)} / ${bn(cloudMax)}`,
      icon: cloudSynced ? <CloudOff size={15} /> : <Cloud size={15} />,
      onSelect: onToggleCloud,
    },
    {
      id: 'job',
      label: 'চাকরির বিজ্ঞপ্তি অনুযায়ী সাজান',
      icon: <Target size={15} />,
      onSelect: onOpenJob,
    },
    {
      id: 'design',
      label: 'ডিজাইন বদলান',
      icon: <Palette size={15} />,
      onSelect: onOpenDesign,
    },
    {
      id: 'import',
      label: 'CV ফাইল ইমপোর্ট করুন',
      icon: <FileUp size={15} />,
      onSelect: onOpenImport,
    },
    {
      id: 'restore',
      label: 'JSON ব্যাকআপ ফিরিয়ে আনুন',
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
    { id: 'sep-2', separator: true },
    {
      id: 'theme',
      label: THEME_LABEL[themePreference],
      icon: <ThemeIcon size={15} />,
      onSelect: onCycleTheme,
    },
    {
      id: 'shortcuts',
      label: 'কীবোর্ড শর্টকাট',
      hint: '?',
      icon: <Keyboard size={15} />,
      onSelect: onOpenShortcuts,
    },
  ];

  const downloadEntries: MenuEntry[] = [
    {
      id: 'design-pdf',
      label: 'ডিজাইন করা PDF',
      hint: 'Ctrl+S',
      icon: <Download size={15} />,
      disabled: pendingExport !== null,
      onSelect: onExportDesign,
    },
    {
      id: 'ats-pdf',
      label: 'ATS-সেফ PDF',
      icon: <Download size={15} />,
      disabled: pendingExport !== null,
      onSelect: onExportAts,
    },
    { id: 'sep-dl', separator: true },
    {
      id: 'json',
      label: 'JSON ব্যাকআপ',
      icon: <FileJson size={15} />,
      onSelect: onExportJson,
    },
  ];

  return (
    <div className="flex min-h-15 items-center gap-2 px-2.5 py-2 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          href={ROUTES.home}
          title={`${APP_NAME} হোম`}
          aria-label={`${APP_NAME} হোম`}
          className="tap-target rounded-control hover:bg-surface-2 flex flex-none items-center gap-2 p-1 transition"
        >
          <BrandMark className="h-8 w-8 drop-shadow-sm" />
          <span className="app-gradient-text text-ui-lg hidden font-extrabold tracking-tight lg:block">
            {APP_NAME}
          </span>
        </Link>

        <span aria-hidden="true" className="bg-border-base hidden h-5 w-px flex-none sm:block" />

        <button
          type="button"
          onClick={onOpenLibrary}
          title="আমার CV — বদলান, কপি করুন বা ব্যাকআপ নিন"
          className="tap-target border-border-base bg-surface/70 text-fg-muted hover:border-primary/30 hover:bg-primary-soft hover:text-fg rounded-control inline-flex min-w-0 items-center gap-1.5 border px-2.5 py-1.5 shadow-sm transition"
        >
          <FolderOpen size={14} className="text-primary flex-none" />
          <span className="text-ui max-w-[9rem] truncate md:max-w-[16rem]">
            {documentName || 'নামহীন CV'}
          </span>
        </button>

        <SaveStatus state={saveState} className="hidden md:inline-flex" />

        <button
          type="button"
          onClick={onToggleCloud}
          aria-pressed={cloudSynced}
          title={
            cloudSynced
              ? `আপনার অ্যাকাউন্টে রাখা আছে (${bn(cloudUsed)}/${bn(cloudMax)})। সিঙ্ক বন্ধ করতে ক্লিক করুন।`
              : `শুধু এই ডিভাইসে আছে। অ্যাকাউন্টে সিঙ্ক করতে ক্লিক করুন (${bn(cloudUsed)}/${bn(cloudMax)} ব্যবহৃত)।`
          }
          className={cn(
            'tap-target rounded-control text-ui-xs hidden items-center gap-1.5 border px-2 py-1 font-semibold transition lg:inline-flex',
            cloudSynced
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-border-base bg-surface/60 text-fg-muted hover:border-primary/30 hover:text-fg',
          )}
        >
          {cloudSynced ? <Cloud size={13} /> : <CloudOff size={13} />}
          {cloudSynced ? 'সিঙ্ক হচ্ছে' : 'শুধু এই ডিভাইসে'}
        </button>
      </div>

      <div className="flex flex-none items-center gap-1">
        {/*
          The score lives here as a number, always. The breakdown is a drawer
          at every width that has two panes; the chip is the way into it, and
          the phone has a tab of its own.
        */}
        <button
          type="button"
          onClick={onToggleScorePanel}
          aria-pressed={scorePanelOpen}
          title="ATS স্কোর"
          className={cn(
            'tap-target rounded-control text-ui hidden items-center gap-2 border py-1 pr-2.5 pl-1.5 font-semibold transition md:inline-flex',
            scorePanelOpen
              ? 'border-primary/40 bg-primary-soft shadow-sm'
              : 'border-border-base bg-surface/60 hover:border-primary/30 hover:bg-primary-soft',
          )}
        >
          <MiniRing score={atsScore} color={SCORE_TONE_VAR[atsTone]} />
          <span className="text-fg">ATS</span>
        </button>

        <div className="hidden items-center gap-0.5 md:flex">
          <Button
            size="icon"
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="ফিরিয়ে নিন"
            title="ফিরিয়ে নিন (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="আবার করুন"
            title="আবার করুন (Ctrl+Shift+Z)"
          >
            <Redo2 size={15} />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenJob}
          className="hidden xl:inline-flex"
          leading={<Target size={14} />}
        >
          জব ম্যাচ
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDesign}
          className="hidden lg:inline-flex"
          leading={<Palette size={14} />}
        >
          ডিজাইন
        </Button>

        <Menu
          label="আরও অ্যাকশন"
          entries={menuEntries}
          trigger={(props) => (
            <Button size="icon" variant="ghost" aria-label="আরও অ্যাকশন" title="আরও" {...props}>
              <MoreHorizontal size={17} />
            </Button>
          )}
        />

        <div className="flex items-stretch">
          <Button
            variant="primary"
            size="md"
            onClick={onExportDesign}
            disabled={pendingExport !== null}
            className="rounded-r-none"
            leading={
              pendingExport !== null ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )
            }
          >
            ডাউনলোড
          </Button>
          <Menu
            label="ডাউনলোডের বিকল্প"
            entries={downloadEntries}
            trigger={(props) => (
              <Button
                variant="primary"
                size="icon"
                aria-label="আরও ডাউনলোডের বিকল্প"
                title="আরও ডাউনলোডের বিকল্প"
                className="w-8 rounded-l-none border-l border-white/25"
                {...props}
              >
                <ChevronDown size={15} />
              </Button>
            )}
          />
        </div>

        <span aria-hidden="true" className="bg-border-base mx-0.5 h-6 w-px" />

        {/*
          Last, past the divider: the account is not one of the document's
          controls. It remains visible because it is how readers know whether
          this browser is syncing their CVs to other devices.
        */}
        <UserMenu />
      </div>
    </div>
  );
};

/** A score as a small ring with its number inside; the toolbar's whole readout. */
const MiniRing = ({ score, color }: { score: number; color: string }) => {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <span className="relative inline-flex h-7 w-7 flex-none items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r={radius} fill="none" stroke="var(--app-border)" strokeWidth="3" />
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
          transform="rotate(-90 14 14)"
          style={{ transition: 'stroke-dasharray 420ms ease' }}
        />
      </svg>
      <span
        className="text-ui-2xs absolute leading-none font-bold tabular-nums"
        style={{ color }}
        aria-label={`ATS স্কোর ${bn(clamped)}`}
      >
        {bn(clamped)}
      </span>
    </span>
  );
};
