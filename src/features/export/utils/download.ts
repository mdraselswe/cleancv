/** Browser download helpers. */

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadText = (contents: string, filename: string, type = 'application/json'): void =>
  downloadBlob(new Blob([contents], { type }), filename);

/** Reads the filename the server suggested, falling back to our own. */
export const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="([^"]+)"/.exec(header);

  return match?.[1] ?? fallback;
};
