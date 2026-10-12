'use client';

import {
  Cloud,
  CloudOff,
  Copy,
  FilePenLine,
  MoreHorizontal,
  PencilLine,
  Trash2,
} from 'lucide-react';

import { Badge, Button, Menu, type Hue, type MenuEntry } from '@/components/ui';
import type { DocumentMeta } from '@/features/library';
import type { Resume } from '@/features/resume';
import { TemplatePreview, getTemplate } from '@/features/templates';
import { formatRelativeTime } from '@/lib/date';
import { isBlank } from '@/lib/text';
import { cn } from '@/lib/cn';

/** Thumbnail width in pixels; the page height follows A4. */
const THUMB_WIDTH = 196;

export interface DocumentCardProps {
  meta: DocumentMeta;
  resume: Resume | undefined;
  hue: Hue;
  active: boolean;
  /** Also kept on the server, under the signed-in account. */
  synced: boolean;
  syncUsed: number;
  syncMax: number;
  onToggleSync: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * One saved CV, drawn as its own first page.
 *
 * The whole card opens the document; the three less common actions sit in a
 * menu so the card is one large target rather than four small ones. The
 * thumbnail is the real template at real size, scaled — a name alone does not
 * tell someone with six drafts which one is which.
 */
export const DocumentCard = ({
  meta,
  resume,
  hue,
  active,
  synced,
  syncUsed,
  syncMax,
  onToggleSync,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: DocumentCardProps) => {
  const title = meta.name || meta.personName || resume?.basics.fullName || 'Untitled CV';
  const empty =
    resume !== undefined &&
    isBlank(resume.basics.fullName) &&
    isBlank(resume.summary.text) &&
    resume.experience.length === 0;

  const entries: MenuEntry[] = [
    { id: 'open', label: 'Open', icon: <FilePenLine size={15} />, onSelect: onOpen },
    { id: 'rename', label: 'Rename', icon: <PencilLine size={15} />, onSelect: onRename },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy size={15} />, onSelect: onDuplicate },
    {
      id: 'sync',
      label: synced ? 'Stop syncing' : 'Sync to my account',
      hint: `${syncUsed} of ${syncMax}`,
      icon: synced ? <CloudOff size={15} /> : <Cloud size={15} />,
      onSelect: onToggleSync,
    },
    { id: 'sep', separator: true },
    { id: 'delete', label: 'Delete', icon: <Trash2 size={15} />, danger: true, onSelect: onDelete },
  ];

  return (
    <article
      className={cn(
        `hue-${hue} card-lift group border-border-base bg-surface rounded-panel relative flex flex-col border has-[[aria-expanded=true]]:z-30`,
        active && 'border-hue/50 ring-hue/20 ring-2',
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${title}`}
        className="bg-dots rounded-t-panel relative flex flex-col items-center overflow-hidden px-4 pt-5 pb-0 text-left"
        style={{
          background:
            'linear-gradient(180deg, var(--hue-soft), color-mix(in srgb, var(--hue) 4%, var(--app-surface)))',
        }}
      >
        <span className="shadow-sheet relative block h-[200px] w-full max-w-[196px] overflow-hidden rounded-t-[3px] bg-white transition duration-300 group-hover:-translate-y-1">
          {resume ? (
            <TemplatePreview
              templateId={resume.meta.templateId}
              resume={resume}
              width={THUMB_WIDTH}
            />
          ) : (
            <span className="skeleton block h-full w-full" />
          )}

          {empty ? (
            <span className="bg-surface/75 absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
              <Badge tone="neutral">Empty draft</Badge>
            </span>
          ) : null}
        </span>
      </button>

      <div className="flex items-start gap-2 p-3.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-fg text-ui-md truncate font-semibold">{title}</h3>
          <p className="text-fg-subtle text-ui-xs mt-0.5 truncate">
            Edited {formatRelativeTime(meta.updatedAt)}
            {resume ? ` · ${getTemplate(resume.meta.templateId).meta.name}` : ''}
          </p>
          <button
            type="button"
            onClick={onToggleSync}
            title={
              synced
                ? 'Kept on your account. Click to stop syncing.'
                : `Only on this device. Click to sync (${syncUsed} of ${syncMax} used).`
            }
            className={`tap-target text-ui-2xs mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold transition ${
              synced
                ? 'bg-success/12 text-success hover:bg-success/20'
                : 'bg-surface-2 text-fg-subtle hover:text-fg'
            }`}
          >
            {synced ? <Cloud size={11} /> : <CloudOff size={11} />}
            {synced ? 'Synced to account' : 'This device only'}
          </button>
        </div>

        <Menu
          label={`Actions for ${title}`}
          entries={entries}
          trigger={(props) => (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Actions for ${title}`}
              className="-mt-1 -mr-1.5"
              {...props}
            >
              <MoreHorizontal size={17} />
            </Button>
          )}
        />
      </div>

      {active ? (
        <span className="bg-hue absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm">
          Last opened
        </span>
      ) : null}
    </article>
  );
};
