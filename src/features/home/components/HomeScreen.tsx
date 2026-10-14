'use client';

import { DatabaseBackup, HardDriveDownload, Plus } from 'lucide-react';
import { useRef } from 'react';

import { EmptyIllustration } from '@/components/illustrations';
import { Button, Toaster, type Hue } from '@/components/ui';
import { ImportDialog } from '@/features/import';
import { useCloudSync, useLibrarySync } from '@/features/library';
import { useResume } from '@/features/resume';
import { bn } from '@/lib/bn';

import { useHome } from '../hooks/useHome';
import { DeleteDialog, RenameDialog } from './DocumentDialogs';
import { DocumentCard } from './DocumentCard';
import { HeroSection } from './HeroSection';
import { FreeBanner } from './FreeBanner';
import { HomeHeader } from './HomeHeader';
import { SiteFooter } from './SiteFooter';
import { HowItWorks } from './HowItWorks';
import { TemplateStrip } from './TemplateStrip';

const CARD_HUES: readonly Hue[] = ['indigo', 'pink', 'amber', 'emerald', 'violet', 'sky', 'rose', 'teal'];

/**
 * The landing page and the reader's own list of CVs.
 *
 * It owns no document logic: `useHome` creates, opens and removes, and this
 * draws. The editor is a separate route, so a reader with six CVs chooses one
 * on purpose instead of being dropped into whichever was open last.
 */
export const HomeScreen = () => {
  // Boots the library and keeps the active document written back, as the editor does.
  useLibrarySync();
  useCloudSync();

  const home = useHome();
  const resume = useResume();
  const restoreInput = useRef<HTMLInputElement>(null);
  const loading = home.status === 'loading';

  const nameOf = (id: string): string => {
    const meta = home.documents.find((entry) => entry.id === id);

    return meta?.name || meta?.personName || home.resumes[id]?.basics.fullName || 'নামহীন CV';
  };

  return (
    <div className="bg-bg min-h-dvh">
      <FreeBanner />
      <HomeHeader />

      <main>
        <HeroSection
          onCreate={() => void home.createBlank()}
          onSample={() => void home.createFromSample()}
          onImport={() => void home.beginImport()}
          disabled={loading}
        />

        <section id="my-cvs" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-fg text-2xl font-extrabold tracking-tight">আমার CV</h2>
              <p className="text-fg-subtle text-ui-md mt-0.5">
                {loading
                  ? 'আপনার লাইব্রেরি খোলা হচ্ছে…'
                  : `এই ব্রাউজারে ${bn(home.documents.length)}টি সংরক্ষিত আছে। সম্পাদনা চালিয়ে যেতে একটি বেছে নিন।`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => restoreInput.current?.click()}
                leading={<DatabaseBackup size={14} />}
              >
                ব্যাকআপ ফিরিয়ে আনুন
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void home.backupAll()}
                disabled={loading || home.documents.length === 0}
                leading={<HardDriveDownload size={14} />}
              >
                সবগুলোর ব্যাকআপ নিন
              </Button>
            </div>
          </div>

          {home.status === 'unavailable' ? (
            <p className="border-danger/30 bg-danger/10 text-danger text-ui-md rounded-card mb-5 border px-4 py-3">
              {home.error}
            </p>
          ) : null}

          {loading ? (
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {[0, 1, 2].map((key) => (
                <div key={key} className="skeleton rounded-panel h-[318px]" />
              ))}
            </div>
          ) : (
            <ul className="stagger grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              <li className="relative">
                <button
                  type="button"
                  onClick={() => void home.createBlank()}
                  disabled={home.atLimit}
                  className="card-lift border-primary/30 bg-primary-soft/40 text-primary hover:bg-primary-soft rounded-panel flex h-full min-h-[318px] w-full flex-col items-center justify-center gap-3 border-2 border-dashed p-6 transition disabled:opacity-50"
                >
                  <span className="app-gradient-bg flex h-14 w-14 items-center justify-center rounded-full text-white shadow-pop">
                    <Plus size={26} />
                  </span>
                  <span className="text-ui-md font-bold">নতুন CV</span>
                  <span className="text-fg-subtle text-ui-xs">ফাঁকা পেজ থেকে শুরু করুন</span>
                </button>
              </li>

              {home.documents.map((meta, index) => (
                <li
                  key={meta.id}
                  // The entrance animation gives each item its own stacking
                  // context, so a menu open in one has to raise the item itself
                  // or the next card paints over it.
                  className="relative has-[[aria-expanded=true]]:z-30"
                >
                  <DocumentCard
                    meta={meta}
                    resume={home.resumes[meta.id]}
                    hue={CARD_HUES[index % CARD_HUES.length]}
                    active={meta.id === home.activeId}
                    synced={meta.cloud}
                    syncUsed={home.cloud.used}
                    syncMax={home.cloud.max}
                    onToggleSync={() => void home.cloud.toggle(meta.id, !meta.cloud)}
                    onOpen={() => void home.openDocument(meta.id)}
                    onRename={() => home.setRenaming(meta)}
                    onDuplicate={() => void home.duplicateDocument(meta.id)}
                    onDelete={() => home.setDeleting(meta)}
                  />
                </li>
              ))}
            </ul>
          )}

          {!loading && home.documents.length === 0 ? (
            <div className="mx-auto mt-4 max-w-xs text-center">
              <EmptyIllustration />
              <p className="text-fg-muted text-ui-md">এখনো কিছু নেই। আপনার প্রথম CV শুরু করুন।</p>
            </div>
          ) : null}
        </section>

        <section id="designs" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
          <h2 className="text-fg text-2xl font-extrabold tracking-tight">একটি ডিজাইন থেকে শুরু করুন</h2>
          <p className="text-fg-subtle text-ui-md mt-0.5 mb-5">
            নিচের প্রতিটি ডিজাইন ATS-পরীক্ষিত। একটি বেছে নিলে সেটি নতুন CV হিসেবে খুলবে।
          </p>
          <TemplateStrip
            onPick={(templateId) => void home.createFromTemplate(templateId)}
            disabled={loading || home.atLimit}
          />
        </section>

        <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
          <h2 className="text-fg mb-5 text-2xl font-extrabold tracking-tight">কীভাবে কাজ করে</h2>
          <HowItWorks />
        </section>
      </main>

      <SiteFooter />

      <input
        ref={restoreInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-label="ব্যাকআপ ফাইল ফিরিয়ে আনুন"
        onChange={(event) => {
          const file = event.target.files?.[0];

          event.target.value = '';
          if (file) void home.restoreBackup(file);
        }}
      />

      <ImportDialog
        open={home.importing}
        resume={resume}
        onClose={() => void home.cancelImport()}
        onApply={home.applyImport}
      />

      {home.renaming ? (
        <RenameDialog
          document={home.renaming}
          fallbackName={nameOf(home.renaming.id)}
          onConfirm={(name) => void home.confirmRename(home.renaming!.id, name)}
          onClose={() => home.setRenaming(null)}
        />
      ) : null}

      {home.deleting ? (
        <DeleteDialog
          title={nameOf(home.deleting.id)}
          onConfirm={() => void home.confirmDelete(home.deleting!.id)}
          onClose={() => home.setDeleting(null)}
        />
      ) : null}

      <Toaster />
    </div>
  );
};
