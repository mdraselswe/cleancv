'use client';

import { FileText, Gauge, PencilLine, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { AppShell, Pane, SplitPane } from '@/components/layout';
import { Button, Tabs } from '@/components/ui';
import type { AtsFixTarget } from '@/constants';
import { AtsPanel, useAtsScore } from '@/features/ats';
import { useKeyboardShortcuts, useTheme } from '@/hooks';
import { IMPORT_INPUT_ID, useExportJson, useExportPdf } from '@/features/export';
import { ImportDialog } from '@/features/import';
import { LibraryPanel, useActiveDocument, useLibraryReady, useLibrarySync } from '@/features/library';
import { useResume, useResumeActions, useResumeStore } from '@/features/resume';
import { getAvailableTemplates, getTemplate } from '@/features/templates';

import { useEditorLayout, type EditorTab } from '../hooks/useEditorLayout';
import { EditorPane } from './EditorPane';
import { PreviewPane } from './PreviewPane';
import { Toolbar } from './Toolbar';

const TABS = [
  { value: 'edit' as const, label: 'Edit', icon: <PencilLine size={16} /> },
  { value: 'preview' as const, label: 'Preview', icon: <FileText size={16} /> },
  { value: 'score' as const, label: 'Score', icon: <Gauge size={16} /> },
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
  const ready = useLibraryReady();
  const activeDocument = useActiveDocument();
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

  // A "Fix it" link in the score panel has to move the editor, not just scroll it.
  const [pendingTarget, setPendingTarget] = useState<AtsFixTarget | null>(null);
  const { setTab } = layout;
  const navigateToFix = useCallback(
    (target: AtsFixTarget) => {
      setPendingTarget(target);
      setTab('edit');
    },
    [setTab],
  );
  const json = useExportJson((imported) => actions.replaceResume(imported, { resetHistory: true }));

  const templateOptions = useMemo(
    () => getAvailableTemplates().map(({ meta }) => ({ value: meta.id, label: meta.name })),
    [],
  );

  useKeyboardShortcuts([
    { key: 'z', meta: true, handler: actions.undo },
    { key: 'z', meta: true, shift: true, handler: actions.redo },
    { key: 'y', meta: true, handler: actions.redo },
  ]);

  const toolbar = (
    <Toolbar
      documentName={
        activeDocument?.name || resume.meta.documentName || resume.basics.fullName
      }
      onOpenLibrary={() => setLibraryOpen(true)}
      onOpenImport={() => setImportOpen(true)}
      templateId={resume.meta.templateId}
      templateOptions={templateOptions}
      onTemplateChange={(id) => actions.setTemplate(id, getTemplate(id).meta.defaultTheme)}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={actions.undo}
      onRedo={actions.redo}
      pendingExport={pdf.pending}
      onExportDesign={() => void pdf.exportPdf(resume, 'design', pageBreaks)}
      onExportAts={() => void pdf.exportPdf(resume, 'ats')}
      onExportJson={() => json.exportJson(resume)}
      themePreference={theme.preference}
      onCycleTheme={theme.cycle}
      atsScore={score.total}
      atsTone={score.tone}
      scorePanelOpen={layout.scorePanelOpen}
      onToggleScorePanel={() => layout.setScorePanelOpen(!layout.scorePanelOpen)}
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
        pendingTarget={pendingTarget}
        onPendingTargetHandled={() => setPendingTarget(null)}
        startedBlank={layout.startedBlank}
        onStartBlank={layout.startBlank}
      />
    </Pane>
  );

  const previewPane = (
    <Pane className="bg-surface-2">
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
        <Tabs
          items={TABS}
          value={layout.tab}
          onChange={(value: EditorTab) => layout.setTab(value)}
          variant="bar"
          ariaLabel="Editor view"
        />
      }
    >
      {/* Storage is read after mount; rendering before it lands would flash an empty resume. */}
      {!ready ? (
        <div className="flex h-full items-center justify-center text-sm text-fg-subtle">
          Loading your resume…
        </div>
      ) : layout.isDesktop ? (
        <div className="flex h-full min-h-0">
          <div className="min-w-0 flex-1">
            <SplitPane left={editorPane} right={previewPane} className="h-full" />
          </div>

          {layout.scorePanelOpen ? (
            <aside
              aria-label="ATS score"
              className="flex w-[360px] flex-none flex-col border-l border-border-base bg-surface"
            >
              <div className="flex flex-none items-center justify-between border-b border-border-base px-3 py-2">
                <span className="text-[13px] font-semibold text-fg">ATS score</span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Close score panel"
                  onClick={() => layout.setScorePanelOpen(false)}
                >
                  <X size={15} />
                </Button>
              </div>
              <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">{atsPanel}</div>
            </aside>
          ) : null}
        </div>
      ) : (
        <div className="h-full">
          {layout.tab === 'preview' ? previewPane : null}
          {layout.tab === 'edit' ? editorPane : null}
          {layout.tab === 'score' ? <Pane className="bg-surface">{atsPanel}</Pane> : null}
        </div>
      )}

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

      {pdf.error ? (
        <div
          role="alert"
          className="fixed bottom-20 left-1/2 z-30 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-lg border border-danger bg-surface px-4 py-2 text-sm text-danger shadow-app lg:bottom-6"
        >
          <span className="min-w-0">{pdf.error}</span>
          {pdf.failedMode ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void pdf.exportPdf(
                  resume,
                  pdf.failedMode ?? 'design',
                  pdf.failedMode === 'ats' ? [] : pageBreaks,
                )
              }
            >
              Try again
            </Button>
          ) : null}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={pdf.clearError}
            className="text-fg-subtle hover:text-fg transition"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}
    </AppShell>
  );
};
