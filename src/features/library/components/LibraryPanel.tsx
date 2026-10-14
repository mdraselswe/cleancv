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
import { bn } from '@/lib/bn';
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
    setNotice(`${bn(all.length)}টি ডকুমেন্ট এক্সপোর্ট হয়েছে।`);
    toast.success(`${bn(all.length)}টি ডকুমেন্টের ব্যাকআপ নেওয়া হয়েছে`, {
      description: filename,
    });
  };

  const importBackup = async (file: File) => {
    const result = parseBackup(await file.text());

    if (!result.ok) {
      const message = result.error ?? 'ফাইলটি পড়া যায়নি।';

      setNotice(message);
      toast.error(message);

      return;
    }

    const landed = await actions.importDocuments(result.documents);
    const message =
      landed === 0
        ? 'ফিরিয়ে আনার মতো কিছু নেই — ফাইলের সবকিছু আগে থেকেই এখানে আছে, অথবা পুরনো।'
        : `${bn(landed)}টি ডকুমেন্ট ফিরিয়ে আনা হয়েছে।`;

    setNotice(message);
    if (landed === 0) toast(message);
    else toast.success(message);
  };

  const commitRename = async (id: string) => {
    await actions.rename(id, draftName.trim());
    setRenamingId(null);
  };

  return (
    <Drawer label="আমার CV" onClose={onClose}>
      <ModalHeader
        title="আমার CV"
        subtitle={`${bn(documents.length)}টি সংরক্ষিত${atLimit ? ` — সীমা ${bn(MAX_DOCUMENTS)}টি` : ''}`}
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
          নতুন CV
        </Button>

        <ul className="flex flex-col gap-2">
          {documents.map((document, index) => {
            const isActive = document.id === activeId;
            const title = document.name || document.personName || 'নামহীন CV';

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
                      aria-label={`${title}-এর নাম`}
                      className="text-ui h-8"
                      onChange={(event) => setDraftName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void commitRename(document.id);
                        if (event.key === 'Escape') setRenamingId(null);
                      }}
                    />
                    <Button size="sm" onClick={() => void commitRename(document.id)}>
                      সংরক্ষণ
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
                        সংরক্ষিত: {formatRelativeTime(document.updatedAt)}
                      </span>
                    </button>

                    <div className="flex flex-none items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`${title}-এর নাম বদলান`}
                        title="নাম বদলান"
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
                          document.cloud ? `${title}-এর সিঙ্ক বন্ধ করুন` : `${title} আমার অ্যাকাউন্টে সিঙ্ক করুন`
                        }
                        title={
                          document.cloud
                            ? `সিঙ্ক হচ্ছে (${bn(cloudToggle.used)}/${bn(cloudToggle.max)})। বন্ধ করতে ক্লিক করুন।`
                            : `শুধু এই ডিভাইসে আছে। সিঙ্ক করতে ক্লিক করুন (${bn(cloudToggle.used)}/${bn(cloudToggle.max)} ব্যবহৃত)।`
                        }
                        className={document.cloud ? 'text-success' : undefined}
                        onClick={() => void cloudToggle.toggle(document.id, !document.cloud)}
                      >
                        {document.cloud ? <Cloud size={14} /> : <CloudOff size={14} />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`${title} কপি করুন`}
                        title="কপি করুন — একটি চাকরির জন্য কপি সাজান"
                        disabled={atLimit}
                        onClick={() => void actions.duplicate(document.id)}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`${title} মুছুন`}
                        title="মুছে ফেলুন"
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
          <SectionLabel>আপনার CV নিরাপদ রাখা</SectionLabel>
          <p className="text-fg-subtle text-ui-xs mt-1">
            প্রতিটি পরিবর্তন আগে এই ব্রাউজারে সংরক্ষিত হয়, তাই CleanCV অফলাইনেও কাজ করে।
          </p>

          {!sessionPending && signedIn ? (
            <div className="border-border-base rounded-card mt-3 border p-3">
              <div className="flex items-start gap-2.5">
                <HueIcon hue={cloud.status === 'error' ? 'rose' : 'sky'}>
                  {cloud.status === 'error' ? <CloudOff size={16} /> : <Cloud size={16} />}
                </HueIcon>
                <div className="min-w-0 flex-1">
                  <p className="text-fg text-ui font-medium">ক্লাউড সিঙ্ক</p>
                  <p className="text-fg-subtle text-ui-xs mt-0.5">
                    {cloud.status === 'syncing'
                      ? 'এই ব্রাউজার আপনার অ্যাকাউন্টের সঙ্গে সিঙ্ক হচ্ছে…'
                      : cloud.status === 'error'
                        ? cloud.error
                        : `${bn(cloudToggle.max)}টির মধ্যে ${bn(cloudToggle.used)}টি CV আপনার অ্যাকাউন্টে রাখা আছে${
                            cloud.lastSyncedAt
                              ? `, শেষ সিঙ্ক: ${formatRelativeTime(cloud.lastSyncedAt)}`
                              : ''
                          }। বাকি সব CV এই ডিভাইসেই থাকে।`}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="এখনই CV সিঙ্ক করুন"
                  title="এখনই সিঙ্ক করুন"
                  disabled={cloud.status === 'syncing'}
                  onClick={() => void cloud.syncNow()}
                >
                  <RefreshCw size={14} className={cloud.status === 'syncing' ? 'animate-spin' : ''} />
                </Button>
              </div>
            </div>
          ) : !sessionPending ? (
            <div className="border-border-base rounded-card mt-3 border p-3">
              <p className="text-fg text-ui font-medium">সব ডিভাইসে আপনার CV ব্যবহার করুন</p>
              <p className="text-fg-subtle text-ui-xs mt-0.5">
                PDF ডাউনলোড করতে একটি ফ্রি অ্যাকাউন্ট লাগে। এতে আপনার পছন্দের {bn(cloudToggle.max)}টি
                পর্যন্ত CV অ্যাকাউন্টে রাখা যায়, যাতে সেগুলো অন্য ডিভাইসেও পাওয়া যায়। বাকি সব CV শুধু
                এই ডিভাইসেই থাকে।
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
                সিঙ্ক করতে সাইন-ইন করুন
              </Button>
            </div>
          ) : null}

          {workspace.supported ? (
            <div className="border-border-base rounded-card mt-3 border p-3">
              <div className="flex items-center gap-2">
                <HueIcon hue="amber" size="sm">
                  <FolderOpen size={14} />
                </HueIcon>
                <p className="text-fg text-ui font-medium">ওয়ার্কস্পেস ফোল্ডার</p>
              </div>
              <p className="text-fg-subtle text-ui-xs mt-0.5">
                {workspace.folderName
                  ? `প্রতিটি CV “${workspace.folderName}”-এ সংরক্ষিত হচ্ছে। শেষ লেখা: ${formatRelativeTime(workspace.lastSyncedAt)}।`
                  : 'একটি ফোল্ডার বেছে নিন, তাহলে আপনি লেখার সঙ্গে সঙ্গে প্রতিটি CV সেখানে লেখা হবে। Drive বা OneDrive যে ফোল্ডার আগে থেকেই সিঙ্ক করে, সেটি বেছে নিলে বিনা খরচে এই কম্পিউটারের বাইরে একটি ব্যাকআপ পাবেন।'}
              </p>

              {workspace.needsPermission ? (
                <p className="text-warning text-ui-2xs mt-1.5">
                  ব্রাউজার ওই ফোল্ডারের অ্যাক্সেস হারিয়েছে। সংরক্ষণ চালু রাখতে আবার সংযুক্ত করুন।
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant={workspace.folderName ? 'ghost' : 'outline'}
                  leading={<FolderOpen size={14} />}
                  onClick={() => void actions.connectWorkspace()}
                >
                  {workspace.folderName ? 'ফোল্ডার বদলান' : 'একটি ফোল্ডার বেছে নিন'}
                </Button>

                {workspace.folderName ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      leading={<FolderSync size={14} />}
                      onClick={() => void actions.syncWorkspace()}
                    >
                      এখনই সিঙ্ক করুন
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leading={<HardDriveDownload size={14} />}
                      onClick={async () => {
                        const landed = await actions.restoreFromWorkspace();
                        setNotice(
                          landed === 0
                            ? 'ওই ফোল্ডারে নতুন কিছু নেই।'
                            : `ফোল্ডার থেকে ${bn(landed)}টি ডকুমেন্ট ফিরিয়ে আনা হয়েছে।`,
                        );
                      }}
                    >
                      ফোল্ডার থেকে ফিরিয়ে আনুন
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void actions.disconnectWorkspace()}
                    >
                      সংযোগ বিচ্ছিন্ন করুন
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="border-border-base text-fg-subtle rounded-card text-ui-xs mt-3 border p-3">
              এই ব্রাউজার সরাসরি কোনো ফোল্ডারে লিখতে পারে না। তার বদলে একটি ব্যাকআপ ফাইল এক্সপোর্ট
              করুন, আর সেটি এমন জায়গায় রাখুন যেখানে পরে খুঁজে পাবেন।
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              leading={<DownloadCloud size={14} />}
              onClick={() => void exportAll()}
            >
              সবগুলো এক ফাইলে এক্সপোর্ট করুন
            </Button>

            <label
              htmlFor={BACKUP_INPUT_ID}
              className="border-border-base text-fg-muted hover:bg-surface-2 hover:text-fg rounded-control text-ui inline-flex h-8 cursor-pointer items-center gap-1.5 border px-3 font-medium transition"
            >
              ব্যাকআপ ফিরিয়ে আনুন
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
        <Modal label="CV মুছে ফেলুন" onClose={() => setDeletingId(null)} className="max-w-[420px]">
          <ModalHeader title="এই CV মুছে ফেলবেন?" onClose={() => setDeletingId(null)} />
          <div className="flex flex-col gap-4 p-4">
            <p className="text-fg-muted text-ui-md leading-relaxed">
              <strong className="text-fg">
                {(() => {
                  const target = documents.find((entry) => entry.id === deletingId);

                  return target?.name || target?.personName || 'এই CV';
                })()}
              </strong>{' '}
              এই ব্রাউজার থেকে মুছে যাবে। পরে ফিরে পেতে চাইলে আগে একটি ব্যাকআপ ডাউনলোড করে নিন।
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeletingId(null)}>
                রেখে দিন
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const id = deletingId;

                  setDeletingId(null);
                  void actions.remove(id);
                }}
              >
                মুছে ফেলুন
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </Drawer>
  );
};
