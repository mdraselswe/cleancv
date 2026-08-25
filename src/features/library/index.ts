export { LibraryPanel, type LibraryPanelProps } from './components/LibraryPanel';
export {
  backupFilename,
  buildBackup,
  parseBackup,
  serializeBackup,
  type BackupReadResult,
} from './backup';
export { readAllDocuments, readIndex } from './storage';
export {
  useActiveDocument,
  useLibraryActions,
  useLibraryDocuments,
  useLibraryStore,
  type LibraryActions,
  type LibraryStatus,
  type WorkspaceState,
} from './useLibrary';
export { useLibraryReady, useLibrarySync } from './useLibrarySync';
export type { BackupFile, CvDocument, DocumentMeta, LibraryIndex } from './schema';
