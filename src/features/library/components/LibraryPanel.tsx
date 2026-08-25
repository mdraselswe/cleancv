'use client';

import {
  AlertTriangle,
  Copy,
  DownloadCloud,
  FolderOpen,
  FolderSync,
  HardDriveDownload,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { Button, Input, SectionLabel } from '@/components/ui';
import { MAX_DOCUMENTS } from '@/constants';
import { downloadText } from '@/features/export';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/cn';

import { backupFilename, parseBackup, serializeBackup } from '../backup';
import { readAllDocuments, readIndex } from '../storage';
import { useLibraryStore } from '../useLibrary';

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
  const { status, documents, activeId, workspace, error, actions } = useLibraryStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [notice, setNotice] = useState('');
  const backupInput = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const atLimit = documents.length >= MAX_DOCUMENTS;

  const exportAll = async () => {
    const all = await readAllDocuments(await readIndex());
    downloadText(serializeBackup(all), backupFilename());
    setNotice(`Exported ${all.length} document${all.length === 1 ? '' : 's'}.`);
  };

  const importBackup = async (file: File) => {
    const result = parseBackup(await file.text());

    if (!result.ok) {
      setNotice(result.error ?? 'That file could not be read.');

      return;
    }

    const landed = await actions.importDocuments(result.documents);
    setNotice(
      landed === 0
        ? 'Nothing to restore — everything in that file is already here, or older.'
        : `Restored ${landed} document${landed === 1 ? '' : 's'}.`,
    );
  };

  const commitRename = async (id: string) => {
    await actions.rename(id, draftName.trim());
    setRenamingId(null);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close the library"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />

      <aside
        aria-label="My CVs"
        className="border-border-base bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-app"
      >
        <header className="border-border-base flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-fg text-[15px] font-semibold">My CVs</h2>
            <p className="text-fg-subtle text-[12px]">
              {documents.length} saved{atLimit ? ` — the limit is ${MAX_DOCUMENTS}` : ''}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X size={16} />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {status === 'unavailable' ? (
            <p className="border-danger text-danger mb-3 flex gap-2 rounded-lg border px-3 py-2 text-[12.5px]">
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
                    'rounded-xl border px-3 py-2.5 transition',
                    isActive ? 'border-primary bg-primary-soft' : 'border-border-base',
                  )}
                >
                  {renamingId === document.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={draftName}
                        aria-label={`Name for ${title}`}
                        className="h-8 text-[13px]"
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
                        <span className="text-fg block truncate text-[13.5px] font-medium">
                          {title}
                        </span>
                        <span className="text-fg-subtle block truncate text-[11.5px]">
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
                          <span className="text-[13px]">Aa</span>
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
            <p className="text-fg-subtle mt-1 text-[12px]">
              Everything above lives in this browser. Clearing site data erases it, so keep a copy
              somewhere the browser cannot reach.
            </p>

            {workspace.supported ? (
              <div className="border-border-base mt-3 rounded-xl border p-3">
                <p className="text-fg text-[13px] font-medium">Workspace folder</p>
                <p className="text-fg-subtle mt-0.5 text-[12px]">
                  {workspace.folderName
                    ? `Saving every CV into “${workspace.folderName}”. Last write ${formatRelativeTime(workspace.lastSyncedAt)}.`
                    : 'Pick a folder and every CV is written there as you type. Choose one that Drive or OneDrive already syncs and you get an off-machine backup for free.'}
                </p>

                {workspace.needsPermission ? (
                  <p className="text-warning mt-1.5 text-[11.5px]">
                    The browser has dropped access to that folder. Connect it again to resume
                    saving.
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
              <p className="border-border-base text-fg-subtle mt-3 rounded-xl border p-3 text-[12px]">
                This browser cannot write to a folder directly. Export a backup file instead, and
                keep it somewhere you will find it again.
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
                className="border-border-base text-fg-muted hover:bg-surface-2 hover:text-fg inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition"
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

            {notice ? <p className="text-fg-muted mt-2 text-[12px]">{notice}</p> : null}
          </div>
        </div>
      </aside>
    </>
  );
};
