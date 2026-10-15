'use client';

import { FileText, Gauge, PencilLine } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppShell, Pane, SplitPane } from '@/components/layout';
import { Drawer, ModalHeader, Tabs, Toaster } from '@/components/ui';
import type { AtsFixTarget } from '@/constants';
import { AtsPanel, useAtsScore } from '@/features/ats';
import { TailorDialog } from '@/features/tailor';
import { SignInRequiredDialog } from '@/features/auth';
import { useKeyboardShortcuts, useTheme } from '@/hooks';
import { IMPORT_INPUT_ID, useExportJson, useExportPdf } from '@/features/export';
import { ImportDialog } from '@/features/import';
import {
  LibraryPanel,
  useActiveDocument,
  useCloudSync,
  useCloudToggle,
  useLibraryReady,
  useLibrarySync,
  useSaveState,
} from '@/features/library';
import { useResume, useResumeActions, useResumeStore } from '@/features/resume';
import { bn } from '@/lib/bn';

import { useActiveSection } from '../hooks/useActiveSection';
import { useEditorLayout, type EditorTab } from '../hooks/useEditorLayout';
import { useSectionProgress } from '../hooks/useSectionProgress';
import { EditorPane } from './EditorPane';
import { PreviewPane } from './PreviewPane';
import { SectionRail } from './SectionNav';
import { ShortcutsDialog } from './ShortcutsDialog';
import { Toolbar } from './Toolbar';

const TABS = [
  { value: 'edit' as const, label: 'à¦à¦¡à¦¿à¦Ÿ', icon: <PencilLine size={17} /> },
  { value: 'preview' as const, label: 'à¦ªà§à¦°à¦¿à¦­à¦¿à¦‰', icon: <FileText size={17} /> },
  { value: 'score' as const, label: 'à¦¸à§à¦•à§‹à¦°', icon: <Gauge size={17} /> },
];

/**
 * Composition root for the editor.
 *
 * Deliberately thin: it wires state to panes and owns no domain logic of its
 * own. Anything that looks like a rule belongs in a feature hook.
 */
export const EditorScreen = () => {
  const resume = useResume();
  // Boots the document library and writes the open CV back as it changes.
  useLibrarySync();
  // Signed-in readers sync the CVs they switched on (at most three); everything else stays local.
  useCloudSync();
  const ready = useLibraryReady();
  const activeDocument = useActiveDocument();
  const saveState = useSaveState();
  const cloud = useCloudToggle();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const actions = useResumeActions();
  const canUndo = useResumeStore((state) => state.past.length > 0);
  const canRedo = useResumeStore((state) => state.future.length > 0);

  // Keyed by document so opening another empty CV asks again.
  const layout = useEditorLayout(activeDocument?.id);
  const theme = useTheme();
  const pdf = useExportPdf();

  // Measured by the preview when it is mounted; 0 means "not measured yet", and
  // the score hook falls back to a content-based estimate.
  const [pageCount, setPageCount] = useState(0);
  // Body type size read off the rendered design; 0 until the preview has drawn.
  const [bodyPt, setBodyPt] = useState(0);
  /*
   * Where the preview put its page breaks. Sent with the export so the PDF
   * breaks in the same places; empty when the preview is not mounted, and the
   * export then falls back to Chrome's own pagination. See ADR-021.
   */
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const { score, keywords } = useAtsScore({ measuredPages: pageCount, measuredBodyPt: bodyPt });

  // Owned here so the rail and the form agree on which section is open.
  const section = useActiveSection();
  const progress = useSectionProgress(section.tabs);

  // A "Fix it" link in the score panel has to move the editor, not just scroll it.
  const [pendingTarget, setPendingTarget] = useState<AtsFixTarget | null>(null);
  const { setTab, dismissScoreOverlay } = layout;
  const navigateToFix = useCallback(
    (target: AtsFixTarget) => {
      setPendingTarget(target);
      setTab('edit');
      // On a tablet the score sits over the form it is sending the reader to.
      // On a desktop it sits beside it, and closing it there would take away a
      // panel nobody asked to lose.
      dismissScoreOverlay();
    },
    [setTab, dismissScoreOverlay],
  );
  const json = useExportJson((imported) => actions.replaceResume(imported, { resetHistory: true }));

  const exportDesign = useCallback(
    () => void pdf.exportPdf(resume, 'design', pageBreaks),
    [pdf, resume, pageBreaks],
  );

  useKeyboardShortcuts([
    { key: 'z', meta: true, handler: actions.undo },
    { key: 'z', meta: true, shift: true, handler: actions.redo },
    { key: 'y', meta: true, handler: actions.redo },
    { key: 's', meta: true, allowInInput: true, handler: exportDesign },
    { key: 'k', meta: true, allowInInput: true, handler: () => setLibraryOpen(true) },
    { key: '?', shift: true, handler: () => layout.setShortcutsOpen(true) },
  ]);

  /*
   * A failed export is reported where every other outcome is â€” the export that
   * worked says so in a toast, and one that did not should not have to be
   * looked for somewhere else. The retry is offered on the toast itself
   * because a failure here is usually transient.
   */
  const { error: pdfError, failedMode, clearError } = pdf;
  useEffect(() => {
    if (!pdfError) return;

    toast.error(pdfError, {
      action: failedMode
        ? {
            label: 'à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨',
            onClick: () =>
              void pdf.exportPdf(resume, failedMode, failedMode === 'ats' ? [] : pageBreaks),
          }
        : undefined,
      onDismiss: clearError,
      onAutoClose: clearError,
    });
    // `pdf` and `resume` are read by the retry only, and re-firing the toast
    // every time the document changes would repeat a message already shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfError, failedMode, clearError]);

  const toolbar = (
    <Toolbar
      documentName={activeDocument?.name || resume.meta.documentName || resume.basics.fullName}
      saveState={saveState}
      onOpenLibrary={() => setLibraryOpen(true)}
      onOpenImport={() => setImportOpen(true)}
      onOpenDesign={() => navigateToFix('panel:design')}
      onOpenJob={() => {
        layout.dismissScoreOverlay();
        layout.setTab('edit');
        section.setActive({ kind: 'panel', key: 'job' });
      }}
      onOpenShortcuts={() => layout.setShortcutsOpen(true)}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={actions.undo}
      onRedo={actions.redo}
      pendingExport={pdf.pending}
      onExportDesign={exportDesign}
      onExportAts={() => void pdf.exportPdf(resume, 'ats')}
      onExportJson={() => json.exportJson(resume)}
      themePreference={theme.preference}
      onCycleTheme={theme.cycle}
      cloudSynced={Boolean(activeDocument?.cloud)}
      cloudUsed={cloud.used}
      cloudMax={cloud.max}
      onToggleCloud={() => {
        if (activeDocument) void cloud.toggle(activeDocument.id, !activeDocument.cloud);
      }}
      atsScore={score.total}
      atsTone={score.tone}
      scorePanelOpen={layout.scoreOpen}
      onToggleScorePanel={layout.toggleScore}
    />
  );

  const atsPanel = (
    <AtsPanel
      score={score}
      keywords={keywords}
      jobDescription={resume.meta.targetJobDescription}
      onJobDescriptionChange={actions.setJobDescription}
      onNavigate={navigateToFix}
      onQuickFix={(fix) => {
        if (fix.kind === 'font-scale') actions.setTheme({ fontScale: fix.value });
      }}
      onTailor={() => {
        // The score drawer sits over the work; close it so the dialog is the only thing up.
        layout.dismissScoreOverlay();
        setTailorOpen(true);
      }}
    />
  );

  const editorPane = (
    <Pane className="bg-surface">
      <EditorPane
        section={section}
        progress={progress}
        showStrip={layout.mode === 'compact'}
        pendingTarget={pendingTarget}
        onPendingTargetHandled={() => setPendingTarget(null)}
        startedBlank={layout.startedBlank}
        onStartBlank={layout.startBlank}
      />
    </Pane>
  );

  const previewPane = (
    <Pane className="bg-canvas">
      <PreviewPane
        resume={resume}
        zoom={layout.zoom}
        zoomMode={layout.zoomMode}
        onZoomIn={layout.zoomIn}
        onZoomOut={layout.zoomOut}
        onResetZoom={layout.resetZoom}
        onPageCountChange={setPageCount}
        onPageBreaksChange={setPageBreaks}
        onBodyPointsChange={setBodyPt}
      />
    </Pane>
  );

  return (
    <AppShell
      toolbar={toolbar}
      bottomBar={
        // Only the one-pane layout needs a way to swap panes.
        layout.mode === 'compact' ? (
          <Tabs
            items={TABS}
            value={layout.tab}
            onChange={(value: EditorTab) => layout.setTab(value)}
            variant="bar"
            ariaLabel="à¦à¦¡à¦¿à¦Ÿà¦° à¦­à¦¿à¦‰"
          />
        ) : undefined
      }
    >
      {/* Storage is read after mount; rendering before it lands would flash an empty resume. */}
      {!ready ? (
        <EditorSkeleton mode={layout.mode} tab={layout.tab} />
      ) : layout.mode === 'compact' ? (
        <div className="flex h-full min-h-0 flex-col">
          {layout.tab === 'preview' ? previewPane : null}
          {layout.tab === 'edit' ? editorPane : null}
          {layout.tab === 'score' ? <Pane className="bg-surface">{atsPanel}</Pane> : null}
        </div>
      ) : (
        <div className="flex h-full min-h-0">
          <SectionRail
            tabs={section.tabs}
            active={section.active}
            progress={progress}
            onSelect={section.setActive}
          />
          <div className="min-w-0 flex-1">
            <SplitPane left={editorPane} right={previewPane} className="h-full" />
          </div>
        </div>
      )}

      {/* Beside the work it would crowd it, so the breakdown arrives over it and leaves again. */}
      {layout.mode !== 'compact' && layout.scoreOpen ? (
        <Drawer label="ATS à¦¸à§à¦•à§‹à¦°" onClose={layout.closeScore} className="max-w-sm">
          <ModalHeader
            title="ATS à¦¸à§à¦•à§‹à¦°"
            subtitle={`${bn(score.total)} / à§§à§¦à§¦`}
            onClose={layout.closeScore}
          />
          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">{atsPanel}</div>
        </Drawer>
      ) : null}

      <input
        id={IMPORT_INPUT_ID}
        type="file"
        accept="application/json"
        onChange={(event) => void json.handleFileChange(event)}
        className="sr-only"
        tabIndex={-1}
      />

      <LibraryPanel open={libraryOpen} onClose={() => setLibraryOpen(false)} />

      <TailorDialog open={tailorOpen} onClose={() => setTailorOpen(false)} />

      <ImportDialog
        open={importOpen}
        resume={resume}
        onClose={() => setImportOpen(false)}
        onApply={(next) => actions.replaceResume(next)}
      />

      {layout.shortcutsOpen ? (
        <ShortcutsDialog onClose={() => layout.setShortcutsOpen(false)} />
      ) : null}

      {/* The one thing an account buys, asked for at the moment it is wanted. */}
      {pdf.signInRequired ? <SignInRequiredDialog onClose={pdf.clearSignInRequired} /> : null}

      <Toaster />
    </AppShell>
  );
};

/**
 * The shape of the editor while storage is read.
 *
 * A centred "Loadingâ€¦" tells the reader the app is busy and nothing else; the
 * layout then appears all at once and everything moves. This draws the real
 * frame - the section rail, the form column capped at its real width, the
 * heading card, the sheet at its real proportion - so what changes at the end
 * is that the boxes fill with words. The measurements are the live ones: the
 * rail is 64px and 252px from `xl`, the form column is capped at 680px, and the
 * pane takes 46% between 320 and 720px, as `SplitPane` does.
 */
const SkeletonRail = () => (
  <div className="border-border-base bg-surface/70 flex w-[64px] flex-none flex-col gap-1 border-r px-2 py-3 xl:w-[252px] xl:px-3">
    <div className="mb-2 hidden xl:block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      <div className="skeleton h-2 w-full rounded-full" />
    </div>
    {Array.from({ length: 9 }, (_, index) => (
      <div key={index} className="flex items-center gap-2.5 px-1.5 py-1.5 xl:px-2">
        <div className="skeleton rounded-control h-9 w-9 flex-none" />
        <div className="skeleton hidden h-4 flex-1 rounded xl:block" />
      </div>
    ))}
  </div>
);

const SkeletonForm = ({ strip }: { strip: boolean }) => (
  <div className="flex min-h-full flex-col">
    {strip ? (
      <div className="border-border-base flex gap-2 overflow-hidden border-b px-3 py-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton h-9 w-24 flex-none rounded-full" />
        ))}
      </div>
    ) : null}
    <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-4 px-4 py-5 sm:px-5">
      <div className="skeleton rounded-panel h-[132px] w-full lg:h-[96px]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton rounded-control h-10 w-full" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <div className="skeleton h-4 w-1/4 rounded" />
          <div className="skeleton rounded-control h-10 w-full" />
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton rounded-control h-28 w-full" />
      </div>
    </div>
  </div>
);

const SkeletonSheet = () => (
  <div className="app-preview-canvas relative min-h-full px-4 py-6 sm:px-8">
    <div className="skeleton shadow-sheet aspect-[210/297] w-full rounded-sm" />
  </div>
);

const EditorSkeleton = ({ mode, tab }: { mode: 'compact' | 'split' | 'full'; tab: EditorTab }) => {
  if (mode === 'compact') {
    return (
      <div className="bg-surface h-full min-h-0 overflow-hidden" aria-hidden="true">
        {tab === 'preview' ? <SkeletonSheet /> : <SkeletonForm strip />}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0" aria-hidden="true">
      <SkeletonRail />
      <div className="flex min-w-0 flex-1">
        <div className="bg-surface flex-none basis-[46%] overflow-hidden min-w-[320px] max-w-[720px]">
          <SkeletonForm strip={false} />
        </div>
        <div className="bg-border-base w-px flex-none" />
        <div className="bg-canvas min-w-0 flex-1 overflow-hidden">
          <SkeletonSheet />
        </div>
      </div>
    </div>
  );
};
