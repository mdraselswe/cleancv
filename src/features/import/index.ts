export { ImportDialog, type ImportDialogProps } from './components/ImportDialog';
export { SmartImportSettings } from './components/SmartImportSettings';
export { detectKind, extractDocument, isTwoColumn } from './extract';
export { linesFromPdf, readEmbeddedResume, type PdfLike } from './extract/pdf';
export { toDocument } from './extract/lines';
export {
  MERGE_GROUPS,
  MERGE_GROUP_LABEL,
  applyImport,
  foundGroups,
  groupSize,
  type ListStrategy,
  type MergeGroup,
  type MergePlan,
} from './merge';
export { parseHeuristically } from './parse/heuristic';
export { splitIntoSections } from './headings';
export {
  SMART_PRESETS,
  getSmartSettings,
  isSmartConfigured,
  saveSmartSettings,
  useSmartSettings,
  type SmartSettings,
} from './settings';
export { useImport, type ImportState, type UseImport } from './useImport';
export type {
  ExtractedDocument,
  ImportProviderId,
  ImportResult,
  ParsedResume,
  SourceKind,
  TextLine,
} from './types';
