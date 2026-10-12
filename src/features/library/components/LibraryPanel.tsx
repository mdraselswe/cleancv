'use client';

import {
  AlertTriangle,
  Cloud,
  CloudOff,
  Copy,
  FileText,
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

import {
  Button,
  Drawer,
  HueIcon,
  Input,
  Modal,
  ModalHeader,
  SectionLabel,
  type Hue,
} from '@/components/ui';
import { AUTH_ROUTES, MAX_DOCUMENTS, REDIRECT_PARAM, ROUTES } from '@/constants';
import { useAuthSession } from '@/features/auth';
import { downloadText } from '@/features/export';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/cn';

import { backupFilename, parseBackup, serializeBackup } from '../backup';
import { useCloudToggle } from '../useCloudToggle';
import { readAllDocuments, readIndex } from '../storage';
import { useLibraryStore } from '../useLibrary';
import { useCloudSyncStore } from '../useCloudSync';

const BACKUP_INPUT_ID = 'cv-library-backup-input';

const ROW_HUES: readonly Hue[] = ['indigo', 'pink', 'amber', 'emerald', 'violet', 'sky', 'rose', 'teal'];

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
  const cloudToggle = useCloudToggle();
  const { status, documents, activeId, workspace, error, actions } = useLibraryStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
          {documents.map((document, index) => {
            const isActive = document.id === activeId;
            const title = document.name || document.personName || 'Untitled CV';

            return (
              <li
                key={document.id}
                className={cn(
                  `hue-${ROW_HUES[index % ROW_HUES.length]} rounded-card card-lift border px-3 py-2.5 transition`,
                  isActive ? 'border-hue/60 bg-hue-soft' : 'border-border-base bg-surface',
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
                  <div className="flex items-center gap-2.5">
                    <HueIcon hue={ROW_HUES[index % ROW_HUES.length]} solid={isActive}>
                      <FileText size={16} />
                    </HueIcon>
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
                        aria-label={
                          document.cloud ? `Stop syncing ${title}` : `Sync ${title} to my account`
                        }
                        title={
                          document.cloud
                            ? `Synced (${cloudToggle.used} of ${cloudToggle.max}). Click to stop.`
                            : `This device only. Click to sync (${cloudToggle.used} of ${cloudToggle.max} used).`
                        }
                        className={document.cloud ? 'text-success' : undefined}
                        onClick={() => void cloudToggle.toggle(document.id, !document.cloud)}
                      >
                        {document.cloud ? <Cloud size={14} /> : <CloudOff size={14} />}
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
                        onClick={() => setDeletingId(document.id)}
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
                <HueIcon hue={cloud.status === 'error' ? 'rose' : 'sky'}>
                  {cloud.status === 'error' ? <CloudOff size={16} /> : <Cloud size={16} />}
                </HueIcon>
                <div className="min-w-0 flex-1">
                  <p className="text-fg text-ui font-medium">Cloud sync</p>
                  <p className="text-fg-subtle text-ui-xs mt-0.5">
                    {cloud.status === 'syncing'
                      ? 'Syncing this browser with your account…'
                      : cloud.status === 'error'
                        ? cloud.error
                        : `${cloudToggle.used} of ${cloudToggle.max} CVs are kept on your account${
                            cloud.lastSyncedAt
                              ? `, last synced ${formatRelativeTime(cloud.lastSyncedAt)}`
                              : ''
                          }. Every other CV stays on this device.`}
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
                A free account is needed to download PDFs. It also lets you keep up to{' '}
                {cloudToggle.max} CVs of your choice on your account so they follow you to other
                devices. Every other CV stays on this device only.
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
              <div className="flex items-center gap-2">
                <HueIcon hue="amber" size="sm">
                  <FolderOpen size={14} />
                </HueIcon>
                <p className="text-fg text-ui font-medium">Workspace folder</p>
              </div>
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
      {deletingId ? (
        <Modal label="Delete CV" onClose={() => setDeletingId(null)} className="max-w-[420px]">
          <ModalHeader title="Delete this CV?" onClose={() => setDeletingId(null)} />
          <div className="flex flex-col gap-4 p-4">
            <p className="text-fg-muted text-ui-md leading-relaxed">
              <strong className="text-fg">
                {(() => {
                  const target = documents.find((entry) => entry.id === deletingId);

                  return target?.name || target?.personName || 'This CV';
                })()}
              </strong>{' '}
              will be removed from this browser. Download a backup first if you might want it back.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeletingId(null)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const id = deletingId;

                  setDeletingId(null);
                  void actions.remove(id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </Drawer>
  );
};
