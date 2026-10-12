'use client';

import { FileText, Gauge, PencilLine } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppShell, Pane, SplitPane } from '@/components/layout';
import { Drawer, ModalHeader, Tabs, Toaster } from '@/components/ui';
import type { AtsFixTarget } from '@/constants';
import { AtsPanel, useAtsScore } from '@/features/ats';
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

import { useActiveSection } from '../hooks/useActiveSection';
import { useEditorLayout, type EditorTab } from '../hooks/useEditorLayout';
import { useSectionProgress } from '../hooks/useSectionProgress';
import { EditorPane } from './EditorPane';
import { PreviewPane } from './PreviewPane';
import { SectionRail } from './SectionNav';
import { ShortcutsDialog } from './ShortcutsDialog';
import { Toolbar } from './Toolbar';

const TABS = [
  { value: 'edit' as const, label: 'Edit', icon: <PencilLine size={17} /> },
  { value: 'preview' as const, label: 'Preview', icon: <FileText size={17} /> },
  { value: 'score' as const, label: 'Score', icon: <Gauge size={17} /> },
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
  /*
   * Where the preview put its page breaks. Sent with the export so the PDF
   * breaks in the same places; empty when the preview is not mounted, and the
   * export then falls back to Chrome's own pagination. See ADR-021.
   */
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const { score, keywords } = useAtsScore({ measuredPages: pageCount });

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
   * A failed export is reported where every other outcome is — the export that
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
            label: 'Try again',
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
            ariaLabel="Editor view"
          />
        ) : undefined
      }
    >
      {/* Storage is read after mount; rendering before it lands would flash an empty resume. */}
      {!ready ? (
        <EditorSkeleton />
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
        <Drawer label="ATS score" onClose={layout.closeScore} className="max-w-sm">
          <ModalHeader
            title="ATS score"
            subtitle={`${score.total} out of 100`}
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
 * A centred "Loading…" tells the reader the app is busy and nothing else; the
 * layout then appears all at once and everything moves. Blocking out the panes
 * that are about to arrive means the only thing that changes at the end is
 * that the boxes fill with words.
 */
const EditorSkeleton = () => (
  <div className="flex h-full min-h-0 gap-px" aria-hidden="true">
    <div className="bg-surface flex min-w-0 flex-1 flex-col gap-3 p-4 lg:max-w-[520px]">
      <div className="skeleton rounded-panel h-24 w-full" />
      <div className="skeleton mt-2 h-4 w-1/3 rounded-lg" />
      <div className="skeleton rounded-control h-9 w-full" />
      <div className="skeleton mt-2 h-4 w-1/4 rounded-lg" />
      <div className="skeleton rounded-control h-9 w-full" />
      <div className="skeleton mt-2 h-4 w-2/5 rounded-lg" />
      <div className="skeleton rounded-control h-24 w-full" />
    </div>

    <div className="bg-canvas hidden min-w-0 flex-1 items-start justify-center p-8 md:flex">
      <div className="skeleton shadow-sheet aspect-[210/297] w-full max-w-[420px] rounded-sm" />
    </div>
  </div>
);
