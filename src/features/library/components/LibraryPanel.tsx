'use client';

import {
  AlertTriangle,
  Cloud,
  CloudOff,
  Copy,
  DownloadCloud,
  FolderOpen,
  FolderSync,
  HardDriveDownload,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button, Drawer, Input, ModalHeader, SectionLabel } from '@/components/ui';
import { AUTH_ROUTES, MAX_DOCUMENTS, REDIRECT_PARAM, ROUTES } from '@/constants';
import { useAuthSession } from '@/features/auth';
import { downloadText } from '@/features/export';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/cn';

import { backupFilename, parseBackup, serializeBackup } from '../backup';
import { readAllDocuments, readIndex } from '../storage';
import { useLibraryStore } from '../useLibrary';
import { useCloudSyncStore } from '../useCloudSync';

const BACKUP_INPUT_ID = 'cv-library-backup-input';

export interface LibraryPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The document library: every saved CV, and the two ways of keeping them.
 *
 * The workspace folder is given more room than a settings toggle usually gets,
 * because it is the only thing here that survives clearing browser data — and a
 * user who does not understand that will find out the hard way.
 */
export const LibraryPanel = ({ open, onClose }: LibraryPanelProps) => {
  const router = useRouter();
  const { signedIn, pending: sessionPending } = useAuthSession();
  const cloud = useCloudSyncStore();
  const { status, documents, activeId, workspace, error, actions } = useLibraryStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [notice, setNotice] = useState('');
  const backupInput = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const atLimit = documents.length >= MAX_DOCUMENTS;

  const exportAll = async () => {
    const all = await readAllDocuments(await readIndex());
    const filename = backupFilename();

    downloadText(serializeBackup(all), filename);
    setNotice(`Exported ${all.length} document${all.length === 1 ? '' : 's'}.`);
    toast.success(`Backed up ${all.length} document${all.length === 1 ? '' : 's'}`, {
      description: filename,
    });
  };

  const importBackup = async (file: File) => {
    const result = parseBackup(await file.text());

    if (!result.ok) {
      const message = result.error ?? 'That file could not be read.';

      setNotice(message);
      toast.error(message);

      return;
    }

    const landed = await actions.importDocuments(result.documents);
    const message =
      landed === 0
        ? 'Nothing to restore — everything in that file is already here, or older.'
        : `Restored ${landed} document${landed === 1 ? '' : 's'}.`;

    setNotice(message);
    if (landed === 0) toast(message);
    else toast.success(message);
  };

  const commitRename = async (id: string) => {
    await actions.rename(id, draftName.trim());
    setRenamingId(null);
  };

  return (
    <Drawer label="My CVs" onClose={onClose}>
      <ModalHeader
        title="My CVs"
        subtitle={`${documents.length} saved${atLimit ? ` — the limit is ${MAX_DOCUMENTS}` : ''}`}
        onClose={onClose}
      />

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {status === 'unavailable' ? (
          <p className="border-danger text-danger rounded-control text-ui-xs mb-3 flex gap-2 border px-3 py-2">
            <AlertTriangle size={15} className="mt-0.5 flex-none" />
            <span>{error}</span>
          </p>
        ) : null}

        <Button
          variant="primary"
          className="mb-3 w-full"
          disabled={atLimit || status !== 'ready'}
          leading={<Plus size={14} />}
          onClick={() => void actions.createNew()}
        >
          New CV
        </Button>

        <ul className="flex flex-col gap-2">
          {documents.map((document) => {
            const isActive = document.id === activeId;
            const title = document.name || document.personName || 'Untitled CV';

            return (
              <li
                key={document.id}
                className={cn(
                  'rounded-card border px-3 py-2.5 transition',
                  isActive ? 'border-primary bg-primary-soft' : 'border-border-base',
                )}
              >
                {renamingId === document.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={draftName}
                      aria-label={`Name for ${title}`}
                      className="text-ui h-8"
                      onChange={(event) => setDraftName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void commitRename(document.id);
                        if (event.key === 'Escape') setRenamingId(null);
                      }}
                    />
                    <Button size="sm" onClick={() => void commitRename(document.id)}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => void actions.open(document.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="text-fg text-ui block truncate font-medium">{title}</span>
                      <span className="text-fg-subtle text-ui-2xs block truncate">
                        {document.personName && document.name ? `${document.personName} · ` : ''}
                        saved {formatRelativeTime(document.updatedAt)}
                      </span>
                    </button>

                    <div className="flex flex-none items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Rename ${title}`}
                        title="Rename"
                        onClick={() => {
                          setRenamingId(document.id);
                          setDraftName(document.name);
                        }}
                      >
                        <span className="text-ui">Aa</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Duplicate ${title}`}
                        title="Duplicate — tailor a copy to one job"
                        disabled={atLimit}
                        onClick={() => void actions.duplicate(document.id)}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${title}`}
                        title="Delete"
                        onClick={() => void actions.remove(document.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="border-border-base mt-5 border-t pt-4">
          <SectionLabel>Keeping your CVs safe</SectionLabel>
          <p className="text-fg-subtle text-ui-xs mt-1">
            Every edit is saved in this browser first, so CleanCV keeps working offline.
          </p>

          {!sessionPending && signedIn ? (
            <div className="border-border-base rounded-card mt-3 border p-3">
              <div className="flex items-start gap-2.5">
                <span className="bg-primary-soft text-primary rounded-control flex h-8 w-8 flex-none items-center justify-center">
                  {cloud.status === 'error' ? <CloudOff size={16} /> : <Cloud size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-fg text-ui font-medium">Cloud sync</p>
                  <p className="text-fg-subtle text-ui-xs mt-0.5">
                    {cloud.status === 'syncing'
                      ? 'Syncing this browser with your account…'
                      : cloud.status === 'error'
                        ? cloud.error
                        : cloud.lastSyncedAt
                          ? `Available on your other devices. Last synced ${formatRelativeTime(cloud.lastSyncedAt)}.`
                          : 'Your CVs will be available anywhere you sign in.'}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Sync CVs now"
                  title="Sync now"
                  disabled={cloud.status === 'syncing'}
                  onClick={() => void cloud.syncNow()}
                >
                  <RefreshCw size={14} className={cloud.status === 'syncing' ? 'animate-spin' : ''} />
                </Button>
              </div>
            </div>
          ) : !sessionPending ? (
            <div className="border-border-base rounded-card mt-3 border p-3">
              <p className="text-fg text-ui font-medium">Use your CVs on every device</p>
              <p className="text-fg-subtle text-ui-xs mt-0.5">
                Sign in for free cloud sync. Downloads and every editor feature remain free without
                an account.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                leading={<Cloud size={14} />}
                onClick={() =>
                  router.push(
                    `${AUTH_ROUTES.signIn}?${REDIRECT_PARAM}=${encodeURIComponent(ROUTES.editor)}`,
                  )
                }
              >
                Sign in to sync
              </Button>
            </div>
          ) : null}

          {workspace.supported ? (
            <div className="border-border-base rounded-card mt-3 border p-3">
              <p className="text-fg text-ui font-medium">Workspace folder</p>
              <p className="text-fg-subtle text-ui-xs mt-0.5">
                {workspace.folderName
                  ? `Saving every CV into “${workspace.folderName}”. Last write ${formatRelativeTime(workspace.lastSyncedAt)}.`
                  : 'Pick a folder and every CV is written there as you type. Choose one that Drive or OneDrive already syncs and you get an off-machine backup for free.'}
              </p>

              {workspace.needsPermission ? (
                <p className="text-warning text-ui-2xs mt-1.5">
                  The browser has dropped access to that folder. Connect it again to resume saving.
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant={workspace.folderName ? 'ghost' : 'outline'}
                  leading={<FolderOpen size={14} />}
                  onClick={() => void actions.connectWorkspace()}
                >
                  {workspace.folderName ? 'Change folder' : 'Choose a folder'}
                </Button>

                {workspace.folderName ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      leading={<FolderSync size={14} />}
                      onClick={() => void actions.syncWorkspace()}
                    >
                      Sync now
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leading={<HardDriveDownload size={14} />}
                      onClick={async () => {
                        const landed = await actions.restoreFromWorkspace();
                        setNotice(
                          landed === 0
                            ? 'Nothing new in that folder.'
                            : `Restored ${landed} document${landed === 1 ? '' : 's'} from the folder.`,
                        );
                      }}
                    >
                      Restore from folder
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void actions.disconnectWorkspace()}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="border-border-base text-fg-subtle rounded-card text-ui-xs mt-3 border p-3">
              This browser cannot write to a folder directly. Export a backup file instead, and keep
              it somewhere you will find it again.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              leading={<DownloadCloud size={14} />}
              onClick={() => void exportAll()}
            >
              Export all as one file
            </Button>

            <label
              htmlFor={BACKUP_INPUT_ID}
              className="border-border-base text-fg-muted hover:bg-surface-2 hover:text-fg rounded-control text-ui inline-flex h-8 cursor-pointer items-center gap-1.5 border px-3 font-medium transition"
            >
              Restore a backup
            </label>
            <input
              ref={backupInput}
              id={BACKUP_INPUT_ID}
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importBackup(file);
                event.target.value = '';
              }}
            />
          </div>

          {notice ? <p className="text-fg-muted text-ui-xs mt-2">{notice}</p> : null}
        </div>
      </div>
    </Drawer>
  );
};
